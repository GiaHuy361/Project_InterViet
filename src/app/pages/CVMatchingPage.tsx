import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import * as resumeService from '../../services/resumeService';
import * as jobDescriptionService from '../../services/jobDescriptionService';
import * as matchingService from '../../services/matchingService';
import { safeParseJsonArray } from '../../lib/parsers/jsonSafeParse';
import { getPhase3UserMessage } from '../../lib/api/phase3Errors';
import { logApiAction } from '../../lib/api/apiDebug';
import { ResumeUploadCard } from '../components/cv-matching/ResumeUploadCard';
import { JobDescriptionCard } from '../components/cv-matching/JobDescriptionCard';
import { ResumeListCard } from '../components/cv-matching/ResumeListCard';
import { MatchingPanel } from '../components/cv-matching/MatchingPanel';
import { ResumeDetailCard } from '../components/cv-matching/ResumeDetailCard';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getLower(value: unknown): string { return String(value ?? '').trim().toLowerCase(); }
function statusLabel(status?: string | null): string {
  switch (getLower(status)) {
    case 'queued': return 'Đang chờ xử lý';
    case 'processing': return 'Đang phân tích CV';
    case 'parsed': return 'Đã phân tích xong';
    case 'failed': return 'Phân tích thất bại';
    case 'serviceunavailable': return 'Dịch vụ AI/CV tạm thời không khả dụng';
    case 'pending': return 'Đang chờ xử lý';
    case 'completed': return 'Hoàn tất';
    case 'cancelled': return 'Đã hủy';
    default: return status ?? 'Chưa xác định';
  }
}

