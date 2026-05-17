import fs from 'fs';

const fixes = {
  93: '                <div className="text-xs text-blue-100">CV tối ưu</div>',
  119: '            <h2 className="text-3xl lg:text-4xl font-bold mb-2">Giao diện thân thiện, dễ sử dụng</h2>',
  140: '          <p className="text-center text-gray-500 text-sm mb-6">Được tin dùng bởi chuyên gia từ các công ty hàng đầu</p>',
  152: '      {/* Section: DÀNH CHO ỨNG VIÊN - Ultra Compact */}',
  179: '                    <span>Miễn phí 3 lần</span>',
  184: '                Điểm matching chính xác theo ATS, gợi ý từ khóa thiếu và viết lại thông minh',
  192: '                PHỔ BIẾN',
  202: '                    <span>Phản hồi tức thì</span>',
  207: '                Luyện tập bằng giọng nói, transcript tự động và phản hồi chi tiết về kỹ năng',
  222: '                    <span>Theo dõi tiến độ</span>',
  239: '              Bắt đầu ngay - Miễn phí <ArrowRight className="ml-2" size={18} />',
  251: '              Hơn 10,000 chuyên gia đã cải thiện sự nghiệp với INTER-VIET',
  260: '                  alt="Nguyễn Thu Hà"',
  264: '                  <h4 className="font-bold">Nguyễn Thu Hà</h4>',
  265: '                  <p className="text-sm text-gray-600">Senior Developer • FPT Software</p>',
  289: '                  <p className="text-sm text-gray-600">Product Manager • VinGroup</p>',
  275: '                "Tính năng phỏng vấn AI thật sự tuyệt vời! Tôi đã luyện tập 5 lần trước buổi phỏng vấn thật',
  276: '                và cảm thấy tự tin hơn rất nhiều. Kết quả là đã nhận được offer từ công ty mơ ước."',
  299: '                "CV matching score giúp tôi hiểu rõ điểm yếu của CV so với JD. Sau khi tối ưu theo gợi ý,',
  300: '                tỷ lệ phản hồi từ nhà tuyển dụng tăng từ 10% lên 60%. Đáng đồng tiền bát gạo!"',
  317: '            Sẵn sàng bắt đầu hành trình mới?',
  320: '            Hàng nghìn người Việt đang sử dụng INTER-VIET mỗi ngày để thay đổi sự nghiệp.',
  321: '            Bạn đã sẵn sàng chưa?',
  330: '              Dùng thử miễn phí <ArrowRight className="ml-2" size={20} />',
  338: '              Liên hệ tư vấn',
};

const path = 'src/app/pages/HomePage.tsx';
const lines = fs.readFileSync(path, 'utf8').split(/\n/);
for (const [num, content] of Object.entries(fixes)) {
  const i = Number(num) - 1;
  if (lines[i] !== undefined) lines[i] = content;
}
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('HomePage patched');
