/* 화면별 선 규칙 — design context 가 뭉갠 선을 use_figma 로 읽은 값으로 되살린다(screen-css.json).
   값의 출처: 2026-11-03 use_figma(strokeAlign · strokeWeight · dashPattern · gradientTransform).
   실행: node mk-screen-css.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');

/* Figma gradientTransform → CSS linear-gradient */
function cssGrad(tr, W, H, stops) {
  const a = tr[0][0], b = tr[0][1], c = tr[0][2];
  const gx = a / W, gy = b / H;
  let deg = Math.atan2(gx, -gy) * 180 / Math.PI;
  if (deg < 0) deg += 360;
  const U = (x, y) => a * x / W + b * y / H + c;
  const us = [U(0, 0), U(W, 0), U(0, H), U(W, H)];
  const u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us);
  const pct = (u) => +((u - u0) / (u1 - u0) * 100).toFixed(2) + '%';
  return 'linear-gradient(' + +deg.toFixed(2) + 'deg,' + stops.map((s) => s[1] + ' ' + pct(s[0])).join(',') + ')';
}
const sel = (id, tail) => '.{{PX}}-root [data-node-id="' + id + '"]' + (tail || '');
const MASK = '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;';
/* 안쪽 정렬 그라디언트 선 — 테두리는 투명(자리는 그대로), 같은 굵기 링을 ::after 로. 절대 배치는 padding box 기준이라 -w 로 border box 에 맞춘다 */
function ring(id, grad, w, opacity) {
  return [sel(id) + '{border-color:transparent!important;}',
    sel(id, '::after') + '{content:"";position:absolute;inset:-' + w + 'px;border-radius:inherit;padding:' + w + 'px;pointer-events:none;' + MASK + 'background:' + grad + ';' + (opacity != null && opacity < 1 ? 'opacity:' + opacity + ';' : '') + '}'];
}
/* 가운데 정렬 선 — 테두리를 걷어 오토레이아웃에서 빼고, 상자 밖 1px · 안 1px 을 굵기 절반 농도로 칠한다.
   정수 좌표 위 1.055px 가운데 선을 Figma 가 그리는 결과(양쪽 픽셀에 52.75% 씩)와 같다. */
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].join(','); };
function center(id, w, hex) {
  const c = 'rgba(' + rgb(hex) + ',' + +(w / 2).toFixed(4) + ')';
  return [sel(id) + '{border-width:0!important;box-shadow:0 0 0 1px ' + c + ',inset 0 0 0 1px ' + c + ';}'];
}
const CHIP = [[0, '#175e3a'], [0.5, '#64caa5'], [1, '#337b90']];
const CHIP_TR = [[0, 1, 0], [-1, 0, 1]];
const TITLE = [[0, '#245360'], [0.5, '#1b94a6'], [1, '#3b4a94']];
const TITLE_TR = [[0, -1, 1], [11.6404, 0, -5.3202]];
const COUNT = [[0, '#5dafda'], [0.5, '#f1eeff'], [1, '#5dafda']];
const COUNT_TR = [[0, 1, 0], [-13.2704, 0, 7.1352]];

/* 원형 카운터(13:1425 · 13:1442) — 둥근 끝 3,6 점선 + 대각 그라디언트 2px 가운데 정렬 */
function counter(id) {
  const tr = [[1.20318, 1.00731, -0.87552], [-1.00731, 1.20318, 0.52369]];
  const det = tr[0][0] * tr[1][1] - tr[0][1] * tr[1][0];
  const inv = (u, v) => { const du = u - tr[0][2], dv = v - tr[1][2]; return [(tr[1][1] * du - tr[0][1] * dv) / det * 88, (-tr[1][0] * du + tr[0][0] * dv) / det * 88]; };
  const a = inv(0, 0.5), b = inv(1, 0.5);
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='-1 -1 90 90'><defs><linearGradient id='g' gradientUnits='userSpaceOnUse' x1='" + a[0].toFixed(2) + "' y1='" + a[1].toFixed(2) + "' x2='" + b[0].toFixed(2) + "' y2='" + b[1].toFixed(2) + "'><stop stop-color='%23e2e3e5'/><stop offset='1' stop-color='%235fc49c'/></linearGradient></defs><path d='M44 0A44 44 0 1 1 44 88A44 44 0 1 1 44 0' fill='none' stroke='url(%23g)' stroke-width='2' stroke-dasharray='3 6' stroke-linecap='round'/></svg>";
  return [sel(id) + '{border:0!important;}',
    sel(id, '::after') + '{content:"";position:absolute;left:-1px;top:-1px;width:90px;height:90px;pointer-events:none;background:url("data:image/svg+xml,' + svg + '") 0 0/90px 90px no-repeat;}'];
}

