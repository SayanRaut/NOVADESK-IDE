const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  });
}

walkSync(srcDir, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-\[#(1e1e1e|1a1a1a|101010|141414|0d0d0d|0c0c0c|181818)\]/gi, 'bg-slate-950');
  content = content.replace(/bg-\[#(252526|292929|2a2a2a|222222|222)\]/gi, 'bg-slate-900');
  
  // Borders
  content = content.replace(/border-\[#(3a3a3a|3b3b3b|383838|333|2a2a2a|333333)\]/gi, 'border-slate-800');
  content = content.replace(/border-\[#(1a1a1a|1e1e1e)\]/gi, 'border-slate-950');

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${filepath}`);
  }
});
console.log('Done refactoring colors!');
