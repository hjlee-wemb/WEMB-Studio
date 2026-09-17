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
    return out(fromHsl({ h: 218, s: 0.07, l: nl, a: h.a }));   /* POSCO — 남색 시안 */
  }
  if (role === 'text') return h.l > 0.45 ? out(fromHsl({ h: h.h, s: Math.min(0.95, h.s), l: 0.34, a: h.a })) : null;
  if (role === 'border') return h.l > 0.5 ? out(fromHsl({ h: h.h, s: h.s * 0.8, l: 0.62, a: h.a })) : null;
  /* POSCO — 아주 어두운 유채색 면·선(짙은 남색 판)은 색상각을 지킨 채 밝은 쪽으로 옮긴다.
     채도가 아주 높은 것(브랜드 파랑 #004BFF, 상태색)은 그대로 둔다 — 색이 곧 의미라서. */
  if ((role === 'bg' || role === 'border') && h.l < 0.32 && h.s < 0.62) {
    return out(fromHsl({ h: h.h, s: Math.min(0.32, h.s * 0.5), l: 0.9 - h.l * 0.5, a: h.a }));
  }
  return null;                                        /* 면의 브랜드색은 그대로 둔다 */
}

/* ── 역할별 대응표 ──────────────────────────────────────────── */

/* 글자 — 라이트에서 4.5:1 이상 나오도록 명도를 잡았다(밝은 면 기준) */
const TEXT = {
  '#fff': '#10231d', '#ffffff': '#10231d', '#fbfeff': '#16281f', '#f9f9f9': '#1b2c24',
  '#f5fffd': '#18291f', '#f2f9ef': '#1e2f26', '#f1f1f1': '#20312a', '#eff9f6': '#20312a',
  '#eee': '#25362e', '#eaeaea': '#27382f', '#e9ebeb': '#26372f', '#e4e4e4': '#243530',
  '#d9efeb': '#2c443c', '#d7ede6': '#2f4840', '#d2d8d6': '#39473f',
  '#a9a9a9': '#525d59', '#a7a7a7': '#525d59', '#a5b0ad': '#4c5a55', '#9c9c9c': '#565f5c',
  '#999': '#5b6461', '#929292': '#5b6461', '#86afa1': '#3d6355', '#829291': '#4a5854',
  '#7b7b7b': '#585f5d', '#6f8c83': '#41564e', '#666': '#5f6866', '#444': '#3a4340',
  /* 강조·상태 — 밝은 판에서 읽히도록 명도만 낮춘다(색상은 유지) */
  '#5bdcc6': '#067a68', '#00c8a5': '#04785f', '#0defcb': '#06806b', '#00d8ad': '#04785f',
  '#11af8a': '#0a7a60', '#5bdcd6': '#0a7a73', '#2bdf8a': '#0a7c4c', '#0de7ef': '#067481',
  '#00cded': '#00697d', '#0de7cb': '#06806b', '#5bbadc': '#1a6a86', '#37bafa': '#0a6a9c',
  '#fa0004': '#c2000a', '#f43031': '#bb1b1c', '#f53132': '#bb1b1c', '#f6701e': '#a54a05',
  '#feb836': '#8a6100', '#f3c200': '#7d6300', '#f7ba1d': '#836100', '#fdd01f': '#7d6600',
  'rgba(255,255,255,0.5)': 'rgba(16,35,29,0.58)',
  'rgba(255,255,255,0.8)': 'rgba(16,35,29,0.82)',
  'rgba(255,255,255,0.64)': 'rgba(16,35,29,0.68)',
};

