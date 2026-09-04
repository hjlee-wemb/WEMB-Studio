/* 한진 SMART 통합관제 — 라이트 테마 파생표
   원본 시안이 다크라, 여기서는 '라이트'를 만든다(형상·좌표는 한 줄도 건드리지 않고 색만 다시 적는다).
   · 역할별(글자 / 면 / 선 / 그림자)로 표를 따로 둔다 — 같은 #fff 라도 '표의 행 배경'과
     '컬러 배지 위의 글자'는 다른 색으로 가야 하기 때문.
   · 브랜드·경보·차트 계열색(파랑 #2861ff, 주황 #f38f05, 초록 #44d1a8, 분홍 #f43679 …)은 그대로 둔다.
   · 표에 없는 색은 autoLight() 가 처리한다 — 무채색은 명도를 뒤집고, 유채색은 역할에 맞는 명도로 옮긴다.
   생성기 conv.js 가 같은 순회에서 이 표를 돌려 `.hjX-root[data-theme="light"] .nXXXX{…}` 오버라이드를 뽑는다. */
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
    return out(fromHsl({ h: 218, s: 0.10, l: nl, a: h.a }));
  }
  if (role === 'text') return h.l > 0.45 ? out(fromHsl({ h: h.h, s: Math.min(0.95, h.s), l: 0.34, a: h.a })) : null;
  if (role === 'border') return h.l > 0.5 ? out(fromHsl({ h: h.h, s: h.s * 0.8, l: 0.62, a: h.a })) : null;
  return null;                                        /* 면의 브랜드색은 그대로 둔다 */
}

/* ── 역할별 대응표 ──────────────────────────────────────────── */

/* 글자 — 라이트에서 4.5:1 이상 나오도록 명도를 잡았다(밝은 면 기준) */
const TEXT = {
  '#fff': '#141a28', '#ffffff': '#141a28', '#fefefe': '#1b2231', '#f8f8f8': '#1b2231',
  '#ebebeb': '#333c4d', '#ddd': '#3b4455', '#ccc': '#3f4859', '#cfcfcf': '#3f4859',
  '#c7c7c7': '#454e5f', '#bbb': '#4b5465', '#a4a4a4': '#565f6f', '#a0a0a2': '#565f6f',
  '#929292': '#5b6472', '#666669': '#6d7684', '#98a6c0': '#54617c', '#9aa9cb': '#525e79',
  '#aebfd1': '#3f4c5b', '#b3d3ea': '#1f5e7d', '#dcecf7': '#1d5169',
  '#ffe507': '#8a6a00', '#46cbff': '#00658f', '#00aaef': '#00688f', '#4cb5ff': '#005fa6',
  '#4b93ff': '#1a4fbb', '#6f89ff': '#2b40b8', '#6a36ff': '#4c22bd', '#e4575a': '#b62327',
  '#fc9126': '#a35400', '#e3af31': '#7d5c00', '#6ef5ae': '#07784a',
  '#e7ebff': '#2a3766', '#ced7ff': '#2a3766', '#c6d4fa': '#2a3766', '#bac1fa': '#333c78',
  '#5b68bb': '#3b48a4', '#69789f': '#465471',
  'rgba(255,255,255,0.5)': 'rgba(20,26,40,0.55)',
};

