/* STATCOM HMI — 라이트 테마 파생표
   원본 시안이 다크라, 여기서는 '라이트'를 만든다(형상·좌표는 그대로, 색만 다시 적는다).
   역할별(글자 / 면 / 선 / 그림자) 대응표는 light-palette.js. 표에 없는 색은 autoLight() 가 처리한다.
   생성기 conv.js 가 같은 순회에서 이 표를 돌려 `.tcX-root[data-theme="light"] .nXXXX{…}` 오버라이드를 뽑는다. */
'use strict';

/* ── 색 도구 ── */
function parse(c) {
  c = c.trim();
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
  const c = (1 - Math.abs(2 * x.l - 1)) * x.s, hp = x.h / 60, m = x.l - c / 2;
  const q = c * (1 - Math.abs(hp % 2 - 1));
  const t = hp < 1 ? [c, q, 0] : hp < 2 ? [q, c, 0] : hp < 3 ? [0, c, q] : hp < 4 ? [0, q, c] : hp < 5 ? [q, 0, c] : [c, 0, q];
  return { r: (t[0] + m) * 255, g: (t[1] + m) * 255, b: (t[2] + m) * 255, a: x.a };
}

/* 표에 없는 색 — 무채색은 명도를 뒤집고, 유채색은 역할이 요구하는 명도대로 옮긴다(색상각은 유지). */
function autoLight(c, role) {
  const o = parse(c); if (!o) return null;
  const h = toHsl(o);
  if (h.s < 0.16) {                                   /* 무채색 */
    const nl = role === 'text' ? Math.max(0.08, 0.92 - h.l * 0.86)
      : role === 'border' ? Math.min(0.86, 0.98 - h.l * 0.72)
        : Math.min(0.99, 1 - h.l * 0.62);
    return out(fromHsl({ h: 218, s: 0.07, l: nl, a: h.a }));   /* POSCO — 남색 시안 */
  }
  if (role === 'text') return h.l > 0.3 ? out(fromHsl({ h: h.h, s: Math.min(0.95, h.s), l: 0.3, a: h.a })) : null;
  if (role === 'border') return h.l > 0.5 ? out(fromHsl({ h: h.h, s: h.s * 0.8, l: 0.62, a: h.a })) : null;
  /* POSCO — 아주 어두운 유채색 면·선(짙은 남색 판)은 색상각을 지킨 채 밝은 쪽으로 옮긴다.
     채도가 아주 높은 것(브랜드 파랑 #004BFF, 상태색)은 그대로 둔다 — 색이 곧 의미라서. */
  if ((role === 'bg' || role === 'border') && h.l < 0.32 && (h.s < 0.62 || h.l < 0.14)) {
    return out(fromHsl({ h: h.h, s: Math.min(0.32, h.s * 0.5), l: 0.9 - h.l * 0.5, a: h.a }));
  }
  return null;                                        /* 면의 브랜드색은 그대로 둔다 */
}

const { TEXT, BG, BORDER, SHADOW } = require('./light-palette.js');

const ROLE = (prop) => prop === 'color' || prop === '-webkit-text-fill-color' ? 'text'
  : /shadow|^filter$/.test(prop) ? 'shadow'
    : /^border-.*color$|^border-color$|^outline-color$/.test(prop) ? 'border'
      : /^background|^mask|^fill$/.test(prop) ? 'bg' : null;

const TABLE = { text: TEXT, bg: BG, border: BORDER, shadow: SHADOW };
const UNMAPPED = {};
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

/* 밝은 판 위 글자 — 옅은 칸(#f4f7fa)에서도 4.5:1 이 안 나오면 색상각을 지킨 채 어둡게 */
function lumOf(o) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(o.r) + 0.7152 * f(o.g) + 0.0722 * f(o.b); }
function darkenText(c) {
  const o = parse(c); if (!o) return c;
  const h = toHsl(o);
  let cur = { r: o.r, g: o.g, b: o.b, a: 1 }, l = h.l;
  while (lumOf(cur) > 0.16 && l > 0.05) { l -= 0.01; const x = fromHsl({ h: h.h, s: h.s, l, a: 1 }); cur = { r: x.r, g: x.g, b: x.b, a: 1 }; }
  return out({ r: cur.r, g: cur.g, b: cur.b, a: o.a < 0.75 ? Math.max(o.a, 0.9) : o.a });
}