/* 면 — 어두운 판을 밝은 판으로. 채도 있는 브랜드/상태색은 건드리지 않는다. */
const BG = {
  '#051811': '#eef4f1', '#05050a': '#eef4f1', '#000': '#ffffff', '#000000': '#ffffff',
  '#151a17': '#f7faf8', '#1c1c1c': '#f5f8f6', '#222': '#f3f7f5', '#1f2621': '#f6f9f7',
  '#172d27': '#eaf3ef', '#3b4c46': '#e2ebe7', '#315851': '#dceae6', '#223331': '#e8f0ec',
  '#2a2a2a': '#f2f5f3', '#605f5f': '#cfd6d3', '#7b7b7b': '#c6cecb', '#5e5e5e': '#d2d8d6',
  'rgba(0,0,0,0.3)': 'rgba(255,255,255,0.74)', 'rgba(0,0,0,0.2)': 'rgba(255,255,255,0.66)',
  'rgba(0,0,0,0.4)': 'rgba(255,255,255,0.8)', 'rgba(0,0,0,0.5)': 'rgba(255,255,255,0.84)',
  'rgba(0,0,0,0.6)': 'rgba(255,255,255,0.88)', 'rgba(0,0,0,0.8)': 'rgba(255,255,255,0.92)',
  'rgba(0,0,0,0.85)': 'rgba(255,255,255,0.93)', 'rgba(0,0,0,0.1)': 'rgba(255,255,255,0.5)',
  'rgba(59,76,70,0.1)': 'rgba(0,72,58,0.04)', 'rgba(59,76,70,0.3)': 'rgba(0,72,58,0.07)',
  'rgba(59,76,70,0.7)': 'rgba(0,72,58,0.11)', 'rgba(59,76,70,0.5)': 'rgba(0,72,58,0.09)',
  'rgba(77,99,78,0.1)': 'rgba(0,72,40,0.05)', 'rgba(42,49,45,0.8)': 'rgba(255,255,255,0.9)',
  'rgba(32,44,40,0.8)': 'rgba(255,255,255,0.9)', 'rgba(8,33,25,0.8)': 'rgba(238,246,242,0.92)',
  'rgba(42,42,42,0.5)': 'rgba(255,255,255,0.82)',
  'rgba(226,226,228,0.2)': 'rgba(0,58,46,0.09)', 'rgba(217,217,217,0.15)': 'rgba(0,58,46,0.07)',
  'rgba(153,153,153,0.7)': 'rgba(120,134,129,0.34)', 'rgba(153,153,153,0.28)': 'rgba(120,134,129,0.22)',
  'rgba(255,255,255,0.5)': 'rgba(0,45,36,0.16)',
  'rgba(255,255,255,0.05)': 'rgba(0,45,36,0.04)', 'rgba(255,255,255,0.1)': 'rgba(0,45,36,0.06)',
  'rgba(255,255,255,0.15)': 'rgba(0,45,36,0.09)', 'rgba(255,255,255,0.2)': 'rgba(0,45,36,0.11)',
  /* 브랜드 틴트 — 밝은 판에서 같은 세기로 보이게 살짝 진하게 */
  'rgba(0,145,120,0.1)': 'rgba(0,145,120,0.1)', 'rgba(0,145,120,0.2)': 'rgba(0,145,120,0.16)',
  'rgba(0,145,120,0.3)': 'rgba(0,145,120,0.2)',
  'rgba(3,140,140,0.2)': 'rgba(3,140,140,0.16)', 'rgba(91,220,214,0.2)': 'rgba(6,140,130,0.14)',
  'rgba(42,227,255,0.2)': 'rgba(0,120,150,0.14)', 'rgba(25,136,153,0.2)': 'rgba(25,136,153,0.16)',
  'rgba(240,102,91,0.28)': 'rgba(200,60,48,0.2)', 'rgba(0,205,237,0.1)': 'rgba(0,140,165,0.1)',
  'rgba(35,77,72,0.3)': 'rgba(0,120,100,0.12)',
};

/* 선 — 어두운 회색 테두리를 밝은 회색으로. 강조 테두리(브랜드·상태)는 유지. */
const BORDER = {
  '#999': '#c3cdc9', '#7b7b7b': '#c9d1ce', '#6c726e': '#c7cfcc', '#666': '#ccd4d1',
  '#5e5e5e': '#ccd3d1', '#3a3a3a': '#d7dedb', '#566761': '#cdd7d3', '#3b4c46': '#d2dcd8',
  '#778985': '#b8c5c1', '#86afa1': '#8fb4a7', '#4d634e': '#c2d2c3', '#34605b': '#a9c8c3',
  '#223331': '#d5dedb', '#144940': '#a8ccc3', '#004e42': '#9fd0c5', '#009178': '#009178',
  'rgba(255,255,255,0.05)': 'rgba(0,45,36,0.06)', 'rgba(255,255,255,0.15)': 'rgba(0,45,36,0.13)',
  'rgba(255,255,255,0.2)': 'rgba(0,45,36,0.16)', 'rgba(255,255,255,0.3)': 'rgba(0,45,36,0.22)',
  'rgba(217,217,217,0.5)': 'rgba(0,45,36,0.2)',
};

