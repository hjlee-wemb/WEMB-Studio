/* 이천 FMS 두 화면(메인 Screen/FMS Hub · 항온항습기 상세 Screen/HVAC Detail)에서 실제로 쓰인
   에셋을 전부 훑어 스튜디오 '에셋 라이브러리' 등록 목록(src/icheon-assets.js)을 만든다.

   원칙
   - 그림은 새로 그리지 않는다. Figma 가 내보낸 원본 파일(src/skhynix-hub/*, src/skhynix-hvac/*)을
     그대로 참조한다(복사도 안 한다). 라이브러리는 <img src> 로 그 파일을 그린다.
   - 분류·이름은 Figma 레이어명과 그 부모 사슬에서 뽑는다. 내비 심볼은 화면에 찍힌 한글 라벨을 그대로 쓴다.
   - 같은 내용(md5)이 두 화면에 겹치면 한 번만 등록한다.
   - '패널'은 원본에 파일이 없다(CSS 로 그린 빈 컨테이너) → 화면 CSS 의 실제 값(면색·테두리·radius·그림자)을
     그대로 옮긴 SVG 를 이 폴더에 만들어 등록한다. 값은 아래 PANELS 에 출처 노드까지 적어 뒀다.

   사용법:  node src/icheon-assets/_gen/mk-assets.js
*/
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT_DIR = path.join(ROOT, 'src', 'icheon-assets');

global.window = {};
require(path.join(ROOT, 'src', 'skhynix-hub.js'));
require(path.join(ROOT, 'src', 'skhynix-hvac.js'));

/* ── 1) 두 화면에서 <img> 를 전부 훑어 파일 → (레이어명, 부모 사슬, 라벨) 로 모은다 ── */
const screens = [
  { key: 'hub', dir: 'src/skhynix-hub/', html: window.buildSkhynixHub('A/') },
  { key: 'hvac', dir: 'src/skhynix-hvac/', html: window.buildSkhynixHvac('A/') },
];
const found = new Map();                    /* screen|file → {…} */
screens.forEach((s) => {
  const lines = s.html.split('\n');
  const indent = (l) => (l.match(/^\s*/) || [''])[0].length;
  for (let i = 0; i < lines.length; i++) {
    const im = lines[i].match(/<img [^>]*src="A\/([\w.-]+)"/);
    if (!im) continue;
    /* 이 이미지를 감싼 가장 가까운 '이름 있는' 레이어와 그 위 조상들 */
    let nm = '', nid = '', ctx = [], d = indent(lines[i]);
    for (let j = i; j >= 0; j--) {
      if (indent(lines[j]) >= d && j !== i) continue;
      const m = lines[j].match(/data-name="([^"]*)" data-node-id="([^"]*)"/);
      if (j !== i) d = indent(lines[j]);
      if (!m) continue;
      if (!nm) { nm = m[1]; nid = m[2]; } else ctx.push(m[1]);
      if (ctx.length >= 3) break;
    }
    /* 화면에 찍힌 한글 라벨이 가장 정확한 이름이다 — 이 이미지를 감싼 'Nav Item/…' 블록을 정확히
       찾아 그 안의 첫 <p> 를 읽는다. 메인은 Label 이 Visual 뒤에, 상세(Toolbar)는 앞에 오므로
       '블록의 시작줄 ~ 들여쓰기가 되돌아오는 줄'로 범위를 잡아야 이웃 블록의 글자를 잘못 집지 않는다. */
    let label = '';
    for (let j = i; j >= 0; j--) {
      const m = lines[j].match(/data-name="(Nav Item\/[^"]*)"/);
      if (!m) continue;
      const base = indent(lines[j]);
      for (let k = j + 1; k < lines.length && indent(lines[k]) > base; k++) {
        const t = lines[k].match(/<p [^>]*>([^<]+)<\/p>/);
        if (t) { label = t[1].trim(); break; }
      }
      break;
    }
    const key = s.key + '|' + im[1];
    /* 파일명은 Figma 가 레이어명에서 만든 것이라 '이 이미지가 무엇인지'의 가장 정확한 힌트다.
       래퍼가 이름 없는 <div> 이면 위 순회가 엉뚱한 조상 이름(예: 'Bar Chart')을 집으므로,
       아는 종류면 파일명 쪽을 먼저 믿는다. */
    {
      const b = im[1].replace(/-?\d*\.\w+$/, '');
      const FILE_KIND = {
        divider: 'Divider', 'grid-line': 'Grid Line', line: 'Line', 'leader-lines': 'Leader Lines',
        marker: 'Marker', 'mini-chart': 'Mini Chart', 'line-series': 'Line Series', shadow: 'Shadow', ring: 'Ring',
      };
      if (FILE_KIND[b]) nm = FILE_KIND[b];
      else if (!nm && ctx.length) nm = ctx.shift();
    }
    if (found.has(key)) continue;
    const file = path.join(ROOT, s.dir, im[1]);
    let size = 0, hash = '';
    try { const b = fs.readFileSync(file); size = b.length; hash = crypto.createHash('md5').update(b).digest('hex'); } catch (e) { continue; }
    found.set(key, { screen: s.key, src: s.dir + im[1], file: im[1], name: nm, nid, ctx: ctx.join(' < '), label, size, hash });
  }
});

