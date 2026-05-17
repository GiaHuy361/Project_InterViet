import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Mic,
  BarChart3,
  Sparkles,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';

/** Mock dashboard UI — thay ảnh stock, đúng brand INTER-VIET */
export const DashboardPreview: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto max-w-4xl"
    >
      <motion.div
        className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-blue-500/30 via-violet-500/25 to-cyan-500/20 blur-3xl"
        animate={{ opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400/90" />
            <span className="h-3 w-3 rounded-full bg-amber-400/90" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
          </div>
          <div className="mx-auto flex max-w-xs flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-400 shadow-inner ring-1 ring-slate-200/80">
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            app.inter-viet.vn/dashboard
          </div>
        </div>

        <div className="flex min-h-[280px] bg-gradient-to-br from-slate-50 to-white sm:min-h-[320px]">
          {/* Sidebar mock */}
          <aside className="hidden w-44 shrink-0 border-r border-slate-100 bg-white p-3 sm:block">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600" />
              <span className="text-[10px] font-bold text-slate-800">INTER-VIET</span>
            </div>
            {[
              { icon: LayoutDashboard, label: 'Dashboard', active: true },
              { icon: FileText, label: 'CV Matching' },
              { icon: Mic, label: 'Phỏng vấn' },
              { icon: BarChart3, label: 'Báo cáo' },
            ].map((item) => (
              <div
                key={item.label}
                className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] ${
                  item.active ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-500'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            ))}
          </aside>

          {/* Main */}
          <main className="flex-1 p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600">
                  Bảng điều khiển
                </p>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Xin chào, ứng viên! 👋
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                <Sparkles className="h-3 w-3" />
                AI
              </span>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                { label: 'CV tối ưu', value: '12', color: 'from-blue-500 to-blue-600' },
                { label: 'Phỏng vấn', value: '5', color: 'from-violet-500 to-purple-600' },
                { label: 'Điểm TB', value: '8.4', color: 'from-cyan-500 to-blue-600' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm"
                >
                  <p className={`text-lg font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                  <p className="text-[9px] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-violet-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-700">Tiến độ hôm nay</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/80">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600"
                  initial={{ width: 0 }}
                  whileInView={{ width: '72%' }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 1 }}
                />
              </div>
              <p className="mt-1.5 text-[9px] text-slate-500">3/4 bước onboarding hoàn thành</p>
            </div>
          </main>
        </div>
      </div>
    </motion.div>
  );
};
