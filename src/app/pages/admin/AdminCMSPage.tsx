import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { PageState } from '../../components/phase2/PageState';
import {
  getAdminCmsSummary,
  getAdminTestimonials, createAdminTestimonial, deleteAdminTestimonial,
  getAdminFaqs, createAdminFaq, deleteAdminFaq,
  getAdminBlogs, createAdminBlog, deleteAdminBlog,
  getAdminContactRequests, updateAdminContactRequestStatus,
  getAdminReportShares
} from '../../../services/adminContentService';
import type { AdminCmsSummary, Testimonial, FaqItem, BlogPost, AdminContactRequest, AdminReportShare } from '../../../lib/api/publicTypes';
import { FileText as FileTextIcon } from 'lucide-react';

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

  useEffect(() => {
    getAdminTestimonials().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa?')) return;
    try {
      await deleteAdminTestimonial(id);
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
        <h2 className="text-xl font-bold">Danh sách Đánh giá</h2>
        <Button onClick={() => toast.info('Tính năng thêm mới chưa implement trong demo')}>Thêm mới</Button>
      </div>
      <div className="space-y-4">
        {Array.isArray(items) ? items.map(item => (
          <div key={item.id} className="p-4 border rounded flex justify-between items-center">
            <div>
              <p className="font-bold">{item.authorName} - {item.authorRole}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">"{item.content}" - {item.rating} sao</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Xóa</Button>
          </div>
        )) : null}
        {(!Array.isArray(items) || items.length === 0) && <p>Chưa có dữ liệu</p>}
      </div>
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
