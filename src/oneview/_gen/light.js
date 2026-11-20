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
  /* 아주 옅은 선(연분홍 · 연하늘 흰 테두리) → 중성 회청 선 — 같은 색상각으로 어둡게 하면 갈색 · 탁한 분홍이 됐다 */
  if (role === 'border' && h.l > 0.82 && h.s < 0.5) return out({ r: 200, g: 213, b: 230, a: h.a });
  if (role === 'border') return h.l > 0.5 ? out(fromHsl({ h: h.h, s: h.s * 0.8, l: 0.62, a: h.a })) : null;
  /* POSCO — 아주 어두운 유채색 면·선(짙은 남색 판)은 색상각을 지킨 채 밝은 쪽으로 옮긴다.
     채도가 아주 높은 것(브랜드 파랑 #004BFF, 상태색)은 그대로 둔다 — 색이 곧 의미라서. */
  /* 원뷰 — 남색 · 보라 판(색상각 190~290°)과 중간 회청 판은 채도와 상관없이 밝은 면으로(제목 띠 · 값 알약이 짙게 남아 글자가 묻혔다) */
  /* 11-20 — 연보라 · 회청으로 뭉치지 않게 색상각을 차가운 중성(214°)으로 모으고 채도를 낮춘다.
     아주 짙은 면(l < .16) = 흰 판, 그보다 옅은 판 · 칸 = #f3f6fa ~ #e9eef6, 반투명 줄무늬는 같은 비율로 */
  if (role === 'bg' && ((h.h >= 190 && h.h <= 290 && h.l < 0.42) || (h.s < 0.45 && h.l < 0.62))) {
    const nl = h.l < 0.16 ? 1 : Math.max(0.915, 0.985 - (h.l - 0.16) * 0.22);
    return out(fromHsl({ h: 214, s: nl >= 1 ? 0 : 0.32, l: nl, a: h.a < 1 ? Math.min(1, h.a + 0.35) : 1 }));
  }
  if ((role === 'bg' || role === 'border') && h.l < 0.32 && (h.s < 0.86 || h.l < 0.14)) {
    return out(fromHsl({ h: h.h, s: Math.min(0.3, h.s * 0.45), l: role === 'bg' ? 0.965 - h.l * 0.14 : 0.9 - h.l * 0.5, a: h.a }));
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
  while (lumOf(cur) > 0.12 && l > 0.05) { l -= 0.01; const x = fromHsl({ h: h.h, s: h.s, l, a: 1 }); cur = { r: x.r, g: x.g, b: x.b, a: 1 }; }
  return out({ r: cur.r, g: cur.g, b: cur.b, a: o.a < 0.75 ? Math.max(o.a, 0.9) : o.a });
}

/* 라이트 그림자 · 빛 — 흰 판 위에서는 그림자가 아주 옅어야 자연스럽다.
   · 흰 · 아주 밝은 빛(반사)은 그대로
   · 무채 · 짙은 그림자 → 옅은 남색(30,60,100), 알파 ×0.22 (최소 .03 · 최대 .12)
   · 색 있는 빛(하늘 · 파랑 · 보라 글로우) → 같은 색상각의 중간 밝기, 알파 ×0.3 (최대 .22) */
function shadowLight(c) {
  const o = parse(c); if (!o) return undefined;
  if (o.a < 0.05) return undefined;
  const h = toHsl(o);
  if (h.l > 0.9) return undefined;
  if (h.s < 0.25 || h.l < 0.3) return out({ r: 30, g: 60, b: 100, a: Math.min(0.12, Math.max(0.03, o.a * 0.22)) });
  const x = fromHsl({ h: h.h, s: Math.min(0.8, h.s), l: 0.55, a: Math.min(0.22, Math.max(0.04, o.a * 0.3)) });
  return out(x);
}

/* 값 하나를 라이트로 옮긴다. 바뀐 게 없으면 null(오버라이드를 만들지 않는다). */
function mapValue(value, role) {
  let changed = false;
  const v = value.replace(COLOR_RE, (c) => {
    const t = TABLE[role];
    const key = c.trim().replace(/\s+/g, '');
    let n = t[key] || t[key.toLowerCase()];
    /* 그림자 · 빛은 표를 거치지 않고 shadowLight 로 — 다크 세기(알파 .3~.8)가 흰 판에서 진한 얼룩이 됐다(11-20 사용자 지적) */
    if (role === 'shadow') { n = shadowLight(key); if (n === undefined) n = key; }   /* 흰 반사광은 그대로(예전 자동 규칙이 회색 .7 그림자로 바꿨다) */
    if (n === undefined) { n = autoLight(key, role); if (process.env.LIGHT_DEBUG) { const u = UNMAPPED[role] = UNMAPPED[role] || {}; u[key] = (u[key] || 0) + 1; } }
    if (role === 'text') n = darkenText(n || key);
    if (n && n !== key) { changed = true; return n; }
    return c;
  });
  let v2 = v;
  if (role === 'bg') {
    /* 탭 · 카드 머리의 사선 줄무늬(멈춤점 두 개가 같은 % 인 칼날 그라디언트) — 어두운 판에서는 은은한 반사였지만
       흰 판에서는 회색 얼룩이라 라이트에서는 지운다. 남보라로 흐르던 탭 바탕은 같은 파랑의 옅은 단색 흐름으로 */
    v2 = v2.replace(/linear-gradient\([^()]*(?:\([^()]*\)[^()]*)*\)/g, (g) => {
      const pcts = g.match(/\s(\d+(?:\.\d+)?)%/g) || [];
      if (pcts.length === 2 && pcts[0].trim() === pcts[1].trim() && !/0%$/.test(pcts[0].trim())) return 'linear-gradient(transparent,transparent)';
      return g;
    });
    v2 = v2.replace(/rgba\(46, ?134, ?252, ?0\.1\) 0%, ?rgba\([^)]*\) 100%/g, 'rgba(46,134,252,0.11) 0%, rgba(46,134,252,0.05) 100%');
    if (v2 !== value) changed = true;
  }
  return changed ? v2 : null;
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
function lightRing(shorthand, thick) {
  if (thick) {
    const v = shorthand.replace(COLOR_RE, (c) => { const o = parse(c); if (!o) return c; const h = toHsl(o); return h.s > 0.4 ? out(fromHsl({ h: h.h, s: 0.7, l: 0.82, a: o.a })) : c; });
    if (v !== shorthand) return v;
  }
  return mapValue(shorthand, 'border');
}

