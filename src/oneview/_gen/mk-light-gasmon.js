/* 라이트 그림 사본 — src/gasmon/*.svg → *-lt.svg + light-assets.json
   자동 뒤집기 대신 파일 역할별 색 표로 옮긴다(형상은 한 점도 안 건드린다).
   <mask>/<clipPath> 안의 색은 알파라서 그대로 둔다. 래스터 사본(screen-main-lt.jpg · floor-plan-lt.png)은 mk-light-images.cs 가 만든다.
   실행: node mk-light-gasmon.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');

/* 판 · 선 공통 */
const PANEL = {
  '#0c1015': '#ffffff',                                   /* 판 바탕 */
  '#172b5c': '#c9d8ec', '#175f8e': '#9cc3e3', '#175f8f': '#7fb0da', '#277ab0': '#5a9fd4',
  '#88d0fe': '#3b9be0', '#152b5d': '#e2ecf8', '#4773ad': '#b2c8e0',
  '#0a1a2c': '#f0f5fb', '#17346e': '#dce8f6', '#11244c': '#f2f6fb', '#1f3e7f': '#dae6f4',
  '#101d47': '#e5eef9', '#b6b6b6': '#4a5d73',
  '#091120': '#ffffff', '#2b2f33': '#d7dee7',             /* 이벤트 로그 판 */
  '#2b2e31': '#eaf0f6', '#33363b': '#dfe6ee', '#45494d': '#cfd8e2',   /* 표 머리 줄 */
  '#1c2432': '#b9c5d3', '#343639': '#c4ceda',             /* Auto · 접기 단추 */
  '#0c2977': '#d4e0f0',                                   /* 가스 감지기 미터 트랙 */
  '#12395e': '#e4eef9', '#155280': '#9fc5e4',             /* 공장도면 배지 */
  '#6590c7': '#3f6fa8',                                   /* 헤더 시계 · 로그아웃 */
  '#d9d9d9': '#d9d9d9',
};
/* 헤더 띠(화면 맨 위) — 남색 띠 → 흰 띠 + 하늘 선 */
const HEADER = Object.assign({}, PANEL, {
  '#00101f': '#ffffff', '#021b32': '#f3f8fd', '#1e2f40': '#d9e3ee', '#134967': '#b7d1e8', '#157cb5': '#5ea2d8', '#00529f': '#3e8ad6', '#2ea3fe': '#2a8fe3',
});
/* 메뉴 카드 받침 · 유리 구 — 밝은 유리로 */
const PEDESTAL = {
  '#1f2a3f': '#e1e9f2', '#193e5a': '#c9dbeb', '#666f7e': '#a5b4c4', '#66829a': '#93acc2', '#66849b': '#93acc2',
  /* 유리 구(orb) — 흰 바탕에서 사라지지 않게 회청으로 한 단 짙게, 테두리는 또렷하게 */
  '#43434a': '#9fb2c7', '#5d5d5d': '#b3c3d5', '#6c6c6c': '#7f98b3', '#737373': '#c6d3e1', '#959597': '#dbe4ee', '#dfdfdf': '#ffffff',
};
function tableFor(f) {
  if (/^background-(3|4-2|hd)/.test(f)) return HEADER;
  if (/^(platform|orb)\.svg$/.test(f)) return PEDESTAL;
  if (/^(status-|btn-event-status|marker-sensor|body|cloud|figure|lens|highlight|light|shadow|row-group)/.test(f)) return null;
  if (/^background-(1|2-2)\.svg$/.test(f)) return null;   /* Ack 단추 — 보라 그대로 */
  return PANEL;
}
/* 흰색으로 그린 아이콘 — 흰 판에서 사라지므로 짙게 */
const WHITE = { 'boolean-false.svg': '#3f5470', 'boolean-true.svg': '#3f5470', 'radio.svg': '#3f5470', 'radio-2.svg': '#3f5470' };

