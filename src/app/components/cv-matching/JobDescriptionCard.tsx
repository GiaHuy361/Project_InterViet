import React from 'react';
import { ExternalLink, CalendarDays, MapPin, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

interface JobDescriptionCardProps {
  newJdTitle: string;
  newJdCompanyName: string;
  newJdLocation: string;
  newJdSalaryText: string;
  newJdSourceUrl: string;
  newJdPostedAt: string;
  newJdRawText: string;
  creatingJd: boolean;
  onChangeTitle: (value: string) => void;
  onChangeCompanyName: (value: string) => void;
  onChangeLocation: (value: string) => void;
  onChangeSalaryText: (value: string) => void;
  onChangeSourceUrl: (value: string) => void;
  onChangePostedAt: (value: string) => void;
  onChangeRawText: (value: string) => void;
  onCreate: () => void;
}

export const JobDescriptionCard: React.FC<JobDescriptionCardProps> = ({
  newJdTitle,
  newJdCompanyName,
  newJdLocation,
  newJdSalaryText,
  newJdSourceUrl,
  newJdPostedAt,
  newJdRawText,
  creatingJd,
  onChangeTitle,
  onChangeCompanyName,
  onChangeLocation,
  onChangeSalaryText,
  onChangeSourceUrl,
  onChangePostedAt,
  onChangeRawText,
  onCreate,
}) => {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Tạo Job Description</h2>
        <p className="text-sm text-slate-500">Tạo JD mới ngay trong màn này để dùng cho matching.</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jdTitle">Tên JD</Label>
            <Input id="jdTitle" value={newJdTitle} onChange={(e) => onChangeTitle(e.target.value)} placeholder="Ví dụ: Backend C#" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jdCompany">Tên công ty</Label>
            <Input id="jdCompany" value={newJdCompanyName} onChange={(e) => onChangeCompanyName(e.target.value)} placeholder="Ví dụ: Tech Corp" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jdLocation">Địa điểm</Label>
            <Input id="jdLocation" value={newJdLocation} onChange={(e) => onChangeLocation(e.target.value)} placeholder="Ví dụ: Ho Chi Minh" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jdSalary">Mức lương</Label>
            <Input id="jdSalary" value={newJdSalaryText} onChange={(e) => onChangeSalaryText(e.target.value)} placeholder="Ví dụ: 20.000.000 - 30.000.000 VNĐ" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="jdSourceUrl">Link nguồn</Label>
            <Input id="jdSourceUrl" value={newJdSourceUrl} onChange={(e) => onChangeSourceUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="jdPostedAt">Ngày đăng</Label>
            <Input id="jdPostedAt" type="date" value={newJdPostedAt} onChange={(e) => onChangePostedAt(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="jdRawText">Nội dung JD</Label>
          <Textarea id="jdRawText" value={newJdRawText} onChange={(e) => onChangeRawText(e.target.value)} placeholder="Dán toàn bộ mô tả công việc vào đây..." className="min-h-40" />
        </div>
        <div className="flex justify-end">
          <Button onClick={onCreate} disabled={creatingJd}>
            {creatingJd ? 'Đang tạo...' : 'Tạo JD mới'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