const OUT = {
  '11-946': [].concat(
    /* 헤더 메뉴 · 카드 · 읽음 칸 */
    ...['2:137'].map((id) => center(id, 1.055, '#09b6fb')),
    ...['2:135', '2:134'].map((id) => center(id, 1.055, '#3d7bac')),
    ...['7:83', '8:208', '9:416', '9:441', '9:649', '9:653', '9:784', '9:788', '9:829', '9:833', '11:978', '11:1065'].map((id) => center(id, 1.055, '#2a7ca0')),
    /* 그라디언트 선 */
    ...['13:1366', '13:1382', '13:1330', '13:1360', '13:1406', '13:1413'].map((id) => ring(id, cssGrad(CHIP_TR, 94, 34, CHIP), 1)),
    ...['13:1419', '13:1444'].map((id) => ring(id, cssGrad(CHIP_TR, 110, 34, CHIP), 1)),
    ...['9:899', '11:1033', '11:1066'].map((id) => ring(id, cssGrad(TITLE_TR, 121, 36, TITLE), 2)),
    /* 범례 아래 선 — 가운데가 진하고 양끝이 사라진다 */
    [sel('8:292', '::after') + '{content:"";position:absolute;inset:0 0 -1px 0;border-radius:inherit;padding:0 0 1px 0;pointer-events:none;' + MASK + 'background:linear-gradient(90deg,rgba(79,172,254,0) 0%,rgba(79,172,254,1) 50%,rgba(79,172,254,0) 100%);}'],
    counter('13:1425'), counter('13:1442'),
    /* 그림 묶음 크기가 낡았다 — Figma 메타데이터는 405 인데 안쪽 선 그림은 판 폭(391 · 401)만큼이다. 그림 원래 폭으로 */
    [sel('9:667') + '{inset:15.15% -0.12% 15.62% 0.12%;}', sel('9:847') + '{inset:15.15% -0.12% 15.62% 0.12%;}']),
  '15-2': [].concat(
    ...['15:43'].map((id) => center(id, 1.055, '#09b6fb')),
    ...['15:46', '15:48'].map((id) => center(id, 1.055, '#3d7bac')),
    ...['15:813', '17:916', '17:968', '17:1018', '17:1069', '17:1119'].map((id) => center(id, 1.055, '#2a7ca0')),
    ...['18:2279', '19:2455', '18:2336', '19:2474', '19:2432'].map((id) => ring(id, cssGrad(CHIP_TR, 94, 34, CHIP), 1))),
  '19-2533': [].concat(
    ...['19:2576'].map((id) => center(id, 1.055, '#09b6fb')),
    ...['19:2573', '19:2579'].map((id) => center(id, 1.055, '#3d7bac')),
    ...['19:3311', '19:3315', '23:3359', '25:4021'].map((id) => center(id, 1, '#2a7ca0')),
    ...['25:4351', '25:4355', '25:4346', '25:4341'].map((id) => ring(id, cssGrad(CHIP_TR, 94, 34, CHIP), 1)),
    ring('25:4336', cssGrad(CHIP_TR, 110.59, 40, CHIP), 1.1765),
    ...[['23:3376', 104, 0.7], ['23:3390', 94, 1], ['23:3405', 97, 0.7], ['23:3418', 101, 0.7], ['23:3424', 108, 0.7], ['23:3430', 108, 0.7]].map((c) => ring(c[0], cssGrad(COUNT_TR, c[1], 28, COUNT), 2, c[2]))),
};
fs.writeFileSync(path.join(__dirname, 'screen-css.json'), JSON.stringify(OUT, null, 1));
console.log(Object.keys(OUT).map((k) => k + ':' + OUT[k].length).join(' '));

