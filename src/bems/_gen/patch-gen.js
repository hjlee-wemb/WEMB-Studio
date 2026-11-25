/* datacenter-setup.js 로 복사한 뒤 이 생성기에만 필요한 고침 — 여러 번 돌려도 같다. 실행: node patch-gen.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const ed = (f, fn) => { const p = path.join(G, f); const o = fs.readFileSync(p, 'utf8'); const s = fn(o); if (s !== o) { fs.writeFileSync(p, s); console.log('patched', f); } };
const PAGES = [['main', '1-3'], ['overview2', '96-7914'], ['transactions', '56-3639'], ['was', '42-4769'], ['waspopup', '50-5951'], ['tp', '63-3639'], ['system', '66-10016'], ['system2', '76-4561'], ['detail', '77-6526'], ['network', '84-8482'], ['event', '22-770']];
ed('conv.js', (s) => s.indexOf("case 'via-black'") >= 0 ? s : s.replace("      case 'to-black': gTo = '#000000'; continue;",
  "      case 'to-black': gTo = '#000000'; continue;\n      case 'via-black': gVia = '#000000'; continue;\n      case 'text-ellipsis': set('text-overflow', 'ellipsis'); continue;\n      case '-translate-x-full': tr.unshift('translateX(-100%)'); continue;\n" +
  "      case 'border-l-5': bSides.left = '5px'; continue;\n      case 'border-r-5': bSides.right = '5px'; continue;\n      case 'border-t-5': bSides.top = '5px'; continue;\n" +
  "      case 'border-l-10': bSides.left = '10px'; continue;\n      case 'border-r-10': bSides.right = '10px'; continue;\n      case 'border-t-10': bSides.top = '10px'; continue;"));
ed('cap.js', (s) => s.replace(/const P = \[[^\n]*\];/, 'const P = ' + JSON.stringify(PAGES) + ';'));
ed('diff-all.js', (s) => s.replace(/for \(const k of \[[^\]]*\]\)/, 'for (const k of ' + JSON.stringify(PAGES.map((p) => p[1])) + ')'));
