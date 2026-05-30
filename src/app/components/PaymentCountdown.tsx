import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface PaymentCountdownProps {
  expiresAt?: string;
  onExpired?: () => void;
}

const PaymentCountdown: React.FC<PaymentCountdownProps> = ({ expiresAt, onExpired }) => {
  const calculateTimeLeft = () => {
    if (!expiresAt) return { minutes: 0, seconds: 0 };
    
    // Chuyển đổi expiresAt thành milliseconds và trừ đi thời gian hiện tại
    const difference = +new Date(expiresAt) - +new Date();
    let timeLeft = { minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (!expiresAt) return;

    // Cập nhật đồng hồ mỗi 1 giây
    const timer = setInterval(() => {
      const updatedTimeLeft = calculateTimeLeft();
      setTimeLeft(updatedTimeLeft);

      // Khi đếm ngược về 00:00
      if (updatedTimeLeft.minutes === 0 && updatedTimeLeft.seconds === 0) {
        clearInterval(timer);
        if (onExpired) {
          onExpired(); // Gọi hàm xử lý khi hết hạn (ví dụ: Khóa nút, thông báo hết hạn)
        }
      }
    }, 1000);

    // Dọn dẹp timer khi unmount component
    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  if (!expiresAt) return null;

  // Thêm số 0 phía trước nếu số < 10 (ví dụ: 09:05)
  const padZero = (num: number) => String(num).padStart(2, '0');

  const isTimeUp = timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div 
      className={`p-4 rounded-xl font-medium text-center text-base my-4 flex items-center justify-center gap-2 ${
        isTimeUp 
          ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' 
          : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
      }`}
    >
      {isTimeUp ? (
        <>
          <AlertTriangle className="h-5 w-5" />
          <span>Giao dịch đã hết hạn! Vui lòng tạo đơn hàng mới.</span>
        </>
      ) : (
        <>
          <Clock className="h-5 w-5 animate-pulse" />
          <span>
            Vui lòng thanh toán trong: 
            <span className="font-bold ml-1 text-lg">
              {padZero(timeLeft.minutes)}:{padZero(timeLeft.seconds)}
            </span>
          </span>
        </>
      )}
    </div>
  );
};

export default PaymentCountdown;
