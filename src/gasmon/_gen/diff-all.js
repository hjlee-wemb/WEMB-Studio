/* figma-<key>.png ↔ dom-<key>.png 전체 대조. 실행: node diff-all.js [접두어 기본 dom] */
const { execFileSync } = require('child_process'), path = require('path');
const pre = process.argv[2] || 'dom';
for (const k of ['3059-3083', '3059-3990', '3059-4943', '3059-5211', '3050-2030']) {
  const o = execFileSync('node', [path.join(__dirname, 'diff.js'), path.join(__dirname, 'figma-' + k + '.png'), path.join(__dirname, pre + '-' + k + '.png')]).toString();
  console.log(k, o.split('\n')[0]);
}
