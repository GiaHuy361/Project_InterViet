// This file contains all remaining page components
import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  FileText, Mic, BarChart3, Mail, Shield, Book, HelpCircle,
  Phone, MapPin, CheckCircle, AlertCircle, Clock, Users, Target,
  TrendingUp, Download, Share2, Star, Activity, Settings, Bell, Loader2
} from 'lucide-react';

// Features Page
export const FeaturesPage: React.FC = () => {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">TÃ­nh nÄƒng toÃ n diá»‡n</h1>
          <p className="text-xl text-blue-100">
            Giáº£i phÃ¡p AI hoÃ n chá»‰nh cho sá»± nghiá»‡p cá»§a báº¡n
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <Card className="p-8">
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Tá»‘i Æ°u CV thÃ´ng minh</h3>
              <p className="text-gray-600">
                AI phÃ¢n tÃ­ch CV chi tiáº¿t, so khá»›p vá»›i JD vÃ  Ä‘Æ°a ra gá»£i Ã½ cáº£i thiá»‡n cá»¥ thá»ƒ
              </p>
            </Card>
            <Card className="p-8">
              <Mic className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Phỏng vấn AI real-time</h3>
              <p className="text-gray-600">
                Luyá»‡n táº­p phá»ng váº¥n báº±ng giá»ng nÃ³i vá»›i AI, nháº­n feedback tá»©c thÃ¬
              </p>
            </Card>
            <Card className="p-8">
              <BarChart3 className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Báo cáo chi tiết</h3>
              <p className="text-gray-600">
                PhÃ¢n tÃ­ch toÃ n diá»‡n hiá»‡u suáº¥t, so sÃ¡nh vá»›i benchmark ngÃ nh
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

// Solutions Page
export const SolutionsPage: React.FC = () => {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Giải pháp theo ngành</h1>
          <p className="text-xl text-blue-100">
            Tá»‘i Æ°u hÃ³a cho tá»«ng lÄ©nh vá»±c cá»¥ thá»ƒ
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {['CÃ´ng nghá»‡', 'Marketing', 'Tài chính', 'Nhân sự'].map(industry => (
              <Card key={industry} className="p-8">
                <h3 className="text-2xl font-bold mb-4">{industry}</h3>
                <p className="text-gray-600 mb-4">
                  Giáº£i phÃ¡p chuyÃªn biá»‡t cho ngÃ nh {industry.toLowerCase()}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm">Câu hỏi phỏng vấn chuyên ngành</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm">Template CV theo ngành</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm">Benchmark ngành cập nhật</span>
                  </li>
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Blog Page
export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const posts = [
    { id: 1, title: '10 mẹo viết CV thu hút nhà tuyỒn dụng', date: '2026-02-20', category: 'CV Tips' },
    { id: 2, title: 'CÃ¡ch tráº£ lá»i cÃ¢u há»i "Táº¡i sao báº¡n muá»‘n lÃ m viá»‡c á»Ÿ Ä‘Ã¢y?"', date: '2026-02-18', category: 'Phỏng vấn' },
    { id: 3, title: 'Xu hÆ°á»›ng tuyá»ƒn dá»¥ng IT 2026', date: '2026-02-15', category: 'Thá»‹ trÆ°á»ng' },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-blue-100">
            Kiáº¿n thá»©c vÃ  xu hÆ°á»›ng nghá» nghiá»‡p
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map(post => (
              <Card key={post.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/blog/${post.id}`)}>
                <Badge className="mb-4">{post.category}</Badge>
                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                <p className="text-sm text-gray-600">{new Date(post.date).toLocaleDateString('vi-VN')}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Blog Post Page
export const BlogPostPage: React.FC = () => {
  const { slug } = useParams();
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-6">
        <article>
          <Badge className="mb-4">CV Tips</Badge>
          <h1 className="text-4xl font-bold mb-4">10 mẹo viết CV thu hút nhà tuyỒn dụng</h1>
          <p className="text-gray-600 mb-8">Ngày 20 tháng 2, 2026</p>
          <div className="prose max-w-none">
            <p>
              Má»™t CV tá»‘t lÃ  chÃ¬a khÃ³a má»Ÿ ra cÆ¡ há»™i nghá» nghiá»‡p. DÆ°á»›i Ä‘Ã¢y lÃ  10 máº¹o giÃºp CV cá»§a báº¡n ná»•i báº­t...
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

// FAQ Page
export const FAQPage: React.FC = () => {
  const faqs = [
    { q: 'INTER-VIET là gì?', a: 'INTER-VIET lÃ  ná»n táº£ng AI giÃºp báº¡n tá»‘i Æ°u CV vÃ  luyá»‡n phá»ng váº¥n.' },
    { q: 'GÃ³i miá»…n phÃ­ cÃ³ nhá»¯ng gÃ¬?', a: 'GÃ³i miá»…n phÃ­ bao gá»“m 3 láº§n/tÃ i khoáº£n tá»‘i Æ°u CV vÃ  1 phiÃªn/tÃ i khoáº£n phá»ng váº¥n AI.' },
    { q: 'LÃ m sao Ä‘á»ƒ nÃ¢ng cáº¥p gÃ³i?', a: 'Báº¡n cÃ³ thá»ƒ nÃ¢ng cáº¥p báº¥t cá»© lÃºc nÃ o tá»« trang GÃ³i dá»‹ch vá»¥.' },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Câu hỏi thường gặp</h1>
          <p className="text-xl text-blue-100">
            Tìm câu trả lời cho các thắc mắc của bạn
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 space-y-4">
          {faqs.map((faq, i) => (
            <Card key={i} className="p-6">
              <h3 className="font-bold mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

// About Page
export const AboutPage: React.FC = () => {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Về chúng tôi</h1>
          <p className="text-xl text-blue-100">
            Sá»© má»‡nh giÃºp ngÆ°á»i Viá»‡t thÃ nh cÃ´ng trong sá»± nghiá»‡p
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="p-8">
            <h2 className="text-3xl font-bold mb-4">CÃ¢u chuyá»‡n cá»§a chÃºng tÃ´i</h2>
            <p className="text-gray-600 mb-4">
              INTER-VIET Ä‘Æ°á»£c thÃ nh láº­p vá»›i má»¥c tiÃªu giÃºp ngÆ°á»i Viá»‡t Nam tiáº¿p cáº­n cÃ´ng nghá»‡ AI 
              Ä‘á»ƒ phÃ¡t triá»ƒn sá»± nghiá»‡p má»™t cÃ¡ch hiá»‡u quáº£ nháº¥t.
            </p>
            <p className="text-gray-600">
              Vá»›i Ä‘á»™i ngÅ© chuyÃªn gia AI vÃ  HR giÃ u kinh nghiá»‡m, chÃºng tÃ´i xÃ¢y dá»±ng giáº£i phÃ¡p 
              toÃ n diá»‡n giÃºp báº¡n tá»± tin hÆ¡n trong hÃ nh trÃ¬nh tÃ¬m viá»‡c vÃ  phÃ¡t triá»ƒn nghá» nghiá»‡p.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

// Contact Page
export const ContactPage: React.FC = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Cáº£m Æ¡n báº¡n Ä‘Ã£ liÃªn há»‡! ChÃºng tÃ´i sáº½ pháº£n há»“i sá»›m.');
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">LiÃªn há»‡</h1>
          <p className="text-xl text-blue-100">
            ChÃºng tÃ´i luÃ´n sáºµn sÃ ng há»— trá»£ báº¡n
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Gửi tin nhắn</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Họ tên</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="message">Tin nhắn</Label>
                  <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required />
                </div>
                <Button type="submit" className="w-full">Gửi tin nhắn</Button>
              </form>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <Mail className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold mb-2">Email</h3>
                <p className="text-gray-600">support@inter-viet.com</p>
              </Card>
              <Card className="p-6">
                <Phone className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold mb-2">Äiá»‡n thoáº¡i</h3>
                <p className="text-gray-600">+84 (28) 1234 5678</p>
              </Card>
              <Card className="p-6">
                <MapPin className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold mb-2">Äá»‹a chá»‰</h3>
                <p className="text-gray-600">123 Nguyá»…n Huá»‡, Q.1, TP.HCM</p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Support Page
export const SupportPage: React.FC = () => {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Trung tÃ¢m há»— trá»£</h1>
          <p className="text-xl text-blue-100">
            TÃ¬m cÃ¢u tráº£ lá»i vÃ  hÆ°á»›ng dáº«n sá»­ dá»¥ng
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Book className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">HÆ°á»›ng dáº«n sá»­ dá»¥ng</h3>
              <p className="text-gray-600 mb-4">TÃ i liá»‡u chi tiáº¿t vá» cÃ¡c tÃ­nh nÄƒng</p>
              <Button variant="outline">Xem hÆ°á»›ng dáº«n</Button>
            </Card>
            <Card className="p-6">
              <HelpCircle className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">FAQ</h3>
              <p className="text-gray-600 mb-4">Câu hỏi thường gặp</p>
              <Button variant="outline">Xem FAQ</Button>
            </Card>
            <Card className="p-6">
              <Mail className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">LiÃªn há»‡</h3>
              <p className="text-gray-600 mb-4">Há»— trá»£ trá»±c tiáº¿p tá»« team</p>
              <Button variant="outline">LiÃªn há»‡ ngay</Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

// Security Page
export const SecurityPage: React.FC = () => {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Báº£o máº­t & An toÃ n dá»¯ liá»‡u</h1>
          <p className="text-xl text-blue-100">
            Cam káº¿t báº£o vá»‡ thÃ´ng tin cá»§a báº¡n
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Tiêu chuẩn bảo mật</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Shield className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold">Mã hóa SSL 256-bit</h3>
                  <p className="text-sm text-gray-600">Táº¥t cáº£ dá»¯ liá»‡u Ä‘Æ°á»£c mÃ£ hÃ³a khi truyá»n táº£i</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold">Tuân thủ GDPR</h3>
                  <p className="text-sm text-gray-600">Quyá»n riÃªng tÆ° dá»¯ liá»‡u Ä‘Æ°á»£c báº£o vá»‡</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold">Sao lÆ°u Ä‘á»‹nh ká»³</h3>
                  <p className="text-sm text-gray-600">Dá»¯ liá»‡u Ä‘Æ°á»£c backup tá»± Ä‘á»™ng hÃ ng ngÃ y</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
};

// Terms Page
export const TermsPage: React.FC = () => {
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Điều khoản sử dụng</h1>
        <div className="prose max-w-none">
          <h2>1. Cháº¥p nháº­n Ä‘iá»u khoáº£n</h2>
          <p>Báº±ng cÃ¡ch sá»­ dá»¥ng dá»‹ch vá»¥ INTER-VIET, báº¡n Ä‘á»“ng Ã½ vá»›i cÃ¡c Ä‘iá»u khoáº£n nÃ y.</p>
          
          <h2>2. Sá»­ dá»¥ng dá»‹ch vá»¥</h2>
          <p>Báº¡n cam káº¿t sá»­ dá»¥ng dá»‹ch vá»¥ cho má»¥c Ä‘Ã­ch há»£p phÃ¡p vÃ  khÃ´ng vi pháº¡m quyá»n cá»§a ngÆ°á»i khÃ¡c.</p>
          
          <h2>3. Tài khoản người dùng</h2>
          <p>Báº¡n chá»‹u trÃ¡ch nhiá»‡m báº£o máº­t thÃ´ng tin tÃ i khoáº£n cá»§a mÃ¬nh.</p>
          
          <h2>4. Thanh toán và hoàn tiền</h2>
          <p>Chính sách hoàn tiền trong vòng 14 ngày nếu không hài lòng.</p>
        </div>
      </div>
    </div>
  );
};

// Privacy Page
export const PrivacyPage: React.FC = () => {
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Chính sách bảo mật</h1>
        <div className="prose max-w-none">
          <h2>1. Thu thập thông tin</h2>
          <p>ChÃºng tÃ´i thu tháº­p thÃ´ng tin cáº§n thiáº¿t Ä‘á»ƒ cung cáº¥p dá»‹ch vá»¥ tá»‘t nháº¥t.</p>
          
          <h2>2. Sử dụng thông tin</h2>
          <p>ThÃ´ng tin Ä‘Æ°á»£c sá»­ dá»¥ng Ä‘á»ƒ cáº£i thiá»‡n dá»‹ch vá»¥ vÃ  tráº£i nghiá»‡m ngÆ°á»i dÃ¹ng.</p>
          
          <h2>3. Báº£o vá»‡ thÃ´ng tin</h2>
          <p>ChÃºng tÃ´i Ã¡p dá»¥ng cÃ¡c biá»‡n phÃ¡p báº£o máº­t tiÃªn tiáº¿n Ä‘á»ƒ báº£o vá»‡ dá»¯ liá»‡u cá»§a báº¡n.</p>
          
          <h2>4. Chia sẻ thông tin</h2>
          <p>ChÃºng tÃ´i khÃ´ng chia sáº» thÃ´ng tin cÃ¡ nhÃ¢n cá»§a báº¡n vá»›i bÃªn thá»© ba.</p>
        </div>
      </div>
    </div>
  );
};

// Status Page
export const StatusPage: React.FC = () => {
  const services = [
    { name: 'Website', status: 'operational', uptime: 99.9 },
    { name: 'API', status: 'operational', uptime: 99.8 },
    { name: 'AI Engine', status: 'operational', uptime: 99.7 },
    { name: 'Database', status: 'operational', uptime: 99.9 },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Tráº¡ng thÃ¡i há»‡ thá»‘ng</h1>
          <p className="text-xl text-blue-100">
            Táº¥t cáº£ dá»‹ch vá»¥ Ä‘ang hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 space-y-4">
          {services.map(service => (
            <Card key={service.name} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="font-bold">{service.name}</h3>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">Hoáº¡t Ä‘á»™ng</Badge>
                  <p className="text-sm text-gray-600 mt-1">{service.uptime}% uptime</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

// 404 Page
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="p-12 text-center max-w-md">
        <div className="text-8xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4">Trang khÃ´ng tá»“n táº¡i</h1>
        <p className="text-gray-600 mb-8">
          Trang báº¡n Ä‘ang tÃ¬m kiáº¿m khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ Ä‘Æ°á»£c di chuyá»ƒn.
        </p>
        <Button onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      </Card>
    </div>
  );
};

// Maintenance Page
export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="p-12 text-center max-w-md">
        <Settings className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-spin" style={{ animationDuration: '3s' }} />
        <h1 className="text-3xl font-bold mb-4">Đang bảo trì</h1>
        <p className="text-gray-600 mb-4">
          ChÃºng tÃ´i Ä‘ang nÃ¢ng cáº¥p há»‡ thá»‘ng Ä‘á»ƒ mang Ä‘áº¿n tráº£i nghiá»‡m tá»‘t hÆ¡n.
        </p>
        <p className="text-sm text-gray-500">
          Dự kiến hoàn thành: 2 giờ nữa
        </p>
      </Card>
    </div>
  );
};

// Account Locked Page
export const AccountLockedPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="w-full max-w-md p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
      <h1 className="text-3xl font-bold mb-2">TÃ i khoáº£n bá»‹ khÃ³a</h1>
      <p className="text-gray-600 mb-6">
        TÃ i khoáº£n cá»§a báº¡n Ä‘Ã£ bá»‹ khÃ³a do vi pháº¡m Ä‘iá»u khoáº£n sá»­ dá»¥ng.
        Vui lÃ²ng liÃªn há»‡ bá»™ pháº­n há»— trá»£ Ä‘á»ƒ biáº¿t thÃªm chi tiáº¿t.
      </p>
      <Button onClick={() => navigate('/lien-he')}>
        LiÃªn há»‡ há»— trá»£
      </Button>
    </Card>
  );
};
