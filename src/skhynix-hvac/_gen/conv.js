/* Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기
   - 레이어명(data-name)을 id/class 로 보존, node-id 를 유일 클래스로
   - Tailwind 유틸리티를 실제 CSS 선언으로 1:1 번역(근사 없음, 미지원 클래스는 리포트)
   - 아이콘/복잡 그래픽은 Figma 가 내보낸 개별 svg/png 파일 참조 */
const fs = require('fs');
const path = require('path');

const SP = __dirname;
const src = fs.readFileSync(path.join(SP, 'figma-design-context.jsx.txt'), 'utf8');

/* ── 1) 에셋 상수 ── */
const assets = {};           /* varName → {url, file} */
for (const m of src.matchAll(/^const (\w+) = "([^"]+)";/gm)) {
  const kebab = m[1].replace(/^img/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])(\d)/g, '$1-$2')
    .toLowerCase();
  const ext = (m[2].match(/\.(\w+)$/) || [null, 'png'])[1];
  assets[m[1]] = { url: m[2], file: kebab + '.' + ext };
}

/* ── 2) JSX 파싱 ── */
const bodyStart = src.indexOf('return (');
const body = src.slice(src.indexOf('<', bodyStart), src.lastIndexOf('</div>') + 6);

function parseAttrs(s) {
  const a = {};
  for (const m of s.matchAll(/([\w-]+)=(?:"([^"]*)"|\{(\w+)\})/g)) a[m[1]] = m[2] !== undefined ? m[2] : { expr: m[3] };
  /* style={{ containerType: "size" }} — 인라인 스타일 객체.
     컨테이너 쿼리 단위(100cqw/100cqh)를 쓰는 노드가 있어 이 값이 빠지면 크기가 0 이 된다. */
  const st = s.match(/style=\{\{([^}]*)\}\}/);
  if (st) {
    a.__style = st[1].split(",").map(function (kv) {
      const i = kv.indexOf(":");
      if (i < 0) return null;
      const prop = kv.slice(0, i).trim().replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      return [prop, kv.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }).filter(Boolean);
  }
  return a;
}
function parse(s) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<(\/?)([A-Za-z][\w]*)((?:[^<>"]|"[^"]*")*?)(\/?)>/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    const raw = s.slice(last, m.index);
    /* JSX 텍스트: 보통은 공백 정리, {`…`} 템플릿 리터럴은 앞뒤 공백까지 원문 그대로(whitespace-pre 텍스트가 있다) */
    const tl = raw.trim().match(/^\{`([\s\S]*)`\}$/);
    const txt = tl ? tl[1] : raw.replace(/\s+/g, ' ').trim();
    if (txt) stack[stack.length - 1].children.push({ tag: '#text', text: txt });
    last = re.lastIndex;
    if (m[1]) { stack.pop(); continue; }
    const node = { tag: m[2], attrs: parseAttrs(m[3]), children: [] };
    stack[stack.length - 1].children.push(node);
    if (!m[4]) stack.push(node);
  }
  return root.children[0];
}
const tree = parse(body);

/* ── 3) Tailwind → CSS ── */
const unknown = new Map();
const FONTS = {
  Pretendard: '"Pretendard","Pretendard Variable","Malgun Gothic",-apple-system,system-ui,sans-serif',
  Tomorrow: '"Tomorrow","Pretendard",system-ui,sans-serif',
  /* Gotham 은 유료 폰트라 설치 환경에서만 잡히고, 없으면 Pretendard 로 떨어진다(기존 팝업 시안과 동일한 처리) */
  Gotham_Book: '"Gotham Book","Gotham","Pretendard",system-ui,sans-serif',
  Gotham_Medium: '"Gotham Medium","Gotham","Pretendard",system-ui,sans-serif',
};
const WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800, Black: 900 };
const GOTHAM_W = { Gotham_Book: 400, Gotham_Medium: 500 };

const fixCalc = (v) => v.replace(/calc\(([^()]*)\)/g, (mm, inner) => 'calc(' + inner.replace(/([\d%a-z)])([-+])(?=[\d.])/g, '$1 $2 ') + ')');
const arb = (c) => fixCalc(c.slice(c.indexOf('[') + 1, c.lastIndexOf(']')).replace(/_/g, ' '));

