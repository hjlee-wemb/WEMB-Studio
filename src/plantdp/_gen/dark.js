/* 무선망 통합관리 — 다크 테마 파생표
   원본 시안이 **라이트**라 여기서는 '다크'를 만든다(형상·좌표는 그대로, 색만 다시 적는다).
   다른 시안의 light.js 와 같은 모양(lightDecl · lightRing · lightExtra · surfaceLuma)을 내보내서
   conv.js 는 셀렉터의 테마 이름만 "dark" 로 바꿔 그대로 쓴다.
   원칙(메모리 dark-render-light-theme): 자동 반전 금지 — 역할(글자 / 면 / 선 / 그림자)마다 명도를 옮기고 색상각은 지킨다.
   채도가 높은 브랜드 · 상태색(파랑 배너 · 초록 장비 버튼 · 상태 점)은 의미라서 그대로 둔다. */
'use strict';

function parse(c) {
  c = c.trim();
  if (c === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (c === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  let m = /^#([0-9a-fA-F]{3,8})$/.exec(c);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = /^rgba?\(([^)]*)\)$/.exec(c);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  return null;
}
const out = (o) => o.a >= 1
  ? '#' + [o.r, o.g, o.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
  : 'rgba(' + [o.r, o.g, o.b].map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',') + ',' + +o.a.toFixed(3) + ')';
function toHsl(o) {
  const r = o.r / 255, g = o.g / 255, b = o.b / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const l = (mx + mn) / 2;
  return { h: h * 60, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l, a: o.a };
}
function fromHsl(x) {
  const c = (1 - Math.abs(2 * x.l - 1)) * x.s, hp = ((x.h % 360) + 360) % 360 / 60, m = x.l - c / 2;
  const q = c * (1 - Math.abs(hp % 2 - 1));
  const t = hp < 1 ? [c, q, 0] : hp < 2 ? [q, c, 0] : hp < 3 ? [0, c, q] : hp < 4 ? [0, q, c] : hp < 5 ? [q, 0, c] : [c, 0, q];
  return { r: (t[0] + m) * 255, g: (t[1] + m) * 255, b: (t[2] + m) * 255, a: x.a };
}

/* 다크 팔레트 — 중성 그래파이트(사용자 지시 2026-11-06 "파란 빛 나는 다크 말고 심미성 있고 현대적인").
   바탕 · 면 · 선 · 글자는 거의 무채색(색상각 220, 채도 4~6%)으로 두고, 파랑은 브랜드 · 강조(배너 · 단추 · 시각 · 차트)에만 남긴다. */
const NAVY = 218, NS = 0.06;

/* 손으로 정한 대응(가장 자주 쓰는 색). 키는 원본 그대로, 값은 다크. */
const TABLE = {
  /* 글자 — 본문 남회색(#303a46)은 밝은 회백, 보조(#7086a0)는 차분한 회청, 브랜드 파랑 글자는 밝은 파랑 */
  text: {
    '#303a46': '#e6ebf2', '#7086a0': '#9aa8bb', '#2d2e38': '#eceef2', '#2f3042': '#dfe3ea', '#2a74f4': '#76a3ff', '#363743': '#e2e5ea',
    '#4a525d': '#c3cad4', '#676767': '#a3a8b0', '#32333b': '#e6e8ec', '#676b70': '#a3a8b0', '#5b6877': '#a9b3c0', '#616972': '#a6adb7',
    'rgba(112,134,160,0.5)': 'rgba(160,174,192,0.55)', '#1359da': '#7ea8ff', '#005bc3': '#7aa7ff', '#0058a7': '#7aa7ff', '#2b7fca': '#7fb4ec',
    '#334786': '#dfe6f5', '#b3b1b1': '#7d828a', '#000': '#eceef2', '#000000': '#eceef2', black: '#eceef2', 'rgba(0,0,0,0.8)': 'rgba(236,238,242,0.85)',
  },
  /* 면 — 흰 판은 그래파이트 패널(#171a20), 옅은 하늘 · 회색 칸은 한 단계 밝은 칸, 반투명 흰 유리는 반투명 그래파이트 */
  bg: {
    white: '#171a20', '#fff': '#171a20', '#ffffff': '#171a20', 'rgb(255,255,255)': '#171a20', 'rgba(255,255,255,1)': '#171a20',
    '#f3f9fb': '#1e222a', '#f4f3f3': '#20232a', 'rgb(244,243,243)': '#20232a', '#f1f9ff': '#1b2230', 'rgba(246,253,255,1)': '#191d24',
    '#f4fafe': '#1a1e25', 'rgb(244,250,254)': '#1a1e25', '#f1f1f1': '#23262d', '#f3f5f8': '#1f2228', '#d5f4ff': '#1b2a36',
    '#ffefef': '#3a1d21', '#ffe3e3': '#3d2125', 'rgb(255,199,199)': '#4a2428', '#ffc7c7': '#4a2428',
    '#d9d9d9': '#2a2e36', '#e5e5e5': '#2a2e36', '#dbdbdb': '#2a2e36', '#d8f3f9': '#10161d',
    'rgba(236,244,255,0.9)': 'rgba(24,28,36,0.9)', 'rgba(255,255,255,0.95)': 'rgba(23,26,32,0.95)', 'rgba(255,255,255,0.85)': 'rgba(23,26,32,0.86)',
    'rgba(255,255,255,0.8)': 'rgba(23,26,32,0.82)', 'rgba(255,255,255,0.7)': 'rgba(23,26,32,0.74)', 'rgba(255,255,255,0.5)': 'rgba(23,26,32,0.6)',
    'rgba(255,255,255,0.45)': 'rgba(23,26,32,0.55)', 'rgba(255,255,255,0.3)': 'rgba(23,26,32,0.45)', 'rgba(255,255,255,0.15)': 'rgba(255,255,255,0.04)',
    'rgba(228,228,228,0.3)': 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)': 'rgba(255,255,255,0.01)',
  },
  border: {
    '#d6dde6': '#2b3039', '#d7e1f0': '#2c323d', '#ccc': '#3a3f48', '#cccccc': '#3a3f48', '#9aabc1': '#4d5868', '#bdddff': '#2c4466', '#bcccd1': '#34404a',
    'rgba(255,255,255,0.8)': 'rgba(255,255,255,0.08)', '#e6ecf3': '#2a2f37', '#e6e6e6': '#2a2f37', 'rgba(215,225,240,0.5)': 'rgba(255,255,255,0.08)',
    '#bfc8db': '#3b4250', 'rgba(255,255,255,0.5)': 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)': 'rgba(255,255,255,0.06)', '#bcd4ff': '#2f4a78',
    white: '#2a2f37', '#fff': '#2a2f37', '#ffffff': '#2a2f37',
  },
  shadow: { 'rgba(215,225,240,0.8)': 'rgba(0,0,0,0.42)', 'rgba(255,255,255,0.8)': 'rgba(255,255,255,0.04)', '#97bdee': 'rgba(0,0,0,0.35)' },
};

