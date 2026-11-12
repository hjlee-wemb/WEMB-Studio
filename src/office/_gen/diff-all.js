/* figma-<key>.png ↔ dom-<key>.png 전체 대조. 실행: node diff-all.js [접두어 기본 dom] */
const { execFileSync } = require('child_process'), path = require('path');
const pre = process.argv[2] || 'dom';
for (const k of ["1-105","1-199","1-298","1-393","1-1890","1-2550","1-7737","1-9189","1-3119","1-2787","1-2950","1-3909","1-3471","1-3738","1-3648","1-3597","1-6530","1-6934","1-73"]) {
  const o = execFileSync('node', [path.join(__dirname, 'diff.js'), path.join(__dirname, 'figma-' + k + '.png'), path.join(__dirname, pre + '-' + k + '.png')]).toString();
  console.log(k, o.split('\n')[0]);
}
