import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { PageState } from '../../components/phase2/PageState';
import {
  getAdminCmsSummary,
  getAdminTestimonials, createAdminTestimonial, updateAdminTestimonial, deleteAdminTestimonial,
  getAdminFaqs, createAdminFaq, deleteAdminFaq,
  getAdminBlogs, createAdminBlog, deleteAdminBlog,
  getAdminContactRequests, updateAdminContactRequestStatus,
  getAdminReportShares
} from '../../../services/adminContentService';
import type { AdminCmsSummary, Testimonial, FaqItem, BlogPost, AdminContactRequest, AdminReportShare } from '../../../lib/api/publicTypes';
import { FileText as FileTextIcon, Plus, Edit, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';

export const AdminCMSPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-200 dark:shadow-none">
            <FileTextIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Quản lý Nội dung (CMS)</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Quản lý dữ liệu hiển thị trên Landing Page, Help Center và các trang công cộng.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
          <TabsTrigger value="shares">Chia sẻ Báo cáo</TabsTrigger>
          <TabsTrigger value="testimonials">Đánh giá</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <AdminStatsTab />
        </TabsContent>
        <TabsContent value="shares">
          <AdminSharesTab />
        </TabsContent>
        <TabsContent value="testimonials">
          <AdminTestimonialsTab />
        </TabsContent>
        <TabsContent value="faqs">
          <AdminFaqsTab />
        </TabsContent>
        <TabsContent value="blog">
          <AdminBlogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Sub-components for each tab ---

const AdminStatsTab = () => {
  const [summary, setSummary] = useState<AdminCmsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminCmsSummary().then(setSummary).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải...</div>;
  if (!summary) return <div>Lỗi tải dữ liệu</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tổng quan Nội dung</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">FAQs (Đã đăng / Tổng)</p>
          <p className="text-2xl font-bold mt-1">{summary.publishedFaqs} / {summary.totalFaqs}</p>
        </Card>
        <Card className="p-4 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800/50">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Blog (Đã đăng / Tổng)</p>
          <p className="text-2xl font-bold mt-1">{summary.publishedBlogArticles} / {summary.totalBlogArticles}</p>
        </Card>
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Đánh giá (Active / Tổng)</p>
          <p className="text-2xl font-bold mt-1">{summary.activeTestimonials} / {summary.totalTestimonials}</p>
        </Card>
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50">
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Liên hệ (Chờ / Tổng)</p>
          <p className="text-2xl font-bold mt-1">{summary.pendingContactRequests} / {summary.totalContactRequests}</p>
        </Card>
      </div>

      {/* <Card className="p-6">
        <h3 className="font-bold mb-2">Thêm chỉ số động (Dynamic Stats)</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Các chỉ số này có thể hiển thị trên Landing Page. Hiện tại chưa có giao diện danh sách.</p>
        <Button onClick={() => toast.info('Tính năng thêm chỉ số động qua API chưa có UI đầy đủ.')}>Thêm chỉ số</Button>
      </Card> */}
    </div>
  );
};

