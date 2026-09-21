/* mix-blend-mode 를 쓴 에셋을 브라우저에서도 Figma 와 같게 그린다.

   무엇이 잘못됐나 — Figma 가 내보낸 몇몇 그림(Ack 단추·접기 단추·자산 타일 바탕 …)은
   `<path style="mix-blend-mode:overlay">` 로 광택을 얹는다. 브라우저는 그 그림을 **독립된 이미지**로
   그리기 때문에 blend 의 바탕(backdrop)이 '투명'이 되어, 섞이는 대신 **원본 색 그대로**(흰 삼각형)
   찍힌다. Figma 렌더와 대조하다 찾았다(Ack 단추가 하얗게 떴다).

   어떻게 고치나 — 뿌리 <svg> 에 `isolation:isolate` 를 준다. 그러면 그 그림 안에서 먼저 그려진
   면이 blend 의 바탕이 되어, Figma 가 의도한 대로 **자기 아래 면 위에** 광택이 얹힌다.
   형상·색·좌표는 한 점도 건드리지 않는다(속성 한 개만 더한다).

   실행: node src/lselectric/_gen/mk-blend-fix.js */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..');

let fixed = 0, skipped = 0;
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.svg')) continue;
  const p = path.join(DIR, f);
  let s = fs.readFileSync(p, 'utf8');
  if (s.indexOf('mix-blend-mode') < 0) continue;
  /* 이미 얹힌 것 — 아래에서 넣는 모양이 `isolation: isolate`(사이 띄움)라, 띄어쓰기를 무시하고 본다.
     예전엔 `isolation:isolate` 만 찾아서, 다시 돌릴 때마다 같은 속성이 겹겹이 쌓였다. */
  if (/isolation:\s*isolate/.test(s)) { skipped++; continue; }
  const m = /^<svg\s/.exec(s);
  if (!m) { console.log('  ! <svg> 로 시작하지 않는다:', f); continue; }
  if (/<svg[^>]*\sstyle="/.test(s)) {
    s = s.replace(/(<svg[^>]*\sstyle=")/, (x) => x + 'isolation: isolate; ');
  } else {
    s = s.replace(/^<svg/, '<svg style="isolation: isolate"');
  }
  fs.writeFileSync(p, s);
  fixed++;
}
console.log('blend-isolated:', fixed, ' 이미 반영:', skipped);
