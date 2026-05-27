import React, { useEffect, useState } from 'react';
import { 
  UserCircle, 
  Save, 
  Loader2, 
  Plus, 
  X,
  Briefcase,
  Lightbulb,
  Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import mentorWorkspaceService from '../../../services/mentorWorkspaceService';
import type { MentorProfile, UpdateMentorProfileRequest } from '../../../lib/api/publicTypes';
import { toast } from 'sonner';

export const MentorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Array State
  const [expertise, setExpertise] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // Input states for adding new tags
  const [newExpertise, setNewExpertise] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await mentorWorkspaceService.getMentorProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setHeadline(data.headline || '');
      setBio(data.bio || '');
      setYearsOfExperience(data.yearsOfExperience || 0);
      setAvatarUrl(data.avatarUrl || '');
      setExpertise(data.expertise || []);
      setIndustries(data.industries || []);
      setLanguages(data.languages || []);
    } catch (err) {
      console.error('Failed to load mentor profile', err);
      toast.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateMentorProfileRequest = {
        fullName: fullName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        yearsOfExperience,
        avatarUrl: avatarUrl.trim(),
        expertise,
        industries,
        languages
      };
      const data = await mentorWorkspaceService.updateMentorProfile(payload);
      setProfile(data);
      toast.success('Đã lưu hồ sơ thành công');
    } catch (err) {
      console.error('Failed to save profile', err);
      toast.error('Lưu hồ sơ thất bại');
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
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p>Đang tải hồ sơ chuyên gia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-200">
            <UserCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hồ sơ Chuyên gia</h1>
            <p className="text-sm text-gray-500">
              Cập nhật thông tin để ứng viên có thể tìm thấy bạn
            </p>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-200">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Thông tin Cơ bản</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="Vd: Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề (Headline)</label>
                <input 
                  type="text" 
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  placeholder="Vd: Senior Software Engineer tại Google"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số năm kinh nghiệm</label>
                  <input 
                    type="number" 
                    value={yearsOfExperience}
                    onChange={e => setYearsOfExperience(Number(e.target.value))}
                    min={0}
                    step={0.5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh đại diện (Avatar URL)</label>
                  <input 
                    type="url" 
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu bản thân (Bio)</label>
                <textarea 
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                  placeholder="Chia sẻ về kinh nghiệm, định hướng và cách bạn có thể giúp ứng viên..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Skills & Tags */}
        <div className="space-y-6 lg:col-span-1">
          {/* Status Card */}
          <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
            <div className="flex items-center gap-3 text-white">
              <div className={`h-3 w-3 rounded-full ${profile?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
              <span className="font-medium text-sm">Trạng thái: {profile?.status === 'active' ? 'Đang hoạt động' : 'Tạm ẩn'}</span>
            </div>
            {profile?.isVerified ? (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 text-cyan-300 px-3 py-1 text-xs font-semibold border border-cyan-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Hồ sơ đã được xác thực
              </div>
            ) : (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 text-gray-300 px-3 py-1 text-xs font-semibold">
                Chưa xác thực
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-cyan-700">
              <Lightbulb className="h-5 w-5" />
              <h3 className="font-bold">Chuyên môn (Expertise)</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {expertise.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {tag}
                  <button onClick={() => handleRemoveTag(setExpertise, tag)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newExpertise}
                onChange={e => setNewExpertise(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag(setExpertise, newExpertise, setNewExpertise)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:bg-white focus:outline-none focus:border-cyan-400"
                placeholder="Thêm kỹ năng..."
              />
              <button onClick={() => handleAddTag(setExpertise, newExpertise, setNewExpertise)} className="rounded-lg bg-gray-100 px-3 hover:bg-gray-200 transition-colors"><Plus className="h-4 w-4 text-gray-600" /></button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-purple-700">
              <Briefcase className="h-5 w-5" />
              <h3 className="font-bold">Ngành nghề (Industries)</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {industries.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full text-xs font-medium">
                  {tag}
                  <button onClick={() => handleRemoveTag(setIndustries, tag)} className="hover:text-purple-900 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newIndustry}
                onChange={e => setNewIndustry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag(setIndustries, newIndustry, setNewIndustry)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:bg-white focus:outline-none focus:border-purple-400"
                placeholder="Thêm ngành..."
              />
              <button onClick={() => handleAddTag(setIndustries, newIndustry, setNewIndustry)} className="rounded-lg bg-gray-100 px-3 hover:bg-gray-200 transition-colors"><Plus className="h-4 w-4 text-gray-600" /></button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <Globe className="h-5 w-5" />
              <h3 className="font-bold">Ngôn ngữ (Languages)</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {languages.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-medium">
                  {tag}
                  <button onClick={() => handleRemoveTag(setLanguages, tag)} className="hover:text-blue-900 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newLanguage}
                onChange={e => setNewLanguage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag(setLanguages, newLanguage, setNewLanguage)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:bg-white focus:outline-none focus:border-blue-400"
                placeholder="Thêm ngôn ngữ..."
              />
              <button onClick={() => handleAddTag(setLanguages, newLanguage, setNewLanguage)} className="rounded-lg bg-gray-100 px-3 hover:bg-gray-200 transition-colors"><Plus className="h-4 w-4 text-gray-600" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfilePage;
