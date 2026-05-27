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
        // we already included admin and mentor directly, and ignore components for now unless needed
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // bg-color-50 -> dark:bg-color-900/30
      content = content.replace(/\bbg-(blue|purple|emerald|amber|red|green|yellow|orange|indigo|violet|fuchsia|pink|rose|cyan|sky|teal)-50(?!\s+dark:bg-)/g, 'bg-$1-50 dark:bg-$1-900/30');
      // bg-color-100 -> dark:bg-color-900/40
      content = content.replace(/\bbg-(blue|purple|emerald|amber|red|green|yellow|orange|indigo|violet|fuchsia|pink|rose|cyan|sky|teal)-100(?!\s+dark:bg-)/g, 'bg-$1-100 dark:bg-$1-900/40');
      
      // text-color-600 -> dark:text-color-400
      content = content.replace(/\btext-(blue|purple|emerald|amber|red|green|yellow|orange|indigo|violet|fuchsia|pink|rose|cyan|sky|teal)-600(?!\s+dark:text-)/g, 'text-$1-600 dark:text-$1-400');
      // text-color-700 -> dark:text-color-400
      content = content.replace(/\btext-(blue|purple|emerald|amber|red|green|yellow|orange|indigo|violet|fuchsia|pink|rose|cyan|sky|teal)-700(?!\s+dark:text-)/g, 'text-$1-700 dark:text-$1-400');
      // text-color-800 -> dark:text-color-300
      content = content.replace(/\btext-(blue|purple|emerald|amber|red|green|yellow|orange|indigo|violet|fuchsia|pink|rose|cyan|sky|teal)-800(?!\s+dark:text-)/g, 'text-$1-800 dark:text-$1-300');
      
      // border-color-100 -> dark:border-color-800/50
      content = content.replace(/\bborder-(blue|purple|emerald|amber|red|green|yellow|orange|indigo|violet|fuchsia|pink|rose|cyan|sky|teal)-100(?!\s+dark:border-)/g, 'border-$1-100 dark:border-$1-800/50');
      // border-color-200 -> dark:border-color-800
      content = content.replace(/\bborder-(blue|purple|emerald|amber|red|green|yellow|orange|indigo|violet|fuchsia|pink|rose|cyan|sky|teal)-200(?!\s+dark:border-)/g, 'border-$1-200 dark:border-$1-800');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

directories.forEach(processDirectory);
console.log('Done fixing colors.');
