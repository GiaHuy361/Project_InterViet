import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { PageState } from '../components/phase2/PageState';
import * as jobDescriptionService from '../../services/jobDescriptionService';
import { createApiError } from '../../lib/api/apiError';
import { getPhase3UserMessage } from '../../lib/api/phase3Errors';

const EMPTY_FORM = {
  title: '',
  companyName: '',
  location: '',
  salaryText: '',
  sourceUrl: '',
  postedAt: '',
  rawText: '',
};

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export const JobDescriptionsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<jobDescriptionService.JobDescriptionSummary[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<jobDescriptionService.JobDescriptionDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await jobDescriptionService.getJobDescriptions());
    } catch (err) {
      toast.error(getPhase3UserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title là bắt buộc.';
    if (!form.rawText.trim()) return 'Raw JD text là bắt buộc.';
    if (!isValidUrl(form.sourceUrl)) return 'Source URL không hợp lệ.';
    if (form.postedAt && Number.isNaN(Date.parse(form.postedAt))) return 'Posted at không hợp lệ.';
    return null;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSave = async () => {
    const error = validate();
    if (error) return toast.error(error);
    const payload: jobDescriptionService.JobDescriptionPayload = {
      title: form.title.trim(),
      rawText: form.rawText.trim(),
    };
    if (form.companyName.trim()) payload.companyName = form.companyName.trim();
    if (form.location.trim()) payload.location = form.location.trim();
    if (form.salaryText.trim()) payload.salaryText = form.salaryText.trim();
    if (form.sourceUrl.trim()) payload.sourceUrl = form.sourceUrl.trim();
    if (form.postedAt.trim()) payload.postedAt = new Date(form.postedAt).toISOString();

    try {
      if (editingId) await jobDescriptionService.updateJobDescription(editingId, payload);
      else await jobDescriptionService.createJobDescription(payload);
      toast.success(editingId ? 'Đã cập nhật JD' : 'Đã tạo JD');
      resetForm();
      await load();
    } catch (err) {
      toast.error(createApiError(err).getUserMessage());
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const item = await jobDescriptionService.getJobDescriptionDetail(id);
      setDetail(item);
      setEditingId(id);
      setForm({
        title: item.title ?? '',
        companyName: item.companyName ?? '',
        location: item.location ?? '',
        salaryText: item.salaryText ?? '',
        sourceUrl: item.sourceUrl ?? '',
        postedAt: item.postedAt ? item.postedAt.slice(0, 10) : '',
        rawText: item.rawText ?? '',
      });
    } catch (err) {
      toast.error(createApiError(err).getUserMessage());
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await jobDescriptionService.deleteJobDescription(deleteId);
      toast.success('Đã xóa JD');
      setDeleteId(null);
      await load();
    } catch (err) {
      toast.error(createApiError(err).getUserMessage());
    }
  };

  const handleView = async (id: string) => {
    try {
      setDetail(await jobDescriptionService.getJobDescriptionDetail(id));
    } catch (err) {
      toast.error(createApiError(err).getUserMessage());
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AppPageHeader title="Job Descriptions" subtitle="Create, list, detail, update và delete JD" icon={Target} iconGradient="from-violet-500 to-purple-600" />
      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Create / Edit JD</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div><Label>Company name</Label><Input value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} /></div>
          <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></div>
          <div><Label>Salary text</Label><Input value={form.salaryText} onChange={(e) => setForm((p) => ({ ...p, salaryText: e.target.value }))} /></div>
          <div><Label>Source URL</Label><Input value={form.sourceUrl} onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))} /></div>
          <div><Label>Posted at</Label><Input type="date" value={form.postedAt} onChange={(e) => setForm((p) => ({ ...p, postedAt: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Raw JD text</Label><Textarea rows={10} value={form.rawText} onChange={(e) => setForm((p) => ({ ...p, rawText: e.target.value }))} /></div>
        </div>
        <div className="flex gap-2"><Button onClick={() => void handleSave()}>{editingId ? 'Update' : 'Create'}</Button>{editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}</div>
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">JD list</h2>
        <PageState isLoading={loading} isEmpty={!items.length} emptyTitle="Bạn chưa có JD nào." emptyDescription="Hãy thêm JD đầu tiên để matching với CV.">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.companyName || '-'} · {item.location || '-'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => void handleView(item.id)}><Eye className="mr-1 h-4 w-4" />View</Button>
                    <Button variant="outline" size="sm" onClick={() => void handleEdit(item.id)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteId(item.id)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageState>
      </Card>
      {detail && <Card className="p-6"><h2 className="mb-2 text-xl font-semibold">JD detail</h2><p className="text-sm text-muted-foreground mb-4">{detail.title}</p><pre className="whitespace-pre-wrap text-sm">{detail.rawText}</pre></Card>}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa JD</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa JD này? Các kết quả matching cũ có thể vẫn được giữ trong lịch sử.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