/* 값 하나를 라이트로 옮긴다. 바뀐 게 없으면 null(오버라이드를 만들지 않는다). */
function mapValue(value, role) {
  let changed = false;
  const v = value.replace(COLOR_RE, (c) => {
    const t = TABLE[role];
    const key = c.trim().replace(/\s+/g, '');
    let n = t[key] || t[key.toLowerCase()];
    if (n === undefined) { n = autoLight(key, role); if (process.env.LIGHT_DEBUG) { const u = UNMAPPED[role] = UNMAPPED[role] || {}; u[key] = (u[key] || 0) + 1; } }
    if (role === 'text') n = darkenText(n || key);
    if (n && n !== key) { changed = true; return n; }
    return c;
  });
  return changed ? v : null;
}

/* 그라디언트·이미지가 섞인 선언(background-image 등)도 색만 갈아 끼운다 */
function lightDecl(prop, value, nid) {
  if (SKIP_NODE[nid]) return null;
  const role = ROLE(prop);
  if (!role) return null;
  if (!COLOR_RE.test(value)) return null;
  COLOR_RE.lastIndex = 0;
  return mapValue(value, role);
}

/* ::after 링의 border 축약값(`1px solid #565e71`) */
function lightRing(shorthand) {
  return mapValue(shorthand, 'border');
}

/* 색을 바꾸지 않을 노드 — 컬러 배지·상태 칩처럼 원본 색이 곧 의미인 것들 */
const SKIP_NODE = {};

/* 표로 담기지 않는 것 — 그림 사본 갈아 끼우기(원본 → -lt.svg · -lt.jpg, mk-light-statcom.js 가 만든다).
   img 의 src 는 CSS 로 못 바꾸지만 `content:url()` 은 그린 결과를 바꾼다(레이아웃은 그대로). */
const VARIANTS = require('./light-assets.json');
function lightExtra(PX) {
  const R = '.' + PX + '-root[data-theme="light"]';
  const rules = [R + ':not(.hj-asset){background:#eef3f7;}', R + '{color:#15253a;}'];
  for (const [orig, lt] of Object.entries(VARIANTS)) {
    rules.push(R + ' img[src$="/' + orig + '"]{content:url("{{B}}' + lt + '");}');
  }
  return rules;
}

/* 라이트로 옮긴 뒤의 '면 밝기'. 그 위에 놓인 글자를 어둡게 할지(밝은 판) 흰색으로 둘지(컬러 배지) 가른다.
   반투명은 흰 바탕에 얹어 계산하고, 그라디언트는 정지색 평균으로 본다. 배경이 없으면 null(부모를 따른다). */
function surfaceLuma(decls) {
  const vals = decls.filter(([p]) => p === 'background-color' || p === 'background-image' || p === 'background').map((x) => x[1]);
  if (!vals.length) return null;
  const cols = [];
  for (const v of vals) {
    const mapped = mapValue(v, 'bg') || v;
    for (const c of mapped.match(COLOR_RE) || []) {
      const o = parse(c);
      if (o && o.a > 0.05) cols.push(o);
    }
  }
  if (!cols.length) return null;
  /* 그라디언트는 '가장 밝은 정지색' 을 본다 — 글자가 옅은 쪽에 놓이면 흰 글자가 사라지기 때문.
     (도크 막대는 아래가 진하고 위가 30% 라, 평균으로 보면 흰 글자를 남겨 두게 되어 위쪽에서 안 보였다) */
  let L = 0;
  for (const o of cols) {                       /* 흰 바탕에 얹은 결과 */
    const r = o.r * o.a + 255 * (1 - o.a), g = o.g * o.a + 255 * (1 - o.a), b = o.b * o.a + 255 * (1 - o.a);
    const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    L = Math.max(L, 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b));
  }
  return L;
}

module.exports = { lightDecl, lightRing, lightExtra, surfaceLuma, UNMAPPED };
