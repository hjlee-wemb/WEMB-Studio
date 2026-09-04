/* 이천 FMS 두 화면(메인 Screen/FMS Hub · 항온항습기 상세 Screen/HVAC Detail)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/icheon-assets.js)으로 만든다.

   ── 등록 단위는 '컴포넌트' 다 ──
   눈금선·배지 그림자·파티클 같은 **부품은 등록하지 않는다.** 라이브러리에서 꺼내 쓸 수 있는 최소 단위는
   위젯·칩·콜아웃·내비 심볼처럼 그 자체로 뜻이 서는 덩어리다.
   - 컴포넌트(위젯·차트·콜아웃·칩·토글·목록)는 Figma 프레임을 통째로 내보낸 파일을 쓴다
     → `components.json` 에 노드 id·이름·파일명을 적어 뒀다(파일은 src/icheon-assets/comp-*.svg).
     Figma SVG 내보내기는 글자를 path 로 바꾸므로 폰트 없이도 원본 그대로 그려진다.
   - 그 자체가 이미 최소 단위인 것(내비 심볼·3D 렌더·아이콘·상태 점)만 화면 폴더의 원본 파일을 그대로 참조한다.
   - 패널(빈 컨테이너)은 원본에 파일이 없어 화면 CSS 의 실제 값으로 SVG 를 만들어 쓴다(아래 PANELS).

   사용법:  node src/icheon-assets/_gen/mk-assets.js
*/
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT_DIR = path.join(ROOT, 'src', 'icheon-assets');

global.window = {};
require(path.join(ROOT, 'src', 'skhynix-hub.js'));
require(path.join(ROOT, 'src', 'skhynix-hvac.js'));

