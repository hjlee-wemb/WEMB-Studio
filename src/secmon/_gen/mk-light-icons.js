/* 증권 통합관제 — 라이트 아이콘 · 심볼 대비(2026-11-27 사용자 지적 "라이트에서 심볼 · 아이콘이 잘 안 보인다").
   대상은 icon-vis.js 실측(그림을 숨긴 화면과의 픽셀 차이 = 바탕에서 드러나는 정도)으로 골랐다: 라이트 점수 < 다크의 60% · 다크 점수 > 10.
   다크 → 라이트 원칙(모양 그대로 색만): 형상 · 좌표 · 그라디언트 방향은 그대로, 색 글자만 역할별로 다시 칠한다.
     ICON  글리프 · 점 · 불릿 · 로고 칩 — 흰 · 옅은 무채색 → 짙은 남청(L' = 0.22 + (1-L)·0.45), 채도 있는 색(시안 · 주황 · 노랑 …)은 같은 색상 그대로 명도만 ≤ 0.48
     RING  게이지 링 · 원(72px 안팎) — 흰 트랙 → 중간 회청(L' = 0.52 + (1-L)·0.3), 색 호(분홍)는 ICON 과 같다
     STRIP 목록 강조 띠 — 흰 반투명 → 옅은 청회(L' 0.72)
     DEEP  Redis 도넛 안쪽 짙은 원판 — 흰 카드 위에서 사라지지 않게 옅은 남청 원판(L' = 0.86 - L·0.25)
   투명도(opacity · fill-opacity · stop-opacity)는 1.5배(빛 번짐이 흰 바탕에서 안 보였다).
   함정: <mask> · <clipPath> 는 알파라 칠하지 않는다(칠했더니 빈 별 · 일부 점이 가려졌다). '&#235;' 같은 문자 참조를 색으로 읽지 않는다(선 차트 그림이 깨졌다).
   3D 렌더 png 는 아래 PNG 필터(screen-css ':light').
   실행: node mk-light-icons.js → node conv.js   (mk-light-secmon.js 다음에 돌린다 — DEEP 이 그 사본을 덮는다) */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const ICON = ['dot.svg', 'dot-1.svg', 'dot-6.svg', 'bullet.svg', 'bullet-1.svg', 'logo-chip.svg', 'shape.svg', 'data.svg', 'dot-7.svg', 'data-a.svg', 'data-b.svg', 'dot-8.svg',
  'dot-1-2.svg', 'dot-6-2.svg', 'bullet-2.svg', 'dot-9.svg', 'dot-10.svg', 'shape-2.svg', 'dot-17.svg', 'logo-chip-2.svg', 'dot-6-3.svg', 'bullet-3.svg', 'logo-chip-3.svg',
  'dot-6-4.svg', 'bullet-4.svg', 'shape-4.svg', 'shape-1.svg', 'shape-2-2.svg', 'shape-5.svg', 'bullet-1-2.svg', 'logo-chip-4.svg', 'dot-6-5.svg', 'bullet-5.svg',
  'circle-1-3.svg', 'circle-2-2.svg', 'masked-visual.svg', 'logo-chip-5.svg', 'logo-chip-6.svg', 'dot-4-6.svg', 'circle-1-4.svg', 'circle-4.svg'];
const RING = ['arc.svg', 'arc-2.svg', 'arc-4.svg', 'arc-6.svg', 'arc-8.svg', 'arc-9.svg', 'icon-2.svg', 'shape-4-2.svg'];
const STRIP = ['background-4.svg', 'background-5.svg', 'background-6.svg'];   /* graphic.svg(라벨 밑 빛 번짐)는 칠하면 글자 위를 긋는 줄이 돼 원본 그대로 */
const DEEP = ['circle-3.svg', 'circle-1-2.svg'];

