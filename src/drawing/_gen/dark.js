/* 스마트 도면관리 시스템 — 다크 테마 파생표
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
const NAVY = 220, NS = 0.05;

/* 손으로 정한 대응(가장 자주 쓰는 색). 키는 원본 그대로, 값은 다크. */
/* DRAWING_DARK */
const TABLE = {
  text: {
    '#171d25': '#eceef2', '#202433': '#eceef2', '#232729': '#eceef2', '#32363d': '#e4e6ea', '#414651': '#c9cdd6', black: '#eceef2', '#000': '#eceef2',
    '#3967fd': '#8ba6ff', '#747474': '#a7acb6', '#636363': '#a7acb6', '#666': '#a7acb6', '#767676': '#a7acb6', '#979bae': '#8d929c', '#9196aa': '#8d929c',
    '#d4d4d4': '#8b909b', '#b4b4b4': '#8f949f', '#999': '#979ca6', '#fefdfe': '#a7acb6',
  },
  bg: {
    white: '#17191e', '#fefdfe': '#17191e', '#fff': '#17191e', '#ffffff': '#17191e', '#f6f8fb': '#0e0f12', '#f0f1f8': '#17191e', '#fcfcfc': '#1d2027', '#f1f1f1': '#23262d', '#f9f9fc': '#17191e', '#f5f7ff': '#23262d', '#f6f8fb80': '#0e0f12',
    'rgba(255,255,255,0.5)': 'rgba(23,25,30,0.62)', 'rgba(255,255,255,0.6)': 'rgba(23,25,30,0.7)', 'rgba(255,255,255,0.7)': 'rgba(23,25,30,0.78)',
    'rgba(254,253,254,0.4)': 'rgba(255,255,255,0.05)', 'rgba(254,253,254,0.6)': 'rgba(255,255,255,0.05)',
  },
  border: {
    '#dddfeb': '#2a2d34', '#e3e3e3': '#2a2d34', '#eeeef2': '#24272e', '#eaebf0': '#2a2d34', '#eaebec': '#2a2d34', '#d9dbe6': '#31343c', '#d5d6dd': '#31343c', '#d5d6de': '#31343c', '#dadfff': '#2d3038', '#ddd': '#2d3038', '#ebeef4': '#24272e', '#d2d2d2': '#3a3d45', '#bfbfbf': '#3a3d45', '#e2e4f2': '#31343c',
    'rgba(255,255,255,0.5)': 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.6)': 'rgba(255,255,255,0.08)',
  },
  shadow: { /* DRAWING_DARK2 */ 'rgba(217,219,230,0.5)': 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)': 'rgba(0,0,0,0.3)' },
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
  /* 층 — 바탕 #0e0f12 < 헤더 띠 #131519 < 패널 #17191e > 값 칸 #111316. 파랑은 강조에만 */
  const GLASS = ['Widget/Notice', 'Widget/Help Desk', 'Panel'].map((n) => R + ' [data-name="' + n + '"] > div:first-child').join(',');
  rules.push(
    R + ':not(.hj-asset) > [data-node-id]{background-color:#0e0f12;}',   /* 화면 판에만 — 에셋 썸네일 바탕은 투명해야 한다 */
    R + ' [data-name="Header"] > [data-name="Background"]{background:#131519!important;box-shadow:inset 0 -1px 0 rgba(255,255,255,.06)!important;}',
    R + ' [data-name="Input"],' + R + ' [data-name="Select"],' + R + ' [data-name^="Field/ID"],' + R + ' [data-name^="Field/Password"]{background-color:#111316;}',
    GLASS + '{background-image:linear-gradient(180deg,rgba(33,36,43,.64),rgba(19,21,26,.76))!important;background-color:transparent!important;backdrop-filter:blur(18px) saturate(1.15)!important;-webkit-backdrop-filter:blur(18px) saturate(1.15)!important;}',
    /* 원본의 안쪽 빛(푸른 100px 안개)은 어두운 판에서 뿌옇게 뜬다 — 머리카락 테두리 + 윗면 빛 + 바깥 그림자로 */
    ['Widget/Notice', 'Widget/Help Desk', 'Panel'].map((n) => R + ' [data-name="' + n + '"] > div:nth-child(3)').join(',') + '{box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 0 1px rgba(255,255,255,.07),0 24px 48px rgba(0,0,0,.34)!important;}',
    R + ' > [data-node-id]:has([data-name^="Widget/"]) > [data-name="Header"] > [data-name="Background"]{background:rgba(14,16,20,.68)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;}',
    R + ' [data-name^="Step/"] > div:first-child{background-color:rgba(130,155,255,.12);}',
    R + ' [data-name^="Widget/"] [data-name="List Item/Post"]{background-color:rgba(255,255,255,.045);}',
    R + ' [data-name="Count"]{background-color:rgba(255,255,255,.1)!important;}',
    R + ' [data-name="Login Card"] > div:first-child{background-image:linear-gradient(180deg,rgba(33,36,43,.62),rgba(19,21,26,.74))!important;background-color:transparent!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;}',
    R + ' [data-name="Login Card"] > div:nth-child(2){box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.08),0 30px 60px rgba(0,0,0,.4)!important;}',
    R + ' [data-name="Search Overlay"] > [data-name="Background"],' + R + ' [data-name="Background"][data-node-id="1:6533"]{background-color:#17191e!important;}',
    /* DRAWING_GLASS 유리 띠는 화면 안에 직접 심겨서 사본 교체가 안 먹는다 — 색만 CSS 로 */
    R + ' svg.ls-inl[data-src^="background-1"] > g{filter:none;}',
    R + ' svg.ls-inl[data-src^="background-1"] > g > use{fill:#15171c;fill-opacity:.72;}',
    R + ' svg.ls-inl[data-src^="background-1"] > g > path{stroke:#fff;stroke-opacity:.09;}',
    R + ' [data-name="Icon Image"] img[src$="/icon-image-2.png"]{filter:brightness(.9);}',
    /* 공지 · Help Desk 아이콘 칸 — 그림의 판 색이 패널에 묻히므로 같은 머리카락 테두리를 얹는다 */
    R + ' [data-name="Icon Image"]:not(:has(img[src$="/icon-image-2.png"]))::after{content:"";position:absolute;inset:0;border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0));box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);pointer-events:none;}'
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
