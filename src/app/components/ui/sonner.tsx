import { Toaster as Sonner } from 'sonner';

/**
 * Toast góc phải — không phụ thuộc next-themes (tránh lỗi khi thiếu ThemeProvider)
 */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      theme="light"
      expand
      richColors
      closeButton
      duration={4500}
      gap={12}
      offset={{ top: 20, right: 20 }}
      visibleToasts={5}
      className="interviet-toaster"
      toastOptions={{
        classNames: {
          toast:
            'interviet-toast !rounded-xl !border !shadow-xl !font-sans',
          title: '!text-sm !font-semibold !leading-snug',
          description: '!text-sm !opacity-90',
          success: '!border-green-300 !bg-green-50 !text-green-950',
          error: '!border-red-300 !bg-red-50 !text-red-950',
          info: '!border-blue-300 !bg-blue-50 !text-blue-950',
          warning: '!border-amber-300 !bg-amber-50 !text-amber-950',
          closeButton: '!border-gray-300 !bg-white hover:!bg-gray-100',
        },
      }}
    />
  );
}
