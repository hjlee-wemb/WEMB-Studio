/* figma-<key>.png ↔ dom-<key>.png 전체 대조. 실행: node diff-all.js [접두어 기본 dom] */
const { execFileSync } = require('child_process'), path = require('path');
const pre = process.argv[2] || 'dom';
for (const k of ["3302-4796","3301-4796","3300-4796","3302-5372","3293-5251","3292-5597","3287-4796","3293-4796","3289-5423","3286-4796"]) {
  const o = execFileSync('node', [path.join(__dirname, 'diff.js'), path.join(__dirname, 'figma-' + k + '.png'), path.join(__dirname, pre + '-' + k + '.png')]).toString();
  console.log(k, o.split('\n')[0]);
}