/* 색을 바꾸지 않을 노드 — 컬러 배지·상태 칩처럼 원본 색이 곧 의미인 것들 */
const SKIP_NODE = {};

/* 표로 담기지 않는 것 — 그림 사본 갈아 끼우기(원본 → -lt.svg · -lt.jpg, mk-light-statcom.js 가 만든다).
   img 의 src 는 CSS 로 못 바꾸지만 `content:url()` 은 그린 결과를 바꾼다(레이아웃은 그대로). */
const VARIANTS = require('./light-assets.json');
function lightExtra(PX) {
  const R = '.' + PX + '-root[data-theme="light"]';
  /* 화면 판 색은 에셋 라이브러리 썸네일(.hj-asset)에 깔리지 않게 — 썸네일 바탕은 투명이어야 한다 */
  const rules = [R + ':not(.hj-asset){background:#eef3f7;}', R + '{color:#15253a;}',
    /* 헤더 제목 · 시계 — 원본은 옅은 하늘색 그라디언트 글자(text-clip)라 흰 바탕에서 사라진다 → 같은 방향의 짙은 파랑 그라디언트 */
    R + ' [data-name="Logo Group"] [data-name="Title"]{background-image:linear-gradient(to right,#1d4fc4,#3a7ee6)!important;}',
    R + ' [data-name="Clock"] [data-name="Time"]{background-image:linear-gradient(to top,#173f9e,#2e72dc 86.843%)!important;}',
    /* 3D 바닥 · 장식 그림(짙은 타원 PNG) — 흰 바탕에서 검은 웅덩이처럼 보여 위 라벨이 묻혔다 → 밝고 옅게 */
    /* 11-20 다시 — 밝기를 올린 원판이 분홍 · 보라 비눗방울로, 바닥 띠가 회색 웅덩이로 보였다.
       원판(구) = 원래 색 그대로 아주 옅게, 바닥 띠 = 거의 안 보이게, 빛줄기 = 반쯤 */
    R + ' [data-name="Symbol"] > [data-name="Shape"] img{opacity:.32;filter:saturate(.7);}',
    /* KPI 배지(Badge) — 원래 육각 그림 그대로(색만 바꾼 사본, mk-light-oneview.js BADGE), 글자색만 그 강조색의 진한 색 */
    ...[['background-4', '#04536b'], ['background-5', '#6b3361'], ['background-6', '#6e4a07'], ['background-7', '#195429']].map(([f, tx]) => R + ' [data-name="Badge"]:has(img[src$="/' + f + '.svg"]) p{color:' + tx + '!important;}'),
    R + ' :is([data-name="Floor Layer"],[data-name="Floor"] > [data-name="Part"]) > *{opacity:.18;}',
    R + ' [data-name="Floor"] img{opacity:.25;}',
    R + ' [data-name="Effect"] > * > *,' + R + ' [data-name="Effect"] img{opacity:.45;}',
    /* 파란 단추(Stop · Own · Ack · 선택)는 라이트에서도 원본 파란 판 + 흰 글자 */
    R + ' :is([data-name="Button/Stop"],[data-name="Button/Own"],[data-name="Button/Ack"],[data-name="Button/Select"]) img{content:normal!important;}',
    R + ' :is([data-name="Button/Stop"],[data-name="Button/Own"],[data-name="Button/Ack"],[data-name="Button/Select"]) p{color:#fff!important;}',
    R + ' [data-name="Button/Stop"]{background:#1668d4!important;}', R + ' [data-name="Button/Own"]{background:#2d6bd6!important;}',
    R + ' [data-name="Button/Ack"]{background:#24489f!important;}', R + ' [data-name="Button/Select"]{background:#1f6fd8!important;}',
    /* 3D 노드 라벨 — 짙은 바닥 위라 라이트에서 남색 글자가 묻힌다 → 흰 테두리 빛 */
  ];
  /* 사본을 다시 만들면 같은 이름이라 브라우저가 옛 그림을 쥐고 있다 → 파일 수정 시각을 ?v 로 붙인다 */
  const fs = require('fs'), path = require('path');
  for (const [orig, lt] of Object.entries(VARIANTS)) {
    let v = '';
    try { v = '?v=' + Math.round(fs.statSync(path.join(__dirname, '..', lt)).mtimeMs / 1000).toString(36); } catch (e) { }
    rules.push(R + ' img[src$="/' + orig + '"]{content:url("{{B}}' + lt + v + '");}');
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
