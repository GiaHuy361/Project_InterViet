import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FadeIn, Stagger, StaggerItem, ScaleOnHover } from '../components/design-system/motion';
import { MeshBackground } from '../components/design-system/MeshBackground';
import { FloatingOrbs } from '../components/design-system/FloatingOrbs';
import { DashboardPreview } from '../components/brand/DashboardPreview';
import { AvatarInitials } from '../components/brand/AvatarInitials';
import {
  FileText,
  Mic,
  BarChart3,
  Sparkles,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  ChevronDown,
  Quote,
  GraduationCap,
  Play,
  TrendingUp
} from 'lucide-react';
import { getPublicStats, getPublicTestimonials, getPublicBlogs } from '../../services/publicContentService';
import type { PublicStatsResponse, Testimonial, BlogPost } from '../../lib/api/publicTypes';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<PublicStatsResponse>({
    totalCandidates: 0,
    totalCVsProcessed: 0,
    totalInterviewsConducted: 0,
    averageRating: 0
  });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    getPublicStats().then(setStats).catch(console.error).finally(() => setLoadingStats(false));
    getPublicTestimonials().then(setTestimonials).catch(console.error).finally(() => setLoadingTestimonials(false));
    getPublicBlogs({ page: 1, pageSize: 3 }).then(setBlogs).catch(console.error).finally(() => setLoadingBlogs(false));
  }, []);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      {/* Hero Section - SIMPLE with inline stats */}
      <section className="relative overflow-hidden py-20 text-white lg:py-28">
        <MeshBackground variant="auth" />
        <FloatingOrbs />
        <section className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/88 via-violet-700/82 to-indigo-900/88" />
        <section className="relative z-10 mx-auto max-w-[1440px] px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-5">
              <Sparkles size={16} className="text-yellow-300" />
              <p className="text-xs font-medium">Nền tảng AI số 1 cho ứng viên Việt Nam</p>
            </div>
            
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-5 text-4xl font-extrabold leading-tight tracking-tight lg:text-6xl"
            >
              Cố vấn sự nghiệp AI 24/7
              <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200 bg-clip-text text-transparent animate-gradient-shift">
                cho người Việt
              </span>
            </motion.h1>
            
            <p className="text-lg lg:text-xl mb-8 text-blue-100 leading-relaxed max-w-3xl mx-auto">
              Tối ưu CV thông minh, luyện phỏng vấn real-time bằng giọng nói,
              <br className="hidden lg:block" />
              và tìm việc nhanh hơn với AI
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <Button 
                size="lg" 
                onClick={() => navigate('/dang-ky')}
                className="group btn-glow h-12 rounded-xl bg-white px-8 font-semibold text-blue-700 dark:text-blue-400 shadow-2xl hover:bg-blue-50 dark:bg-blue-900/30"
              >
                Dùng thử miễn phí <ArrowRight className="ml-2 size-[18px] transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-base px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => {
                  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2" size={18} />
                Xem Demo
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{stats.totalCandidates === 0 ? '0' : `${stats.totalCandidates.toLocaleString()}+`}</div>
                <div className="text-xs text-blue-100">Người dùng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{stats.totalCVsProcessed === 0 ? '0' : `${stats.totalCVsProcessed.toLocaleString()}+`}</div>
                <div className="text-xs text-blue-100">CV tối ưu</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{stats.totalInterviewsConducted === 0 ? '0' : `${stats.totalInterviewsConducted.toLocaleString()}+`}</div>
                <div className="text-xs text-blue-100">Phỏng vấn</div>
              </div>
              <div className="text-center">
                {stats.averageRating === 0 ? (
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-sm font-semibold italic text-blue-200">Chưa có đánh giá</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={18} fill="currentColor" className="text-yellow-300" />
                    <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
                  </div>
                )}
                <div className="text-xs text-blue-100">Đánh giá</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown size={24} className="text-white/60" />
          </div>
        </section>
      </section>

      {/* Product Demo - Clean & Simple */}
      <section id="demo" className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-2">Giao diện thân thiện, dễ sử dụng</h2>
            <p className="text-lg text-gray-600">Trải nghiệm AI tối ưu trong từng chi tiết</p>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* Company Logos - One Line */}
      <section className="py-10 bg-white border-y border-gray-200">
        <div className="max-w-[1440px] mx-auto px-8">
          <p className="text-center text-gray-500 text-sm mb-6">Được tin dùng bởi chuyên gia từ các công ty hàng đầu</p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-60">
            <div className="text-xl font-bold text-gray-700">FPT Software</div>
            <div className="text-xl font-bold text-gray-700">VinGroup</div>
            <div className="text-xl font-bold text-gray-700">Viettel</div>
            <div className="text-xl font-bold text-gray-700">VNPT</div>
            <div className="text-xl font-bold text-gray-700">Momo</div>
            <div className="text-xl font-bold text-gray-700">Tiki</div>
          </div>
        </div>
      </section>

      {/* Section: DÀNH CHO ỨNG VIÊN - Ultra Compact */}
      <section id="ung-vien" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full mb-3">
              <GraduationCap size={18} />
              <span className="text-sm font-semibold">Dành cho ứng viên</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-3">
              Chinh phục sự nghiệp mơ ước
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              AI phân tích CV, so khớp JD và luyện phỏng vấn real-time
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
            <ScaleOnHover>
            <Card className="rounded-2xl border-2 border-slate-100 p-6 transition-shadow hover:border-blue-200 dark:border-blue-800 hover:shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Tối ưu CV & So khớp JD</h3>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    <CheckCircle size={14} />
                    <span>Miễn phí 3 lần</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Điểm matching chính xác theo ATS, gợi ý từ khóa thiếu và viết lại thông minh
              </p>
            </Card>
            </ScaleOnHover>

            <ScaleOnHover>
            <Card className="relative rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6 transition-shadow hover:shadow-xl">
              <div className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-600 to-blue-600 text-white px-3 py-1 text-xs font-bold rounded-full">
                PHỔ BIẾN
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mic className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Phỏng vấn AI Real-time</h3>
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                    <Zap size={14} />
                    <span>Phản hồi tức thì</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Luyện tập bằng giọng nói, transcript tự động và phản hồi chi tiết về kỹ năng
              </p>
            </Card>
            </ScaleOnHover>

            <ScaleOnHover>
            <Card className="rounded-2xl border-2 border-slate-100 p-6 transition-shadow hover:border-green-200 dark:border-green-800 hover:shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Báo cáo Chi tiết</h3>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                    <TrendingUp size={14} />
                    <span>Theo dõi tiến độ</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Phân tích từng câu hỏi, so sánh benchmark ngành và xuất PDF chuyên nghiệp
              </p>
            </Card>
            </ScaleOnHover>
          </div>

          <motion.div className="text-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dang-ky')}
              className="px-8"
            >
              Bắt đầu ngay - Miễn phí <ArrowRight className="ml-2" size={18} />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Social Proof: Testimonials (2 only) */}
      {(loadingTestimonials || testimonials.length > 0) && (
        <section className="py-16 bg-white">
          <div className="max-w-[1440px] mx-auto px-8">
            <div className="text-center mb-10">
              <h2 className="text-4xl lg:text-5xl font-bold mb-3">Người dùng nói gì về chúng tôi</h2>
              <p className="text-lg text-gray-600">
                Hơn 10,000 chuyên gia đã cải thiện sự nghiệp với INTER-VIET
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {loadingTestimonials ? (
                <div className="col-span-2 text-center text-gray-500 py-10">Đang tải đánh giá...</div>
              ) : (
                testimonials.map((testimonial, idx) => (
                  <Card key={testimonial.id} className={`p-8 hover:shadow-xl transition-shadow ${idx % 2 === 1 ? 'border-2 border-purple-200 dark:border-purple-800' : ''}`}>
                    <div className="flex items-center gap-4 mb-4">
                      {testimonial.avatarUrl ? (
                        <img src={testimonial.avatarUrl} alt={testimonial.authorName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <AvatarInitials name={testimonial.authorName} />
                      )}
                      <div>
                        <h4 className="font-bold">{testimonial.authorName}</h4>
                        <p className="text-sm text-gray-600">{testimonial.authorRole}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < testimonial.rating ? "currentColor" : "none"} className={i < testimonial.rating ? "text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                    <Quote className="text-gray-300 mb-2" size={28} />
                    <p className="text-gray-700 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Blog Preview Section */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Cẩm nang nghề nghiệp</h2>
              <p className="text-gray-600">Những bài viết mới nhất giúp bạn phát triển kỹ năng</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/blog')}>
              Xem tất cả <ArrowRight className="ml-2" size={16} />
            </Button>
          </div>

          {loadingBlogs ? (
            <div className="text-center text-gray-500 py-10">Đang tải bài viết...</div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Không tìm thấy bài viết nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {blogs.map(blog => (
                <Card key={blog.id} className="overflow-hidden hover:shadow-xl transition-shadow flex flex-col cursor-pointer" onClick={() => navigate(`/blog/${blog.slug}`)}>
                  <div className="h-48 bg-gray-200 relative">
                    {blog.coverImageUrl ? (
                      <img src={blog.coverImageUrl} alt={blog.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {blog.category && (
                        <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                          {blog.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 hover:text-blue-600 dark:text-blue-400 transition-colors">{blog.title}</h3>
                    <div className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1" dangerouslySetInnerHTML={{ __html: blog.content }}></div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                      <span>{blog.author}</span>
                      <span>{new Date(blog.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <TrendingUp className="mx-auto mb-6" size={56} />
          <h2 className="text-4xl lg:text-5xl font-bold mb-5">
            Sẵn sàng bắt đầu hành trình mới?
          </h2>
          <p className="text-xl mb-8 text-blue-100 leading-relaxed max-w-2xl mx-auto">
            Hàng nghìn người Việt đang sử dụng INTER-VIET mỗi ngày để thay đổi sự nghiệp.
            Bạn đã sẵn sàng chưa?
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <Button 
              size="lg"
              className="text-lg px-10 h-14 bg-white text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/30"
              onClick={() => navigate('/dang-ky')}
            >
              Dùng thử miễn phí <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-10 h-14 bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => navigate('/lien-he')}
            >
              Liên hệ tư vấn
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-300" />
              <span>Không cần thẻ tín dụng</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-300" />
              <span>Setup trong 30 giây</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-300" />
              <span>Hủy bất cứ lúc nào</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