function autoDark(c, role) {
  const o = parse(c); if (!o) return null;
  const h = toHsl(o);
  const gray = h.s < 0.16;
  if (role === 'text') {
    if (h.l >= 0.55) return null;                       /* 이미 밝은 글자(흰 글자 · 배지 글자)는 그대로 */
    if (gray) return out(fromHsl({ h: NAVY, s: NS, l: Math.min(0.94, 0.96 - h.l * 0.62), a: h.a }));
    return out(fromHsl({ h: h.h, s: Math.min(0.95, h.s), l: 0.7, a: h.a }));
  }
  if (role === 'bg') {
    if (gray) {
      if (h.l < 0.5) return null;                       /* 어두운 회색 판은 그대로 */
      return out(fromHsl({ h: NAVY, s: NS, l: 0.085 + (1 - h.l) * 0.5, a: h.a }));
    }
    if (h.l > 0.82) return out(fromHsl({ h: h.h, s: Math.min(0.18, h.s * 0.25), l: 0.12 + (1 - h.l) * 0.4, a: h.a }));
    return null;                                        /* 채도 있는 면(배너 · 버튼 · 상태)은 의미라서 둔다 */
  }
  if (role === 'border') {
    if (gray) return out(fromHsl({ h: NAVY, s: NS, l: h.l > 0.5 ? 0.13 + (1 - h.l) * 0.45 : 0.62 - h.l * 0.4, a: h.a }));
    if (h.l > 0.85) return out(fromHsl({ h: h.h, s: h.s * 0.3, l: 0.22, a: h.a }));
    return null;
  }
  if (role === 'shadow') {
    /* 흰 안쪽 하이라이트는 어두운 판에서 줄이 되어 보인다 → 아주 옅게. 검은 그림자는 조금 진하게 */
    if (h.l > 0.9) return out({ r: 255, g: 255, b: 255, a: Math.min(h.a, 0.06) });
    if (h.l < 0.2) return out({ r: 0, g: 0, b: 0, a: Math.min(0.6, h.a * 2.2) });
    return null;
  }
  return null;
}

