import fs from 'fs';
const p = 'src/app/pages/VerifyEmailPage.tsx';
const lines = fs.readFileSync(p, 'utf8').split('\n');
lines[204] = '        </div>';
lines[221] = '      </div>';
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('done', lines[204], lines[221]);