function styleFor(classes) {
  const d = [];                       /* [prop, value] 순서 유지 */
  const set = (p, v) => { const i = d.findIndex((x) => x[0] === p); if (i >= 0) d[i][1] = v; else d.push([p, v]); };
  let bAll = null, bSides = {}, bColor = null, bStyle = null;
  const shadows = [], drops = [], tr = [];
  let gradDir = null, gFrom = null, gFromPos = null, gTo = null, gToPos = null;

  for (const c of classes) {
    /* 임의 속성 [prop:value] */
    if (/^\[[^\]]+\]$/.test(c) && c.includes(':')) {
      const v = c.slice(1, -1);
      const i = v.indexOf(':');
      set(v.slice(0, i), v.slice(i + 1).replace(/_/g, ' '));
      continue;
    }
    switch (c) {
      case 'absolute': set('position', 'absolute'); continue;
      case 'relative': set('position', 'relative'); continue;
      case 'contents': set('display', 'contents'); continue;
      case 'flex': set('display', 'flex'); continue;
      case 'inline-grid': set('display', 'inline-grid'); continue;
      case 'block': set('display', 'block'); continue;
      case 'flex-col': set('flex-direction', 'column'); continue;
      case 'flex-none': set('flex', 'none'); continue;
      case 'shrink-0': set('flex-shrink', '0'); continue;
      case 'self-stretch': set('align-self', 'stretch'); continue;
      case 'content-stretch': set('align-content', 'stretch'); continue;
      case 'items-center': set('align-items', 'center'); continue;
      case 'items-start': set('align-items', 'flex-start'); continue;
      case 'items-end': set('align-items', 'flex-end'); continue;
      case 'items-baseline': set('align-items', 'baseline'); continue;
      case 'justify-center': set('justify-content', 'center'); continue;
      case 'justify-between': set('justify-content', 'space-between'); continue;
      case 'justify-end': set('justify-content', 'flex-end'); continue;
      case 'place-items-start': set('place-items', 'start'); continue;
      case 'col-1': set('grid-column', '1'); continue;
      case 'row-1': set('grid-row', '1'); continue;
      case 'inset-0': set('inset', '0'); continue;
      case 'left-0': set('left', '0'); continue;
      case 'top-0': set('top', '0'); continue;
      case 'ml-0': set('margin-left', '0'); continue;
      case 'mt-0': set('margin-top', '0'); continue;
      case 'w-0': set('width', '0'); continue;
      case 'h-0': set('height', '0'); continue;
      case 'w-full': set('width', '100%'); continue;
      case 'h-full': set('height', '100%'); continue;
      case 'size-full': set('width', '100%'); set('height', '100%'); continue;
      case 'min-w-px': set('min-width', '1px'); continue;
      case 'min-h-px': set('min-height', '1px'); continue;
      case 'max-w-none': set('max-width', 'none'); continue;
      case 'gap-px': set('gap', '1px'); continue;
      case 'object-cover': set('object-fit', 'cover'); continue;
      case 'overflow-hidden': set('overflow', 'hidden'); continue;
      case 'overflow-clip': set('overflow', 'clip'); continue;
      case 'pointer-events-none': set('pointer-events', 'none'); continue;
      case 'mix-blend-screen': set('mix-blend-mode', 'screen'); continue;
      case 'whitespace-nowrap': set('white-space', 'nowrap'); continue;
      case 'whitespace-pre': set('white-space', 'pre'); continue;
      case 'not-italic': set('font-style', 'normal'); continue;
      case 'text-center': set('text-align', 'center'); continue;
      case 'text-right': set('text-align', 'right'); continue;
      case 'text-white': set('color', '#fff'); continue;
      case 'text-black': set('color', '#000'); continue;
      case 'bg-white': set('background-color', '#fff'); continue;
      case 'border-white': bColor = '#fff'; continue;
      case 'border-solid': bStyle = 'solid'; continue;
      case 'border': bAll = '1px'; continue;
      case 'border-2': bAll = '2px'; continue;
      case 'border-4': bAll = '4px'; continue;
      case 'border-b': bSides.bottom = '1px'; continue;
      case 'border-t': bSides.top = '1px'; continue;
      case 'border-r': bSides.right = '1px'; continue;
      case 'border-l': bSides.left = '1px'; continue;
      case 'border-t-2': bSides.top = '2px'; continue;
      case 'border-b-2': bSides.bottom = '2px'; continue;
      case 'rotate-90': tr.push('rotate(90deg)'); continue;
      case 'rotate-180': tr.push('rotate(180deg)'); continue;
      case 'bottom-1/4': set('bottom', '25%'); continue;
      case 'from-white': gFrom = '#ffffff'; continue;
      case 'to-white': gTo = '#ffffff'; continue;
      case '-translate-x-1/2': tr.unshift('translateX(-50%)'); continue;
      case 'bg-gradient-to-r': gradDir = 'to right'; continue;
      case 'bg-gradient-to-l': gradDir = 'to left'; continue;
      case 'bg-gradient-to-t': gradDir = 'to top'; continue;
      case 'bg-gradient-to-b': gradDir = 'to bottom'; continue;
    }
    let m;
    if ((m = c.match(/^(left|top|right|bottom|width|height)-\[/))) { set(m[1], arb(c)); continue; }
    if ((m = c.match(/^(w|h)-\[/))) { set(m[1] === 'w' ? 'width' : 'height', arb(c)); continue; }
    if (/^size-\[/.test(c)) { const v = arb(c); set('width', v); set('height', v); continue; }
    if (/^inset-\[/.test(c)) { set('inset', arb(c)); continue; }
    if (/^gap-\[/.test(c)) { set('gap', arb(c)); continue; }
    if (/^p-\[/.test(c)) { set('padding', arb(c)); continue; }
    if (/^px-\[/.test(c)) { const v = arb(c); set('padding-left', v); set('padding-right', v); continue; }
    if (/^py-\[/.test(c)) { const v = arb(c); set('padding-top', v); set('padding-bottom', v); continue; }
    if ((m = c.match(/^p([tblr])-\[/))) { set('padding-' + { t: 'top', b: 'bottom', l: 'left', r: 'right' }[m[1]], arb(c)); continue; }
    if ((m = c.match(/^m([tblr])-\[/))) { set('margin-' + { t: 'top', b: 'bottom', l: 'left', r: 'right' }[m[1]], arb(c)); continue; }
    if (/^rounded-\[/.test(c)) { set('border-radius', arb(c)); continue; }
    if ((m = c.match(/^rounded-(tl|tr|bl|br)-\[/))) {
      set({ tl: 'border-top-left-radius', tr: 'border-top-right-radius', bl: 'border-bottom-left-radius', br: 'border-bottom-right-radius' }[m[1]], arb(c));
      continue;
    }
    if (/^aspect-\[/.test(c)) { set('aspect-ratio', arb(c).replace(/\s/g, '')); continue; }
    if (/^flex-\[/.test(c)) { set('flex', arb(c)); continue; }
    if (/^grid-cols-\[/.test(c)) { set('grid-template-columns', arb(c)); continue; }
    if (/^grid-rows-\[/.test(c)) { set('grid-template-rows', arb(c)); continue; }
    if (/^leading-\[/.test(c)) { set('line-height', arb(c)); continue; }
    if (/^tracking-\[/.test(c)) { set('letter-spacing', arb(c)); continue; }
    if (/^backdrop-blur-\[/.test(c)) { set('backdrop-filter', 'blur(' + arb(c) + ')'); set('-webkit-backdrop-filter', 'blur(' + arb(c) + ')'); continue; }
    if (/^drop-shadow-\[/.test(c)) { drops.push('drop-shadow(' + arb(c) + ')'); continue; }
    if (/^shadow-\[/.test(c)) { shadows.push(arb(c)); continue; }
    if (/^bg-\[/.test(c)) { set('background-color', arb(c)); continue; }
    if (/^border-\[/.test(c)) { const v = arb(c); if (/^\d|^\./.test(v)) bAll = v; else bColor = v; continue; }
    if (/^from-\[/.test(c)) { const v = arb(c); if (/%$/.test(v)) gFromPos = v; else gFrom = v; continue; }
    if (/^to-\[/.test(c)) { const v = arb(c); if (/%$/.test(v)) gToPos = v; else gTo = v; continue; }
    if (/^text-\[/.test(c)) {
      const v = arb(c);
      if (v.startsWith('length:')) {                   /* text-[length:var(--1,16px)] → 16px */
        const raw = v.slice(7);
        const fb = raw.match(/var\([^,]+,\s*([^)]+)\)/);
        set('font-size', fb ? fb[1].trim() : raw);
      } else if (/^\d|^\./.test(v)) set('font-size', v);
      else set('color', v);
      continue;
    }
    if ((m = c.match(/^font-\['([^']+)'\]$/))) {
      const [fam, style] = m[1].split(':');
      set('font-family', FONTS[fam] || '"' + fam.replace(/_/g, ' ') + '",sans-serif');
      set('font-weight', String(GOTHAM_W[fam] || WEIGHT[style] || 400));
      continue;
    }
    unknown.set(c, (unknown.get(c) || 0) + 1);
  }

  if (bAll || Object.keys(bSides).length || bColor || bStyle) {
    set('border-style', bStyle || 'solid');
    if (bColor) set('border-color', bColor);
    if (bAll) set('border-width', bAll);
    else if (Object.keys(bSides).length) set('border-width', '0');
    for (const s of Object.keys(bSides)) set('border-' + s + '-width', bSides[s]);
  }
  if (shadows.length) set('box-shadow', shadows.join(','));
  if (drops.length) set('filter', drops.join(' '));
  if (tr.length) set('transform', tr.join(' '));
  if (gradDir) {
    const stops = [];
    if (gFrom) stops.push(gFrom + (gFromPos ? ' ' + gFromPos : ''));
    if (gTo) stops.push(gTo + (gToPos ? ' ' + gToPos : ''));
    set('background-image', 'linear-gradient(' + gradDir + ',' + stops.join(',') + ')');
  }
  return d;
}

/* ── 4) HTML/CSS 생성 ── */
const rules = [];
const usedIds = new Map();
const usedAssets = new Set();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const slug = (s) => s.replace(/[^\w가-힣]+/g, '-').replace(/^-+|-+$/g, '');
let anon = 0;

function uniqueId(name) {
  const base = 'skv-' + name;
  const n = (usedIds.get(base) || 0) + 1;
  usedIds.set(base, n);
  return n === 1 ? base : base + '_' + n;
}

/* Figma 메타데이터의 실제 텍스트 박스 크기 — 브라우저 폰트 메트릭이 Figma 와 미세하게 달라
   글자 상자 크기가 1~2px 어긋나고, 그게 auto-layout 을 타고 상위 위젯 위치까지 밀어낸다.
   → 텍스트 노드에 Figma 가 측정한 폭/줄높이를 그대로 박아 레이아웃을 고정한다(글자는 그대로 편집 가능). */
const META = JSON.parse(fs.readFileSync(path.join(__dirname, 'figma-node-sizes.json'), 'utf8'));
let textFixes = 0;

let out = [];
const borderFixes = [];
const ringFixes = [];
/* 다크 테마 — 색 대응표(_gen/dark.js)를 같은 순회에서 함께 돌려 오버라이드 시트를 만든다.
   형상·좌표는 건드리지 않고 색이 바뀌는 선언만 다시 적는다. */
const DARK = require('./dark.js');
const darkRules = [];
function walk(node, depth, parentBorder, inHeader) {
  const pad = '  '.repeat(depth);
  if (node.tag === '#text') { out.push(pad + esc(node.text)); return; }
  const a = node.attrs;
  const classes = (a.className || '').split(/\s+/).filter(Boolean);
  const nid = a['data-node-id'] || '';
  const uc = nid ? 'n' + nid.replace(/[:.]/g, '_') : 'x' + ++anon;
  const decls = styleFor(classes);
  if (a.__style) a.__style.forEach(function (kv) { const i = decls.findIndex(function (x) { return x[0] === kv[0]; }); if (i >= 0) decls[i][1] = kv[1]; else decls.push([kv[0], kv[1]]); });
  /* Figma 의 이미지 채우기·자식 좌표는 '테두리 바깥(border box)' 기준인데 CSS 의 절대배치는 padding box 기준이라
     테두리가 있는 부모 안에서 이미지가 테두리 두께만큼 밀린다(헤더 메시 패턴이 어긋났던 원인).
     → 테두리 있는 부모의 inset:0 자식은 음수 inset 으로 되돌려 border box 를 덮게 한다. */
  if (parentBorder) {
    const gi = decls.findIndex((x) => x[0] === 'inset');
    if (gi >= 0 && decls[gi][1] === '0') {
      const bw = parseFloat(parentBorder);
      /* 교체요소(img)는 width:auto 가 고유 크기라 inset 만으론 안 늘어난다 → 명시적으로 border box 크기를 준다 */
      decls.splice(gi, 1,
        ['left', -bw + 'px'], ['top', -bw + 'px'],
        ['width', 'calc(100% + ' + bw * 2 + 'px)'], ['height', 'calc(100% + ' + bw * 2 + 'px)']);
      for (let i = decls.length - 1; i >= 0; i--) {
        if ((decls[i][0] === 'width' || decls[i][0] === 'height') && decls[i][1] === '100%' && i > gi + 3) decls.splice(i, 1);
      }
      borderFixes.push((a['data-name'] || node.tag) + ' in ' + parentBorder);
    }
  }
  if (node.tag === 'p' && META[nid] && META[nid].w != null) {
    const mw = META[nid].w, mh = META[nid].h;
    const has = (p) => decls.some((x) => x[0] === p);
    if (!has('width')) decls.push(['width', +mw.toFixed(3) + 'px']);
    /* text-box-trim 텍스트는 상자가 이미 cap 높이로 잘리므로 줄높이를 건드리지 않는다 */
    const trimmed = classes.some((c) => c.indexOf('text-box-trim') >= 0);
    /* trim 된 텍스트는 줄높이를 못 쓰므로(상자가 cap 높이로 잘린다) 높이를 직접 준다 */
    if (trimmed && !has('height') && mh <= 40) decls.push(['height', +mh.toFixed(3) + 'px']);
    if (!trimmed && !has('height') && mh <= 40) {
      const i = decls.findIndex((x) => x[0] === 'line-height');
      if (i >= 0) decls[i][1] = +mh.toFixed(3) + 'px'; else decls.push(['line-height', +mh.toFixed(3) + 'px']);
    }
    textFixes++;
  }
  /* ── Figma stroke = center align(레이아웃 공간 0) ──
     사방 균일 테두리는 decls 에서 빼고 ::after 링(inset -B/2, border B)으로 그린다.
     내용 상자가 Figma 의 fill box 와 정확히 같아지고, 선의 바깥/안쪽 반씩 걸치는 것도 원본과 같아진다.
     한쪽 면만 있는 테두리(표의 구분선)는 원본에서도 행 높이에 포함돼 있으므로 그대로 둔다.
     Event List(64:4370)는 그라디언트 링을 따로 얹으므로 제외. */
  const bwI = decls.findIndex((x) => x[0] === 'border-width');
  const hasSide = decls.some((x) => /^border-(top|right|bottom|left)-width$/.test(x[0]));
  let ring = null;
  /* 예외: 안쪽 정렬(inside) stroke — Figma 에서 선이 실제로 레이아웃 공간을 먹는 프레임.
     Table>Body(64:4434) 는 원본 좌표가 행을 (1,1) 부터 놓으므로 CSS border 를 그대로 둔다.
     Event List(64:4370) 는 그라디언트 링을 따로 얹는다. */
  const INSIDE_STROKE = ['64:4370', '64:4434'];
  if (bwI >= 0 && !hasSide && INSIDE_STROKE.indexOf(nid) < 0) {
    const bw = parseFloat(decls[bwI][1]);
    const bc = (decls.find((x) => x[0] === 'border-color') || [, 'currentColor'])[1];
    const bs = (decls.find((x) => x[0] === 'border-style') || [, 'solid'])[1];
    const rr = decls.find((x) => x[0] === 'border-radius');
    const half = +(bw / 2).toFixed(4);
    let rad = 'inherit';
    if (rr) { const v = parseFloat(rr[1]); if (!isNaN(v) && /^[\d.]+px$/.test(rr[1].trim())) rad = +(v + half).toFixed(4) + 'px'; }
    for (let i = decls.length - 1; i >= 0; i--) if (/^border-(width|color|style)$/.test(decls[i][0])) decls.splice(i, 1);
    const pos = decls.find((x) => x[0] === 'position');
    if (!pos) decls.push(['position', 'relative']);
    ring = '.skv-root .' + uc + '::after{content:"";position:absolute;inset:-' + half + 'px;'
      + 'border:' + bw + 'px ' + bs + ' ' + bc + ';border-radius:' + rad + ';pointer-events:none;}';
    ringFixes.push((a['data-name'] || nid) + ' ' + bw + 'px');
  }
  if (decls.length) rules.push('.skv-root .' + uc + '{' + decls.map(([p, v]) => p + ':' + v).join(';') + '}');
  if (ring) rules.push(ring);
  /* 다크 테마 — 헤더(원본이 이미 어두운 띠)는 그대로 두고, 색이 바뀌는 선언만 다시 적는다 */
  if (!inHeader && nid !== '64:4067') {
    const dd = [];
    decls.forEach(([p, v]) => { const nv = DARK.darkDecl(p, v); if (nv) dd.push([p, nv]); });
    if (dd.length) darkRules.push('.skv-root[data-theme="dark"] .' + uc + '{' + dd.map(([p, v]) => p + ':' + v).join(';') + '}');
    if (ring) {
      const mm = ring.match(/::after\{content:"";position:absolute;inset:(-?[\d.]+px);border:([^;]+);border-radius:([^;]+);/);
      if (mm) { const nb = DARK.darkRing(mm[2]); if (nb) darkRules.push('.skv-root[data-theme="dark"] .' + uc + '::after{border:' + nb + ';}'); }
    }
  }

  const cls = [uc];
  if (a['data-name']) cls.push('skv-' + slug(a['data-name']));
  const attrs = [
    'id="' + escAttr(uniqueId(a['data-name'] || nid || (node.tag === 'img' ? 'Asset' : 'Node'))) + '"',
    'class="' + cls.join(' ') + '"',
  ];
  if (a['data-name']) attrs.push('data-name="' + escAttr(a['data-name']) + '"');
  if (nid) attrs.push('data-node-id="' + nid + '"');
  if (node.tag === 'img') {
    const v = a.src && a.src.expr;
    const as = assets[v];
    if (!as) throw new Error('unknown asset ' + v);
    usedAssets.add(v);
    attrs.push('src="{{B}}' + as.file + '"', 'alt=""');
    out.push(pad + '<img ' + attrs.join(' ') + '>');
    return;
  }
  if (!node.children.length) { out.push(pad + '<' + node.tag + ' ' + attrs.join(' ') + '></' + node.tag + '>'); return; }
  const onlyText = node.children.length === 1 && node.children[0].tag === '#text';
  if (onlyText) {
    out.push(pad + '<' + node.tag + ' ' + attrs.join(' ') + '>' + esc(node.children[0].text) + '</' + node.tag + '>');
    return;
  }
  out.push(pad + '<' + node.tag + ' ' + attrs.join(' ') + '>');
  /* 자식에게 넘길 테두리 두께(있을 때만) */
  const bw2 = decls.find((x) => x[0] === 'border-width');
  const kid = !ring && bw2 && bw2[1] !== '0' ? bw2[1] : null;
  node.children.forEach((c) => walk(c, depth + 1, kid, inHeader || nid === '64:4067'));
  out.push(pad + '</' + node.tag + '>');
}
walk(tree, 1, null, false);
if (borderFixes.length) console.log('border-box 이미지 보정:', borderFixes.join(' | '));
console.log('stroke→링 변환:', ringFixes.length, '개 —', ringFixes.join(' | '));

if (unknown.size) {
  console.log('!! UNKNOWN CLASSES:');
  for (const [k, v] of unknown) console.log('   ' + k + ' x' + v);
} else console.log('all classes translated');

const missing = Object.keys(assets).filter((k) => !usedAssets.has(k));
if (missing.length) console.log('unused assets:', missing.join(', '));

/* ── 4-b) 원본 SVG 대조로 찾은 보정 2건 ──
   Figma 코드 출력(get_design_context)이 표현하지 못한 값을 export.svg(=원본 벡터)에서 읽어 되살린다.
   ① Header(64:3855) — 프레임 stroke 가 실제로는 '가로 그라디언트'(paint80: 투명→#788188 60%→#EDECED→투명)인데
      코드 출력은 단색 투명(border-[rgba(120,129,136,0)])으로 뭉갰다. 이미지 위에 그려지는 선이라 오버레이로 얹는다.
      헤더 배경 이미지도 패턴 변환값이 비균등 스케일이라 object-cover 로는 1~2px 어긋난다 → 원본 값(-67.5,1,2055x58) 그대로.
   ② Event List(64:3894) — 4px 테두리가 흰 단색이 아니라 가로 그라디언트(paint81)다. 라운드 코너를 살려야 하므로
      border-color:transparent + padding-box/border-box 2겹 배경 기법으로 재현한다. */
let html = out.join('\n');
const HDR_STROKE = 'linear-gradient(to right,rgba(120,129,136,0) 0%,rgba(120,129,136,0.6) 51.4072%,#ededed 54.8601%,rgba(120,129,136,0.6) 58.1619%,rgba(120,129,136,0) 100%)';
html = html.replace(/(\n(\s*)<img id="[^"]*" class="[^"]*" src="\{\{B\}\}header\.png" alt="">)/,
  '$1\n$2<div id="skv-Header/Stroke" class="skv-Header-Stroke skv-Stroke" data-name="Header/Stroke"></div>');
rules.push('/* Header 프레임 stroke = 가로 그라디언트(원본 paint80) — 이미지 위에 얹는 선 */');
rules.push('.skv-root .skv-Header-Stroke{position:absolute;left:-2px;top:-2px;width:calc(100% + 4px);height:calc(100% + 4px);'
  + 'border:2px solid transparent;border-image:' + HDR_STROKE + ' 2;pointer-events:none;}');
rules.push('/* 헤더 배경 이미지 — 원본 패턴 변환 그대로(비균등 스케일) */');
/* 헤더 배경 이미지 — 원본 SVG 의 패턴 변환 그대로.
   pattern0: matrix(0.000558036 0 0 0.0178571 -0.0357143 0) · image 1920x56 · fill rect x1 y1 1918x58
   → 1920*0.000558036*1918 = 2055px, 56*0.0178571*58 = 58px, x = 1 - 0.0357143*1918 = -67.5px, y = 1px.
   (테두리를 링으로 뺐으므로 기준점은 헤더 상자의 (0,0) 이다) */
rules.push('.skv-root .n64_4067 > img{left:-67.5px;top:1px;width:2055px;height:58px;object-fit:fill;}');
rules.push('/* Event List 테두리 = 가로 그라디언트(원본 paint81) */');
/* 패널이 반투명(흰 10%)이라 배경 2겹 기법은 못 쓴다(그라디언트가 패널 안까지 비친다) →
   테두리는 투명으로 두고 ::before 링을 마스크로 잘라 얹는다(라운드 코너 유지). */
rules.push('.skv-root .n64_4370{border-color:transparent;}');
rules.push('.skv-root .n64_4370::before{content:"";position:absolute;inset:-4px;border-radius:15px;padding:4px;'
  + 'background:linear-gradient(to right,#ffffff 0%,#f4f4fa 50%,#ffffff 75%,#ededf3 87.5%,#e6e6ec 100%);'
  + '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;'
  + 'mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;}');

/* Event List 그라디언트 링의 다크판 — 흰 계열 정지색을 흰색 투명도로 바꾼다(유리 테두리 느낌 유지) */
darkRules.push('.skv-root[data-theme="dark"] .n64_4370::before{background:linear-gradient(to right,'
  + 'rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.20) 75%,'
  + 'rgba(255,255,255,0.08) 87.5%,rgba(255,255,255,0.06) 100%);}');
darkRules.push(...DARK.EXTRA);

/* ── 5) 스튜디오 모듈 · 단독 미리보기 파일 출력 ── */
const STUDIO = path.join(__dirname, '..', '..', '..');
const HTML = html;
const BASE_CSS = [
  "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');",
  /* Tomorrow — 숫자/타임스탬프용(로컬 ttf). index.html 은 500/600 만 선언하므로 400 을 여기서 보탠다 */
  "@font-face{font-family:'Tomorrow';font-weight:400;font-style:normal;font-display:swap;src:url('{{B}}../fonts/Tomorrow-Regular.ttf') format('truetype');}",
  "@font-face{font-family:'Tomorrow';font-weight:500;font-style:normal;font-display:swap;src:url('{{B}}../fonts/Tomorrow-Medium.ttf') format('truetype');}",
  /* 루트 — 1920x1080 캔버스. 앱 전역 스타일이 새어 들어오지 않도록 텍스트 기본값을 모두 명시한다 */
  '.skv-root{position:absolute;inset:0;overflow:hidden;background:#fff;z-index:5;' +
  'font-family:"Pretendard","Pretendard Variable","Malgun Gothic",-apple-system,system-ui,sans-serif;' +
  'font-size:16px;font-weight:400;font-style:normal;line-height:normal;letter-spacing:normal;' +
  'color:#000;text-align:left;text-transform:none;word-spacing:normal;-webkit-font-smoothing:antialiased;}',
  '.skv-root,.skv-root *,.skv-root *::before,.skv-root *::after{box-sizing:border-box;}',
  '.skv-root *{margin:0;padding:0;border:0 solid transparent;background:none;font:inherit;color:inherit;text-decoration:none;}',
  '.skv-root img{display:block;border:0;max-width:none;}',
].join('\n');
const CSS = BASE_CSS + '\n' + rules.join('\n');
/* 다크 테마 시트 — 화면 CSS 뒤에 따로 깔린다(.skv-root[data-theme="dark"] 로만 걸린다) */
const DARK_CSS = [
  '/* Screen/HVAC Detail — 다크 테마(형상 동일, 색만 반전). 생성기: _gen/dark.js */',
].concat(darkRules).join('\n');

const MODULE = [
  '/* SK하이닉스 이천 FMS — Screen/HVAC Detail',
  '   원본: Figma 0R04sQR7srWuzezhRPzkMW / node 64:4059 (1920x1080, page "Light-시안02")',
  '   순수 HTML/CSS 재구축. 글자는 편집 가능한 실제 텍스트(SVG 아님), 아이콘·이미지는 원본에서 내려받은 개별 에셋 그대로.',
  '   Figma 레이어명은 id="skv-<레이어명>" · class="skv-<레이어명>" · data-name 에 보존하고,',
  '   스타일 훅은 노드 id 기반 유일 클래스(n64_3367)로 건다. 좌표·크기·색은 Figma 값 그대로(근사 없음).',
  '   생성기: scratchpad/conv.js (Figma get_design_context → Tailwind 유틸리티 1:1 CSS 번역). 손으로 고치지 말 것. */',
  '(function () {',
  "  var A = 'src/skhynix-hvac/';",
  '  var CSS = ' + JSON.stringify(CSS) + ';',
  '  var HTML = ' + JSON.stringify(HTML) + ';',
  '  var DARK = ' + JSON.stringify(DARK_CSS) + ';',
  '  window.SKHYNIX_HVAC_CSS = CSS.split(\'{{B}}\').join(A);',
  '  window.SKHYNIX_HVAC_DARK_CSS = DARK.split(\'{{B}}\').join(A);',
  '  window.buildSkhynixHvac = function (base) { return HTML.split(\'{{B}}\').join(base || A); };',
  '})();',
  '',
].join('\n');
fs.writeFileSync(path.join(STUDIO, 'src/skhynix-hvac.js'), MODULE);

const PREVIEW = [
  '<!doctype html><html lang="ko"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Screen/HVAC Detail — Figma 64:4059 재구축</title>',
  /* 주의: @import 는 다른 규칙보다 앞에 와야 무시되지 않는다 → 화면 CSS(첫 줄이 Pretendard @import)를 먼저 깐다 */
  '<style>',
  CSS.split('{{B}}').join('./'),
  DARK_CSS.split('{{B}}').join('./'),
  /* 시안은 1920x1080 기준으로 그리되, 화면을 꽉 채운다 —
     skhynix-hvac-live.js 가 창 비율만큼 캔버스를 넓히고 블록(헤더·좌우 위젯열·이벤트 목록)을 가장자리에 다시 붙인다.
     글자·위젯은 균일 배율로만 커지므로 왜곡이 없고, 16:9 창에서는 Figma 원본과 완전히 같은 그림이 된다. */
  'html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#e3e9f0;}',
  '.skv-fit{position:fixed;inset:0;overflow:hidden;}',
  '.skv-stage{position:absolute;inset:0;overflow:hidden;}',
  '</style></head><body><div class="skv-fit"><div class="skv-stage"><div class="skv-root">',
  HTML.split('{{B}}').join('./'),
  '</div></div></div>',
  /* 인터랙션·라이브 데이터 레이어(스튜디오와 같은 모듈) */
  '<script src="../skhynix-hvac-live.js?v=14"></script>',
  '<script>window.initSkhynixHvac(document.querySelector(".skv-root"));</script>',
  /* 미리보기 전용 — 다크/라이트 확인용 토글(스튜디오에서는 앱의 테마 버튼이 같은 일을 한다) */
  '<button id="tt" style="position:fixed;right:12px;bottom:12px;z-index:99;padding:8px 14px;border-radius:8px;border:1px solid #8888;background:#fff8;font:13px system-ui;cursor:pointer">theme</button>',
  '<script>tt.onclick=function(){var r=document.querySelector(".skv-root");r.dataset.theme=r.dataset.theme==="dark"?"light":"dark";};</script>',
  '</body></html>',
].join('\n');
fs.writeFileSync(path.join(STUDIO, 'src/skhynix-hvac/preview.html'), PREVIEW);
console.log('wrote src/skhynix-hvac.js (' + MODULE.length + ') · src/skhynix-hvac/preview.html');

console.log('텍스트 박스 고정:', textFixes);
console.log('nodes:', rules.length, 'html bytes:', out.join('\n').length, 'css bytes:', rules.join('\n').length);