/* ── 1) 화면에서 <img> 로 쓰인 원본 파일을 훑는다(레이어명·부모 사슬·라벨과 함께) ── */
const screens = [
  { key: 'hub', dir: 'src/skhynix-hub/', html: window.buildSkhynixHub('A/') },
  { key: 'hvac', dir: 'src/skhynix-hvac/', html: window.buildSkhynixHvac('A/') },
];
const found = new Map();
screens.forEach((s) => {
  const lines = s.html.split('\n');
  const indent = (l) => (l.match(/^\s*/) || [''])[0].length;
  for (let i = 0; i < lines.length; i++) {
    const im = lines[i].match(/<img [^>]*src="A\/([\w.-]+)"/);
    if (!im) continue;
    let nm = '', ctx = [], d = indent(lines[i]);
    for (let j = i; j >= 0; j--) {
      if (indent(lines[j]) >= d && j !== i) continue;
      const m = lines[j].match(/data-name="([^"]*)" data-node-id="([^"]*)"/);
      if (j !== i) d = indent(lines[j]);
      if (!m) continue;
      if (!nm) nm = m[1]; else ctx.push(m[1]);
      if (ctx.length >= 3) break;
    }
    /* 내비 심볼 이름은 화면에 찍힌 한글 라벨이 가장 정확하다 — 감싼 'Nav Item/…' 블록 안의 첫 <p> */
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
    if (found.has(key)) continue;
    const file = path.join(ROOT, s.dir, im[1]);
    let hash = '';
    try { hash = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex'); } catch (e) { continue; }
    found.set(key, { screen: s.key, src: s.dir + im[1], file: im[1], name: nm, ctx: ctx.join(' < '), label, hash });
  }
});

/* ── 2) 원본 파일 중 '그 자체가 최소 단위'인 것만 고른다 ──
   나머지(배경·글로우·파티클·격자·구분선·배지 부품·차트 조각)는 컴포넌트에 이미 들어 있으므로 등록하지 않는다. */
function atomicCat(a) {
  if (a.name === 'Visual' && /Nav Item/.test(a.ctx)) return 'symbol';   /* 내비 심볼(디스크+글리프) */
  if (a.name === 'Hero Image') return 'symbol';                         /* 3D 렌더 */
  if (/^Icon/.test(a.name) || a.name === 'Icon' || a.name === 'logo') return 'icon';
  if (a.name === 'Dot' || a.name === 'Status Dot') return 'icon';       /* 등급/상태 점(색이 곧 의미) */
  return null;                                                          /* 나머지는 부품 → 제외 */
}
/* 색이 곧 의미인 점은 파일에서 대표 색을 읽어 이름을 붙인다(같은 색이면 크기만 다른 중복이라 하나만 남는다) */
function mainColor(src) {
  try {
    const t = fs.readFileSync(path.join(ROOT, src), 'utf8');
    for (const x of t.match(/(?:stroke|fill)="(#[0-9A-Fa-f]{6})"/g) || []) {
      const c = x.slice(x.indexOf('#')).replace('"', '').toUpperCase();
      if (!['#FFFFFF', '#DEE1E5', '#CDCBD4', '#F9F8F8'].includes(c)) return c;
    }
  } catch (e) {}
  return '';
}
const SEM = { '#F43030': '위험', '#F68108': '중대', '#F2C204': '경미', '#2FC0EF': '주의', '#50A9FF': '정보' };
const KO = {
  'Icon/Widget/Power': '전력 아이콘', 'Icon/Widget/Saturation': '포화도 아이콘', 'Icon/Widget/Temperature': '온도 아이콘',
  'Icon/Trend/Up': '상승 화살표', 'Icon/Trend/Down': '하강 화살표', 'Icon/Action/Collapse': '접기 화살표',
  'Icon/Callout/Operation': '운전상태 아이콘', 'Icon/Callout/Humidity': '습도 아이콘', 'Icon/Callout/Temperature': '온도계 아이콘',
  logo: 'SK하이닉스 로고',
};
function atomicName(a) {
  if (a.name === 'Visual') return (a.label || 'Nav') + ' 심볼' + (/\(Active\)/.test(a.ctx) ? '(선택)' : '');
  if (a.name === 'Hero Image') return a.screen === 'hub' ? '3D 데이터센터' : '3D 항온항습기';
  if (a.name === 'Icon') {
    if (/Time/.test(a.ctx)) return '시계 아이콘';
    if (/Action/.test(a.ctx)) return a.file === 'icon-2.svg' ? '로그아웃 아이콘' : '사용자 아이콘';
    return '아이콘';
  }
  if (a.name === 'Dot' || a.name === 'Status Dot') {
    const c = mainColor(a.src);
    return '상태 점' + (SEM[c] ? '(' + SEM[c] + ')' : '');
  }
  return KO[a.name] || a.name;
}

/* ── 3) 패널 — 원본에 파일이 없다(CSS 로 그린 빈 컨테이너). 화면 CSS 의 실제 값을 그대로 SVG 로 옮긴다 ── */
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
    : (() => {                                       /* 모서리마다 반지름이 다른 카드 → path */
      const [tl, tr, br, bl] = p.r, x = pad, y = pad, w = p.w, h = p.h;
      return `<path d="M${x + tl} ${y}H${x + w - tr}A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}V${y + h - br}A${br} ${br} 0 0 1 ${x + w - br} ${y + h}H${x + bl}A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}V${y + tl}A${tl} ${tl} 0 0 1 ${x + tl} ${y}Z"`;
    })();
  const fx = p.shadow ? ` filter="url(#${p.id}_sh)"` : '';
  const st = p.stroke ? ` stroke="${p.strokeGrad ? `url(#${p.id}_g)` : p.strokeColor}" stroke-width="${p.stroke}"` : '';
  const defs = [];
  if (p.shadow) {
    const [dx, dy, blur, col] = p.shadow;
    defs.push(`<filter id="${p.id}_sh" x="-40%" y="-40%" width="180%" height="180%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">`
      + `<feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur / 2}" flood-color="${col}"/></filter>`);
  }
  if (p.strokeGrad) {
    defs.push(`<linearGradient id="${p.id}_g" x1="${pad}" y1="0" x2="${pad + p.w}" y2="0" gradientUnits="userSpaceOnUse">`
      + `<stop stop-color="#ffffff"/><stop offset="0.5" stop-color="#f4f4fa"/><stop offset="0.75" stop-color="#ffffff"/>`
      + `<stop offset="0.875" stop-color="#ededf3"/><stop offset="1" stop-color="#e6e6ec"/></linearGradient>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none">\n`
    + (defs.length ? '<defs>' + defs.join('') + '</defs>\n' : '')
    + `${shape} fill="${p.fill}"${st}${fx}/>\n</svg>\n`;
}

/* ── 3-b) 내보낸 컴포넌트에서 '놓여 있던 자리의 배경'을 걷어낸다 ──
   Figma 프레임 내보내기는 그 노드만 그리지 않는다. 노드 상자와 겹치는 조상들의 배경을 함께 그린다:
     <rect width=W height=H fill="#F4F4F4"/>            ← Figma 캔버스 색
     <g id="Screen/…"><rect width=1920 height=1080 …fill="white"/>  ← 화면 프레임의 흰 판
     <g id="Event List"><rect …/>                        ← 칩이 얹혀 있던 유리 패널 같은 중간 컨테이너
   라이브러리 에셋에는 컴포넌트 자신만 있어야 하므로 **컴포넌트 그룹부터 잘라 낸다**.
   (이미 잘라 낸 파일을 다시 돌려도 결과가 같다 — 그룹이 곧 첫 요소라 버릴 게 없다) */
function extractGroup(s, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp('<g id="' + esc + '"[^>]*>').exec(s);
  if (!m) return null;
  const tag = /<\/?g\b[^>]*>/g;
  tag.lastIndex = m.index;
  let depth = 0, t;
  while ((t = tag.exec(s))) {
    if (t[0][1] === '/') { depth--; if (depth === 0) return s.slice(m.index, t.index + t[0].length); }
    else if (!/\/>\s*$/.test(t[0])) depth++;
  }
  return null;
}
function stripBackground(file, figName) {
  const p = path.join(OUT_DIR, file);
  const s = fs.readFileSync(p, 'utf8');
  const head = (s.match(/<svg[^>]*>/) || [])[0];
  const group = extractGroup(s, figName);
  if (!head || !group) { console.log('!! 배경 제거 실패(구조가 다름):', file, '/', figName); return false; }
  const defs = (s.match(/<defs>[\s\S]*<\/defs>/) || [''])[0];
  const out = head + '\n' + group + '\n' + (defs ? defs + '\n' : '') + '</svg>\n';
  if (out === s) return false;
  fs.writeFileSync(p, out);
  return true;
}

/* ── 4) 목록 만들기 — 컴포넌트가 먼저, 그다음 최소 단위 원본, 마지막에 패널 ── */
fs.mkdirSync(OUT_DIR, { recursive: true });
PANELS.forEach((p) => fs.writeFileSync(path.join(OUT_DIR, p.file), panelSvg(p)));

const COMP = JSON.parse(fs.readFileSync(path.join(__dirname, 'components.json'), 'utf8')).items;
const cats = { charts: [], symbols: [], icons: [], panels: [] };
const KEY = { chart: 'charts', symbol: 'symbols', icon: 'icons', panel: 'panels' };

/* 4-a) Figma 컴포넌트 프레임 — 배경을 걷어낸 뒤 등록 */
let stripped = 0;
COMP.forEach((c) => {
  const f = path.join(OUT_DIR, c.file);
  if (!fs.existsSync(f)) { console.log('!! 파일 없음(다시 내보내야 함):', c.file); return; }
  if (stripBackground(c.file, c.fig)) stripped++;
  /* light: 썸네일을 밝은 판 위에 그린다 — 배경을 걷어낸 라이트 시안 컴포넌트라
     어두운 썸네일에서는 위젯 제목 같은 어두운 글자가 묻힌다(Figma 캔버스와 같은 조건으로 맞춘다). */
  cats[KEY[c.cat]].push({ id: 'c_' + c.file.replace(/^comp-|\.svg$/g, '').replace(/[^\w]/g, '_'), name: c.name, fig: c.fig + ' (' + c.nid + ')', src: 'src/icheon-assets/' + c.file, light: true });
});
if (stripped) console.log('배경 제거:', stripped, '개');

/* 4-b) 그 자체가 최소 단위인 원본 파일 */
const seenHash = new Set(), seenName = new Set();
[...found.values()]
  .sort((a, b) => (a.screen === b.screen ? a.file.localeCompare(b.file) : a.screen === 'hub' ? -1 : 1))
  .forEach((a) => {
    const cat = atomicCat(a);
    if (!cat || seenHash.has(a.hash)) return;
    seenHash.add(a.hash);
    const name = atomicName(a);
    if (seenName.has(cat + '|' + name)) return;      /* 크기만 다른 같은 그림은 하나만 */
    seenName.add(cat + '|' + name);
    cats[KEY[cat]].push({
      id: (a.screen === 'hub' ? 'h_' : 'v_') + a.file.replace(/\.\w+$/, '').replace(/[^\w]/g, '_'),
      name, fig: a.name + (a.ctx ? ' < ' + a.ctx : ''), src: a.src,
    });
  });

/* 4-c) 패널 컨테이너 — 라이트 시안(이천 main)의 CSS 값으로 만든 밝은 판이므로 컴포넌트와 같은 light 취급 */
PANELS.forEach((p) => cats.panels.push({ id: p.id, name: p.name, fig: p.src, src: 'src/icheon-assets/' + p.file, light: true }));

const mod = [
  '/* 자동 생성물 — 이천 FMS 두 화면(Figma 64:3367 · 64:4059)의 에셋 라이브러리 등록 목록.',
  '   등록 단위는 컴포넌트다(부품은 넣지 않는다).',
  '   - 위젯·차트·콜아웃·칩·토글·목록: Figma 프레임을 통째로 내보낸 파일(src/icheon-assets/comp-*.svg)',
  '   - 내비 심볼·3D 렌더·아이콘·상태 점: 화면 폴더의 원본 파일을 그대로 참조',
  '   - 패널(빈 컨테이너): 화면 CSS 값 그대로 만든 SVG',
  '   생성기: src/icheon-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */',
  'window.__ICHEON_ASSETS = ' + JSON.stringify(cats, null, 1) + ';',
  '',
].join('\n');
fs.writeFileSync(path.join(ROOT, 'src', 'icheon-assets.js'), mod);

console.log('패널 SVG', PANELS.length, '개 · 컴포넌트', COMP.length, '개');
console.log('등록:', Object.keys(cats).map((k) => k + ' ' + cats[k].length).join(' · '),
  '(전체', Object.values(cats).reduce((s, a) => s + a.length, 0) + ')');
Object.keys(cats).forEach((k) => console.log('\n[' + k + ']\n  ' + cats[k].map((i) => i.name).join(' · ')));