interface CVMatchingPageProps {
  initialSection?: 'cv' | 'jd' | 'matching';
  showSectionSwitcher?: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const CVMatchingPage: React.FC<CVMatchingPageProps> = ({ initialSection = 'cv', showSectionSwitcher = true, pageTitle, pageSubtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState<resumeService.ResumeSummary[]>([]);
  const [resumeDetail, setResumeDetail] = useState<resumeService.ResumeDetail | null>(null);
  const [jobDescriptions, setJobDescriptions] = useState<jobDescriptionService.JobDescriptionSummary[]>([]);
  const [activeResumeMissing, setActiveResumeMissing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  const [matchSessionId, setMatchSessionId] = useState('');
  const [newJdTitle, setNewJdTitle] = useState('');
  const [newJdCompanyName, setNewJdCompanyName] = useState('');
  const [newJdLocation, setNewJdLocation] = useState('');
  const [newJdSalaryText, setNewJdSalaryText] = useState('');
  const [newJdSourceUrl, setNewJdSourceUrl] = useState('');
  const [newJdPostedAt, setNewJdPostedAt] = useState('');
  const [newJdRawText, setNewJdRawText] = useState('');
  const [creatingJd, setCreatingJd] = useState(false);
  const [matchDetail, setMatchDetail] = useState<matchingService.MatchSessionDetail | null>(null);
  const [activeSection, setActiveSection] = useState<'cv' | 'jd' | 'matching'>(initialSection);

  useEffect(() => {
    if (location.pathname.includes('/doi-sanh')) setActiveSection('matching');
    else if (location.pathname.includes('/jd')) setActiveSection('jd');
    else setActiveSection('cv');
  }, [location.pathname]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resumeList, jdList] = await Promise.all([
        resumeService.safeGetResumes(),
        jobDescriptionService.safeGetJobDescriptions(),
      ]);
      setResumes(resumeList);
      setJobDescriptions(jdList);
      const sessions = await matchingService.safeGetMatchSessions();
      const completedSession = sessions.find((session) => getLower(session.status) === 'completed') ?? sessions[0] ?? null;
      if (completedSession) {
        const detail = await matchingService.getMatchSessionDetail(completedSession.sessionId);
        setMatchDetail(detail);
        setMatchSessionId(completedSession.sessionId);
      }
      let active: resumeService.ResumeDetail | null = null;
      try {
        active = await resumeService.getActiveResume();
        setActiveResumeMissing(false);
      } catch (err) {
        setActiveResumeMissing(true);
        setResumeDetail(null);
        setSelectedResumeId(resumeList[0]?.resumeId || '');
        if ((err as { status?: number })?.status !== 404) throw err;
      }
      setSelectedResumeId((prev) => prev || active?.resumeId || resumeList[0]?.resumeId || '');
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);
  useEffect(() => {
    if (!selectedResumeId) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await resumeService.getResume(selectedResumeId);
        if (!cancelled) setResumeDetail(detail);
      } catch (err) {
        if (!cancelled) toast.error(getPhase3UserMessage(err));
      }
    })();
    return () => { cancelled = true; };
  }, [selectedResumeId]);

  useEffect(() => {
    if (!resumeDetail?.resumeId) return;
    const status = getLower(resumeDetail.parseStatus);
    if (!['queued', 'processing'].includes(status)) return;
    const timer = window.setInterval(async () => {
      try {
        const detail = await resumeService.getResume(resumeDetail.resumeId!);
        setResumeDetail(detail);
        setResumes((prev) => Array.isArray(prev) ? prev.map((item) => (item.resumeId === detail.resumeId ? { ...item, ...detail } : item)) : []);
      } catch (err) {
        window.clearInterval(timer);
        toast.error(getPhase3UserMessage(err));
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [resumeDetail?.resumeId, resumeDetail?.parseStatus]);

  useEffect(() => {
    if (!matchSessionId) return;
    const timer = window.setInterval(async () => {
      try {
        const detail = await matchingService.getMatchSessionDetail(matchSessionId);
        setMatchDetail(detail);
      } catch (err) {
        window.clearInterval(timer);
        toast.error(getPhase3UserMessage(err));
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [matchSessionId]);

  const validateFile = (file: File): string | null => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) return 'Định dạng file không được hỗ trợ.';
    if (file.size > MAX_FILE_SIZE) return 'File vượt quá dung lượng tối đa 10MB.';
    return null;
  };

  const handleUpload = async () => {
    if (!selectedFile) return setUploadError('Vui lòng chọn CV trước khi tải lên.');
    const error = validateFile(selectedFile);
    if (error) return setUploadError(error);
    setUploading(true);
    setUploadError('');
    try {
      const uploaded = await resumeService.uploadResume({ file: selectedFile, title });
      toast.success('CV đã được tải lên');
      setSelectedFile(null);
      setTitle('');
      setSelectedResumeId(uploaded.resumeId);
      await loadData();
    } catch (err) {
      const message = getPhase3UserMessage(err);
      toast.error(message);
      if (message.includes('gói hiện tại')) navigate('/goi-dich-vu');
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    logApiAction('ui.resume.setActive.click', { id });
    try {
      await resumeService.setActiveResume(id);
      toast.success('Đã đặt CV active');
      await loadData();
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    }
  };

  const handleReprocess = async (id: string) => {
    logApiAction('ui.resume.reprocess.click', { id });
    try {
      const job = await resumeService.reprocessResume(id);
      toast.success(`Đã yêu cầu phân tích lại CV${job.jobId ? ` · Job ${job.jobId}` : ''}`);
      const detail = await resumeService.getResume(id);
      setResumeDetail(detail);
      setSelectedResumeId(id);
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await resumeService.downloadResume(id);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${id}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể tải CV về.');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa CV này? Các kết quả matching cũ có thể vẫn được lưu để tham chiếu.');
    if (!confirmed) return;
    logApiAction('ui.resume.delete.click', { id });
    try {
      await resumeService.deleteResume(id);
      toast.success('Đã xóa CV');
      if (selectedResumeId === id) {
        setSelectedResumeId('');
        setResumeDetail(null);
      }
      await loadData();
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    }
  };

  const handleSingleMatch = async () => {
    if (!selectedResumeId || !selectedJdId) return toast.error('Vui lòng chọn CV và JD.');
    logApiAction('ui.match.single.click', { resumeId: selectedResumeId, jobDescriptionId: selectedJdId });
    try {
      const session = await matchingService.createSingleMatch({ resumeId: selectedResumeId, jobDescriptionId: selectedJdId });
      setMatchSessionId(session.sessionId);
      const detail = await matchingService.getMatchSessionDetail(session.sessionId);
      setMatchDetail(detail);
      toast.success('Đã tạo phiên matching');
      window.localStorage.setItem('interviet:lastMatchSessionId', session.sessionId);
      setActiveSection('matching');
      window.setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const message = getPhase3UserMessage(err);
      toast.error(message);
      if (message.includes('gói hiện tại')) navigate('/goi-dich-vu');
    }
  };

  const handleSelectResume = (id: string) => {
    setSelectedResumeId(id);
  };

  const handleCreateJobDescription = async () => {
    if (!newJdTitle.trim() || !newJdRawText.trim()) {
      toast.error('Vui lòng nhập tên JD và nội dung JD.');
      return;
    }
    setCreatingJd(true);
    try {
      const salaryText = newJdSalaryText.trim();
      const vndSalaryText = salaryText
        ? /vnđ|vnd|₫/i.test(salaryText)
          ? salaryText
          : `${salaryText} VNĐ`
        : undefined;
      const created = await jobDescriptionService.createJobDescription({
        title: newJdTitle.trim(),
        companyName: newJdCompanyName.trim() || undefined,
        location: newJdLocation.trim() || undefined,
        salaryText: vndSalaryText,
        sourceUrl: newJdSourceUrl.trim() || undefined,
        postedAt: newJdPostedAt || undefined,
        rawText: newJdRawText.trim(),
      });
      toast.success('Đã tạo mô tả công việc mới');
      setJobDescriptions((prev) => [created, ...prev]);
      setSelectedJdId(created.id);
      setNewJdTitle('');
      setNewJdCompanyName('');
      setNewJdLocation('');
      setNewJdSalaryText('');
      setNewJdSourceUrl('');
      setNewJdPostedAt('');
      setNewJdRawText('');
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    } finally {
      setCreatingJd(false);
    }
  };

  const parsedSkills = safeParseJsonArray<string>(resumeDetail?.skillsJson, []);
  const parsedExperiences = safeParseJsonArray<unknown>(resumeDetail?.experiencesJson, []);
  const parsedEducations = safeParseJsonArray<unknown>(resumeDetail?.educationsJson, []);
  const parsedProjects = safeParseJsonArray<unknown>(resumeDetail?.projectsJson, []);
  const parsedCertifications = safeParseJsonArray<unknown>(resumeDetail?.certificationsJson, []);
  const parsedLanguages = safeParseJsonArray<string>(resumeDetail?.languagesJson, []);
  const parsedWarnings = safeParseJsonArray<string>((resumeDetail as { warningsJson?: string | null } | null)?.warningsJson, []);

  useEffect(() => {
    if (resumeDetail) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [resumeDetail?.resumeId]);

  return (
    <div className="relative space-y-6 overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28%),linear-gradient(to_bottom,#f8fbff,rgba(255,255,255,0))]" />
      <AppPageHeader title={pageTitle || 'CV và đối sánh'} subtitle={pageSubtitle || 'Kết nối CV, mô tả công việc và đối sánh'} icon={FileText} iconGradient="from-blue-500 to-cyan-500" />
      {activeResumeMissing && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Bạn chưa có CV đang dùng. Hãy tải lên CV trước.</p>}

      {showSectionSwitcher && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button type="button" onClick={() => navigate('/cv-matching/cv')} className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeSection === 'cv' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            CV
          </button>
          <button type="button" onClick={() => navigate('/cv-matching/jd')} className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeSection === 'jd' ? 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            Mô tả công việc
          </button>
          <button type="button" onClick={() => navigate('/cv-matching/doi-sanh')} className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeSection === 'matching' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
            Đối sánh
          </button>
        </div>
      )}

      {activeSection === 'cv' && (
        <>
          <ResumeUploadCard
            selectedFile={selectedFile}
            title={title}
            uploadError={uploadError}
            uploading={uploading}
            onChangeFile={(file) => {
              setSelectedFile(file);
              setUploadError(file ? validateFile(file) ?? '' : '');
            }}
            onChangeTitle={setTitle}
            onUpload={() => void handleUpload()}
            validateFile={validateFile}
          />

          <ResumeListCard
            loading={loading}
            resumes={resumes}
            onSelect={handleSelectResume}
            onSetActive={(id) => void handleSetActive(id)}
            onReprocess={(id) => void handleReprocess(id)}
            onDownload={(id) => void handleDownload(id)}
            onDelete={(id) => void handleDelete(id)}
            statusLabel={statusLabel}
          />

          {resumeDetail && (
            <div ref={detailRef}>
              <ResumeDetailCard
                resumeDetail={resumeDetail}
                parsedSkills={parsedSkills}
                parsedExperiences={parsedExperiences}
                parsedEducations={parsedEducations}
                parsedProjects={parsedProjects}
                parsedCertifications={parsedCertifications}
                parsedLanguages={parsedLanguages}
                parsedWarnings={parsedWarnings}
                statusLabel={statusLabel}
              />
            </div>
          )}
        </>
      )}

      {activeSection === 'jd' && (
        <JobDescriptionCard
          newJdTitle={newJdTitle}
          newJdCompanyName={newJdCompanyName}
          newJdLocation={newJdLocation}
          newJdSalaryText={newJdSalaryText}
          newJdSourceUrl={newJdSourceUrl}
          newJdPostedAt={newJdPostedAt}
          newJdRawText={newJdRawText}
          creatingJd={creatingJd}
          onChangeTitle={setNewJdTitle}
          onChangeCompanyName={setNewJdCompanyName}
          onChangeLocation={setNewJdLocation}
          onChangeSalaryText={setNewJdSalaryText}
          onChangeSourceUrl={setNewJdSourceUrl}
          onChangePostedAt={setNewJdPostedAt}
          onChangeRawText={setNewJdRawText}
          onCreate={() => void handleCreateJobDescription()}
        />
      )}

      {activeSection === 'matching' && (
        <MatchingPanel
          resumes={resumes}
          jobDescriptions={jobDescriptions}
          selectedResumeId={selectedResumeId}
          selectedJdId={selectedJdId}
          matchDetail={matchDetail}
          onSelectResume={handleSelectResume}
          onSelectJd={setSelectedJdId}
          onStartMatch={() => void handleSingleMatch()}
          statusLabel={statusLabel}
        />
      )}

    </div>
  );
};
