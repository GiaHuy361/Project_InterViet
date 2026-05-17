import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';
import { X } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const { state, acceptCookies } = useApp();

  if (state.cookiesAccepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn. Bằng cách tiếp tục sử dụng trang web, 
            bạn đồng ý với việc sử dụng cookie của chúng tôi.{' '}
            <a href="/chinh-sach-bao-mat" className="text-blue-600 hover:underline">
              Tìm hiểu thêm
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Quản lý
          </Button>
          <Button size="sm" onClick={acceptCookies}>
            Chấp nhận tất cả
          </Button>
        </div>
      </div>
    </div>
  );
};
