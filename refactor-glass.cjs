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

  // Replace Sidebar opaque backgrounds
  if (filepath.includes('Sidebar.tsx') || filepath.includes('AISidebar.tsx')) {
    content = content.replace(/bg-slate-900/g, 'glass-sidebar');
    content = content.replace(/bg-slate-950/g, 'glass-sidebar');
    content = content.replace(/bg-slate-800/g, 'glass-sidebar');
  } 
  // Replace ActivityBar opaque backgrounds
  else if (filepath.includes('ActivityBar.tsx') || filepath.includes('TitleBar.tsx') || filepath.includes('StatusBar.tsx')) {
    content = content.replace(/bg-slate-900/g, 'glass-activity-bar');
    content = content.replace(/bg-[#141414]/g, 'glass-activity-bar');
    content = content.replace(/bg-[#161616]/g, 'glass-activity-bar');
    content = content.replace(/bg-[#0d0d0d]/g, 'glass-activity-bar');
    content = content.replace(/bg-slate-950/g, 'glass-activity-bar');
  }
  // Replace Terminal and Editor Panels
  else if (filepath.includes('EditorArea.tsx') || filepath.includes('TerminalPanel.tsx') || filepath.includes('BottomPanel.tsx')) {
    content = content.replace(/bg-slate-900/g, 'glass-surface');
    content = content.replace(/bg-slate-950/g, 'glass-surface');
    content = content.replace(/bg-[#1e1e1e]/g, 'glass-surface');
  }
  // Generic replacements for inner panels
  else {
    content = content.replace(/bg-slate-900/g, 'glass-panel');
    content = content.replace(/bg-slate-950/g, 'glass-panel');
    content = content.replace(/bg-slate-800/g, 'glass-panel');
  }

  // Also replace hover states for elements to glass-element where appropriate
  // (We'll keep it simple for now to avoid breaking complex class strings)

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${filepath}`);
  }
});
console.log('Done refactoring to glass UI!');
