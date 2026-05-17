import React from 'react';
import { Link, Outlet } from 'react-router';
import { motion } from 'motion/react';
import { MeshBackground } from '../components/design-system/MeshBackground';
import { FloatingOrbs } from '../components/design-system/FloatingOrbs';
import { PageTransition } from '../components/design-system/PageTransition';
import { FadeInImmediate } from '../components/design-system/motion';
import { FileText, Mic, Sparkles, Shield } from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';

const highlights = [
  { icon: FileText, text: 'Tối ưu CV theo chuẩn ATS' },
  { icon: Mic, text: 'Phỏng vấn AI real-time' },
  { icon: Shield, text: 'Bảo mật chuẩn doanh nghiệp' },
];

export const AuthLayout: React.FC = () => {
  return (
    <section className="relative min-h-screen overflow-hidden font-[family-name:var(--font-sans)]">
      <MeshBackground variant="auth" />
      <FloatingOrbs />

      <header className="relative z-20 px-6 py-5 lg:px-10">
        <BrandLogo href="/" size="md" variant="light" showWordmark />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] max-w-7xl flex-col items-center gap-10 px-6 pb-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-10">
        {/* Left showcase — desktop */}
        <FadeInImmediate className="hidden max-w-xl flex-1 lg:block">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-blue-100 backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Nền tảng AI cho ứng viên Việt Nam
          </motion.span>

          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
            Chinh phục sự nghiệp
            <span className="mt-2 block bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent animate-gradient-shift">
              với trợ lý AI 24/7
            </span>
          </h2>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">
            Tối ưu CV, luyện phỏng vấn và theo dõi tiến độ — tất cả trong một nền tảng dành riêng cho ứng viên.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map((item, i) => (
              <motion.li
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                className="flex items-center gap-3 text-slate-200"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                  <item.icon className="h-5 w-5 text-blue-300" />
                </span>
                {item.text}
              </motion.li>
            ))}
          </ul>

          <motion.section
            className="mt-12 grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { value: '10K+', label: 'Người dùng' },
              { value: '50K+', label: 'CV tối ưu' },
              { value: '4.9★', label: 'Đánh giá' },
            ].map((stat) => (
              <section
                key={stat.label}
                className="glass-card-dark rounded-xl px-4 py-3 text-center"
              >
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </section>
            ))}
          </motion.section>
        </FadeInImmediate>

        {/* Form area */}
        <section className="flex w-full flex-shrink-0 justify-center lg:w-auto lg:justify-end">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </section>
      </main>

      <footer className="relative z-10 px-6 py-5 text-center text-sm text-slate-500 lg:px-10">
        <p>&copy; 2026 INTER-VIET. Tất cả quyền được bảo lưu.</p>
      </footer>
    </section>
  );
};
