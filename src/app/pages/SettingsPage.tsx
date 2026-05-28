import React from 'react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { Card } from '../components/ui/card';
import { Settings, Construction } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <AppPageHeader 
        title="Cài đặt hệ thống" 
        subtitle="Quản lý cấu hình tài khoản và ứng dụng"
        icon={Settings}
      />
      
      <Card className="p-12 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 border-dashed dark:border-slate-800">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Trang đang được phát triển</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Tính năng cài đặt hệ thống đang trong quá trình xây dựng và sẽ sớm ra mắt trong các phiên bản cập nhật tiếp theo.
        </p>
      </Card>
    </div>
  );
};
