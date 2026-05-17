import React from 'react';
import { Card } from '../ui/card';
import { CheckCircle, X } from 'lucide-react';

const CellCheck = () => (
  <CheckCircle className="text-green-600 inline" size={18} aria-hidden />
);
const CellX = () => <X className="text-red-500 inline" size={18} aria-hidden />;

const purpleCell = 'text-center p-4 text-sm bg-purple-50/80 dark:bg-purple-950/25';
const greenCell = 'text-center p-4 text-sm bg-green-50/80 dark:bg-green-950/25';
const baseCell = 'text-center p-4 text-sm';

export const PlanComparisonTable: React.FC = () => {
  return (
    <div id="comparison-section" className="scroll-mt-8">
      <h2 className="text-2xl font-bold mb-6">Bảng so sánh chi tiết</h2>
      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-bold">Tính năng</th>
                <th className="text-center p-4 font-bold">Miễn phí</th>
                <th className="text-center p-4 font-bold">Tháng</th>
                <th className="text-center p-4 font-bold bg-purple-50/80 dark:bg-purple-950/30">
                  Quý
                </th>
                <th className="text-center p-4 font-bold bg-green-50/80 dark:bg-green-950/30">
                  Năm
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-4 font-medium">Tối ưu CV</td>
                <td className={baseCell}>3 lần/tài khoản</td>
                <td className={baseCell}>3 lần/ngày</td>
                <td className={purpleCell}>5 lần/ngày</td>
                <td className={`${greenCell} font-semibold`}>Không giới hạn</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Phỏng vấn AI</td>
                <td className={baseCell}>1 phiên/tài khoản</td>
                <td className={baseCell}>1 lần/ngày</td>
                <td className={purpleCell}>3 lần/ngày</td>
                <td className={`${greenCell} font-semibold`}>Không giới hạn</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Phỏng vấn với Mentor/người thật</td>
                <td className="text-center p-4"><CellX /></td>
                <td className="text-center p-4"><CellX /></td>
                <td className={purpleCell}>3 lần/tháng</td>
                <td className={`${greenCell} font-semibold`}>1 lần/tuần</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Model AI</td>
                <td className={baseCell}>Basic</td>
                <td className={baseCell}>Ổn định</td>
                <td className={purpleCell}>Cao cấp</td>
                <td className={greenCell}>Cao cấp</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Phong cách AI interviewer & stress-test</td>
                <td className={baseCell}>Cơ bản</td>
                <td className={baseCell}>Đầy đủ 6 loại</td>
                <td className={purpleCell}>Đầy đủ 6 loại</td>
                <td className={greenCell}>Đầy đủ 6 loại</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Báo cáo phân tích</td>
                <td className={baseCell}>Rút gọn</td>
                <td className={baseCell}>Toàn diện</td>
                <td className={purpleCell}>Toàn diện</td>
                <td className={greenCell}>Toàn diện</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Phân tích kỹ năng giao tiếp</td>
                <td className="text-center p-4"><CellX /></td>
                <td className="text-center p-4"><CellCheck /></td>
                <td className="text-center p-4 bg-purple-50/50 dark:bg-purple-950/20"><CellCheck /></td>
                <td className="text-center p-4 bg-green-50/50 dark:bg-green-950/20"><CellCheck /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Xuất PDF</td>
                <td className="text-center p-4"><CellX /></td>
                <td className="text-center p-4"><CellCheck /></td>
                <td className="text-center p-4 bg-purple-50/50 dark:bg-purple-950/20"><CellCheck /></td>
                <td className="text-center p-4 bg-green-50/50 dark:bg-green-950/20"><CellCheck /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">So sánh tiến bộ</td>
                <td className="text-center p-4"><CellX /></td>
                <td className="text-center p-4"><CellCheck /></td>
                <td className="text-center p-4 bg-purple-50/50 dark:bg-purple-950/20"><CellCheck /></td>
                <td className="text-center p-4 bg-green-50/50 dark:bg-green-950/20"><CellCheck /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">So sánh benchmark ngành</td>
                <td className="text-center p-4"><CellX /></td>
                <td className="text-center p-4"><CellCheck /></td>
                <td className="text-center p-4 bg-purple-50/50 dark:bg-purple-950/20"><CellCheck /></td>
                <td className="text-center p-4 bg-green-50/50 dark:bg-green-950/20"><CellCheck /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Chọn mentor theo nhóm ngành</td>
                <td className="text-center p-4"><CellX /></td>
                <td className="text-center p-4"><CellX /></td>
                <td className="text-center p-4 bg-purple-50/50 dark:bg-purple-950/20"><CellX /></td>
                <td className="text-center p-4 bg-green-50/50 dark:bg-green-950/20"><CellCheck /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Lưu lịch sử không giới hạn</td>
                <td className="text-center p-4"><CellX /></td>
                <td className={baseCell}>30 ngày</td>
                <td className={purpleCell}>90 ngày</td>
                <td className="text-center p-4 bg-green-50/50 dark:bg-green-950/20"><CellCheck /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Hỗ trợ</td>
                <td className={baseCell}>Email</td>
                <td className={baseCell}>Email</td>
                <td className={purpleCell}>Priority</td>
                <td className={greenCell}>24/7 cao nhất</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
