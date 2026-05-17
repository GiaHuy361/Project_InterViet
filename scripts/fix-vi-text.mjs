import fs from 'fs';

const replacements = [
  ['CV tá»\u2018i Æ°u', 'CV tối ưu'],
  ['NgÆ°á»\u009di dÃ¹ng', 'Người dùng'],
  ['Phá»\u008fng váº¥n', 'Phỏng vấn'],
  ['Ä\x90Ã¡nh giÃ¡', 'Đánh giá'],
  ['Giao diá»‡n thÃ¢n thiá»‡n, dá»\u008d sá»­ dá»¥ng', 'Giao diện thân thiện, dễ sử dụng'],
  ['Tráº£i nghiá»‡m AI tá»\u2018i Æ°u trong tá»«ng chi tiáº¿t', 'Trải nghiệm AI tối ưu trong từng chi tiết'],
  ['Ä\x90Æ°á»£c tin dÃ¹ng bá»Ÿi chuyÃªn gia tá»« cÃ¡c cÃ´ng ty hÃ ng Ä\x91áº§u', 'Được tin dùng bởi chuyên gia từ các công ty hàng đầu'],
  ['DÃNH CHO á»¨NG VIÃŠN', 'DÀNH CHO ỨNG VIÊN'],
  ['DÃ\xa0nh cho á»©ng viÃªn', 'Dành cho ứng viên'],
  ['Chinh phá»¥c sá»± nghiá»‡p mÆ¡ Æ°á»›c', 'Chinh phục sự nghiệp mơ ước'],
  ['AI phÃ¢n tÃ\xadch CV, so khá»›p JD vÃ\xa0 luyá»‡n phá»\u008fng váº¥n real-time', 'AI phân tích CV, so khớp JD và luyện phỏng vấn real-time'],
  ['Tá»\u2018i Æ°u CV & So khá»›p JD', 'Tối ưu CV & So khớp JD'],
  ['Miá»\u0085n phÃ\xad 3 láº§n', 'Miễn phí 3 lần'],
  ['PHá»"\u0094 BIáº¾N', 'PHỔ BIẾN'],
  ['Pháº£n há»"\u0093i tá»©c thÃ¬', 'Phản hồi tức thì'],
  ['BÃ¡o cÃ¡o Chi tiáº¿t', 'Báo cáo Chi tiết'],
  ['Theo dÃµi tiáº¿n Ä\x91á»™', 'Theo dõi tiến độ'],
  ['Báº¯t Ä\x91áº§u ngay - Miá»\u0085n phÃ\xad', 'Bắt đầu ngay - Miễn phí'],
  ['NgÆ°á»\u009di dÃ¹ng nÃ³i gÃ¬ vá»\u0081 chÃºng tÃ´i', 'Người dùng nói gì về chúng tôi'],
];

// Simpler: read file and apply latin1 fix only to segments matching mojibake regex
function fixSegment(seg) {
  if (!/Ã|áº|Ä|Æ°|â€|á»/.test(seg)) return seg;
  try {
    const fixed = Buffer.from(seg, 'latin1').toString('utf8');
    if (!/\uFFFD/.test(fixed)) return fixed;
  } catch {}
  return seg;
}

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  // Fix quoted strings
  content = content.replace(/'([^'\\]|\\.)*'/g, (m) => {
    const inner = m.slice(1, -1);
    return "'" + fixSegment(inner) + "'";
  });
  content = content.replace(/"([^"\\]|\\.)*"/g, (m) => {
    if (m.includes('className') || m.includes('http') || m.includes('import')) return m;
    const inner = m.slice(1, -1);
    if (!/Ã|áº|Ä|Æ°|á»/.test(inner)) return m;
    const fixed = fixSegment(inner);
    return '"' + fixed + '"';
  });
  // Fix JSX text
  content = content.replace(/>([^<>{}]+)</g, (full, text) => {
    if (!/Ã|áº|Ä|Æ°|á»/.test(text)) return full;
    return '>' + fixSegment(text) + '<';
  });
  fs.writeFileSync(path, content, 'utf8');
}

for (const f of process.argv.slice(2)) fixFile(f);