/* ── 라이트 — 선 색 · 역할별 규칙(원본 그대로인 다크에는 영향 없다) ── */
{
  const LT = { '#09b6fb': '#0a84c6', '#3d7bac': '#9cc3dc', '#2a7ca0': '#b7d0e0' };
  const R = (tail) => '.{{PX}}-root[data-theme="light"] ' + tail;
  const lc = (id, w, hex, extra) => { const c = 'rgba(' + rgb(LT[hex]) + ',' + +(w / 2 + 0.25).toFixed(4) + ')'; return R('[data-node-id="' + id + '"]{box-shadow:0 0 0 1px ' + c + ',inset 0 0 0 1px ' + c + (extra || '') + ';}'); };
  const lring = (id, grad) => R('[data-node-id="' + id + '"]::after{background:' + grad + ';}');
  const CARD = ',0 3px 10px rgba(30,70,110,.08)';
  const CHIP_L = cssGrad(CHIP_TR, 94, 34, [[0, '#a9c6c0'], [0.5, '#64caa5'], [1, '#7fb0c4']]);
  const TITLE_L = cssGrad(TITLE_TR, 121, 36, [[0, '#7fa8bd'], [0.5, '#3a9fc0'], [1, '#7485cf']]);
  const COUNT_L = cssGrad(COUNT_TR, 100, 28, [[0, '#7fb6d6'], [0.5, '#d8e8f3'], [1, '#7fb6d6']]);
  const counterL = (id) => {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='-1 -1 90 90'><path d='M44 0A44 44 0 1 1 44 88A44 44 0 1 1 44 0' fill='none' stroke='%232f8fb0' stroke-width='2' stroke-dasharray='3 6' stroke-linecap='round'/></svg>";
    return R('[data-node-id="' + id + '"]::after{background-image:url("data:image/svg+xml,' + svg + '");}');
  };
  const COMMON = [
    /* 구성도 바탕 무늬 — 어두운 사진이라 뒤집어 옅게 */
    R('[data-name="Topology"] > [data-name="Background"] img{filter:invert(1) hue-rotate(180deg) saturate(.75) brightness(1.04);opacity:.55;}'),
    /* 3D 장비 — 흰 판 위에서 또렷하게 */
    R('[data-name="Visual"] img{filter:saturate(1.15) contrast(1.06);}'),
    R('[data-name="Chip"] > div:last-of-type{box-shadow:none!important;}'),
    /* 차트 — 막대를 더 진하게, 격자는 옅게 */
    R('svg [data-name^="Data/Today"]{opacity:.92;}'),
    /* 상태 표지 · 네트워크 라디오 — 반투명 그림이라 흰 판에서 옅어진다. 형상 그대로 진하게 */
    R('[data-name^="Marker ("] img,')+R('[data-name^="Count/"] [data-name="Marker"] img,')+R('[data-name="Radio"] img{filter:saturate(1.7) brightness(.78) contrast(1.2);}'),
    R('.{{PX}}-stop-ffffff{stop-color:#5d7a8f;}'), R('.{{PX}}-stop-9099a2{stop-color:#a9b9c5;}'),
    /* 시간별 발생 면 — 아래쪽 어두운 끝색을 옅게 */
    R('.{{PX}}-stop-572f08{stop-color:#f7e3c8;}'), R('.{{PX}}-stop-64292b{stop-color:#f6d3d4;}'), R('.{{PX}}-stop-0d5138{stop-color:#c9efe0;}'),
    R('.{{PX}}-stop-714c17{stop-color:#f7e3c8;}'), R('.{{PX}}-stop-0d3c4f{stop-color:#cfe8f3;}'), R('.{{PX}}-stop-0e2152{stop-color:#d3def9;}'),
    /* 조회 · 초기화 · 활성 메뉴는 짙은 판 + 흰 글자 그대로 */
    R('[data-name="Button/Search"] p,') + R('[data-name="Button/Reset"] p{color:#fff!important;}'),
    /* 활성 메뉴 — 반투명이라 밝은 바탕에서 옅어져 흰 글자 대비가 3.8:1 로 떨어졌다 → 같은 색을 불투명으로 */
    R('[data-name$="(Active)"] > [data-name="Content"]{background-color:#036f9d!important;}'),
    /* 차트 호버 · 칩 */
    R('[data-name^="Option/"]{box-shadow:0 1px 3px rgba(30,70,110,.14);}'),
    R('[data-name^="Option/"]{filter:none!important;}'),
  ];
  OUT['11-946:light'] = [].concat(COMMON,
    [R('[data-node-id="8:292"]{box-shadow:0 3px 10px rgba(30,70,110,.12);}')],
    ['2:137'].map((id) => lc(id, 1.055, '#09b6fb')), ['2:135', '2:134'].map((id) => lc(id, 1.055, '#3d7bac')),
    ['7:83', '8:208', '9:416', '9:649', '9:784', '9:829', '11:978', '11:1065'].map((id) => lc(id, 1.055, '#2a7ca0', CARD)),
    ['9:441', '9:653', '9:788', '9:833'].map((id) => lc(id, 1.055, '#2a7ca0')),
    ['13:1366', '13:1382', '13:1330', '13:1360', '13:1406', '13:1413', '13:1419', '13:1444'].map((id) => lring(id, CHIP_L)),
    ['9:899', '11:1033', '11:1066'].map((id) => lring(id, TITLE_L)),
    [counterL('13:1425'), counterL('13:1442')]);
  OUT['15-2:light'] = [].concat(COMMON,
    ['15:43'].map((id) => lc(id, 1.055, '#09b6fb')), ['15:46', '15:48'].map((id) => lc(id, 1.055, '#3d7bac')),
    ['15:813', '17:916', '17:968', '17:1018', '17:1069', '17:1119'].map((id) => lc(id, 1.055, '#2a7ca0', CARD)),
    ['18:2279', '19:2455', '18:2336', '19:2474', '19:2432'].map((id) => lring(id, CHIP_L)));
  OUT['19-2533:light'] = [].concat(COMMON,
    ['19:2576'].map((id) => lc(id, 1.055, '#09b6fb')), ['19:2573', '19:2579'].map((id) => lc(id, 1.055, '#3d7bac')),
    ['19:3311', '19:3315', '23:3359'].map((id) => lc(id, 1, '#2a7ca0')), [lc('25:4021', 1, '#2a7ca0', CARD)],
    ['25:4351', '25:4355', '25:4346', '25:4341', '25:4336'].map((id) => lring(id, CHIP_L)),
    ['23:3376', '23:3390', '23:3405', '23:3418', '23:3424', '23:3430'].map((id) => lring(id, COUNT_L)));
  fs.writeFileSync(path.join(__dirname, 'screen-css.json'), JSON.stringify(OUT, null, 1));
  console.log('라이트 규칙', Object.keys(OUT).filter((k) => /light/.test(k)).map((k) => k + ':' + OUT[k].length).join(' '));
}
