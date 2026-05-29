# 🕒 HƯỚNG DẪN LÀM ĐỒNG HỒ ĐẾM NGƯỢC (COUNTDOWN TIMER) TRÊN WEBSITE

Do trang thanh toán PayOS (`pay.payos.vn`) là trang của bên thứ ba nên chúng ta không can thiệp giao diện được (nó chỉ hiển thị mốc thời gian tĩnh ví dụ: *"Thanh toán trước 22:11:07"*). 

Để nâng cao trải nghiệm người dùng (UX), **Frontend nên tự xây dựng một đồng hồ đếm ngược lùi từng giây ngay trên Website của mình** (ở màn hình đợi thanh toán hoặc màn hình chuyển hướng).

---

## 🛠️ CƠ CHẾ HOẠT ĐỘNG
Khi gọi API Checkout (hoặc API đặt lịch), Backend luôn trả về trường **`expiresAt`** dạng thời gian UTC (ISO 8601), ví dụ: `"expiresAt": "2026-05-29T22:11:07.422Z"`.

Frontend sẽ lấy mốc thời gian này trừ đi thời gian hiện tại của máy khách hàng và thực hiện đếm lùi.

---

## 💻 CODE REACT COMPONENT MẪU (FRONTEND CHỈ VIỆC COPY-PASTE)

Dưới đây là một Component React hoàn chỉnh giúp đếm ngược số phút và giây thời gian thực (real-time countdown) từ biến `expiresAt` nhận từ API:

```jsx
import React, { useState, useEffect } from 'react';

const PaymentCountdown = ({ expiresAt, onExpired }) => {
  const calculateTimeLeft = () => {
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
  }, [expiresAt]);

  // Thêm số 0 phía trước nếu số < 10 (ví dụ: 09:05)
  const padZero = (num) => String(num).padStart(2, '0');

  const isTimeUp = timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: isTimeUp ? '#ffebee' : '#e8f5e9',
      color: isTimeUp ? '#c62828' : '#2e7d32',
      fontWeight: 'bold',
      textAlign: 'center',
      fontSize: '18px',
      margin: '15px 0'
    }}>
      {isTimeUp ? (
        <span>⚠️ Giao dịch đã hết hạn! Vui lòng tạo đơn hàng mới.</span>
      ) : (
        <span>⏱️ Vui lòng thanh toán trong: {padZero(timeLeft.minutes)}:{padZero(timeLeft.seconds)}</span>
      )}
    </div>
  );
};

export default PaymentCountdown;
```

---

## 💡 GỢI Ý XỬ LÝ UX CHO FRONTEND KHI HẾT HẠN (`onExpired`):

1. **Vô hiệu hóa UI:** Ẩn hoặc khóa nút "Xác nhận đã thanh toán", làm mờ mã QR trên web mình (nếu có hiển thị).
2. **Hiển thị thông báo:** Hiện Popup/Modal thông báo: *"Giao dịch của bạn đã quá hạn 15 phút. Vui lòng nhấn nút Tạo phiên mới để tiếp tục thanh toán"*.
3. **Nút làm mới (Refresh):** Hiển thị nút "Tạo mã thanh toán mới" để gọi lại API Checkout và lấy về link mới cho người dùng mà không cần bắt họ quay lại giỏ hàng từ đầu.
