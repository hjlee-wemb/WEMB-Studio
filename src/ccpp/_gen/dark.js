/* 복합화력 설비정보 — 다크 테마 파생표
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
  /* 글자 — 남색 제목은 밝은 회백, 본문 회남색은 차분한 회백, 브랜드 파랑(키 · 머리 칸)은 밝은 파랑(대비 4.5:1 이상) */
  text: {
    '#072549': '#e8eef7', '#434859': '#c3cad6', '#1f222c': '#e6e9ef', '#0073ff': '#5ea2ff', '#1377ff': '#6aa8ff', '#999': '#8d95a3', '#999999': '#8d95a3',
    '#103f66': '#a6dbff', '#106651': '#7fe8c8', '#0d0d14': '#eef0f6', '#000': '#eceef2', '#000000': '#eceef2', black: '#eceef2',
  },
  /* 면 — 흰 유리 판은 그래파이트, 옅은 하늘 카드는 한 단계 밝은 칸, 화면 바탕 하늘은 밤 바탕 */
  bg: {
    white: '#161a21', '#fff': '#161a21', '#ffffff': '#161a21', 'rgb(255,255,255)': '#161a21', 'rgba(255,255,255,1)': '#161a21',
    'rgba(255,255,255,0.95)': 'rgba(22,26,33,0.95)', 'rgba(255,255,255,0.8)': 'rgba(22,26,33,0.84)',
    '#f7fcff': '#1b2029', 'rgb(247,252,255)': '#1b2029', '#cae7ff': '#0d1015', 'rgb(202,231,255)': '#0d1015',
    'rgba(0,140,255,0.03)': 'rgba(94,162,255,0.05)', 'rgba(0,115,255,0.05)': 'rgba(94,162,255,0.10)', 'rgba(7,37,73,0.1)': 'rgba(255,255,255,0.14)',
    'rgba(103,107,112,0.3)': 'rgba(255,255,255,0.10)', '#1f222c': '#8a94a6', 'rgba(0,0,0,0.03)': 'rgba(255,255,255,0.05)',
    'rgba(0,0,0,0.01)': 'rgba(255,255,255,0.01)', 'rgba(0,0,0,0.2)': 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.8)': 'rgba(255,255,255,0.42)',
    '#cff5ff': '#12344a', '#cffff3': '#103a31',
  },
  border: {
    'rgba(0,0,0,0.1)': 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.05)': 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.15)': 'rgba(255,255,255,0.14)',
    '#d4e6f5': '#2a3340', 'rgba(5,25,50,0.15)': 'rgba(255,255,255,0.14)', 'rgba(5,25,50,0.1)': 'rgba(255,255,255,0.10)', 'rgba(0,115,255,0.2)': 'rgba(94,162,255,0.38)',
    white: '#2a2f37', '#fff': '#2a2f37', '#ffffff': '#2a2f37',
  },
  shadow: { 'rgba(3,26,38,0.05)': 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.03)': 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.1)': 'rgba(0,0,0,0.4)' },
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
  const rules = [R + ':not(.hj-asset){background:#0d1015;}', R + '{color:#e3e9f2;}'];
  const ver = (f) => { try { const b = fs.readFileSync(path.join(__dirname, '..', f)); let h = 0; for (let i = 0; i < b.length; i += 97) h = (h * 31 + b[i]) >>> 0; return h.toString(36); } catch (e) { return '1'; } };
  for (const [orig, dk] of Object.entries(VARIANTS)) rules.push(R + ' img[src$="/' + orig + '"]{content:url("{{B}}' + dk + '?v=' + ver(dk) + '");}');
  rules.push(
    /* 화면 바탕(하늘 #cae7ff) → 밤 바탕, 위쪽이 조금 밝은 남회색 */
    R + ' > [data-node-id]{background:linear-gradient(180deg,#111720 0%,#0b0e13 100%)!important;}',
    /* 3D 설비 그림(투명 PNG) — 바탕만 밤이 되었으니 설비는 아주 조금만 누른다 */
    R + ' [data-name="3D Scene"] img{filter:brightness(.88) saturate(.95) contrast(1.04);}',
    /* 계통도 그림(흰 종이 JPG) → 다크 사본(mk-dark-diagram.ps1 — 바탕 · 검은 글씨만 뒤집고 선 색상각은 지킨다) */
    R + ' img[src$="/diagram-image.png"]{content:url("{{B}}diagram-image-dk.jpg?v=' + ver('diagram-image-dk.jpg') + '");}',
    R + ' [data-name="Diagram Title Patch"]{background:linear-gradient(90deg,#3d2f63 0%,#1b2a38 50%,#352c5d 100%)!important;border-color:#7d7bf0!important;}',
    R + ' [data-name="Diagram Title Patch"] p{color:#eef0fb!important;}',
    /* 레일 · 왼쪽 판 · 상세 팝업 — 흰 유리 → 그래파이트 유리(위 1px 하이라이트 · 옅은 테두리) */
    R + ' [data-name="Side Rail"] > [data-name="Body"]{background:linear-gradient(180deg,#151920 47%,rgba(21,25,32,.9) 100%)!important;border-right-color:rgba(255,255,255,.06)!important;}',
    R + ' [data-name^="Panel/"]:not([data-name="Panel/File Open"]),' + R + ' [data-name="Popup/Detail"]{box-shadow:inset 1px 0 0 rgba(255,255,255,.04),0 12px 30px rgba(0,0,0,.35);}',
    /* 레일 단추 — 흰 원판이 그래파이트가 되니 테두리를 조금 살린다 */
    R + ' [data-name="Icon Button"]{box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}'
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
