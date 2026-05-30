import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { UserCircle, Save, Loader2, Plus, X, Briefcase, Lightbulb, Globe, CheckCircle2, ListChecks } from 'lucide-react';
import { Button } from '../components/ui/button';
import { registerMentor } from '../../services/mentorService';
import mentorSpecialtyService, { MentorSpecialtyDto } from '../../services/mentorSpecialtyService';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

export const BecomeMentorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);

  // Array State
  const [expertise, setExpertise] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // Input states for adding new tags
  const [newExpertise, setNewExpertise] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Specialties State
  const [availableSpecialties, setAvailableSpecialties] = useState<MentorSpecialtyDto[]>([]);
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const specs = await mentorSpecialtyService.getSpecialtiesCatalog();
        setAvailableSpecialties(specs || []);
      } catch (err) {
        console.error('Failed to load specialties catalog', err);
        toast.error('Lỗi khi tải danh mục chuyên môn');
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialties();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim() || !headline.trim() || !bio.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (Tên, Tiêu đề, Giới thiệu)');
      return;
    }
    if (selectedSpecialtyIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một chuyên môn');
      return;
    }

    setSaving(true);
    try {
      await registerMentor({
        fullName: fullName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        yearsOfExperience,
        expertise,
        industries,
        languages,
        specialtyIds: selectedSpecialtyIds,
      });

      toast.success('Gửi đơn đăng ký thành công! Vui lòng chờ Admin phê duyệt.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to register mentor', err);
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi đăng ký');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (setter: React.Dispatch<React.SetStateAction<string[]>>, input: string, setInput: React.Dispatch<React.SetStateAction<string>>) => {
    const val = input.trim();
    if (val) {
      setter(prev => {
        if (!prev.includes(val)) return [...prev, val];
        return prev;
      });
      setInput('');
    }
  };

  const handleRemoveTag = (setter: React.Dispatch<React.SetStateAction<string[]>>, valToRemove: string) => {
    setter(prev => prev.filter(v => v !== valToRemove));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const SubmitBar = (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 z-10 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
          <UserCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Đăng ký làm Mentor</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Chia sẻ kiến thức và giúp đỡ các ứng viên phát triển sự nghiệp
          </p>
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 shrink-0">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Gửi đơn đăng ký
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-6">
      {SubmitBar}

      <div className="grid grid-cols-1 gap-8">
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">1. Thông tin Cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Vd: Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tiêu đề (Headline) *</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Vd: Senior Software Engineer tại TechCorp"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Số năm kinh nghiệm</label>
              <input
                type="number"
                value={yearsOfExperience}
                onChange={e => setYearsOfExperience(Number(e.target.value))}
                min={0}
                step={0.5}
                className="w-full md:w-1/2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Giới thiệu bản thân (Bio) *</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                placeholder="Chia sẻ ngắn gọn về hành trình sự nghiệp và những gì bạn có thể chia sẻ..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-4 text-orange-700 dark:text-orange-400">
            <ListChecks className="h-5 w-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">2. Lựa chọn Chuyên môn (Bắt buộc)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSpecialties.map(spec => {
              const isSelected = selectedSpecialtyIds.includes(spec.id);
              return (
                <label
                  key={spec.id}
                  className={`relative flex items-start gap-4 cursor-pointer group p-4 rounded-2xl border-2 transition-all duration-200 ${isSelected ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 bg-gray-50/30'}`}
                >
                  <div className="flex items-center h-5 mt-0.5">
                    <div className={`flex items-center justify-center w-5 h-5 rounded border ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white group-hover:border-orange-400'}`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSpecialtyIds(prev => [...prev, spec.id]);
                        else setSelectedSpecialtyIds(prev => prev.filter(id => id !== spec.id));
                      }}
                      className="sr-only"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${isSelected ? 'text-orange-700' : 'text-gray-900 group-hover:text-orange-600'}`}>{spec.name}</span>
                    {spec.description && <span className="text-xs text-gray-500 mt-1">{spec.description}</span>}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-cyan-700">
              <Lightbulb className="h-5 w-5" />
              <h3 className="font-bold">Kỹ năng mềm/cứng</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {expertise.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                  {tag} <button onClick={() => handleRemoveTag(setExpertise, tag)}><X className="h-3 w-3 text-red-500" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExpertise}
                onChange={e => setNewExpertise(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag(setExpertise, newExpertise, setNewExpertise)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                placeholder="VD: C++, React..."
              />
              <button onClick={() => handleAddTag(setExpertise, newExpertise, setNewExpertise)} className="bg-gray-100 px-2 rounded-lg hover:bg-gray-200"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-purple-700">
              <Briefcase className="h-5 w-5" />
              <h3 className="font-bold">Ngành nghề</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {industries.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                  {tag} <button onClick={() => handleRemoveTag(setIndustries, tag)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIndustry}
                onChange={e => setNewIndustry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag(setIndustries, newIndustry, setNewIndustry)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                placeholder="VD: Fintech, E-commerce..."
              />
              <button onClick={() => handleAddTag(setIndustries, newIndustry, setNewIndustry)} className="bg-gray-100 px-2 rounded-lg hover:bg-gray-200"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <Globe className="h-5 w-5" />
              <h3 className="font-bold">Ngôn ngữ</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {languages.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {tag} <button onClick={() => handleRemoveTag(setLanguages, tag)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLanguage}
                onChange={e => setNewLanguage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag(setLanguages, newLanguage, setNewLanguage)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                placeholder="VD: Tiếng Anh, Tiếng Việt..."
              />
              <button onClick={() => handleAddTag(setLanguages, newLanguage, setNewLanguage)} className="bg-gray-100 px-2 rounded-lg hover:bg-gray-200"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {SubmitBar}
    </div>
  );
};

export default BecomeMentorPage;
