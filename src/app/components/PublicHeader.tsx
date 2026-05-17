import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Menu, X, Sparkles } from 'lucide-react';
import { BrandLogo } from './brand/BrandLogo';

export const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLink =
    'relative text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-600 after:to-violet-600 after:transition-all hover:after:w-full';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/80 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl'
          : 'border-b border-transparent bg-white/60 backdrop-blur-md'
      }`}
    >
      <section className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3.5 lg:px-8">
        <BrandLogo href="/" size="md" />

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/bang-gia" className={navLink}>
            Bảng giá
          </Link>
          <Link to="/tinh-nang" className={navLink}>
            Tính năng
          </Link>
          <Link to="/ve-chung-toi" className={navLink}>
            Về chúng tôi
          </Link>
        </nav>

        <section className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium"
            onClick={() => navigate('/dang-nhap')}
          >
            Đăng nhập
          </Button>
          <Button
            size="sm"
            className="btn-glow gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-violet-700"
            onClick={() => navigate('/dang-ky')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Dùng thử miễn phí
          </Button>
        </section>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </section>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-white/95 px-6 pb-6 backdrop-blur-xl md:hidden"
          >
            <section className="flex flex-col gap-4 pt-4">
              <Link to="/bang-gia" onClick={() => setMobileMenuOpen(false)} className="text-slate-700">
                Bảng giá
              </Link>
              <Link to="/tinh-nang" onClick={() => setMobileMenuOpen(false)} className="text-slate-700">
                Tính năng
              </Link>
              <Link to="/ve-chung-toi" onClick={() => setMobileMenuOpen(false)} className="text-slate-700">
                Về chúng tôi
              </Link>
              <hr className="border-slate-200" />
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/dang-nhap')}>
                Đăng nhập
              </Button>
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600"
                onClick={() => navigate('/dang-ky')}
              >
                Dùng thử miễn phí
              </Button>
            </section>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