const ROLE = (prop) => prop === 'color' || prop === '-webkit-text-fill-color' ? 'text'
  : /shadow|^filter$/.test(prop) ? 'shadow'
    : /^border-.*color$|^border-color$|^outline-color$/.test(prop) ? 'border'
      : /^background|^mask|^fill$/.test(prop) ? 'bg' : null;

const UNMAPPED = {};
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b/g;

function mapValue(value, role) {
  let changed = false;
  const v = value.replace(COLOR_RE, (c) => {
    const key = c.trim().replace(/\s+/g, '');
    const t = TABLE[role] || {};
    let n = t[key] || t[key.toLowerCase()];
    if (n === undefined) {
      n = autoDark(key, role);
      if (process.env.LIGHT_DEBUG) { const u = UNMAPPED[role] = UNMAPPED[role] || {}; u[key] = (u[key] || 0) + 1; }
    }
    if (n && n !== key) { changed = true; return n; }
    return c;
  });
  return changed ? v : null;
}

function lightDecl(prop, value, nid) {
  if (SKIP_NODE[nid]) return null;
  const role = ROLE(prop);
  if (!role) return null;
  COLOR_RE.lastIndex = 0;
  if (!COLOR_RE.test(value)) return null;
  COLOR_RE.lastIndex = 0;
  return mapValue(value, role);
}
function lightRing(shorthand) { return mapValue(shorthand, 'border'); }
const SKIP_NODE = {};

/* 그림 사본 갈아 끼우기 — 밝은 바탕 그림(격자 바탕 · 로그인 바탕 · 통신실 배경)의 어두운 사본(mk-dark-images.ps1).
   img 의 src 는 CSS 로 못 바꾸지만 `content:url()` 은 그린 결과를 바꾼다(레이아웃은 그대로). */
