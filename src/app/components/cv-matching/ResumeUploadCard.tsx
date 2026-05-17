import React from 'react';
import { Loader2, Upload, BadgeInfo, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ResumeUploadCardProps {
  selectedFile: File | null;
  title: string;
  uploadError: string;
  uploading: boolean;
  onChangeFile: (file: File | null) => void;
  onChangeTitle: (value: string) => void;
  onUpload: () => void;
  validateFile: (file: File) => string | null;
}

export const ResumeUploadCard: React.FC<ResumeUploadCardProps> = ({
  selectedFile,
  title,
  uploadError,
  uploading,
  onChangeFile,
  onChangeTitle,
  onUpload,
  validateFile,
}) => {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-6 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />CV Upload
            </div>
            <h2 className="mt-3 text-2xl font-semibold">Upload CV</h2>
            <p className="mt-1 text-sm text-white/80">Tải CV lên để hệ thống xử lý và đồng bộ trạng thái.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm backdrop-blur">
            <BadgeInfo className="h-4 w-4" />
            <span>PDF · DOCX · JPG · PNG · 10MB</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-stretch">
          <div className="space-y-2">
            <Label htmlFor="cvFile" className="text-sm font-semibold text-slate-800">File CV</Label>
            <div className="flex h-full min-h-[120px] flex-col justify-between rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] transition-colors hover:border-blue-400 hover:bg-slate-50">
              <input
                id="cvFile"
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  onChangeFile(file);
                }}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{selectedFile ? selectedFile.name : 'Chưa chọn file nào'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Chọn file từ máy tính của bạn để tiếp tục.</p>
                </div>
                <label htmlFor="cvFile" className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
                  Choose File
                </label>
              </div>
            </div>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvTitle" className="text-sm font-semibold text-slate-800">Title</Label>
            <div className="flex h-full min-h-[120px] flex-col justify-between rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="space-y-2">
                <Input id="cvTitle" value={title} onChange={(e) => onChangeTitle(e.target.value)} placeholder="Ví dụ: CV Backend 2026" className="h-11 rounded-xl" />
                <p className="text-xs text-muted-foreground">Không bắt buộc, dùng để bạn dễ quản lý danh sách CV.</p>
              </div>
              <Button onClick={onUpload} disabled={uploading} className="mt-4 h-11 w-full rounded-xl px-6 shadow-sm">
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload CV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
