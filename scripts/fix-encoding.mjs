import fs from 'fs';

function hasMojibake(t) {
  return /Ã|áº|Ä|Æ°|â€|á»/.test(t);
}

function fixText(t) {
  let s = t
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"');
  if (!hasMojibake(s)) return t;
  const fixed = Buffer.from(s, 'latin1').toString('utf8');
  return /\uFFFD/.test(fixed) ? t : fixed;
}

function fixFile(path) {
  let c = fs.readFileSync(path, 'utf8');

  c = c.replace(/>([^<>{}\n]+)</g, (full, text) => {
    if (!hasMojibake(text)) return full;
    return '>' + fixText(text) + '<';
  });

  c = c.replace(/'((?:\\.|[^'\\])*)'/g, (m, inner) => {
    if (!hasMojibake(inner)) return m;
    return "'" + fixText(inner) + "'";
  });

  fs.writeFileSync(path, c, 'utf8');
  const left = (c.match(/Ã|áº|Ä|Æ°/g) || []).length;
  console.log(`${path}: ${left} patterns remaining`);
}

const files = [
  'src/app/pages/HomePage.tsx',
  'src/app/pages/VerifyEmailPage.tsx',
  'src/app/pages/AllRemainingPages.tsx',
];

for (const f of files) fixFile(f);