/* ── 2) 분류 — Figma 레이어명과 부모 사슬로 판정(파일명이 아니라) ── */
const CHART_NAMES = new Set(['Arc', 'Needle', 'Lines', 'Line Series', 'Chart01', 'Chart02', 'Chart03',
  'Mini Chart', 'Grid Line', 'Line', 'Leader Lines', 'Marker', 'Point', 'Pointer', 'Bubble', 'Divider']);
const DECOR_NAMES = new Set(['Base', 'Overlay', 'Glow', 'Glow Group', 'Floor Glow', 'Particle', 'Group', 'Header', 'Hero Image']);
function classify(a) {
  if (a.name === 'Visual' && /Nav Item/.test(a.ctx)) return 'symbol';
  if (DECOR_NAMES.has(a.name)) return 'symbol';               /* 배경·장식 그래픽 */
  if (/^Icon/.test(a.name) || a.name === 'logo' || a.name === 'Radio'
    || a.name === 'Status Dot' || a.name === 'Dot' || a.name === 'Ring'
    || a.name === 'Shadow' || a.name === 'Background') return 'icon';
  if (CHART_NAMES.has(a.name)) return 'chart';
  return 'icon';
}

/* 색이 곧 의미인 에셋(등급 점·계열선·링)은 파일에서 대표 색을 읽어 이름을 붙인다.
   같은 색이면 크기만 다른 중복이므로 이름이 같아지고, 아래 중복 제거에서 하나만 남는다. */
function mainColor(src) {
  try {
    const t = fs.readFileSync(path.join(ROOT, src), 'utf8');
    const m = t.match(/(?:stroke|fill)="(#[0-9A-Fa-f]{6})"/g) || [];
    for (const x of m) {
      const c = x.slice(x.indexOf('#')).replace('"', '').toUpperCase();
      if (c !== '#FFFFFF' && c !== '#DEE1E5' && c !== '#CDCBD4' && c !== '#F9F8F8') return c;
    }
  } catch (e) {}
  return '';
}
const SEM = { '#F43030': '위험', '#F68108': '중대', '#F2C204': '경미', '#2FC0EF': '주의', '#50A9FF': '정보' };
const HUE = { '#9773EC': '보라', '#FF698E': '분홍', '#F9BC05': '노랑', '#F8BB08': '노랑', '#7D7C7D': '회색', '#2CC7A8': '초록' };
const SERIES = { '#FF698E': '금일', '#7D7C7D': '전일' };

