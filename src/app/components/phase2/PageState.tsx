import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { ApiError } from '../../../lib/api/apiError';

interface PageStateProps {
  isLoading?: boolean;
  error?: ApiError | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}

export const PageState: React.FC<PageStateProps> = ({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <p className="font-medium text-gray-900 mb-1">Không thể tải dữ liệu</p>
        <p className="text-sm text-gray-600 mb-4 max-w-md">{error.getUserMessage()}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
        <p className="font-medium text-gray-700">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm mt-1 max-w-sm">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