const fs = require('fs'), path = require('path');
const VP = path.join(__dirname, 'dark-assets.json');
const VARIANTS = fs.existsSync(VP) ? JSON.parse(fs.readFileSync(VP, 'utf8')) : {};
function lightExtra(PX) {
  const R = '.' + PX + '-root[data-theme="dark"]';
  const rules = [R + ':not(.hj-asset){background:#0e0f12;}', R + '{color:#e3e9f2;}'];
  /* 다크 사본은 같은 이름으로 다시 만들어지므로 내용 해시를 붙여 브라우저가 옛 그림을 물지 않게 한다 */
  const ver = (f) => { try { const b = fs.readFileSync(path.join(__dirname, '..', f)); let h = 0; for (let i = 0; i < b.length; i += 97) h = (h * 31 + b[i]) >>> 0; return h.toString(36); } catch (e) { return '1'; } };
  for (const [orig, dk] of Object.entries(VARIANTS)) rules.push(R + ' img[src$="/' + orig + '"]{content:url("{{B}}' + dk + '?v=' + ver(dk) + '");}');
  /* 층(중성 그래파이트) — 원본은 바탕 · 패널 · GNB 가 모두 흰색이라 한 색으로 옮기면 납작해진다.
     바탕 #0e0f12 < GNB · 헤더 띠 #131519 < 패널 #17191e(위 1px 하이라이트 · 옅은 흰 테두리 · 부드러운 그림자) > 값 칸 #111316.
     파란 빛 · 그라데이션 광원은 쓰지 않는다. 사진 같은 3D 그림은 다크 바탕에서 튀지 않게 조금만 누른다. */
  const glass = 'background:rgba(20,23,29,.84)!important;box-shadow:0 0 0 1px rgba(255,255,255,.07),0 12px 28px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);';
  rules.push(
    /* 화면 바탕(흰 → 하늘 그라디언트) → 밤하늘 남회색 */
    R + ' > [data-node-id] > div[aria-hidden] > div{background:linear-gradient(180deg,#0d1117 0%,#111821 100%)!important;}',
    R + ' > [data-node-id] > div[aria-hidden] > img{opacity:.04!important;filter:invert(1);}',
    /* 밤 바탕 그림(mk-night.js — 원본에서 캔버스로 만든 사본) — 사용자 2026-11-17 "다크에서 배경 이미지가 너무 밝다, 건물은 많이 건들지 말고"
       낮 하늘(screen-main-2) → 밤하늘, 흰 바탕 시안 격자(screen-main-1) → 투명 바탕에 빛나는 격자(조금 더 진하게), 로그인 사진 → 하늘만 밤 + 저녁 톤 */
    R + ' img[src$="/screen-main-2.png"]{content:url("{{B}}screen-main-2-dk.png?v=' + ver('screen-main-2-dk.png') + '");}',
    /* 격자는 Figma 가 mix-blend-mode:darken 으로 얹는다 — 밤하늘에선 어두운 쪽(남색)이 이겨 빛이 사라진다 → 다크는 screen(빛을 더한다) */
    R + ' img[src$="/screen-main-1.png"]{content:url("{{B}}screen-main-1-dk.png?v=' + ver('screen-main-1-dk.png') + '");opacity:.2!important;mix-blend-mode:screen!important;}',
    R + ' img[src$="/background.png"]{content:url("{{B}}background-dk.jpg?v=' + ver('background-dk.jpg') + '");filter:none!important;}',
    /* 3D 장면 · 건물 그림 — 바탕이 밤이 되었으니 아주 조금만 누른다(건물은 원본에 가깝게) */
    R + ' [data-name="Stage/3D Scene"] img{filter:brightness(.9) saturate(.95) contrast(1.03);}',
    R + ' [data-name="Stage/Building Image"] img{filter:brightness(.86) contrast(1.04);}',
    /* 유리 판 — 레일 · 필터 · 오른쪽 위젯 · 이벤트 로그 */
    R + ' [data-name="Side Rail"],' + R + ' [data-name="Filter Panel"] [data-name="Rectangle 4"]{' + glass + '}',
    R + ' > [data-node-id] > [data-name="Header"] > [data-name="Background"],' + R + ' > [data-node-id] > [data-name="Header"] > [data-name="Header Background"]{background:#12151b!important;box-shadow:inset 0 -1px 0 rgba(255,255,255,.07)!important;}',
    /* 차트 SVG(DOM 으로 심은 것) — 흰 판 · 옅은 격자 */
    R + ' svg [fill="#FCFCFC"]:not(mask *),' + R + ' svg [fill="#fcfcfc"]:not(mask *),' + R + ' svg [fill="white"]:not(mask *),' + R + ' svg [fill="#F9F9F9"]:not(mask *){fill:#15181e;}',
    R + ' svg [stroke="#F1F1F1"]:not(mask *),' + R + ' svg [stroke="#f1f1f1"]:not(mask *),' + R + ' svg [fill="#F1F1F1"]:not(mask *){stroke:#2a2e36;}',
    R + ' svg path[fill="#F1F1F1"]:not(mask *){fill:#2a2e36;}',
    /* 칩 · 표 줄 하이라이트 */
    R + ' [data-name="Event Log"] [data-name^="Row/"]:hover,' + R + ' [data-name="Event Log"] [data-name="grid-row"]:hover{filter:brightness(1.15);}',
    R + ' [data-name="Tooltip Group"] [data-name^="Tooltip/"] p{color:#e6ebf2!important;}',
    /* 레일 금속 원판은 원래 밝은 단추라 안의 아이콘도 원본 색 그대로 */
    R + ' [data-name^="Category/"] img{content:normal!important;}'
  );
  return rules;
}

/* 다크로 옮긴 뒤의 '면 밝기' — 그 위 글자를 밝게 할지 정하는 데 쓴다(conv.js). 다크에서는 대부분 어둡다. */
function surfaceLuma(decls) {
  const vals = decls.filter(([p]) => p === 'background-color' || p === 'background-image' || p === 'background').map((x) => x[1]);
  if (!vals.length) return null;
  const cols = [];
  for (const v of vals) {
    const mapped = mapValue(v, 'bg') || v;
    for (const c of mapped.match(COLOR_RE) || []) { const o = parse(c); if (o && o.a > 0.05) cols.push(o); }
  }
  if (!cols.length) return null;
  let L = 0;
  for (const o of cols) {
    const bg = 17;   /* 다크 바탕 위에 얹은 결과 */
    const r = o.r * o.a + bg * (1 - o.a), g = o.g * o.a + bg * (1 - o.a), b = o.b * o.a + 28 * (1 - o.a);
    const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    L = Math.max(L, 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b));
  }
  return L;
}

module.exports = { lightDecl, lightRing, lightExtra, surfaceLuma, UNMAPPED, parse, autoDark };
