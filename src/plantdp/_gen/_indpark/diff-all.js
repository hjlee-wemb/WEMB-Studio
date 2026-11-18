/* figma-<key>.png ↔ dom-<key>.png 전체 대조. 실행: node diff-all.js [접두어 기본 dom] */
const { execFileSync } = require('child_process'), path = require('path');
const pre = process.argv[2] || 'dom';
for (const k of ['2208-2033','2208-2117','2208-2220','2208-2306','2208-2393','2208-2792','2208-3187','2208-3552','2208-3926']) {
  const o = execFileSync('node', [path.join(__dirname, 'diff.js'), path.join(__dirname, 'figma-' + k + '.png'), path.join(__dirname, pre + '-' + k + '.png')]).toString();
  console.log(k, o.split('\n')[0]);
}