function maskRanges(s) {
  const r = [];
  for (const tag of ['mask', 'clipPath']) {
    const re = new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>', 'g');
    let m; while ((m = re.exec(s))) r.push([m.index, m.index + m[0].length]);
  }
  return r;
}

const map = {};
for (const f of fs.readdirSync(DIR)) {
  if (/-lt\.svg$/.test(f)) { fs.unlinkSync(path.join(DIR, f)); continue; }
  if (!/\.svg$/.test(f)) continue;
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');
  const mr = maskRanges(s), inMask = (i) => mr.some(([a, b]) => i >= a && i < b);
  const t = tableFor(f), w = WHITE[f];
  let n = 0;
  let o = s;
  if (t) o = o.replace(/(?<!&)#[0-9a-fA-F]{6}\b|(?<!&)#[0-9a-fA-F]{3}\b/g, (hex, i) => {
    if (inMask(i)) return hex;
    const v = t[hex.toLowerCase()];
    if (v && v !== hex.toLowerCase()) { n++; return v; }
    return hex;
  });
  /* 등급 칩 · 건수 칩(status-*-bg · btn-event-status-bg*) — 다크는 '검은 속 + 색 테두리 빛' 이라 라이트에선 탁한 알약이 된다.
     라이트 칩 = 흰 속 + 옅은 색 물 + 또렷한 색 테두리(글자는 conv.js NODE_CSS 가 등급색 짙은 톤으로). 형상(path)은 그대로 */
  if (/^(status-[a-z]+-bg|btn-event-status-bg)/.test(f)) {
    const CHIP = { '#f43050': '#e8344f', '#fc7f01': '#ee7a00', '#f5c300': '#e2aa00', '#0a7cff': '#1f74e0', '#ececec': '#97a3b1' };
    const m = /stop-color="(#[0-9A-Fa-f]{6})"/.exec(o), C = m && CHIP[m[1].toLowerCase()];
    if (C) {
      o = o.replace(/stop-color="#[0-9A-Fa-f]{6}"/g, 'stop-color="' + C + '"')
        .replace(/fill="white" fill-opacity="0\.1"/g, 'fill="white" fill-opacity="0.94"')                 /* 속: 흰 판 */
        .replace(/fill="#[0-9A-Fa-f]{6}" fill-opacity="0\.\d+"/g, 'fill="' + C + '" fill-opacity="0.16"') /* 채운 칩(CR · NO): 옅은 색 물 */
        .replace(/<stop offset="([\d.]+)" stop-opacity="0\.5"\/>/g, (s0, off) => '<stop offset="' + off + '" stop-color="' + C + '" stop-opacity="0.05"/>')   /* 검은 속(색 없는 정지점) */
        .replace(/(<stop offset="1" stop-color="[^"]+" stop-opacity=")0\.[5-9]\d*("\/>\s*<\/radialGradient>)/g, '$10.2$2')
        .replace(/(<linearGradient[\s\S]*?<stop offset="1" stop-color="[^"]+" stop-opacity=")0("\/>)/g, '$10.55$2');
      n++;
    }
  }
  if (w) o = o.replace(/(fill|stroke|stop-color)="(white|#fff|#ffffff)"/gi, (all, p, _k, i) => (inMask(i) ? all : (n++, p + '="' + w + '"')));
  /* 이벤트 로그 접기 단추 — 흰 화살표만 짙게(단추 판의 흰 반사광은 그대로) */
  o = o.replace(/(id="arrow"[^>]*fill=")white"/, (all, a) => (n++, a + '#3f5470"'));
  if (!n) continue;
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, lt), o);
  map[f] = lt;
}
/* 래스터 사본 */
['screen-main.jpg:screen-main-lt.jpg', 'floor-plan.png:floor-plan-lt.png'].forEach((x) => {
  const [a, b] = x.split(':');
  if (fs.existsSync(path.join(DIR, b))) map[a] = b;
});
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light variants:', Object.keys(map).length);