const AdminTestimonialsTab = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Omit<Testimonial, 'id'>>>({
    authorName: '', authorRole: '', content: '', avatarUrl: '', rating: 5, sortOrder: 0, isActive: true, isFeatured: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    getAdminTestimonials().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (item: Testimonial) => {
    setEditingId(item.id);
    setFormData({
      authorName: item.authorName, authorRole: item.authorRole, content: item.content,
      avatarUrl: item.avatarUrl, rating: item.rating, sortOrder: item.sortOrder,
      isActive: item.isActive, isFeatured: item.isFeatured
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.authorName || !formData.content) {
      toast.error('Vui lòng nhập tên và nội dung');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateAdminTestimonial(editingId, formData);
        toast.success('Đã cập nhật');
      } else {
        toast.error('Không thể tạo mới');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      await deleteAdminTestimonial(id);
      setItems(items.filter(i => i.id !== id));
      toast.success('Đã xóa');
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  if (loading && items.length === 0) return <div>Đang tải...</div>;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Danh sách Đánh giá</h2>
      </div>

      <div className="space-y-4">
        {Array.isArray(items) && items.length > 0 ? items.map(item => (
          <div key={item.id} className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl flex justify-between items-start bg-gray-50 dark:bg-slate-900/50">
            <div className="flex gap-4">
              {item.avatarUrl ? (
                <img src={item.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-gray-500">
                  {item.authorName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 dark:text-slate-100">{item.authorName} <span className="font-normal text-sm text-gray-500">- {item.authorRole}</span></p>
                <div className="flex items-center gap-1 mt-1 text-amber-500">
                  <Star className="w-3 h-3 fill-current" /> <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{item.rating}/5</span>
                  {item.isFeatured && <span className="ml-2 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-2 rounded">Featured</span>}
                  {!item.isActive && <span className="ml-2 text-xs bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2 rounded">Ẩn</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 italic">"{item.content}"</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}><Edit className="w-4 h-4 mr-1" /> Sửa</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Xóa</Button>
            </div>
          </div>
        )) : <p className="text-gray-500 italic">Chưa có đánh giá nào.</p>}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái Đánh giá</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 ">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ảnh đại diện</Label>
                <div className="mt-2">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-gray-500">
                      {formData.authorName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

              </div>
              <div className="space-y-2">
                <Label>Tên tác giả</Label>
                <Input value={formData.authorName} disabled placeholder="VD: Nguyễn Văn A" />
              </div>

            </div>
            <div className="grid grid-cols-1 gap-4">

              <div className="space-y-2">
                <Label>Chức danh / Vai trò</Label>
                <Input value={formData.authorRole} disabled placeholder="VD: Học viên khoá React" />
              </div>
            </div>



            <div className="space-y-2">
              <Label>Nội dung đánh giá</Label>
              <Textarea rows={4} value={formData.content} disabled placeholder="Nhập nội dung..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đánh giá (1-5 sao)</Label>
                <Input type="number" value={formData.rating} disabled />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input type="number" value={formData.sortOrder} disabled />
              </div>
            </div>

            <div className="flex gap-6 mt-2">
              <div className="flex items-center space-x-2">
                <Switch id="is-active" checked={formData.isActive} onCheckedChange={checked => setFormData({ ...formData, isActive: checked })} />
                <Label htmlFor="is-active">Hoạt động (Hiển thị)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is-featured" checked={formData.isFeatured} onCheckedChange={checked => setFormData({ ...formData, isFeatured: checked })} />
                <Label htmlFor="is-featured">Nổi bật (Featured)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu lại'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const AdminFaqsTab = () => {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminFaqs().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa?')) return;
    try {
      await deleteAdminFaq(id);
      setItems(items.filter(i => i.id !== id));
      toast.success('Đã xóa');
    } catch {
      toast.error('Lỗi');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <Card className="p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Danh sách Câu hỏi thường gặp</h2>
        <Button onClick={() => toast.info('Tính năng thêm mới chưa implement trong demo')}>Thêm mới</Button>
      </div>
      <div className="space-y-4">
        {Array.isArray(items) ? items.map(item => (
          <div key={item.id} className="p-4 border rounded flex justify-between items-start">
            <div>
              <p className="font-bold">{item.question}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{item.answer}</p>
              <span className="text-xs bg-gray-100 px-2 rounded">{item.category}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Xóa</Button>
          </div>
        )) : null}
        {(!Array.isArray(items) || items.length === 0) && <p>Chưa có dữ liệu</p>}
      </div>
    </Card>
  );
};

const AdminBlogTab = () => {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminBlogs().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa?')) return;
    try {
      await deleteAdminBlog(id);
      setItems(items.filter(i => i.id !== id));
      toast.success('Đã xóa');
    } catch {
      toast.error('Lỗi');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <Card className="p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Danh sách Bài viết</h2>
        <Button onClick={() => toast.info('Tính năng thêm mới chưa implement trong demo')}>Thêm bài viết</Button>
      </div>
      <div className="space-y-4">
        {Array.isArray(items) ? items.map(item => (
          <div key={item.id} className="p-4 border rounded flex justify-between items-center">
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{item.author} - {new Date(item.publishedAt).toLocaleDateString()}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Xóa</Button>
          </div>
        )) : null}
        {(!Array.isArray(items) || items.length === 0) && <p>Chưa có dữ liệu</p>}
      </div>
    </Card>
  );
};


const AdminSharesTab = () => {
  const [items, setItems] = useState<AdminReportShare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminReportShares().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Đang tải danh sách chia sẻ...</div>;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Quản lý Liên kết Chia sẻ</h2>
        <p className="text-sm text-red-500 font-semibold italic">*Bảo mật: Chỉ hiển thị Token Preview (8 ký tự cuối).</p>
      </div>
      <div className="space-y-4">
        {Array.isArray(items) ? items.map(item => (
          <div key={item.shareId} className="p-4 border rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Chủ sở hữu: {item.ownerFullName} ({item.ownerEmail})</p>
                <p className="text-sm">Loại báo cáo: {item.reportType}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${item.isActive ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
                  {item.isActive ? 'Đang kích hoạt' : 'Đã vô hiệu hóa'}
                </span>
                <p className="text-xs mt-1 font-mono text-gray-500 dark:text-slate-400">Token: ***{item.tokenPreview}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Ngày tạo: {new Date(item.createdAt).toLocaleString()} | Lượt xem: {item.viewCount}</p>
          </div>
        )) : null}
        {(!Array.isArray(items) || items.length === 0) && <p>Chưa có dữ liệu</p>}
      </div>
    </Card>
  );
};