/* 그림자·글로우 — 어두운 바탕 전제의 강한 빛을 라이트에서 은은하게 */
const SHADOW = {
  'rgba(255,255,255,0.05)': 'rgba(0,50,40,0.06)',
  'rgba(255,255,255,0.1)': 'rgba(0,50,40,0.08)',
  'rgba(255,255,255,0.2)': 'rgba(0,50,40,0.1)',
  'rgba(0,0,0,0.2)': 'rgba(12,40,32,0.12)', 'rgba(0,0,0,0.25)': 'rgba(12,40,32,0.14)',
  'rgba(0,0,0,0.3)': 'rgba(12,40,32,0.16)', 'rgba(0,0,0,0.4)': 'rgba(12,40,32,0.18)',
  'rgba(0,0,0,0.5)': 'rgba(12,40,32,0.2)', 'rgba(0,0,0,0.06)': 'rgba(12,40,32,0.06)',
  '#5bdcc6': 'rgba(6,122,104,0.3)', '#00c8a5': 'rgba(4,120,95,0.3)',
  'rgba(0,145,120,0.5)': 'rgba(0,145,120,0.28)',
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
function lightExtra(PX, textured) {
  const R = '.' + PX + '-root[data-theme="light"]';
  /* 판 텍스처(body.png)를 쓰는 자리 — 좌측 층 선택 패널 · 우측 자산정보현황 · 출입동선/자산리스트 판 …
     텍스처는 어두운 노이즈라 라이트에서 그대로 두면 판이 까맣게 남는다(글자도 함께 묻힌다).
     그림을 바꾸지 않고 **흰 막을 한 겹 덮어** 밝게 만든다(형상·자리 그대로).
     어느 노드가 그 텍스처를 쓰는지는 conv.js 가 화면을 훑으며 모아 준다 — 화면마다 다르므로
     손으로 적어 두면(예전 방식) 새 화면의 판이 까맣게 남는다. */
  const TEXTURED = (textured && textured.length ? textured : ['n17_9453', 'nI2_18449_199_6534'])
    .map((t) => (typeof t === 'string' ? { cls: t[0] === '.' ? t : '.' + t, positioned: false } : t));
  const rules = [
    R + '{background:#eef2f7;color:#0e1a2b;}',
    /* 바탕 별밭 사진은 어두운 밤하늘이다 — 색만 뒤집어 밝은 하늘로(형상 그대로) */
    R + ' [data-name="Background"] > img{filter:invert(1) hue-rotate(180deg) saturate(0.4) brightness(1.05);opacity:0.5;}',
    /* 3D 건물 렌더는 흰 건물이라 라이트에서도 그대로 두되, 바닥 반사만 살짝 눌러 준다 */
    R + ' [data-name="Building Image"] img{filter:saturate(0.92) brightness(0.98);}',
    /* 도면(출입동선·전체층·단층의 와이어프레임)은 '어두운 바닥 + 흰 선' 그림이다.
       라이트에서 그대로 두면 밝은 화면 한가운데 검은 덩어리가 남고, 그 위에 반투명 판이 겹치면
       판까지 회색으로 비친다 → 색만 뒤집어 '밝은 바닥 + 짙은 선' 으로 만든다(형상 그대로). */
    R + ' [data-name="Floor Plan"] img{filter:invert(1) hue-rotate(180deg) saturate(0.55) brightness(1.04);}',
    /* 팝업 판은 원본이 '반투명 유리'(면 opacity 0.5 · 짙은 남색)다. 어두운 바탕에서는 짙게 읽히지만
       라이트에서는 ① 뒤의 목록이 그대로 비쳐 글자가 겹치고 ② 면만 그대로 두면 짙은 판에 짙은 글자가 된다.
       → 면 위에 흰 막을 한 겹 덮는다(판 뒤 내용을 가리고 면도 밝아진다). 글자·아이콘은 Body 가
         Background 뒤에 오므로 막 위에 그대로 남는다. */
    R + ' [data-name^="Popup/"] > [data-name="Background"]::after{content:"";position:absolute;inset:0;'
      + 'border-radius:inherit;background:rgba(247,250,254,0.92);pointer-events:none;}',
  ];
  TEXTURED.forEach(function (t) {
    /* 이미 absolute 로 자리를 잡은 판에는 position 을 다시 쓰지 않는다 — 덧씌우면 자리가 무너진다 */
    if (!t.positioned) rules.push(R + ' ' + t.cls + '{position:relative;}');
    rules.push(R + ' ' + t.cls + '::before{content:"";position:absolute;inset:0;border-radius:inherit;'
      + 'background:rgba(247,250,254,0.88);pointer-events:none;z-index:0;}');
  });
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