/* ── 3) 이름(한글) — 레이어명 + 부모 사슬로 사람이 알아볼 수 있게 ── */
const KO = {
  'Icon/Widget/Power': '전력 아이콘', 'Icon/Widget/Saturation': '포화도 아이콘', 'Icon/Widget/Temperature': '온도 아이콘',
  'Icon/Trend/Up': '상승 화살표', 'Icon/Trend/Down': '하강 화살표', 'Icon/Action/Collapse': '접기 화살표',
  'Icon/Callout/Operation': '운전상태 아이콘', 'Icon/Callout/Humidity': '습도 아이콘', 'Icon/Callout/Temperature': '온도계 아이콘',
  'logo': 'SK하이닉스 로고', 'Radio': '라디오 버튼', 'Ring': '배지 링', 'Shadow': '배지 그림자', 'Background': '배지 배경',
  'Needle': '게이지 바늘', 'Lines': '꺾은선 4계열', 'Line Series': '꺾은선 계열', 'Mini Chart': '미니 막대차트',
  'Grid Line': '눈금선', 'Line': '구분선', 'Leader Lines': '유도선', 'Marker': '범례 마커', 'Point': '데이터 점',
  'Pointer': '툴팁 꼬리', 'Bubble': '툴팁 꼬리', 'Divider': '구분선',
  'Base': '바탕', 'Overlay': '보케 오버레이', 'Glow': '빛무리', 'Glow Group': '빛무리', 'Floor Glow': '바닥 기류',
  'Particle': '파티클', 'Group': '파티클 무리', 'Header': '헤더 메시', 'Hero Image': '3D 렌더',
  'Chart01': '포화도 링 1', 'Chart02': '포화도 링 2', 'Chart03': '포화도 링 3',
};
/* 문맥으로 갈라야 이름이 겹치지 않는 것들 */
function nameOf(a) {
  if (a.name === 'Visual' && /Nav Item/.test(a.ctx)) {
    const active = /\(Active\)/.test(a.ctx);
    return (a.label || 'Nav') + ' 심볼' + (active ? '(선택)' : '');
  }
  if (a.name === 'Icon') {                                     /* 헤더의 시계·사용자·로그아웃 */
    if (/Time/.test(a.ctx)) return '시계 아이콘';
    if (/Action/.test(a.ctx)) return a.file === 'icon-2.svg' ? '로그아웃 아이콘' : '사용자 아이콘';
    return '아이콘';
  }
  if (a.name === 'Arc') return /Gauge/.test(a.ctx) ? '게이지 눈금' : '도넛 조각';
  if (a.name === 'Status Dot' || a.name === 'Dot') {
    const c = mainColor(a.src);
    return '상태 점' + (SEM[c] ? '(' + SEM[c] + ')' : '');
  }
  if (a.name === 'Line Series' || a.name === 'Marker') {
    const c = mainColor(a.src), s2 = SERIES[c] ? '(' + SERIES[c] + ')' : '';
    return (a.name === 'Marker' ? '범례 마커' : '꺾은선 계열') + s2;
  }
  if (a.name === 'Mini Chart' || /^Chart0/.test(a.name)) {
    const c = mainColor(a.src), s2 = HUE[c] ? '(' + HUE[c] + ')' : '';
    return (a.name === 'Mini Chart' ? '미니 막대차트' : '포화도 링') + s2;
  }
  if (a.name === 'Hero Image') return a.screen === 'hub' ? '3D 데이터센터' : '3D 항온항습기';
  return KO[a.name] || a.name;
}

