import React from 'react';
import { Link } from 'react-router';
import { Facebook, Linkedin, Twitter, Youtube } from 'lucide-react';
import { BrandLogo } from './brand/BrandLogo';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <BrandLogo variant="light" size="md" />
            </div>
            <p className="text-sm mb-4">
              Cố vấn sự nghiệp AI 24/7 cho người Việt
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/tinh-nang" className="hover:text-white transition-colors">Tính năng</Link></li>
              <li><Link to="/giai-phap" className="hover:text-white transition-colors">Giải pháp</Link></li>
              <li><Link to="/bang-gia" className="hover:text-white transition-colors">Bảng giá</Link></li>
              <li><Link to="/he-thong" className="hover:text-white transition-colors">Trạng thái hệ thống</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Công ty</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ve-chung-toi" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/lien-he" className="hover:text-white transition-colors">Liên hệ</Link></li>
              <li><Link to="/bao-mat" className="hover:text-white transition-colors">Bảo mật</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ho-tro" className="hover:text-white transition-colors">Trung tâm hỗ trợ</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
              <li><Link to="/dieu-khoan" className="hover:text-white transition-colors">Điều khoản sử dụng</Link></li>
              <li><Link to="/chinh-sach-bao-mat" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Kết nối</h4>
            <p className="text-sm mb-2">support@inter-viet.com</p>
            <p className="text-sm mb-2">+84 (28) 1234 5678</p>
            <p className="text-sm">Thứ 2 - Thứ 6: 9:00 - 18:00</p>
          </div>
        </div>

        <hr className="border-gray-800 mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; 2026 INTER-VIET. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-6">
            <Link to="/dieu-khoan" className="hover:text-white transition-colors">
              Điều khoản
            </Link>
            <Link to="/chinh-sach-bao-mat" className="hover:text-white transition-colors">
              Bảo mật
            </Link>
            <Link to="/bao-mat" className="hover:text-white transition-colors">
              An toàn dữ liệu
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
