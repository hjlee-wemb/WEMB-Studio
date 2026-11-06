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
const NAVY = 220, NS = 0.05;

/* 손으로 정한 대응(가장 자주 쓰는 색). 키는 원본 그대로, 값은 다크. */
const TABLE = {
  text: {
    '#222': '#eceef2', '#222222': '#eceef2', '#333': '#e4e6ea', '#333333': '#e4e6ea', black: '#eceef2', '#000': '#eceef2', '#000000': '#eceef2',
    '#1f2226': '#eceef2', '#6d6e72': '#a7acb6', '#6d6e71': '#a7acb6', '#4a5568': '#ced2da', '#bababa': '#6f747e',
    '#0c4da1': '#7aa7ff', '#15345f': '#d5d9e0', '#17335c': '#d5d9e0', '#0e4da4': '#7aa7ff', '#7e7e7e': '#8d929c',
  },
  bg: {
    white: '#17191e', '#fff': '#17191e', '#ffffff': '#17191e', '#f0f4ff': '#1d2027', '#ececec': '#24272e',
    'rgba(255,255,255,0.6)': 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.2)': 'rgba(23,25,30,0.72)', 'rgba(255,255,255,0.1)': 'rgba(23,25,30,0.5)',
  },
  border: {
    '#b4b4b4': '#2d3038', '#e2e2e2': '#24272e', '#cdcdcd': '#2a2d34', '#e3e3e3': '#24272e', '#ececec': '#22252b',
    '#333': '#6b707a', '#333333': '#6b707a', white: '#2a2d35', '#fff': '#2a2d35', '#ffffff': '#2a2d35',
  },
  shadow: {},
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
  const PANEL = ['Widget/Server List', 'Widget/Equipment Status', 'Widget/Terminal', 'Widget/Status Summary'].map((n) => R + ' [data-name="' + n + '"]').join(',');
  rules.push(
    R + ' > [data-name^="Screen/"]{background:#0e0f12!important;}',
    PANEL + '{background:#17191e!important;box-shadow:0 0 0 1px rgba(255,255,255,.07),0 1px 2px rgba(0,0,0,.4),0 12px 28px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.04)!important;}',
    R + ' [data-name="Value Box"],' + R + ' [data-name="Widget/Status Summary"] [data-name^="Item/"]{background:#111316!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)!important;}',
    R + ' [data-name="Widget/Terminal"] [data-name^="Field/"]{background:rgba(255,255,255,.015)!important;}',
    R + ' [data-name^="Step="],' + R + ' > [data-name^="Screen/"] > [data-name^="GNB ("]{background:#131519!important;box-shadow:inset -1px 0 0 rgba(255,255,255,.06)!important;}',
    R + ' [data-name="Header Bar"]{background:#131519!important;box-shadow:inset 0 -1px 0 rgba(255,255,255,.06)!important;}',
    R + ' [data-name="Widget/Event Status"]{border-top-color:rgba(255,255,255,.22)!important;}',
    R + ' [data-name="Scene Image"] img,' + R + ' [data-name="Widget/3D View"] img{filter:brightness(.88);}',
    /* 요약 배너(사용자 지시 "#wnm-Summary Banner 다크에 맞게") — 라이트의 파란 판을 그래파이트 판으로:
       판은 패널과 같은 층 + 위쪽 테두리에만 브랜드 파랑 띠, 값 칸은 들어간 면 + 파란 숫자, 장비 타일은 초록을 한 톤 깊게, 받침대 · 반사광은 낮춘다 */
    R + ' [data-name="Summary Banner"]{background:linear-gradient(180deg,#1a1d23 0%,#15171c 100%)!important;box-shadow:0 0 0 1px rgba(255,255,255,.07),inset 0 2px 0 rgba(47,125,255,.85),0 12px 28px rgba(0,0,0,.32)!important;border-radius:4px;}',
    R + ' [data-name="Summary Banner"] [data-name="Value Box"]{background:#0f1115!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)!important;}',
    R + ' [data-name="Summary Banner"] [data-name="Value Box"] [data-name="Value"]{color:#8fb6ff!important;}',
    R + ' [data-name="Summary Banner"] [data-name="Value Box"] [data-name="Unit"]{color:#8d929c!important;}',
    R + ' [data-name="Summary Banner"] [data-name="Caption"]{color:#8d929c!important;}',
    R + ' [data-name="Summary Banner"] [data-name="Text Wrap"] [data-name="Label"],' + R + ' [data-name="Summary Banner"] [data-name^="Status/DU"] [data-name="Label"]{color:#eceef2!important;}',
    R + ' [data-name="Summary Banner"] [data-name^="Item/"] > [data-name="Body"]{background:linear-gradient(180deg,rgba(18,150,84,.92),rgba(10,112,62,.92))!important;box-shadow:inset 0 0 0 1px rgba(120,255,180,.22)!important;}',
    R + ' [data-name="Summary Banner"] [data-name="Highlight"] img{opacity:.35;}',
    R + ' [data-name="Summary Banner"] [data-name="Pedestal"] img{filter:brightness(.32) contrast(1.1);}',
    R + ' [data-name="Summary Banner"] [data-name^="Item/"] > [data-name="Shadow"] img{filter:brightness(0);opacity:.55;}',
    /* 통신실 렌더는 흰 바닥이 넓어 다크 바탕에서 눈이 부시다 → 한 단계 더 누른다 */
    R + ' > [data-name^="Screen/3D Comm Room"] > [data-name="Scene Image"] img{filter:brightness(.74);}'
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
