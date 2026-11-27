/* 증권 통합관제 — 라이트 그림 사본(svg): 라이트에서 짙게 남는 '판' 그림만 같은 모양의 밝은 판으로(다크 → 라이트 원칙: 모양 그대로 색만).
   대상은 dark-imgs.js 로 찾았다(라이트 렌더에서 평균 밝기 < 110 인 큰 그림): 표 몸통 판 · 표 머리줄 판 · 검색칸 · 도넛 바탕 원 · 파일 확인 카드 판.
   색은 그림 안의 색 글자(#hex · rgb())마다 HSL 로 — 색상 그대로, 명도 뒤집어 밝게(L' = 0.965 - L*0.42), 채도 반. 차트 색(도넛 조각 · 호)과 3D 렌더는 그대로.
   바탕 사진(png · jpg)은 lt-raster.js 가 같은 식으로 만든다. 둘 다 light-assets.json 에 적고 light.js 가 content:url() 로 갈아 끼운다.
   실행: node mk-light-secmon.js → node pw.js lt-raster.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const LIST = ['background-1-2.svg', 'background-2-2.svg', 'background-2-4.svg', 'input-background.svg', 'circle.svg', 'circle-2.svg', 'background-3.svg', 'background-7.svg', 'background-1-4.svg', 'background.svg', 'circle-1.svg', 'circle-3.svg', 'circle-1-2.svg'];
function lt(r, g, b, f) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), L = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) { s = d / (1 - Math.abs(2 * L - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  /* 11-27 맑게 — 판은 옅은 청백(채도 유지), 종합상황판 큰 원판(background.svg) · 도넛 바탕 원은 한 단 진한 하늘색(흰 심볼이 떠 보이게) */
  /* 11-27 2차: 종합상황판 큰 원판(background.svg)은 다크처럼 깊은 남색 — 흰 유리 큐브가 명도 차로 드러난다. 나머지 판은 거의 무채색 흰 판 */
  const deep = f === 'background.svg';
  /* 11-27 4차(사용자): 원판은 아주 연하게 — 흰 바탕과 겨우 구분되는 옅은 청백 */
  const L2 = deep ? 0.965 - L * 0.04 : 0.99 - L * 0.22, S2 = Math.min(1, deep ? 0.32 : s * 0.3 + 0.04);
  const C = (1 - Math.abs(2 * L2 - 1)) * S2, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = L2 - C / 2;
  let o = [0, 0, 0];
  if (h < 60) o = [C, X, 0]; else if (h < 120) o = [X, C, 0]; else if (h < 180) o = [0, C, X]; else if (h < 240) o = [0, X, C]; else if (h < 300) o = [X, 0, C]; else o = [C, 0, X];
  return '#' + o.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'light-assets.json'), 'utf8'));
let n = 0;
for (const f of LIST) {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) { console.log('  없음', f); continue; }
  /* <mask> · <clipPath> 는 알파 — 칠하면 판이 반투명해진다(이벤트 판 바탕 background-7) → 그대로 */
  const keep = [];
  let s = fs.readFileSync(p, 'utf8').replace(/<(mask|clipPath)\b[\s\S]*?<\/\1>/g, (m) => { keep.push(m); return '@@KEEP' + (keep.length - 1) + '@@'; });
  s = s.replace(/(?<!&)#([0-9a-fA-F]{6})\b/g, (m0, hx) => lt(parseInt(hx.slice(0, 2), 16), parseInt(hx.slice(2, 4), 16), parseInt(hx.slice(4, 6), 16), f))
    .replace(/(?<!&)#([0-9a-fA-F]{3})\b(?![0-9a-fA-F])/g, (m0, hx) => lt(parseInt(hx[0] + hx[0], 16), parseInt(hx[1] + hx[1], 16), parseInt(hx[2] + hx[2], 16), f))
    .replace(/="(black)"/g, () => '="' + lt(0, 0, 0, f) + '"')
    .replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g, (m0, r, g, b) => { const h = lt(+r, +g, +b, f); return m0.replace(/\d+,\s*\d+,\s*\d+/, [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')); });
  s = s.replace(/@@KEEP(\d+)@@/g, (m, i) => keep[+i]);
  const out = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, out), s);
  map[f] = out; n++;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light svg', n);

/* 글자 대비(contrast.js 실측 4.5:1 미만)를 역할별 색으로 — 판 · 모양은 그대로, 글자색만.
   시계 시각(원본 = 하늘색 그라디언트 글자) · KPI 라벨(옅어진 알약 위 흰 글자) · Ack 단추 · Max/Min 표지 · 이벤트 표 글자 · Redis 카드 C/M 라벨 */
const INK = '#14243d', SUB = '#2c3f5c', ACC = '#1b3f8f';
const R = '.{{PX}}-root[data-theme="light"]';
const COMMON = [
  R + ' [data-name="Clock"] [data-name="Time"]{background:none!important;-webkit-text-fill-color:' + ACC + '!important;color:' + ACC + '!important;}',
  R + ' [data-name="Clock"] [data-name="Date"]{-webkit-text-fill-color:' + INK + '!important;color:' + INK + '!important;}',
  R + ' [data-name^="KPI/"] p{color:#0b1f4a!important;}',
  R + ' :is([data-name="Button/Ack"],[data-name="Button/Ack (Hover)"],[data-name="Button/All"],[data-name="Button/All (Hover)"]) p{color:' + ACC + '!important;}',
  R + ' [data-name="Max Marker"] p{color:#7d0a6c!important;}',
  R + ' [data-name="Min Marker"] p{color:#03505f!important;}',
  R + ' [data-name^="Row/"] p:not([data-name="Td/Grade"]),' + R + ' [data-name^="Row/"] [data-name^="Td/"]:not([data-name="Td/Grade"]){color:' + INK + '!important;}',
  R + ' [data-name="Cells"] p,' + R + ' [data-name$="Axis Labels"] p{color:' + INK + '!important;}',
  R + ' [data-name^="Cells/"] p{color:' + SUB + '!important;}',
  /* Redis 카드 C · M 글자는 색 점 위 — 원본처럼 흰 글자 */
  R + ' [data-name^="Metric/"] > [data-name="Label"]{color:#ffffff!important;}',
];
const SC = path.join(__dirname, 'screen-css.json');
const sc = JSON.parse(fs.readFileSync(SC, 'utf8'));
const TAG = '/*lt*/';
['4041-8351', '4039-2211', '4039-3717', '4039-5908', '4039-10484', '4038-2699', '4041-7220', '4041-7319', '4041-7360'].forEach((k) => {
  const key = k + ':light';
  sc[key] = (sc[key] || []).filter((x) => x.indexOf(TAG) !== 0).concat(COMMON.map((x) => TAG + x));
});
fs.writeFileSync(SC, JSON.stringify(sc, null, 1));
console.log('light text rules', COMMON.length);
