import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { PublicPageHero } from '../components/design-system/PublicPageHero';
import { Stagger, StaggerItem, ScaleOnHover } from '../components/design-system/motion';
import {
  FileText,
  Mic,
  BarChart3,
  Mail,
  Shield,
  Book,
  HelpCircle,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { getPublicFaqs, getPublicBlogs, submitContactRequest } from '../../services/publicContentService';
import type { FaqItem, BlogPost } from '../../lib/api/publicTypes';

function GlassFeatureCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ScaleOnHover>
      <Card
        className={`glass-card hover-lift rounded-2xl border-white/70 p-8 dark:border-slate-700/50 ${className ?? ''}`}
      >
        {children}
      </Card>
    </ScaleOnHover>
  );
}

export const FeaturesPage: React.FC = () => (
  <div>
    <PublicPageHero
      title="Tính năng toàn diện"
      subtitle="Giải pháp AI hoàn chỉnh cho sự nghiệp của bạn"
    />
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Stagger className="grid gap-8 md:grid-cols-3">
          {[
            { icon: FileText, bg: 'from-blue-500 to-cyan-500', title: 'Tối ưu CV thông minh', desc: 'AI phân tích CV chi tiết, so khớp với JD và đưa ra gợi ý cải thiện cụ thể' },
            { icon: Mic, bg: 'from-violet-500 to-fuchsia-500', title: 'Phỏng vấn AI real-time', desc: 'Luyện tập phỏng vấn bằng giọng nói với AI, nhận feedback tức thì' },
            { icon: BarChart3, bg: 'from-emerald-500 to-teal-500', title: 'Báo cáo chi tiết', desc: 'Phân tích toàn diện hiệu suất, so sánh với benchmark ngành' },
          ].map((f) => (
            <StaggerItem key={f.title}>
              <GlassFeatureCard>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.bg} text-white shadow-lg`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{f.desc}</p>
              </GlassFeatureCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  </div>
);

export const SolutionsPage: React.FC = () => {
  const industries = ['Công nghệ', 'Marketing', 'Tài chính', 'Nhân sự'] as const;
  return (
    <div>
      <PublicPageHero title="Giải pháp theo ngành" subtitle="Tối ưu hóa cho từng lĩnh vực cụ thể" />
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Stagger className="grid gap-8 md:grid-cols-2">
            {industries.map((industry) => (
              <StaggerItem key={industry}>
                <GlassFeatureCard>
                  <h3 className="mb-4 text-2xl font-bold">{industry}</h3>
                  <p className="mb-4 text-slate-600">Giải pháp chuyên biệt cho ngành {industry.toLowerCase()}</p>
                  <ul className="space-y-2">
                    {['Câu hỏi phỏng vấn chuyên ngành', 'Template CV theo ngành', 'Benchmark ngành cập nhật'].map((t) => (
                      <li key={t} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className="text-emerald-500" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </GlassFeatureCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </div>
  );
};

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getPublicBlogs().then(setPosts).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PublicPageHero title="Blog" subtitle="Kiến thức và xu hướng nghề nghiệp" />
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          {loading ? (
            <div className="text-center py-10">Đang tải bài viết...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">Không tìm thấy bài viết nào trong danh mục này.</p>
            </div>
          ) : (
            <Stagger className="grid gap-8 md:grid-cols-3">
              {posts.map((post) => (
                <StaggerItem key={post.id}>
                  <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <Card className="glass-card hover-lift cursor-pointer rounded-2xl p-6" onClick={() => navigate(`/blog/${post.slug}`)}>
                      {post.category && <Badge className="mb-4">{post.category}</Badge>}
                      <h3 className="mb-2 text-xl font-bold">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</p>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>
    </div>
  );
};

export const BlogPostPage: React.FC = () => {
  useParams();
  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <article className="glass-card rounded-2xl p-8 lg:p-10">
          <Badge className="mb-4">CV Tips</Badge>
          <h1 className="mb-4 text-4xl font-bold">10 mẹo viết CV thu hút nhà tuyển dụng</h1>
          <p className="mb-8 text-muted-foreground">Ngày 20 tháng 2, 2026</p>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            Một CV tốt là chìa khóa mở ra cơ hội nghề nghiệp. Dưới đây là 10 mẹo giúp CV của bạn nổi bật trước nhà tuyển dụng...
          </p>
        </article>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const [faqs, setFaqs] = React.useState<FaqItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    getPublicFaqs().then(setFaqs).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PublicPageHero title="Câu hỏi thường gặp" subtitle="Tìm câu trả lời cho các thắc mắc của bạn" />
      <section className="py-20">
        <div className="mx-auto max-w-4xl space-y-4 px-6">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Đang tải câu hỏi...</div>
          ) : faqs.length > 0 ? (
            faqs.map((faq, i) => (
              <motion.div key={faq.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="glass-card rounded-2xl p-6">
                  <h3 className="mb-2 font-bold">{faq.question}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Trung tâm trợ giúp đang cập nhật câu hỏi, vui lòng liên hệ trực tiếp với chúng tôi qua nút hỗ trợ dưới đây.</p>
              <Button onClick={() => window.location.href = '/lien-he'}>Liên hệ Hỗ trợ</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export const AboutPage: React.FC = () => (
  <div>
    <PublicPageHero title="Về chúng tôi" subtitle="Sứ mệnh giúp người Việt thành công trong sự nghiệp" />
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <Card className="glass-card rounded-2xl p-8 lg:p-10">
          <h2 className="mb-4 text-3xl font-bold">Câu chuyện của chúng tôi</h2>
          <p className="mb-4 text-slate-600 dark:text-slate-400">
            INTER-VIET được thành lập với mục tiêu giúp người Việt Nam tiếp cận công nghệ AI để phát triển sự nghiệp một cách hiệu quả nhất.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Với đội ngũ chuyên gia AI và HR giàu kinh nghiệm, chúng tôi xây dựng giải pháp toàn diện giúp bạn tự tin hơn trong hành trình tìm việc và phát triển nghề nghiệp.
          </p>
        </Card>
      </div>
    </section>
  </div>
);

export const ContactPage: React.FC = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [category, setCategory] = React.useState('Chung');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});
    try {
      await submitContactRequest({ name, email, phone, category, subject: 'Liên hệ từ website', message });
      alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.');
      setName('');
      setEmail('');
      setPhone('');
      setCategory('Chung');
      setMessage('');
    } catch (err: any) {
      if (err.code === 'Validation.Failed' && err.details) {
        // Validation Error từ backend 400 Bad Request
        setValidationErrors(err.details);
      } else {
        alert(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <PublicPageHero title="Liên hệ" subtitle="Chúng tôi luôn sẵn sàng hỗ trợ bạn" />
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <Card className="glass-card rounded-2xl p-8">
              <h2 className="mb-6 text-3xl font-bold">Gửi tin nhắn</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Họ tên</Label>
                  <Input id="name" className={`input-premium mt-1 ${validationErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`} value={name} onChange={(e) => setName(e.target.value)} required />
                  {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name.join(', ')}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" className={`input-premium mt-1 ${validationErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email.join(', ')}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" type="tel" className={`input-premium mt-1 ${validationErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone.join(', ')}</p>}
                </div>
                <div>
                  <Label htmlFor="category">Chủ đề cần tư vấn</Label>
                  <select id="category" className={`input-premium mt-1 w-full ${validationErrors.category ? 'border-red-500 focus-visible:ring-red-500' : ''}`} value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="Chung">Tư vấn chung</option>
                    <option value="Billing">Thanh toán & Gói cước</option>
                    <option value="Technical">Hỗ trợ kỹ thuật</option>
                  </select>
                  {validationErrors.category && <p className="text-red-500 text-xs mt-1">{validationErrors.category.join(', ')}</p>}
                </div>
                <div>
                  <Label htmlFor="message">Tin nhắn</Label>
                  <Textarea id="message" className={`input-premium mt-1 ${validationErrors.message ? 'border-red-500 focus-visible:ring-red-500' : ''}`} value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required />
                  {validationErrors.message && <p className="text-red-500 text-xs mt-1">{validationErrors.message.join(', ')}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="btn-glow h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600">
                  {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </Button>
              </form>
            </Card>
            <div className="space-y-6">
              {[
                { icon: Mail, title: 'Email', value: 'support@inter-viet.com' },
                { icon: Phone, title: 'Điện thoại', value: '+84 (28) 1234 5678' },
                { icon: MapPin, title: 'Địa chỉ', value: '123 Nguyễn Huệ, Q.1, TP.HCM' },
              ].map((c) => (
                <Card key={c.title} className="glass-card hover-lift rounded-2xl p-6">
                  <c.icon className="mb-3 h-8 w-8 text-violet-600 dark:text-violet-400" />
                  <h3 className="mb-2 font-bold">{c.title}</h3>
                  <p className="text-slate-600">{c.value}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const SupportPage: React.FC = () => (
  <div>
    <PublicPageHero title="Trung tâm hỗ trợ" subtitle="Tìm câu trả lời và hướng dẫn sử dụng" />
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Stagger className="grid gap-8 md:grid-cols-3">
          {[
            { icon: Book, title: 'Hướng dẫn sử dụng', desc: 'Tài liệu chi tiết về các tính năng', btn: 'Xem hướng dẫn' },
            { icon: HelpCircle, title: 'FAQ', desc: 'Câu hỏi thường gặp', btn: 'Xem FAQ' },
            { icon: Mail, title: 'Liên hệ', desc: 'Hỗ trợ trực tiếp từ team', btn: 'Liên hệ ngay' },
          ].map((item) => (
            <StaggerItem key={item.title}>
              <GlassFeatureCard>
                <item.icon className="mb-4 h-12 w-12 text-violet-600 dark:text-violet-400" />
                <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                <p className="mb-4 text-slate-600">{item.desc}</p>
                <Button variant="outline" className="rounded-xl">{item.btn}</Button>
              </GlassFeatureCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  </div>
);

export const SecurityPage: React.FC = () => (
  <div>
    <PublicPageHero title="Bảo mật & An toàn dữ liệu" subtitle="Cam kết bảo vệ thông tin của bạn" />
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <Card className="glass-card rounded-2xl p-8">
          <h2 className="mb-6 text-2xl font-bold">Tiêu chuẩn bảo mật</h2>
          <ul className="space-y-4">
            {[
              { t: 'Mã hóa SSL 256-bit', d: 'Tất cả dữ liệu được mã hóa khi truyền tải' },
              { t: 'Tuân thủ GDPR', d: 'Quyền riêng tư dữ liệu được bảo vệ' },
              { t: 'Sao lưu định kỳ', d: 'Dữ liệu được backup tự động hàng ngày' },
            ].map((item) => (
              <li key={item.t} className="flex items-start gap-3">
                <Shield className="mt-1 shrink-0 text-emerald-500" size={20} />
                <div>
                  <h3 className="font-semibold">{item.t}</h3>
                  <p className="text-sm text-slate-600">{item.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="py-20">
    <div className="mx-auto max-w-4xl px-6">
      <Card className="glass-card rounded-2xl p-8 lg:p-10">
        <h1 className="mb-8 text-4xl font-bold">Điều khoản sử dụng</h1>
        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          <section><h2 className="text-xl font-bold">1. Chấp nhận điều khoản</h2><p className="mt-2">Bằng cách sử dụng dịch vụ INTER-VIET, bạn đồng ý với các điều khoản này.</p></section>
          <section><h2 className="text-xl font-bold">2. Sử dụng dịch vụ</h2><p className="mt-2">Bạn cam kết sử dụng dịch vụ cho mục đích hợp pháp và không vi phạm quyền của người khác.</p></section>
          <section><h2 className="text-xl font-bold">3. Tài khoản người dùng</h2><p className="mt-2">Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình.</p></section>
          <section><h2 className="text-xl font-bold">4. Thanh toán và hoàn tiền</h2><p className="mt-2">Chính sách hoàn tiền trong vòng 14 ngày nếu không hài lòng.</p></section>
        </div>
      </Card>
    </div>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="py-20">
    <div className="mx-auto max-w-4xl px-6">
      <Card className="glass-card rounded-2xl p-8 lg:p-10">
        <h1 className="mb-8 text-4xl font-bold">Chính sách bảo mật</h1>
        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          {[
            ['1. Thu thập thông tin', 'Chúng tôi thu thập thông tin cần thiết để cung cấp dịch vụ tốt nhất.'],
            ['2. Sử dụng thông tin', 'Thông tin được sử dụng để cải thiện dịch vụ và trải nghiệm người dùng.'],
            ['3. Bảo vệ thông tin', 'Chúng tôi áp dụng các biện pháp bảo mật tiên tiến để bảo vệ dữ liệu của bạn.'],
            ['4. Chia sẻ thông tin', 'Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba.'],
          ].map(([h, p]) => (
            <section key={h}><h2 className="text-xl font-bold">{h}</h2><p className="mt-2">{p}</p></section>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

export const StatusPage: React.FC = () => {
  const services = [
    { name: 'Website', uptime: 99.9 },
    { name: 'API', uptime: 99.8 },
    { name: 'AI Engine', uptime: 99.7 },
    { name: 'Database', uptime: 99.9 },
  ];
  return (
    <div>
      <PublicPageHero title="Trạng thái hệ thống" subtitle="Tất cả dịch vụ đang hoạt động bình thường" />
      <section className="py-20">
        <div className="mx-auto max-w-4xl space-y-4 px-6">
          {services.map((service, i) => (
            <motion.div key={service.name} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Card className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-50 dark:bg-emerald-900/300 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <h3 className="font-bold">{service.name}</h3>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Hoạt động</Badge>
                    <p className="mt-1 text-sm text-slate-500">{service.uptime}% uptime</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6">
      <Card className="glass-card max-w-md rounded-2xl p-12 text-center">
        <p className="text-8xl font-bold text-gradient-brand">404</p>
        <h1 className="mb-4 mt-4 text-3xl font-bold">Trang không tồn tại</h1>
        <p className="mb-8 text-slate-600">Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
        <Button className="btn-glow rounded-xl bg-gradient-to-r from-blue-600 to-violet-600" onClick={() => navigate('/')}>Về trang chủ</Button>
      </Card>
    </div>
  );
};

export const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();

  // Read feature gate context from query params (set by apiClient on 503 Feature Gate)
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const featureParam = searchParams.get('feature'); // 'admin' | 'support' | null
  const codeParam = searchParams.get('code'); // 'Admin.Disabled' | 'Support.Disabled' | null

  const isFeatureGate = !!featureParam;

  // Feature-specific labels
  const featureLabels: Record<string, { title: string; description: string; icon: typeof Settings }> = {
    admin: {
      title: 'Tính năng Quản trị tạm ngưng',
      description: 'Tính năng quản trị hệ thống hiện đang bị tắt bởi quản trị viên. Vui lòng liên hệ quản trị viên để biết thêm thông tin.',
      icon: Shield,
    },
    support: {
      title: 'Tính năng Hỗ trợ tạm ngưng',
      description: 'Tính năng hỗ trợ khách hàng hiện đang bị tắt bởi quản trị viên. Vui lòng liên hệ quản trị viên để biết thêm thông tin.',
      icon: AlertCircle,
    },
  };

  const featureInfo = featureParam ? featureLabels[featureParam] : null;

  if (isFeatureGate && featureInfo) {
    const FeatureIcon = featureInfo.icon;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <Card className="glass-card max-w-lg rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
            <FeatureIcon className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{featureInfo.title}</h1>
          <p className="mb-3 text-slate-600">{featureInfo.description}</p>
          <p className="mb-6 text-sm text-slate-400">
            Trạng thái này chỉ thay đổi khi quản trị viên cập nhật cấu hình hệ thống. Không cần tải lại trang liên tục.
          </p>
          {codeParam && (
            <p className="mb-6 rounded-lg bg-gray-50 px-3 py-2 text-xs font-mono text-gray-400">
              Mã lỗi: {codeParam}
            </p>
          )}
          <Button className="rounded-xl" onClick={() => navigate('/dashboard')}>
            Quay lại Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // General maintenance (non-feature-gate 503)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-violet-50 p-6">
      <Card className="glass-card max-w-md rounded-2xl p-12 text-center">
        <Settings className="mx-auto mb-4 h-20 w-20 animate-spin text-violet-600 dark:text-violet-400" style={{ animationDuration: '3s' }} />
        <h1 className="mb-4 text-3xl font-bold">Đang bảo trì</h1>
        <p className="mb-4 text-slate-600">Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn.</p>
        <p className="text-sm text-slate-500">Dự kiến hoàn thành: 2 giờ nữa</p>
      </Card>
    </div>
  );
};

export const AccountLockedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Card className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
      <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
      <h1 className="mb-2 text-3xl font-bold">Tài khoản bị khóa</h1>
      <p className="mb-6 text-slate-600">Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng. Vui lòng liên hệ bộ phận hỗ trợ.</p>
      <Button className="rounded-xl" onClick={() => navigate('/lien-he')}>Liên hệ hỗ trợ</Button>
    </Card>
  );
};

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6 bg-transparent">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
        <Card className="glass-card rounded-3xl p-10 text-center shadow-2xl border border-red-100 dark:border-red-900/30 relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-400"></div>
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 ring-8 ring-red-50/50 dark:ring-red-900/10">
            <Shield className="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Truy cập bị từ chối</h1>
          <p className="mb-8 text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-2">
            Rất tiếc, bạn không có đủ quyền hạn để xem trang này. Vui lòng kiểm tra lại đường dẫn hoặc liên hệ quản trị viên.
          </p>
          <div className="flex flex-col gap-3">
            <Button className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 h-12 shadow-lg shadow-gray-200 dark:shadow-none transition-all font-medium" onClick={() => navigate('/dashboard')}>
              Về Dashboard
            </Button>
            <Button variant="ghost" className="rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white h-12 font-medium" onClick={() => navigate(-1)}>
              Quay lại trang trước
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
