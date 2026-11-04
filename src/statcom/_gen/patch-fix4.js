/* 고침 4 — 스튜디오에서 눈으로 본 것
   ① 라이트: 채도 높은 짙은 남색 판(#060d1e)이 안 밝아져 글자가 묻혔다 · 밝은 청록 글자가 흰 판에서 흐렸다
   ② 색 정하기: 상태 점(marker-*.svg)이 색상 회전으로 뜻이 바뀌었다 → 그대로 둔다
   ③ 로고 칸 폭이 0 이 됐다(TPLLOGO 가 폭을 풀어 준다) → 칸 폭을 박는다
   ④ 차트 바꾸기: 숨긴 내용이 높이를 지켜 판이 너무 컸다 → 내용은 빼고 판 높이를 정한다. 실행: node patch-fix4.js → node conv.js → node mk-live.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
function patch(file, pairs) {
  const p = path.isAbsolute(file) ? file : path.join(ROOT, file);
  const before = fs.readFileSync(p, 'utf8');
  const crlf = before.includes('\r\n');
  let s = crlf ? before.replace(/\r\n/g, '\n') : before;
  pairs.forEach(([a, b]) => {
    if (s.includes(b)) return;
    if (!s.includes(a)) throw new Error(file + ' 앵커 없음: ' + a.slice(0, 70));
    s = s.replace(a, () => b);
  });
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s);
}
patch(path.join(__dirname, 'light.js'), [
  ["if (role === 'text') return h.l > 0.45 ? out(fromHsl({ h: h.h, s: Math.min(0.95, h.s), l: 0.34, a: h.a })) : null;",
    "if (role === 'text') return h.l > 0.3 ? out(fromHsl({ h: h.h, s: Math.min(0.95, h.s), l: 0.3, a: h.a })) : null;"],
  ["if ((role === 'bg' || role === 'border') && h.l < 0.32 && h.s < 0.62) {", "if ((role === 'bg' || role === 'border') && h.l < 0.32 && (h.s < 0.62 || h.l < 0.14)) {"],
]);
patch('js/templates/image.js', [
  ["keep: /(^|\\/)(logo-image|scene-image|map-image|equipment-image|thumbnail|hero-image)(-[\\d-]+)?(-lt)?\\.(svg|png)(\\?|$)/i,",
    "keep: /(^|\\/)(logo-image|scene-image|map-image|equipment-image|thumbnail|hero-image|marker)(-[\\d-]+)?(-lt)?\\.(svg|png)(\\?|$)/i,"],
]);
const PXS = ['tcm', 'tcs', 'tcp', 'tcv', 'tcc', 'tce', 'tcn', 'tcu', 'tca', 'tcq'];
patch('css/preview/digital-twin.css', [
  ['.tcm-root [data-name="Logo Image"] .tpl-studio-logo,',
    PXS.map((p) => '.' + p + '-root [data-name="Logo Image"][data-studio-logo]').join(',\n') + ' {\n  width: 227px !important;\n}\n.tcl-root [data-name="Logo Image"][data-studio-logo] {\n  width: 408px !important;\n}\n.tcm-root [data-name="Logo Image"] .tpl-studio-logo,'],
]);
patch(path.join(__dirname, 'live-src.js'), [
  [".tc-root .tc-swapped > *:not(.tc-chart){visibility:hidden;}", ".tc-root .tc-swapped > *:not(.tc-chart){display:none!important;}"],
  ["        tg.body.style.minHeight = i >= 0 ? '150px' : '';",
    "        if (tg.h0 == null) tg.h0 = tg.body.offsetHeight;\n        tg.body.style.height = i >= 0 ? clamp(tg.h0, 170, 230) + 'px' : '';"],
]);
console.log('ok');
