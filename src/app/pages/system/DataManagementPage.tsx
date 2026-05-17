import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Trash2,
  RefreshCw,
  Database,
  AlertTriangle,
  Info,
  Download,
  Upload,
  CheckCircle2,
} from 'lucide-react';

export const DataManagementPage: React.FC = () => {
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const STORAGE_KEYS = [
    'interviet_app_state',
    'interviet_events',
  ];

  const loadDataInfo = () => {
    const info: any = {};
    STORAGE_KEYS.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          info[key] = {
            size: new Blob([data]).size,
            sizeKB: (new Blob([data]).size / 1024).toFixed(2),
            exists: true,
            itemCount: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
          };
        } catch {
          info[key] = {
            size: data.length,
            sizeKB: (data.length / 1024).toFixed(2),
            exists: true,
            itemCount: 'N/A',
          };
        }
      } else {
        info[key] = {
          exists: false,
          size: 0,
          sizeKB: '0',
          itemCount: 0,
        };
      }
    });
    setDataInfo(info);
  };

  React.useEffect(() => {
    loadDataInfo();
  }, []);

  const handleClearData = () => {
    try {
      STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      setLastAction('clear');
      setShowConfirm(false);
      loadDataInfo();
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const handleExportData = () => {
    try {
      const exportData: any = {};
      STORAGE_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          exportData[key] = JSON.parse(data);
        }
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interviet-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setLastAction('export');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        Object.entries(importData).forEach(([key, value]) => {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
        setLastAction('import');
        loadDataInfo();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Lỗi: File không hợp lệ');
      }
    };
    reader.readAsText(file);
  };

  const getTotalSize = () => {
    if (!dataInfo) return '0';
    return Object.values(dataInfo as any)
      .reduce((acc: number, item: any) => acc + (item.size || 0), 0);
  };

  const getTotalSizeKB = () => {
    const total = getTotalSize();
    return (Number(total) / 1024).toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Quản lý Dữ liệu</h1>
        <p className="text-gray-600">
          Xóa, xuất, hoặc nhập dữ liệu ứng dụng INTER-VIET
        </p>
      </div>

      {/* Success Message */}
      {lastAction && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-600" size={20} />
            <div>
              <p className="font-semibold text-green-900">
                {lastAction === 'clear' && 'Đã xóa tất cả dữ liệu thành công!'}
                {lastAction === 'export' && 'Đã xuất dữ liệu thành công!'}
                {lastAction === 'import' && 'Đã nhập dữ liệu thành công!'}
              </p>
              {(lastAction === 'clear' || lastAction === 'import') && (
                <p className="text-sm text-green-700">Đang tải lại trang...</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Storage Overview */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold">Tổng quan Lưu trữ</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Tổng dung lượng</p>
            <p className="text-2xl font-bold text-blue-600">{getTotalSizeKB()} KB</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Số storage keys</p>
            <p className="text-2xl font-bold text-purple-600">{STORAGE_KEYS.length}</p>
          </div>
        </div>

        {/* Storage Details */}
        <div className="space-y-3">
          {dataInfo && STORAGE_KEYS.map(key => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-semibold text-sm">{key}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {dataInfo[key]?.exists ? (
                    <>
                      {dataInfo[key].itemCount} items • {dataInfo[key].sizeKB} KB
                    </>
                  ) : (
                    'Không có dữ liệu'
                  )}
                </p>
              </div>
              <Badge
                variant={dataInfo[key]?.exists ? 'default' : 'secondary'}
                className={dataInfo[key]?.exists ? 'bg-green-100 text-green-700' : ''}
              >
                {dataInfo[key]?.exists ? 'Có dữ liệu' : 'Trống'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Thao tác</h2>

        <div className="space-y-3">
          {/* Export */}
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <Download className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Xuất dữ liệu</h3>
              <p className="text-sm text-gray-600 mb-3">
                Tải xuống toàn bộ dữ liệu ứng dụng dưới dạng file JSON
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="border-blue-300 hover:bg-blue-100"
              >
                <Download size={16} className="mr-2" />
                Xuất dữ liệu
              </Button>
            </div>
          </div>

          {/* Import */}
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
            <Upload className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Nhập dữ liệu</h3>
              <p className="text-sm text-gray-600 mb-3">
                Khôi phục dữ liệu từ file backup trước đó
              </p>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 hover:bg-green-100"
                  onClick={(e) => {
                    e.preventDefault();
                    (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                  }}
                >
                  <Upload size={16} className="mr-2" />
                  Chọn file backup
                </Button>
              </label>
            </div>
          </div>

          {/* Clear */}
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold mb-1 text-red-900">Xóa tất cả dữ liệu</h3>
              <p className="text-sm text-red-700 mb-3">
                Xóa hoàn toàn tất cả dữ liệu ứng dụng. Hành động này không thể hoàn tác!
              </p>
              {!showConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={16} className="mr-2" />
                  Xóa tất cả
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleClearData}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Xác nhận xóa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirm(false)}
                  >
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Console Instructions */}
      <Card className="p-6 bg-gray-50">
        <div className="flex items-start gap-3">
          <Info className="text-gray-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold mb-2">Sử dụng Console</h3>
            <p className="text-sm text-gray-600 mb-3">
              Bạn cũng có thể quản lý dữ liệu qua Browser Console (F12):
            </p>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs space-y-1">
              <div>→ clearInterVietData() <span className="text-gray-500">// Xóa dữ liệu</span></div>
              <div>→ clearInterVietAndReload() <span className="text-gray-500">// Xóa và reload</span></div>
              <div>→ showInterVietData() <span className="text-gray-500">// Xem dữ liệu</span></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
