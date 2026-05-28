const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src/app/pages/admin'),
  path.join(__dirname, 'src/app/pages/mentor'),
  path.join(__dirname, 'src/app/pages')
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'admin' && file !== 'mentor' && file !== 'components') {
        // process nested dirs in pages if they aren't admin/mentor which we already handled
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Fix /300/10 -> /30
      content = content.replace(/dark:bg-([a-z]+)-([0-9]+)\/[0-9]+\/[0-9]+/g, 'dark:bg-$1-$2/30');
      // Fix /30/50 -> /30
      content = content.replace(/dark:bg-([a-z]+)-([0-9]+)\/[0-9]+\/[0-9]+/g, 'dark:bg-$1-$2/30');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed opacity in: ${fullPath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
console.log('Done fixing opacities.');