/* 면 — 어두운 판을 밝은 판으로. 채도 있는 브랜드/상태색은 건드리지 않는다. */
const BG = {
  '#05050a': '#e9edf5', '#0a0a14': '#eef1f7', '#000': '#ffffff', '#000000': '#ffffff',
  '#10121b': '#f6f8fc', '#11141c': '#f6f8fc', '#0d1423': '#f4f7fc', '#06152e': '#eaf0fa',
  '#1a1e2b': '#ffffff', '#1b1f26': '#f7f9fc', '#161a21': '#f4f6fb', '#222737': '#eef1f8',
  '#232936': '#eef1f8', '#313243': '#e9ecf4', '#2f364b': '#e2e7f1', '#414a64': '#dbe1ee',
  '#343b54': '#dfe4f0', '#2d4395': '#c3d0f0', '#5b6fa5': '#c9d3ea', '#3d4453': '#e4e8f0',
  'rgba(27,31,38,0.8)': 'rgba(255,255,255,0.88)', 'rgba(27,31,38,0.9)': 'rgba(255,255,255,0.92)',
  'rgba(27,31,38,0)': 'rgba(255,255,255,0)',
  'rgba(23,26,32,0.6)': 'rgba(255,255,255,0.72)', 'rgba(25,28,35,0.5)': 'rgba(255,255,255,0.66)',
  'rgba(5,5,10,0.5)': 'rgba(255,255,255,0.62)', 'rgb(5, 5, 10)': '#e9edf5',
  'rgba(0,0,0,0.85)': 'rgba(255,255,255,0.9)', 'rgba(0,0,0,0.8)': 'rgba(255,255,255,0.86)',
  'rgba(46,53,75,0.9)': 'rgba(226,231,241,0.92)', 'rgba(47,54,75,0.4)': 'rgba(226,231,241,0.55)',
  'rgba(64, 73, 102, 0.8)': 'rgba(214,222,238,0.85)', 'rgb(52, 59, 84)': '#d6deee',
  'rgba(6, 21, 46, 0.8)': 'rgba(226,234,247,0.85)',
  'rgba(255,255,255,0.4)': 'rgba(23,32,52,0.2)',                    /* 표 칸 구분선 */
  'rgba(251, 251, 251, 0.119)': 'rgba(23,32,52,0.09)', 'rgba(251, 251, 251, 0.075)': 'rgba(23,32,52,0.06)',
  'rgba(249, 250, 251, 0)': 'rgba(23,32,52,0)',
  'rgba(207,226,255,0.5)': 'rgba(40,97,255,0.16)', 'rgba(207,226,255,0.15)': 'rgba(40,97,255,0.06)',
  'rgba(255,227,237,0.5)': 'rgba(244,54,121,0.16)', 'rgba(255,217,230,0.15)': 'rgba(244,54,121,0.06)',
  'rgba(243,224,198,0.5)': 'rgba(243,143,5,0.16)', 'rgba(243,224,198,0.15)': 'rgba(243,143,5,0.06)',
  'rgba(107,131,199,0.2)': 'rgba(60,90,170,0.14)', 'rgba(107,131,199,0.4)': 'rgba(60,90,170,0.22)',
  'rgba(108,108,131,0.4)': 'rgba(110,120,150,0.24)',
  'rgba(33,74,117,0.3)': 'rgba(40,97,255,0.16)', 'rgba(33,74,117,0.2)': 'rgba(40,97,255,0.1)',
  'rgba(0,84,169,0.3)': 'rgba(40,97,255,0.18)',
  /* 패널 가장자리 유리 하이라이트 — 흰빛을 어두운 테두리빛으로 바꾼다(같은 위치, 반대 방향) */
  'rgba(137, 150, 173, 0)': 'rgba(70,95,140,0)', 'rgba(137, 150, 173, 0.063)': 'rgba(70,95,140,0.05)',
  'rgba(137, 150, 173, 0.192)': 'rgba(70,95,140,0.14)', 'rgba(137, 150, 173, 0.2)': 'rgba(70,95,140,0.15)',
  'rgba(137, 150, 173, 0.6)': 'rgba(70,95,140,0.4)',
  /* 회색 도크 막대(예비/사용불가) — 밝은 바탕에서 묻히지 않게 */
  'rgba(99, 108, 129, 0.302)': 'rgba(108,120,150,0.34)', 'rgba(99, 108, 129, 0.988)': 'rgba(96,108,138,0.98)',
  'rgb(99, 108, 129)': '#606c8a', 'rgba(99,108,129,0.9)': 'rgba(96,108,138,0.9)',
  'rgba(24, 54, 95, 0.902)': 'rgba(214,226,246,0.92)', 'rgba(24, 54, 95, 0.863)': 'rgba(214,226,246,0.88)',
  'rgba(40, 69, 121, 0.859)': 'rgba(206,220,244,0.88)', 'rgba(40, 69, 121, 0.902)': 'rgba(206,220,244,0.92)',
  'rgba(80, 155, 251, 0)': 'rgba(80,155,251,0)',
};