function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), L = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) { s = d / (1 - Math.abs(2 * L - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, s, L];
}
function hex(h, s, L) {
  s = Math.max(0, Math.min(1, s)); L = Math.max(0, Math.min(1, L));
  const C = (1 - Math.abs(2 * L - 1)) * s, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = L - C / 2;
  let o;
  if (h < 60) o = [C, X, 0]; else if (h < 120) o = [X, C, 0]; else if (h < 180) o = [0, C, X]; else if (h < 240) o = [0, X, C]; else if (h < 300) o = [X, 0, C]; else o = [C, 0, X];
  return '#' + o.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
/* 11-27 사용자: "심볼 · 아이콘을 어둡게 하지 말고 배경을 조절해서, 더 뚜렷하게" → 짙은 남청으로 칠하던 것을 버린다.
   원색(시안 · 주황 · 노랑 · 분홍)은 명도 그대로 채도만 살짝 올리고, 흰 · 옅은 무채색 글리프는 밝은 브랜드 파랑(L 0.56 · 채도 0.88)으로.
   또렷함은 CSS 윤곽(아래 RULES — 얇은 파랑 테두리 그림자)으로 준다. 링 트랙 = 맑은 하늘색, 도넛 안 원판 = 옅은 하늘색. */
function mapColor(kind, r, g, b) {
  const [h, s, L] = hsl(r, g, b);
  const vivid = s > 0.3 && L > 0.12 && L < 0.92;
  if (kind === 'DEEP') return hex(h || 222, 0.35, 0.975 - L * 0.04);   /* 도넛 안 원판 = 거의 흰색(하늘색 링 · 카드와 구분) */
  if (vivid) return hex(h, Math.min(1, s * 1.15), L);
  if (L <= 0.5) return hex(h, s, L);
  const H = s > 0.05 ? h : 217;
  if (kind === 'RING') return hex(H, 0.8, 0.72 - (1 - L) * 0.08);
  if (kind === 'STRIP') return hex(H || 222, 0.85, 0.78);
  /* 11-27 참고 이미지(Nexus): UI 글리프는 중간 회색(#6b7280 단), 로고 칩은 인디고 */
  if (kind === 'BRAND') return hex(243, 0.75, 0.6);
  return hex(220, 0.09, 0.46 + (1 - L) * 0.08);
}
const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };
function recolor(svg0, kind) {
  const keep = [];
  const svg = svg0.replace(/<(mask|clipPath)\b[\s\S]*?<\/\1>/g, (m) => { keep.push(m); return '@@KEEP' + (keep.length - 1) + '@@'; });
  return svg
    .replace(/(?<!&)#([0-9a-fA-F]{6})\b/g, (m0, x) => mapColor(kind, parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)))
    .replace(/(?<!&)#([0-9a-fA-F]{3})\b(?![0-9a-fA-F])/g, (m0, x) => mapColor(kind, parseInt(x[0] + x[0], 16), parseInt(x[1] + x[1], 16), parseInt(x[2] + x[2], 16)))
    .replace(/(fill|stroke|stop-color|flood-color)="(white|black)"/g, (m0, a, c) => a + '="' + mapColor(kind, ...NAMED[c]) + '"')
    .replace(/(fill-opacity|stop-opacity|flood-opacity|opacity)="([\d.]+)"/g, (m0, a, v) => { const n = +v; return a + '="' + (n > 0 && n < 1 ? Math.min(1, +(n * 1.5).toFixed(3)) : n) + '"'; })
    .replace(/@@KEEP(\d+)@@/g, (m, i) => keep[+i]);
}
const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'light-assets.json'), 'utf8'));
let n = 0;
const BRAND = ICON.filter((f) => /^logo-chip/.test(f));
for (const [kind, list] of [['ICON', ICON.filter((f) => BRAND.indexOf(f) < 0)], ['BRAND', BRAND], ['RING', RING], ['STRIP', STRIP], ['DEEP', DEEP]]) {
  for (const f of list) {
    const p = path.join(DIR, f);
    if (!fs.existsSync(p)) { console.log('  없음', f); continue; }
    const out = f.replace(/\.svg$/, '-lt.svg');
    fs.writeFileSync(path.join(DIR, out), recolor(fs.readFileSync(p, 'utf8'), kind));
    map[f] = out; n++;
  }
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light icons', n);

/* 3D 렌더 png(흰 유리 큐브 · DB 서버 · TPQ 원통 · 인프라 서버 층 · 파일 확인 아이콘) — 사진이라 색은 그대로 두고 명도 · 대비를 내리고 짙은 윤곽 그림자.
   글리프 png(로그아웃)는 짙은 남청 글리프로. 종합상황판 원판 사본(circle-lt.png)은 한 단 짙게. */
const R = '.{{PX}}-root[data-theme="light"]';
/* 3D 렌더는 밝기를 내리지 않는다 — 채도 · 대비만 살짝, 파랑 윤곽(1px) + 부드러운 파랑 그림자로 바탕에서 떠오르게 */
/* 11-27 2차: 파란 윤곽이 유리 큐브를 파랗게 물들여 원판과 같은 색이 됐다 → 중립 회색 얇은 윤곽 + 옅은 그림자(아이콘 자체 밝기는 그대로) */
/* 11-27 4차(사용자): 그림자 가장 연하게 — 아주 옅은 0.5px 윤곽 하나만 */
/* 11-27 6차(사용자): 그림자 최대한 연하게 — 보이지만 거슬리지 않게 */
const R3D = 'filter:drop-shadow(0 0 .5px rgba(30,41,59,.1))!important;';
const CRISP = 'filter:drop-shadow(0 0 .5px rgba(15,23,42,.08));';
const BAND = 'linear-gradient(90deg,#1e40af 0%,#1d4ed8 50%,#2563eb 100%)';   /* 흰 글자 대비 ≥ 5:1(끝 #2563eb 5.2:1) */
const PNG3D = ['image-1.png', 'image-2.png', 'image-4.png', 'image-6.png', 'image-7.png', 'bar.png', 'bar-1.png', 'shape.png', 'shape-1.png', 'shape-2.png', 'image-3.png', 'image-1-2.png', 'image-2-2.png', 'image-3-2.png'];
const RULES = [
  R + ' :is(' + PNG3D.map((f) => 'img[src$="/' + f + '"]').join(',') + '){' + R3D + '}',
  /* Max · Min 표지 — 짙은 남색 원판과 흰 바탕을 오가므로 원색 글자 + 얇은 짙은 글자 윤곽(어느 바탕에서도 읽힘) */
  /* Max · Min 표지 — 원판이 연해져 흰 바탕 위 — 그림자 없이 읽히는 원색 */
  R + ' [data-name="Max Marker"] p{color:#c026d3!important;text-shadow:none!important;}',
  R + ' [data-name="Min Marker"] p{color:#0891b2!important;text-shadow:none!important;}',
  /* Redis 카드 빈 즐겨찾기 별 — 노란 테두리가 옅은 칸 위라 안 보였다 → 채워진 별(button-favorite)과 같은 남색 칸 */
  R + ' [data-name="Shape"]:has(~ [data-name="Shape"] :is(img[src$="/shape-4.svg"],img[src$="/shape-2-2.svg"],img[src$="/shape-1.svg"],img[src$="/shape-5.svg"])){background:linear-gradient(135deg,#3d52a0,#2b3c82)!important;}',
  /* 작은 아이콘 · 점 · 불릿 — 색은 밝게 둔 채 얇은 파랑 윤곽으로 또렷하게 */
  R + ' :is(' + ICON.concat(RING).map((f) => 'img[src$="/' + f + '"]').join(',') + '){' + CRISP + '}',
  R + ' [data-name="Input Background"]{box-shadow:inset 0 0 0 1px #8fb0ee!important;border-radius:3px;}',
  /* 회선 차트 '남부 A망' — 흰 선을 짙은 남청으로 바꿨으니 범례 색 상자도 같은 색 */
  R + ' [data-node-id="4041:9407"]{background-color:#24334c!important;}',
  /* 3D 큐브 노드를 만드는 svg 조각(면 · 몸통)도 같은 윤곽 */
  R + ' [data-name="Graphic"] [data-name="Shape"] img,' + R + ' [data-name="Masked Visual"] img{filter:drop-shadow(0 0 .6px rgba(25,45,95,.8));}',
];
const SC = path.join(__dirname, 'screen-css.json');
const sc = JSON.parse(fs.readFileSync(SC, 'utf8'));
const TAG = '/*li*/';
['4041-8351', '4039-2211', '4039-3717', '4039-5908', '4039-10484', '4038-2699', '4041-7220', '4041-7319', '4041-7360'].forEach((k) => {
  const key = k + ':light';
  sc[key] = (sc[key] || []).filter((x) => x.indexOf(TAG) !== 0).concat(RULES.map((x) => TAG + x));
});
fs.writeFileSync(SC, JSON.stringify(sc, null, 1));
console.log('light png rules', RULES.length);