/* ── 4) 패널 — 원본에 파일이 없다(CSS 컨테이너). 화면 CSS 의 실제 값을 그대로 SVG 로 옮긴다 ── */
const PANELS = [
  { id: 'pan_widget', file: 'panel-widget-card.svg', name: '위젯 카드', w: 300, h: 170, r: 15,
    fill: 'rgba(242,244,247,0.9)', shadow: [0, 0, 12, 'rgba(44,19,78,0.23)'], src: '64:4188 Line Chart / 64:4240 Body' },
  { id: 'pan_metric', file: 'panel-metric-card.svg', name: '지표 카드', w: 300, h: 170, r: 14,
    fill: '#f2f4f7', shadow: [0, 0, 6, 'rgba(44,19,78,0.23)'], src: '64:3400 Body' },
  { id: 'pan_summary', file: 'panel-summary-card.svg', name: '요약 카드', w: 282, h: 110, r: [24, 6, 24, 6],
    fill: '#ffffff', shadow: [0, 0, 8, 'rgba(215,220,235,0.75)'], src: '64:3401 Summary Card' },
  { id: 'pan_glass', file: 'panel-glass-list.svg', name: '유리 목록 패널', w: 340, h: 170, r: 15,
    fill: 'rgba(255,255,255,0.1)', stroke: 4, strokeGrad: true, shadow: [0, 0, 12, 'rgba(44,19,78,0.23)'], src: '64:3894 / 64:4370 Event List' },
  { id: 'pan_measure', file: 'panel-measurement-pill.svg', name: '측정값 알약', w: 200, h: 40, r: 20,
    fill: 'rgba(249,249,249,0.9)', src: '64:4155 Measurement' },
  { id: 'pan_switch', file: 'panel-switch-pill.svg', name: '스위치 알약', w: 254, h: 37, r: 18.5,
    fill: 'rgba(255,255,255,0.7)', stroke: 2, strokeColor: '#ffffff', shadow: [0, 2, 3, 'rgba(0,0,0,0.05)'], src: '64:4120 Mode Switch' },
  { id: 'pan_label', file: 'panel-label-pill.svg', name: '라벨 알약', w: 154, h: 32, r: 16,
    fill: 'none', stroke: 1, strokeColor: '#cdcbd4', src: '64:3577 Label' },
];
function panelSvg(p) {
  const pad = 14;                                   /* 그림자가 잘리지 않게 여백을 둔다 */
  const W = p.w + pad * 2, H = p.h + pad * 2;
  const rr = Array.isArray(p.r) ? null : p.r;
  const shape = rr != null
    ? `<rect x="${pad}" y="${pad}" width="${p.w}" height="${p.h}" rx="${rr}"`
    /* 모서리마다 반지름이 다른 카드(요약 카드) — path 로 그린다 */
    : (() => {
      const [tl, tr, br, bl] = p.r, x = pad, y = pad, w = p.w, h = p.h;
      return `<path d="M${x + tl} ${y}H${x + w - tr}A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}V${y + h - br}A${br} ${br} 0 0 1 ${x + w - br} ${y + h}H${x + bl}A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}V${y + tl}A${tl} ${tl} 0 0 1 ${x + tl} ${y}Z"`;
    })();
  const fx = p.shadow ? ` filter="url(#${p.id}_sh)"` : '';
  const st = p.stroke
    ? ` stroke="${p.strokeGrad ? `url(#${p.id}_g)` : p.strokeColor}" stroke-width="${p.stroke}"`
    : '';
  const defs = [];
  if (p.shadow) {
    const [dx, dy, blur, col] = p.shadow;
    defs.push(`<filter id="${p.id}_sh" x="-40%" y="-40%" width="180%" height="180%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">`
      + `<feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur / 2}" flood-color="${col}"/></filter>`);
  }
  if (p.strokeGrad) {
    /* Event List 의 4px 테두리는 가로 그라디언트다(원본 paint) */
    defs.push(`<linearGradient id="${p.id}_g" x1="${pad}" y1="0" x2="${pad + p.w}" y2="0" gradientUnits="userSpaceOnUse">`
      + `<stop stop-color="#ffffff"/><stop offset="0.5" stop-color="#f4f4fa"/><stop offset="0.75" stop-color="#ffffff"/>`
      + `<stop offset="0.875" stop-color="#ededf3"/><stop offset="1" stop-color="#e6e6ec"/></linearGradient>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none">\n`
    + (defs.length ? '<defs>' + defs.join('') + '</defs>\n' : '')
    + `${shape} fill="${p.fill}"${st}${fx}/>\n</svg>\n`;
}

/* ── 5) 출력 ── */
fs.mkdirSync(OUT_DIR, { recursive: true });
PANELS.forEach((p) => fs.writeFileSync(path.join(OUT_DIR, p.file), panelSvg(p)));

const seen = new Set();
const cats = { charts: [], symbols: [], icons: [], panels: [] };
const KEY = { chart: 'charts', symbol: 'symbols', icon: 'icons' };
[...found.values()]
  /* 메인 화면을 먼저 — 같은 내용이 두 화면에 있으면 메인 쪽 경로로 한 번만 등록한다 */
  .sort((a, b) => (a.screen === b.screen ? a.file.localeCompare(b.file) : a.screen === 'hub' ? -1 : 1))
  .forEach((a) => {
    if (seen.has(a.hash)) return;
    seen.add(a.hash);
    const cat = classify(a);
    cats[KEY[cat]].push({
      id: (a.screen === 'hub' ? 'h_' : 'v_') + a.file.replace(/\.\w+$/, '').replace(/[^\w]/g, '_'),
      name: nameOf(a),
      fig: a.name + (a.ctx ? ' < ' + a.ctx : ''),
      src: a.src,
    });
  });
cats.panels = PANELS.map((p) => ({ id: p.id, name: p.name, fig: p.src, src: 'src/icheon-assets/' + p.file }));

/* 이름이 같으면 '크기만 다른 같은 그림'이다(두 화면에 각각 내보내진 것) → 앞의 것 하나만 남긴다.
   라이브러리에 똑같아 보이는 항목이 두 개씩 뜨는 것을 막는다. */
Object.keys(cats).forEach((k) => {
  const seenName = new Set();
  cats[k] = cats[k].filter((it) => {
    if (seenName.has(it.name)) return false;
    seenName.add(it.name);
    return true;
  });
});

const mod = [
  '/* 자동 생성물 — 이천 FMS 두 화면(Figma 64:3367 · 64:4059)에서 실제로 쓰인 에셋 목록.',
  '   그림은 Figma 원본 파일을 그대로 참조한다(src/skhynix-hub/*, src/skhynix-hvac/*).',
  "   패널만 원본에 파일이 없어 화면 CSS 값 그대로 SVG 로 옮겨 src/icheon-assets/ 에 만들어 뒀다.",
  '   생성기: src/icheon-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */',
  'window.__ICHEON_ASSETS = ' + JSON.stringify(cats, null, 1) + ';',
  '',
].join('\n');
fs.writeFileSync(path.join(ROOT, 'src', 'icheon-assets.js'), mod);

console.log('패널 SVG', PANELS.length, '개 생성 → src/icheon-assets/');
console.log('등록:', Object.keys(cats).map((k) => k + ' ' + cats[k].length).join(' · '),
  '(전체', Object.values(cats).reduce((s, a) => s + a.length, 0) + ')');
Object.keys(cats).forEach((k) => console.log('\n[' + k + ']\n  ' + cats[k].map((i) => i.name).join(' · ')));