/* 선 — 어두운 회색 테두리를 밝은 회색으로. 강조 테두리(파랑)는 유지. */
const BORDER = {
  '#565e71': '#c4ccdc', '#727c95': '#b4bdd0', '#444c62': '#ccd3e2', '#555b6d': '#c7cedd',
  '#6c7688': '#b9c2d4', '#3f4656': '#d1d7e4', '#343b54': '#cdd6e8', '#3d4453': '#d3d9e6',
  '#707070': '#bac0cb', '#51596f': '#c5ccdb', '#6c6c83': '#bdc0d0', '#515966': '#c3c9d4',
  '#05050a': '#d7dce6', '#232936': '#d9dfea',
  '#8da3bc': '#7b8ea9', '#98a6bf': '#8290ab', '#9edaec': '#3f9fb8', '#bcd7ff': '#6b93da',
  '#afbfe6': '#8093c1', '#5b6fa5': '#8f9dc2',
  'rgba(132,152,186,0.5)': 'rgba(88,108,148,0.35)', 'rgba(108,118,136,0.6)': 'rgba(122,134,160,0.45)',
  'rgba(108,108,131,0.3)': 'rgba(118,126,152,0.32)', 'rgba(155,196,252,0.2)': 'rgba(58,98,190,0.24)',
  'rgba(137,168,255,0.5)': 'rgba(58,98,210,0.42)',
  'rgba(19,23,53,0.5)': 'rgba(226,232,245,0.72)',      /* 도넛 가운데 원의 바깥 링 — 밝은 판을 덮는다 */
  '#ffbbb9': '#e08a86', '#f3d8b3': '#d3ab6c',
};

/* 그림자·글로우 — 어두운 바탕 전제의 강한 빛을 라이트에서 은은하게 */
const SHADOW = {
  '#2e60fa': 'rgba(46,96,250,0.28)', 'rgba(69,117,255,0.5)': 'rgba(69,117,255,0.3)',
  'rgba(1,53,201,0.7)': 'rgba(1,53,201,0.35)', '#003ce5': 'rgba(0,60,229,0.35)',
  'rgba(106,242,244,0.5)': 'rgba(20,160,180,0.35)',
};

const ROLE = (prop) => prop === 'color' || prop === '-webkit-text-fill-color' ? 'text'
  : /shadow/.test(prop) ? 'shadow'
    : /^border-.*color$|^border-color$|^outline-color$/.test(prop) ? 'border'
      : /^background|^mask|^fill$/.test(prop) ? 'bg' : null;

const TABLE = { text: TEXT, bg: BG, border: BORDER, shadow: SHADOW };
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

/* 값 하나를 라이트로 옮긴다. 바뀐 게 없으면 null(오버라이드를 만들지 않는다). */
function mapValue(value, role) {
  let changed = false;
  const v = value.replace(COLOR_RE, (c) => {
    const t = TABLE[role];
    const key = c.trim();
    let n = t[key] || t[key.toLowerCase()];
    if (n === undefined) n = autoLight(key, role);
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

/* 표로 담기지 않는 것 — 에셋 사본 갈아 끼우기, 바탕 사진 처리 */
const VARIANTS = require('./light-assets.json');   /* 원본.svg → 원본-lt.svg (mk-light-assets.js 가 만든다) */
function lightExtra(PX) {
  const R = '.' + PX + '-root[data-theme="light"]';
  const rules = [
    /* 루트 바탕 */
    R + '{background:#e9edf5;color:#141a28;}',
    /* 별자리 배경(base.png)은 밤하늘 사진이라 라이트에선 옅은 하늘빛으로 뒤집어 깐다 */
    R + ' img[src$="/base.png"]{opacity:0.18;filter:invert(1) hue-rotate(185deg) saturate(0.45) brightness(1.06);}',
    /* 3D 건물 렌더는 야경 사진이라 그대로 두되, 밝은 바탕과 어울리게 살짝 밝힌다 */
    R + ' img[src$="/building-image.png"]{filter:brightness(1.1) contrast(0.97) saturate(1.02);}',
  ];
  /* 어두운 바탕 전제로 그려진 벡터는 색만 옮긴 사본으로 갈아 끼운다.
     img 의 src 는 CSS 로 못 바꾸지만 `content:url()` 은 그린 결과를 바꾼다(레이아웃은 그대로). */
  const lines = [];
  for (const [orig, lt] of Object.entries(VARIANTS)) {
    lines.push(R + ' img[src$="/' + orig + '"]{content:url("{{B}}' + lt + '");}');
  }
  rules.push('/* 라이트 전용 에셋 사본 ' + lines.length + '개 — 생성기 _gen/mk-light-assets.js */');
  return rules.concat(lines);
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

module.exports = { lightDecl, lightRing, lightExtra, surfaceLuma };
