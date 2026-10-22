// 분자·템플릿을 섀도 DOM 에 그린다. 스타일이 스튜디오 UI 와 섞이지 않고, 분자는 원래 화면 밖에서도 같은 모양이다.
import { api } from './api.js';
import { applyTheme, tokenizeInherited } from './theme.js';
import { paintStates } from './states.js';

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sheetCache = new Map();
const variantCache = new Map();

function sheet(key, text) {
  if (sheetCache.has(key)) return sheetCache.get(key);
  const s = new CSSStyleSheet();
  s.replaceSync(text);
  sheetCache.set(key, s);
  return s;
}
const templateSheetText = new Map();
export async function templateSheet(name) {
  if (!templateSheetText.has(name)) templateSheetText.set(name, api('api/sheets/' + encodeURIComponent(name), { text: true }));
  return sheet('t:' + name, await templateSheetText.get(name));
}

export async function loadVariants(ids) {
  const need = [...new Set(ids)].filter(id => !variantCache.has(id));
  for (let i = 0; i < need.length; i += 200) {
    const batch = need.slice(i, i + 200);
    const got = await api('api/variants/' + batch.join(','));
    for (const id of batch) variantCache.set(id, got[id]);
  }
  return Object.fromEntries(ids.map(id => [id, variantCache.get(id)]));
}
export const variant = id => variantCache.get(id);

/* ── 글자 채우기: 필드 위치(sourceRange)에 값만 바꿔 끼운다. 구조·클래스는 그대로다. ── */
export function fillHtml(v, fields, values = {}) {
  const ranges = v.order.map((key, index) => ({ key, index, range: v.props[key].sourceRange })).sort((a, b) => a.range[0] - b.range[0]);
  let out = '', cursor = 0;
  for (const { index, range: [start, end] } of ranges) {
    const fieldKey = fields[index]?.key;
    out += v.html.slice(cursor, start);
    out += fieldKey && values[fieldKey] !== undefined ? esc(values[fieldKey]) : v.html.slice(start, end);
    cursor = end;
  }
  return out + v.html.slice(cursor);
}

/* ── 버전 스타일 → CSS. 색은 토큰만 (없으면 WEMB 기본 팔레트) ── */
const tok = name => `var(--wa-${name}, var(--wa-d-${name}))`;
export function versionCss(moleculeId, version) {
  if (!version || version.version === '1.0.0') return '';
  const sel = `[data-wa-m="${moleculeId}"][data-wa-v="${version.version}"]`;
  const rules = [];
  const r = version.root || {};
  const root = [];
  if (r.background) root.push(`background:${tok(r.background)}!important`);
  if (r.borderColor) root.push(`border-color:${tok(r.borderColor)}!important`, `border-style:solid!important`);
  if (r.borderWidth !== undefined) root.push(`border-width:${r.borderWidth}px!important`, `border-style:solid!important`);
  if (r.radius !== undefined) root.push(`border-radius:${r.radius}px!important`);
  if (r.padding !== undefined) root.push(`padding:${r.padding}px!important`);
  if (r.gap !== undefined) root.push(`gap:${r.gap}px!important`);
  if (root.length) rules.push(`${sel}{${root.join(';')}}`);
  for (const [key, f] of Object.entries(version.fields || {})) {
    const st = f.style || {}, d = [];
    if (st.color) d.push(`color:${tok(st.color)}!important`);
    if (st.fontSize !== undefined) d.push(`font-size:${st.fontSize}px!important`);
    if (st.fontWeight !== undefined) d.push(`font-weight:${st.fontWeight}!important`);
    if (d.length) rules.push(`${sel} [data-wa-f="${key}"]{${d.join(';')}}`, `${sel}[data-wa-f="${key}"]{${d.join(';')}}`);
  }
  return rules.join('\n');
}
/** 버전의 기본 문구 — 값을 직접 넣지 않은 필드에만 쓰인다 */
export function versionTexts(version) {
  const out = {};
  for (const [key, f] of Object.entries(version?.fields || {})) if (f.text) out[key] = f.text;
  return out;
}

function nodeAt(root, path) {
  let node = root;
  for (const i of path || []) node = node?.children[i];
  return node;
}
function tagMolecule(el, v, fields, moleculeId, version, instanceId) {
  if (!el) return;
  el.setAttribute('data-wa-m', moleculeId);
  el.setAttribute('data-wa-v', version || '1.0.0');
  if (instanceId) el.setAttribute('data-wa-i', instanceId);
  v.fieldPaths.forEach((path, i) => { const f = nodeAt(el, path); if (f && fields[i]) f.setAttribute('data-wa-f', fields[i].key); });
}

/* ── 문구 길이 자동 맞춤 ─────────────────────────────────
   Figma 에서 옮긴 DOM 은 글자 칸의 폭이 px 로 박혀 있어, 문구가 길어지면 칸 밖으로 넘치거나 잘린다.
   넘치는 글자가 있으면 두 단계로 맞춘다.
   1) 간격 조절: 글자 칸 → 분자 루트까지 고정 폭을 풀어(최소 = 원래 폭) 내용만큼 늘린다.
      오토 레이아웃(flex · grid) 안이면 옆 요소가 자연스럽게 밀리며 간격이 다시 잡힌다.
   2) 글자 맞춤: 늘린 결과 분자가 자기 부모 칸을 넘치면(늘릴 자리가 없으면) 되돌리고,
      글자 크기를 원래의 60% 까지 줄인다. 그래도 넘치면 말줄임(…).
   1.5) 줄바꿈: 폭은 두고 여러 줄로 흘려 칸 · 이웃을 침범하지 않으면 그대로 둔다.
   문구가 짧아지면 반대로 좁혀 원래 간격을 되찾는다(tight).
   결과는 필드 요소의 data-wa-fit(grow | wrap | shrink | clip | tight)과 --wa-fit-scale 로 남긴다 (인스펙터가 읽는다). */
// 넘친 양(가로, 세로). scrollWidth 는 오른쪽 · 아래로 넘친 것만 센다 — 오른쪽 정렬(flex-end) · 가운데 정렬 글자는 왼쪽으로도 넘치므로
// 자식 · 글자의 실제 범위가 칸 왼쪽 · 위로 나간 만큼을 더한다. (화면 좌표 → CSS px 는 바깥 scale k 로 나눈다)
const excessOf = el => {
  if (!(el.clientWidth > 0)) return [0, 0];
  const r = el.getBoundingClientRect(), k = r.width / el.offsetWidth || 1;
  let l = 0, t = 0;
  const see = q => { if (q.width || q.height) { l = Math.max(l, (r.left - q.left) / k); t = Math.max(t, (r.top - q.top) / k); } };
  for (const c of el.children) see(c.getBoundingClientRect());
  for (const n of el.childNodes) if (n.nodeType === 3 && n.data.trim()) { const g = document.createRange(); g.selectNodeContents(n); see(g.getBoundingClientRect()); }
  return [Math.max(0, el.scrollWidth - el.clientWidth) + l, Math.max(0, el.scrollHeight - el.clientHeight) + t];
};
// 원본 디자인에도 원래 넘치는 칸이 있다(자식이 절대 위치라 높이 0 인 글자 묶음 등).
// 그래서 '원래 문구 · 원래 스타일일 때 넘친 양(base)'보다 더 넘칠 때만 넘친다고 본다 — 색만 바꿨는데 모양이 바뀌면 안 된다.
let base = new Map();
// 원래 문구일 때 이미 겹쳐 있던 글자 쌍 — 이것 말고 새로 겹치면 '부딪힌다'로 본다
let basePairs = new Set();
function textPairs(root) {
  const fs = [...root.querySelectorAll('[data-wa-f]')].filter(f => f.textContent.trim() && getComputedStyle(f).visibility !== 'hidden');
  const rs = fs.map(f => { const r = document.createRange(); r.selectNodeContents(f); return r.getBoundingClientRect(); });
  const out = new Set();
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    if (fs[i].contains(fs[j]) || fs[j].contains(fs[i])) continue;
    const a = rs[i], b = rs[j];
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) out.add(i + ':' + j);
  }
  return out;
}
const collides = root => [...textPairs(root)].some(p => !basePairs.has(p));
const overflows = el => {
  const [w, h] = excessOf(el), [bw, bh] = base.get(el) || [0, 0];
  return w > Math.max(0, bw) + 1 || h > Math.max(0, bh) + 1;
};
// 글자 요소 자체는 내용만큼 커져도, 그 위의 칸(예: 폭 38px 로 박힌 group)이 좁으면 글자가 칸 밖으로 삐져나온다.
// 그래서 글자 요소부터 분자 루트까지 거치는 칸 중 하나라도 넘치면 '넘친다'로 본다.
const chainOf = (f, root) => { const a = []; for (let n = f; n; n = n.parentElement) { a.push(n); if (n === root) break; } return a; };
const firstText = el => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.data.trim() ? 1 : 3) }); return w.nextNode(); };
/** 원래 문구 · 버전 스타일 없이 잰 칸별 넘침 — 잠깐 되돌려 재고 다시 돌려놓는다 */
function baselineOf(root, fields, originals) {
  const out = new Map();
  const swaps = [];
  if (originals) for (const f of fields) {
    const o = originals[f.getAttribute('data-wa-f')], t = firstText(f);
    if (o != null && t && t.data.trim() !== String(o).trim()) { swaps.push([t, t.data]); t.data = o; } // 원본 뒤 공백은 그대로 둔다
  }
  const ver = root.getAttribute('data-wa-v');
  root.setAttribute('data-wa-v', '-base'); // 버전 스타일(글자 크기 등)은 [data-wa-v="…"] 로 걸려 있다
  for (const f of fields) for (const n of chainOf(f, root)) if (!out.has(n)) out.set(n, excessOf(n));
  basePairs = textPairs(root);
  if (ver === null) root.removeAttribute('data-wa-v'); else root.setAttribute('data-wa-v', ver);
  swaps.forEach(([t, d]) => (t.data = d));
  return out;
}
const setImp = (el, prop, value) => el.style.setProperty(prop, value, 'important');

function relaxChain(field, root) {
  // 폭을 'auto(내용만큼)'로 풀면 남는 폭을 채우던 이웃(오른쪽 정렬 숫자 칸 등)이 줄어 모양이 흐트러진다.
  // 그래서 넘친 만큼(px)만 글자 칸 → 분자 루트까지 더한다. 값은 바꾸기 전에 한꺼번에 잰다.
  const chain = chainOf(field, root).filter(n => { const d = getComputedStyle(n).display; return d !== 'contents' && d !== 'inline'; });
  // 칸마다 더할 폭: 자기 넘침과 안쪽 칸이 커진 만큼 중 큰 값 (아래 → 위로 전달)
  let carry = 0;
  const extras = chain.map(n => (carry = Math.max(carry, excessOf(n)[0] - Math.max(0, base.get(n)?.[0] || 0), 0)));
  const plan = chain.map((n, i) => {
    const cs = getComputedStyle(n);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
    return { n, w: n.offsetWidth, extra: extras[i], h: n.offsetHeight, singleLine: n === field && n.offsetHeight < lh * 1.8, style: n.getAttribute('style') };
  });
  for (const { n, w, extra, h, singleLine } of plan) {
    if (!extra && n !== field) continue; // 커질 필요 없는 칸은 건드리지 않는다
    const width = Math.ceil(w + extra) + 'px';
    setImp(n, 'width', width);
    setImp(n, 'min-width', width);
    setImp(n, 'max-width', 'none');
    setImp(n, 'flex-shrink', '0');
    if (singleLine) setImp(n, 'white-space', 'nowrap');
    else { setImp(n, 'min-height', h + 'px'); setImp(n, 'height', 'auto'); }
  }
  return plan.map(p => [p.n, p.style]);
}
const restore = saved => saved.reverse().forEach(([n, style]) => (style === null ? n.removeAttribute('style') : n.setAttribute('style', style)));
const pxOf = v => parseFloat(v) || 0;

/**
 * root = 분자 루트 요소. free = true 면 부모 칸을 신경 쓰지 않고 늘린다(캔버스에 얹은 분자 · 미리보기).
 * keys = 바뀐 필드(문구 · 글자 스타일). 이것만 맞춘다 — 원본 디자인에 원래 있던 1px 남짓한 넘침까지 건드리면 모양이 흐트러진다.
 * 돌려주는 값: 'ok' | 'grow' | 'wrap' | 'shrink'
 */
/* 짧아진 문구 — 원래 글자 폭과의 차이(delta)만큼 글자 칸 → 루트를 좁혀 원래 간격을 되찾는다.
   원래부터 내용보다 넉넉하게 잡혀 있던 칸(표의 고정 열 등, 여유 4px 초과)은 줄 맞춤을 위해 그대로 둔다. */
let measureCtx = null;
function textWidth(el, text) {
  measureCtx ||= document.createElement('canvas').getContext('2d');
  const cs = getComputedStyle(el);
  measureCtx.font = cs.font || (cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily);
  return measureCtx.measureText(text).width + (parseFloat(cs.letterSpacing) || 0) * text.length;
}
function naturalWidth(n) {
  const prev = n.style.getPropertyValue('width'), prio = n.style.getPropertyPriority('width');
  const prevMin = n.style.getPropertyValue('min-width'), prioMin = n.style.getPropertyPriority('min-width');
  setImp(n, 'width', 'max-content'); setImp(n, 'min-width', '0');
  const w = n.offsetWidth;
  n.style.setProperty('width', prev, prio); n.style.setProperty('min-width', prevMin, prioMin);
  if (!prev) n.style.removeProperty('width');
  if (!prevMin) n.style.removeProperty('min-width');
  return w;
}
function tighten(field, root, delta) {
  const saved = [];
  let carried = 0; // 안쪽 칸이 줄어든 양
  for (const n of chainOf(field, root)) {
    const d = getComputedStyle(n).display;
    if (d === 'contents' || d === 'inline') continue;
    const w = n.offsetWidth;
    const slack = w - naturalWidth(n);
    let cut;
    if (slack - delta > 4) {
      // 원래도 넉넉했던 칸 — 안쪽 칸이면 고정 폭(표 열 등)으로 보고 멈춘다.
      // 분자 루트의 여유는 대개 늘어나는 자식(오른쪽 정렬 숫자 칸 등)의 몫이라, 안쪽에서 줄어든 만큼만 같이 줄인다.
      if (n !== root || !carried) break;
      cut = carried;
    } else cut = Math.min(delta, slack);
    if (cut < 0.5) continue;              // 내용에 딱 맞는 칸(글자 요소 등) — 위 칸으로 넘어간다
    saved.push([n, n.getAttribute('style')]);
    const width = Math.max(1, w - cut) + 'px';
    setImp(n, 'width', width); setImp(n, 'min-width', width); setImp(n, 'flex-shrink', '0');
    carried = cut;
  }
  return saved;
}

/* 칸을 늘리거나 좁히면, 부모 폭의 %(left:37% right:38% 등)로 잡힌 아이콘도 같이 늘어나 찌그러진다.
   글자와 안 겹치는 아이콘(그림을 품은 절대 위치 칸)은 원래 px 크기로 두고, 부모 안에서의 상대 중심만 따라가게 한다.
   글자 뒤에 깔린 판(배경 그림)은 글자를 담아야 하므로 그대로 늘어난다. */
function iconBoxes(root) {
  const fieldRects = [...root.querySelectorAll('[data-wa-f]')].map(f => f.getBoundingClientRect());
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const seen = new Set(), out = [];
  for (const img of root.querySelectorAll('img, svg')) {
    let top = null;
    for (let n = img; n && n !== root; n = n.parentElement) if (getComputedStyle(n).position === 'absolute' && !n.querySelector('[data-wa-f]') && !n.hasAttribute('data-wa-f')) top = n;
    if (!top || seen.has(top)) continue;
    seen.add(top);
    const r = top.getBoundingClientRect(), p = top.offsetParent?.getBoundingClientRect();
    if (!p || !r.width || !r.height || !p.width || !p.height || fieldRects.some(f => hit(r, f))) continue;
    // 크기는 CSS px(offset*) — 화면 좌표는 바깥 scale 만큼 틀어진다. 위치는 비율이라 상관없다
    out.push({ n: top, w: top.offsetWidth, h: top.offsetHeight, fx: (r.left + r.width / 2 - p.left) / p.width, fy: (r.top + r.height / 2 - p.top) / p.height });
  }
  return out;
}
function keepIcons(icons) {
  const saved = [];
  for (const { n, w, h, fx, fy } of icons) {
    if (Math.abs(n.offsetWidth - w) < 0.5 && Math.abs(n.offsetHeight - h) < 0.5) continue;
    saved.push([n, n.getAttribute('style')]);
    setImp(n, 'width', w + 'px'); setImp(n, 'height', h + 'px'); setImp(n, 'right', 'auto'); setImp(n, 'bottom', 'auto'); setImp(n, 'inset', 'auto');
    setImp(n, 'left', `calc(${(fx * 100).toFixed(3)}% - ${w / 2}px)`); setImp(n, 'top', `calc(${(fy * 100).toFixed(3)}% - ${h / 2}px)`);
  }
  return saved;
}
/* 그림 비율 — 칸을 늘리거나 좁힌 뒤 그림이 찌그러졌으면(비율 6% 넘게 변함) 그 방법은 쓰지 않는다.
   글자를 통째로 품은 그림(글자 뒤 배경판 · 막대)은 늘어나는 게 맞으므로 뺀다. 게이지 고리처럼 글자를 둘러싼 그림은 지킨다. */
function shapeGuard(root) {
  const fieldRects = [...root.querySelectorAll('[data-wa-f]')].map(f => f.getBoundingClientRect()).filter(r => r.width && r.height);
  const holds = (a, b) => a.left <= b.left + 1 && a.top <= b.top + 1 && a.right >= b.right - 1 && a.bottom >= b.bottom - 1;
  const list = [...root.querySelectorAll('img, svg')].map(e => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 4 && r.height > 4 && !fieldRects.some(f => holds(r, f)))
    .map(({ e, r }) => ({ e, ratio: r.width / r.height }));
  return () => list.some(({ e, ratio }) => { const r = e.getBoundingClientRect(); return r.width && r.height && Math.abs(r.width / r.height - ratio) > ratio * 0.06; });
}

export function fitMolecule(root, opts = {}) {
  return fitCore(root, { ...opts, icons: iconBoxes(root), distorted: shapeGuard(root) });
}
function fitCore(root, { free = false, keys = null, originals = null, icons = [], distorted = () => false } = {}) {
  let fields = [...root.querySelectorAll('[data-wa-f]')];
  if (root.hasAttribute('data-wa-f')) fields.unshift(root);
  if (keys) fields = fields.filter(f => keys.has(f.getAttribute('data-wa-f')));
  fields.forEach(f => { f.removeAttribute('data-wa-fit'); f.style.removeProperty('--wa-fit-scale'); });
  base = baselineOf(root, fields, originals);
  const fieldOver = f => chainOf(f, root).some(overflows);
  // 맞출 필드 — 칸을 넘치는 것. 넘치진 않지만 다른 글자와 새로 부딪히면(절대 위치로 옆에 놓인 글자 등) 바뀐 필드 전부
  const pending = () => { const o = fields.filter(fieldOver); return o.length ? o : collides(root) ? fields : []; };
  const over = pending();
  if (!over.length) {
    // 넘치지 않지만 문구가 짧아졌으면 좁힌다
    let tightened = false;
    for (const f of fields) {
      const orig = originals?.[f.getAttribute('data-wa-f')];
      if (orig == null) continue;
      const delta = textWidth(f, orig.trim()) - textWidth(f, f.textContent.trim());
      if (delta <= 1) continue;
      const saved = tighten(f, root, delta);
      if (!saved.length) continue;
      const iconSaved = keepIcons(icons);
      if (distorted()) { restore(iconSaved); restore(saved); continue; } // 좁히면 그림이 찌그러진다 — 원래 폭 그대로
      f.setAttribute('data-wa-fit', 'tight'); tightened = true;
    }
    return tightened ? 'tight' : 'ok';
  }

  // 1) 간격 조절 — 늘려도 되는지는 모양으로 판단한다.
  //    Figma 식 DOM 은 한 그리드 칸에 요소를 겹쳐 두고 여백으로 자리를 잡는 경우가 많아, 늘리면 옆 요소 위로 올라탈 수 있다.
  //    그래서 늘린 뒤 (a) 원래 담겨 있던 부모 칸을 벗어나거나 (b) 원래 안 닿던 이웃과 겹치면 되돌린다.
  //    오토 레이아웃(flex)이라 이웃이 밀려나면 겹치지 않으므로 그대로 둔다.
  const parent = root.parentElement;
  const rectOf = el => el.getBoundingClientRect();
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const inside = (a, b) => a.left >= b.left - 1 && a.top >= b.top - 1 && a.right <= b.right + 1 && a.bottom <= b.bottom + 1;
  const r0 = rectOf(root);
  const wasInside = parent && inside(r0, rectOf(parent));
  const neighbors = [];
  for (let n = root, d = 0; d < 3 && n.parentElement; d++, n = n.parentElement) {
    for (const s of n.parentElement.children) {
      if (s === n) continue;
      const q = rectOf(s);
      if (q.width && q.height && !hit(r0, q)) neighbors.push(s); // 원래 닿던 것(배경판 등)은 제외
    }
  }
  const targets = over;
  const saved = targets.flatMap(f => relaxChain(f, root));
  const iconSaved = keepIcons(icons);
  const r1 = rectOf(root);
  const blocked = (wasInside && !inside(r1, rectOf(parent))) || neighbors.some(s => hit(r1, rectOf(s)));
  if ((free || !blocked) && !distorted() && !collides(root)) {
    targets.forEach(f => f.setAttribute('data-wa-fit', 'grow'));
    return 'grow';
  }
  restore(iconSaved);
  restore(saved);

  // 1.5) 줄바꿈 — 폭은 그대로 두고 두 줄 이상으로 흘려 본다 (높이가 늘어도 칸 · 이웃을 침범하지 않을 때만)
  const wrapSaved = [];
  for (const f of pending()) {
    wrapSaved.push([f, f.getAttribute('style')]);
    setImp(f, 'white-space', 'normal'); setImp(f, 'word-break', 'keep-all'); setImp(f, 'overflow-wrap', 'anywhere');
    setImp(f, 'height', 'auto'); setImp(f, 'max-height', 'none');
    setImp(f, 'min-width', '0'); setImp(f, 'max-width', '100%'); setImp(f, 'flex-shrink', '1'); // 칸 폭 안에서 접히게
  }
  const r2 = rectOf(root);
  const wrapBlocked = fields.some(fieldOver) || collides(root) || (wasInside && !inside(r2, rectOf(parent))) || neighbors.some(s => hit(r2, rectOf(s)));
  if (!wrapBlocked) {
    wrapSaved.forEach(([f]) => f.setAttribute('data-wa-fit', 'wrap'));
    return 'wrap';
  }
  restore(wrapSaved);

  // 2) 글자 맞춤
  let result = 'shrink';
  for (const f of pending()) {
    const base = pxOf(getComputedStyle(f).fontSize);
    let size = base;
    while ((fieldOver(f) || collides(root)) && size > base * 0.6) { size = Math.max(base * 0.6, size - 0.5); setImp(f, 'font-size', size + 'px'); }
    f.style.setProperty('--wa-fit-scale', (size / base).toFixed(2));
    if (fieldOver(f) || collides(root)) {
      setImp(f, 'overflow', 'hidden'); setImp(f, 'text-overflow', 'ellipsis'); setImp(f, 'white-space', 'nowrap');
      setImp(f, 'min-width', '0'); setImp(f, 'max-width', '100%'); setImp(f, 'flex-shrink', '1'); // 칸 폭에서 잘리게
      f.setAttribute('data-wa-fit', 'clip'); result = 'shrink';
    } else f.setAttribute('data-wa-fit', 'shrink');
  }
  return result;
}
/** 변형의 원래 문구 — 필드 key → 텍스트 */
const originalTexts = (v, molecule) => Object.fromEntries(molecule.fields.map((f, i) => [f.key, v.props[v.order[i]]?.default ?? '']));
/** 맞춤 대상 필드 — 값을 넣은 필드 + 버전에서 글자 스타일을 바꾼 필드. 분자 전체 여백 · 테두리를 바꿨으면 전부. */
function changedKeys(molecule, values, version) {
  const keys = new Set(Object.keys(values || {}).filter(k => !k.startsWith('@')));
  for (const [k, f] of Object.entries(version?.fields || {})) if (f.style && Object.keys(f.style).length) keys.add(k);
  if (version?.root && ['padding', 'borderWidth', 'gap'].some(k => version.root[k] !== undefined)) molecule.fields.forEach(f => keys.add(f.key));
  return keys;
}
const fontsReady = () => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]);

// 분자를 원래 자리 밖에서 그릴 때 — 배치용 속성(절대 위치·여백·그리드 칸)을 풀고, 잰 크기로 고정한다.
const SOLO = sheet('solo', `
.wa-solo{position:relative!important;inset:auto!important;overflow:visible!important;background:transparent!important;z-index:auto!important}
.wa-solo>[data-wa-m]{position:relative!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;inset:auto!important;margin:0!important;grid-area:auto!important;flex:none!important;transform:none!important;width:100%!important;height:100%!important;max-width:none!important}
`);

/**
 * 분자 한 개를 host 안에 그린다.
 * opts: { molecule, variantId, version, values, theme, box, extraCss }
 * box = 측정한 크기 {w,h,inh}. 없으면 내용 크기로 둔다.
 */
/* ── 문맥 그리기 ─────────────────────────────────────────
   루트가 display:contents 이거나 부모 칸 크기 · 격자에 기대어 배치되는 분자는 떼어 그리면 모양이 달라진다.
   측정 때 '따로 그려 보고 원본과 비교'해서 어긋난 것(box.ctx)은, 원래 화면을 통째로 그린 뒤 그 분자만 보이게 잘라 보여 준다. */
let registry = null;
/** 템플릿 전체를 그릴 때 필요한 분자 목록(필드 정보) — 앱이 부팅할 때 한 번 등록한다 */
export function registerMolecules(map) { registry = map; }
const templateCache = new Map();
const loadTemplate = id => { if (!templateCache.has(id)) templateCache.set(id, api('api/templates/' + id)); return templateCache.get(id); };

async function mountInContext(host, opts, v) {
  const { molecule, version, theme } = opts;
  const use = v.uses[0];
  const template = await loadTemplate(use.template);
  const clip = v.part ? opts.box.parts?.[v.part] || opts.box : opts.box;
  const { root: rootEl, elements } = await mountTemplate(host, { template, molecules: registry, theme, stripImages: true });
  const shadow = host.shadowRoot;
  const el = elements.get(use.instance);
  if (!el) return null;
  // 이 분자만 보이게 — 화면 전체는 숨기고 분자 안만 되살린다. 그림도 분자 안 것만 불러온다
  rootEl.style.setProperty('visibility', 'hidden', 'important');
  el.style.setProperty('visibility', 'visible', 'important');
  for (const img of el.querySelectorAll('img[data-src]')) img.setAttribute('src', img.getAttribute('data-src'));
  if (v.ghost) for (const i of v.ghost) el.children[i]?.style.setProperty('visibility', 'hidden', 'important');
  // 이 분자의 id · 버전 · 필드로 다시 표시하고 버전 스타일을 얹는다
  tagMolecule(el, v, molecule.fields, molecule.id, version?.version);
  const vcss = versionCss(molecule.id, version);
  if (vcss) shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet('ver:' + vcss, vcss)];
  const values = { ...versionTexts(version), ...(opts.values || {}) };
  molecule.fields.forEach((fd, i) => {
    const f = nodeAt(el, v.fieldPaths[i]);
    if (!f) return;
    const t = [...f.childNodes].find(n => n.nodeType === 3 && n.data.trim());
    if (values[fd.key] !== undefined && t) t.data = values[fd.key];
    if (opts.box.fields?.[v.order[i]]?.hidden) f.style.setProperty('visibility', 'hidden', 'important');
  });
  applyTheme(host, theme);
  await paintStates(el, v, molecule, version, values, host); // 심볼 칸 — 상태값대로 칠한다
  const frame = shadow.querySelector('.wa-frame');
  let fit = 'ok', show = clip;
  if (Object.keys(values).length || (version && version.version !== '1.0.0')) {
    await fontsReady();
    fit = fitMolecule(el, { keys: changedKeys(molecule, values, version), originals: originalTexts(v, molecule) });
    // 문구가 길어져 분자가 원래 상자 밖으로 커졌으면, 자르는 상자도 칠해진 범위만큼 넓힌다
    if (fit !== 'ok') {
      frame.style.transform = 'none';
      const fr = frame.getBoundingClientRect();
      const k = frame.offsetWidth && fr.width ? fr.width / frame.offsetWidth : 1;
      const vb = visualBounds(el, fr, true);
      if (vb.maxX > vb.minX) {
        const x1 = Math.min(clip.x, vb.minX / k), y1 = Math.min(clip.y, vb.minY / k);
        const x2 = Math.max(clip.x + clip.w, vb.maxX / k), y2 = Math.max(clip.y + clip.h, vb.maxY / k);
        show = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      }
    }
  }
  // 분자 상자만큼 잘라 보여 준다
  frame.style.transform = `translate(${-show.x}px, ${-show.y}px)`;
  host.style.overflow = 'hidden';
  host.dataset.w = Math.ceil(show.w); host.dataset.h = Math.ceil(show.h);
  return { width: +host.dataset.w, height: +host.dataset.h, fit, context: true, offset: { x: clip.x - show.x, y: clip.y - show.y } };
}

export async function mountMolecule(host, opts) {
  const { molecule, variantId, version, theme } = opts;
  const v = (await loadVariants([variantId]))[variantId];
  host.style.overflow = '';
  // 다시 그릴 때 감싸개에 이전 축소 · 확대(scale)가 남아 있으면 화면 좌표로 잰 값이 그만큼 틀어진다 — 재는 동안은 풀어 둔다
  const prevTransform = host.style.transform;
  host.style.transform = 'none';
  try { return await mountSolo(host, opts, v); } finally { host.style.transform = prevTransform; }
}
async function mountSolo(host, opts, v) {
  const { molecule, version, theme } = opts;
  if (opts.box?.ctx && registry && !opts.noContext) {
    const done = await mountInContext(host, opts, v);
    if (done) return done;
  }
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  const sheets = [sheet('v:' + v.id, v.css), SOLO];
  const vcss = versionCss(molecule.id, version);
  if (vcss) sheets.push(sheet('ver:' + vcss, vcss)); // 내용으로 캐시 — 편집 중인 초안이 바뀌면 새 시트
  root.adoptedStyleSheets = sheets;
  // 구성도 노드에서 떼어 낸 조각(심볼 · 라벨) — 노드 전체를 원래 크기로 두고, 조각 상자만큼만 보이게 옮긴다
  const partBox = v.part ? opts.box?.parts?.[v.part] : null;
  const nodeBox = partBox ? opts.box : null;
  const box = v.part ? (partBox ? { ...partBox, inh: opts.box.inh } : null) : opts.box;
  const inh = box?.inh ? Object.entries(box.inh).map(([k, val]) => k + ':' + (k === 'color' ? tokenizeInherited(val) : val)).join(';') : '';
  const size = box ? `width:${box.w}px;height:${box.h}px;` : '';
  const values = { ...versionTexts(version), ...(opts.values || {}) };
  const themeAttr = theme.mode === v.defaultTheme ? '' : ` data-theme="${theme.mode}"`;
  root.innerHTML = `<div class="${v.rootClass} wa-solo"${themeAttr}>${fillHtml(v, molecule.fields, values)}</div>`;
  const wrap = root.firstElementChild;
  wrap.style.cssText = size + inh; // 글꼴 이름의 따옴표 때문에 속성 문자열로 넣지 않는다
  tagMolecule(wrap.firstElementChild, v, molecule.fields, molecule.id, version?.version);
  // 떼어 낸 조각 — 반대쪽 묶음은 자리만 차지하고 보이지 않게 (가로 정렬 노드에서도 위치가 원본 그대로)
  if (v.ghost) for (const i of v.ghost) { const c = wrap.firstElementChild.children[i]; if (c) c.style.setProperty('visibility', 'hidden', 'important'); }
  // 원본에서 다른 레이어에 덮여 안 보이던 글자는 따로 그릴 때도 숨긴다
  const measuredFields = opts.box?.fields;
  if (measuredFields) v.order.forEach((key, i) => {
    if (!measuredFields[key]?.hidden) return;
    const f = nodeAt(wrap.firstElementChild, v.fieldPaths[i]);
    if (f) { f.style.setProperty('visibility', 'hidden', 'important'); f.setAttribute('data-wa-hidden', ''); }
  });
  if (nodeBox) {
    const r = wrap.firstElementChild;
    r.style.setProperty('width', nodeBox.w + 'px', 'important');
    r.style.setProperty('height', nodeBox.h + 'px', 'important');
    r.style.setProperty('left', -(partBox.x - nodeBox.x) + 'px', 'important');
    r.style.setProperty('top', -(partBox.y - nodeBox.y) + 'px', 'important');
  }
  applyTheme(host, theme);
  await paintStates(wrap.firstElementChild, v, molecule, version, values, host); // 심볼 칸 — 상태값대로 칠한다
  let fit = 'ok';
  // 문구를 바꿨거나 버전 스타일(글자 크기 등)이 있으면 넘치는지 보고 맞춘다
  if (Object.keys(values).length || (version && version.version !== '1.0.0')) {
    await fontsReady();
    if (wrap.isConnected) {
      const node = wrap.firstElementChild, nodeH = node?.offsetHeight || 0;
      fit = fitMolecule(wrap.firstElementChild, { free: true, keys: changedKeys(molecule, values, version), originals: originalTexts(v, molecule) });
      // 칸이 넓어졌으면 감싸개도 내용에 맞춰 키운다 (캔버스에서 분자 상자 크기가 따라 바뀐다).
      // 좁힌 경우(tight)는 tighten 이 루트 폭을 px 로 정해 두어, 감싸개만 내용에 맞추면 된다.
      if (fit === 'grow' && box) {
        wrap.style.width = 'max-content'; wrap.style.height = 'auto'; wrap.style.minWidth = box.w + 'px'; wrap.style.minHeight = box.h + 'px';
        // 루트는 height:100% — 감싸개가 auto 가 되면 자식이 절대 위치인 루트(구성도 노드 등)는 높이 0 으로 무너진다. 원래 높이를 바닥으로 둔다.
        if (node && !nodeBox && !node.style.getPropertyValue('min-height')) setImp(node, 'min-height', nodeH + 'px');
      }
      if (fit === 'tight' && box) { wrap.style.width = 'max-content'; } // 루트 폭을 직접 줄였으므로 감싸개가 따라간다
    }
  }
  const resized = fit === 'grow' || fit === 'tight';
  const baseW = resized ? wrap.offsetWidth : box?.w || wrap.offsetWidth;
  const baseH = resized ? wrap.offsetHeight : box?.h || wrap.offsetHeight;
  // 원래 칸 밖으로 조금 나오는 글자 · 장식이 있다(오른쪽 정렬 글자는 왼쪽으로, 빛 번짐은 사방으로).
  // 실제로 칠해지는 범위를 재서 보여 줄 상자가 그 범위를 다 담게 하고, 왼쪽 · 위로 나온 만큼 안쪽으로 밀어 넣는다.
  // 여백(margin)으로 밀면 바깥 상자와 겹쳐 사라진다(마진 겹침) → 위치(left/top)로 옮긴다.
  wrap.style.removeProperty('left'); wrap.style.removeProperty('top');
  // 루트가 display:contents 면 자기 상자가 없어, 자식들이 원래 화면의 먼 조상 기준 좌표로 놓인다.
  // 루트(없으면 자식 합집합)의 실제 위치를 재서 원점으로 끌어온다. 떼어 낸 조각은 일부러 옮겨 두었으므로 제외.
  const wr = wrap.getBoundingClientRect();
  // 조립 화면 캔버스처럼 바깥이 축소돼 있으면 화면 좌표 = CSS px × k — 나눠서 CSS px 로 되돌린다
  const k = wrap.offsetWidth && wr.width ? wr.width / wrap.offsetWidth : 1;
  const rb0 = nodeBox ? { x: 0, y: 0 } : boxOf(wrap.firstElementChild, wr);
  const rb = { x: rb0.x / k, y: rb0.y / k };
  const vb0 = visualBounds(wrap);
  const vb = { minX: vb0.minX / k, minY: vb0.minY / k, maxX: vb0.maxX / k, maxY: vb0.maxY / k };
  const minX = Math.min(0, vb.minX - rb.x), minY = Math.min(0, vb.minY - rb.y);
  const maxX = Math.max(baseW, vb.maxX - rb.x), maxY = Math.max(baseH, vb.maxY - rb.y);
  const sx = -rb.x - minX, sy = -rb.y - minY;
  if (Math.abs(sx) > 0.5) wrap.style.setProperty('left', sx + 'px', 'important');
  if (Math.abs(sy) > 0.5) wrap.style.setProperty('top', sy + 'px', 'important');
  host.dataset.w = Math.ceil(maxX - minX);
  host.dataset.h = Math.ceil(maxY - minY);
  return { width: +host.dataset.w, height: +host.dataset.h, fit };
}

/** 감싸개 기준, 실제로 칠해지는 것(글자 · 그림 · 배경 · 테두리)의 범위 */
function visualBounds(wrap, o = wrap.getBoundingClientRect(), self = false) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = r => { if (!r.width || !r.height) return; minX = Math.min(minX, r.left - o.left); minY = Math.min(minY, r.top - o.top); maxX = Math.max(maxX, r.right - o.left); maxY = Math.max(maxY, r.bottom - o.top); };
  for (const e of self ? [wrap, ...wrap.querySelectorAll('*')] : wrap.querySelectorAll('*')) {
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const paints = e.tagName === 'IMG' || e.tagName.toLowerCase() === 'svg'
      || (cs.backgroundImage && cs.backgroundImage !== 'none')
      || !/rgba\([^)]*,\s*0\)|transparent/.test(cs.backgroundColor)
      || ['Top', 'Right', 'Bottom', 'Left'].some(k => parseFloat(cs['border' + k + 'Width']) > 0 && cs['border' + k + 'Style'] !== 'none');
    if (paints) add(e.getBoundingClientRect());
    for (const n of e.childNodes) if (n.nodeType === 3 && n.data.trim()) { const r = document.createRange(); r.selectNodeContents(n); add(r.getBoundingClientRect()); }
  }
  return minX === Infinity ? { minX: 0, minY: 0, maxX: 0, maxY: 0 } : { minX, minY, maxX, maxY };
}

/**
 * 템플릿 화면 전체를 1920×1080 으로 그린다.
 * opts: { template, molecules(Map), pins, versions(Map id→[versions]), overrides, theme, stripImages }
 */
export async function mountTemplate(host, opts) {
  const { template, molecules, pins = {}, overrides = {}, theme } = opts;
  const vs = await loadVariants(template.instances.map(i => i.variant));
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  const sheets = await Promise.all(template.sheets.map(templateSheet));
  const verCss = [];
  const pinnedVersion = mid => (opts.versions?.get(mid) || []).find(x => x.version === pins[mid]);
  for (const mid of new Set(template.instances.map(i => i.molecule))) {
    const ver = pinnedVersion(mid);
    if (ver) verCss.push(versionCss(mid, ver));
  }
  sheets.push(sheet('frame', ':host{display:block}.wa-frame{position:relative;width:1920px;height:1080px;overflow:hidden}'));
  if (verCss.length) { const s = new CSSStyleSheet(); s.replaceSync(verCss.join('\n')); sheets.push(s); }
  root.adoptedStyleSheets = sheets;
  const byId = new Map(template.instances.map(i => [i.id, i]));
  let html = template.skeleton.replace(/<!--wemb:molecule:([a-z\d-]+)-->/g, (_, id) => {
    const inst = byId.get(id), v = vs[inst.variant], m = molecules.get(inst.molecule);
    // 템플릿에 놓인 분자는 원래 문구가 곧 데이터다. 버전의 기본 문구는 덮지 않고, 화면에서 고친 값만 덮는다.
    return fillHtml(v, m.fields, overrides[id] || {});
  });
  if (opts.stripImages) html = html.replace(/(<img\b[^>]*?)\ssrc=/g, '$1 data-src=');
  const themeAttr = theme.mode === template.defaultTheme ? '' : ` data-theme="${theme.mode}"`;
  root.innerHTML = `<div class="wa-frame"><div class="${template.rootClass}"${themeAttr}>${html}</div></div>`;
  const rootEl = root.querySelector('.' + CSS.escape(template.rootClass));
  const elements = new Map();
  for (const inst of template.instances) {
    const el = nodeAt(rootEl, inst.locator?.path);
    if (!el) continue;
    tagMolecule(el, vs[inst.variant], molecules.get(inst.molecule).fields, inst.molecule, pins[inst.molecule], inst.id);
    elements.set(inst.id, el);
  }
  applyTheme(host, theme);
  // 심볼 칸 — 화면에서 고른 상태 · 고정한 버전의 상태 색
  if (!opts.stripImages) await Promise.all(template.instances.filter(i => elements.has(i.id) && (Object.keys(overrides[i.id] || {}).some(k => k.startsWith('@')) || pinnedVersion(i.molecule)?.states))
    .map(i => paintStates(elements.get(i.id), vs[i.variant], molecules.get(i.molecule), pinnedVersion(i.molecule), overrides[i.id] || {}, host)));
  // 화면에서 문구를 고친 분자 · 스타일 버전을 쓰는 분자는 자리에 맞춰 간격 · 글자 크기를 조절한다
  const fits = new Map();
  const touched = template.instances.filter(i => elements.has(i.id) && (overrides[i.id] || (pins[i.molecule] && pins[i.molecule] !== '1.0.0')));
  if (touched.length && !opts.stripImages) {
    await fontsReady();
    for (const inst of touched) {
      const keys = changedKeys(molecules.get(inst.molecule), overrides[inst.id] || {}, pinnedVersion(inst.molecule));
      if (keys.size && elements.get(inst.id).isConnected) fits.set(inst.id, fitMolecule(elements.get(inst.id), { keys, originals: originalTexts(vs[inst.variant], molecules.get(inst.molecule)) }));
    }
  }
  return { root: rootEl, elements, fits };
}

/* ── 측정: 템플릿을 화면 밖에 1:1 로 그려 분자마다 상자·물려받은 글자 스타일을 잰다 ── */
const INH = ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'white-space'];
function boxOf(el, origin) {
  const r = ownRect(el); // display:contents 등 자기 상자가 없으면 자손 합집합
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}
/* 글자의 실제 범위 — 칸보다 긴 오른쪽 정렬 글자는 칸 왼쪽으로 삐져나온다 */
function textBoxOf(el, origin) {
  const t = [...el.childNodes].find(n => n.nodeType === 3 && n.data.trim());
  if (!t) return null;
  const range = document.createRange();
  range.selectNodeContents(t);
  const r = range.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}
export function measureElements(rootEl, elements) {
  const origin = rootEl.getBoundingClientRect();
  const boxes = {};
  for (const [id, el] of elements) {
    const b = boxOf(el, origin);
    if (!(b.w > 0 && b.h > 0)) continue; // 숨겨진 상태(display:none 등) — 크기 없이 내용대로 그린다
    const parent = el.parentElement ? getComputedStyle(el.parentElement) : null;
    if (parent) b.inh = Object.fromEntries(INH.map(k => [k, parent.getPropertyValue(k)]).filter(([, v]) => v && !/[;{}<>\\]/.test(v) && v.length <= 200));
    boxes[id] = b;
  }
  return boxes;
}

/* ── 원본에서 가려진 글자 찾기 ──
   Figma 원본에는 다른 레이어 밑에 깔려 안 보이는 글자가 있다(예: 구성도 노드 'ACI 내부망' 위의 'T').
   통째로 그리면 원본처럼 가려지지만, 심볼 · 라벨을 떼어 그리면 덮개가 없어져 드러난다.
   그래서 잴 때 '뒤에 그려지는(문서 순서상 나중) 불투명한 그림 · 면이 글자 상자를 완전히 덮는지'를 기록해 둔다. */
// 불투명하게 칠하는 요소인가 — 그림(img · svg) 또는 거의 불투명한 배경. 조상까지 곱한 투명도가 0.9 미만이면 빛 번짐 같은 덧그림으로 본다
function paintsOver(el, stop) {
  let alpha = 1;
  for (let n = el; n && n !== stop; n = n.parentElement) alpha *= Number(getComputedStyle(n).opacity) || 0;
  if (alpha < 0.9) return false;
  if (el.tagName === 'IMG' || el.tagName.toLowerCase() === 'svg') return true;
  const cs = getComputedStyle(el);
  if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
  const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
  if (!m) return false;
  const a = m[1].split(/[\s,/]+/).filter(Boolean)[3];
  return a === undefined || Number(a) >= 0.9;
}
const textRectOf = f => {
  const text = [...f.childNodes].find(n => n.nodeType === 3 && n.data.trim());
  const range = document.createRange();
  if (text) range.selectNodeContents(text); else range.selectNodeContents(f);
  return range.getBoundingClientRect();
};
/** 1단계(화면 밖, 1:1) — 글자 필드의 분자 안 위치 */
/** 요소의 실제 상자 — display:contents 면 자식 합집합 */
function ownRect(el) {
  const r = el.getBoundingClientRect();
  if (r.width || r.height) return r;
  const rs = [...el.children].map(ownRect).filter(x => x.width || x.height);
  if (!rs.length) return r;
  const left = Math.min(...rs.map(x => x.left)), top = Math.min(...rs.map(x => x.top));
  return { left, top, width: Math.max(...rs.map(x => x.right)) - left, height: Math.max(...rs.map(x => x.bottom)) - top, right: Math.max(...rs.map(x => x.right)), bottom: Math.max(...rs.map(x => x.bottom)) };
}
function measureFieldBoxes(template, elements) {
  const out = new Map();
  for (const inst of template.instances) {
    const v = variant(inst.variant), el = elements.get(inst.id);
    if (!v || !el) continue;
    const b0 = boxOf(el, { left: 0, top: 0 }); // display:contents 루트는 자식 합집합
    const base = { left: b0.x, top: b0.y };
    const fields = {};
    v.order.forEach((key, fi) => {
      const f = nodeAt(el, v.fieldPaths[fi]);
      if (!f) return;
      const r = textRectOf(f);
      fields[key] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    });
    out.set(inst.id, fields);
  }
  return out;
}
/* 그림의 그 지점 픽셀이 불투명한가 — 연결선 · 빛 번짐 그림은 상자만 크고 대부분 투명하다 */
const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) imageCache.set(src, new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  return imageCache.get(src);
}
let pixelCtx = null;
async function opaqueAt(img, x, y) {
  const src = img.getAttribute('data-src') || img.getAttribute('src');
  if (!src) return false;
  // 다른 출처 그림은 픽셀을 읽을 수 없다(읽으려 하면 캔버스가 오염돼 이후 모든 판정이 막힌다) → 덮개로 보지 않는다
  if (new URL(src, location.href).origin !== location.origin) return false;
  const im = await loadImage(src);
  if (!im) return false;
  const r = img.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  pixelCtx ||= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const c = pixelCtx.canvas;
  if (c.width < w) c.width = w;
  if (c.height < h) c.height = h;
  pixelCtx.clearRect(0, 0, w, h);
  pixelCtx.drawImage(im, 0, 0, w, h); // Figma 내보내기 그림은 칸에 맞춰 늘려 그린다(preserveAspectRatio none)
  const px = Math.min(w - 1, Math.max(0, Math.floor(x - r.left))), py = Math.min(h - 1, Math.max(0, Math.floor(y - r.top)));
  try { return pixelCtx.getImageData(px, py, 1, 1).data[3] >= 200; }
  catch { pixelCtx = null; return false; } // 혹시 오염되면 캔버스를 새로 만든다
}

/** 2단계(화면 안, 투명) — 브라우저에 그 지점의 실제 쌓임 순서를 물어 원본에서 가려진 글자를 찾는다.
 *  글자 가운데 · 왼쪽 · 오른쪽 세 점이 모두 '같은 분자 안에서' 글자보다 위에 있는 불투명한 그림 · 면에 덮였으면 가려진 것. */
async function markHidden(shadow, rootEl, template, elements, fieldBoxes) {
  for (const inst of template.instances) {
    const v = variant(inst.variant), el = elements.get(inst.id), fields = fieldBoxes.get(inst.id);
    if (!v || !el || !fields) continue;
    for (const [fi, key] of v.order.entries()) {
      const f = nodeAt(el, v.fieldPaths[fi]);
      if (!f || !fields[key]) continue;
      let hidden = false;
      for (let n = f; n && n !== rootEl && !hidden; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') hidden = true; }
      const r = textRectOf(f);
      if (!hidden && (!r.width || !r.height)) hidden = true;
      if (!hidden) {
        const y = r.top + r.height / 2;
        hidden = true;
        for (const t of [0.5, 0.2, 0.8]) {
          const x = r.left + r.width * t;
          let covered = false;
          for (const e of shadow.elementsFromPoint(x, y)) {
            if (e === f || e.contains(f)) break;          // 글자(또는 그 조상)까지 왔는데 덮개가 없었다
            // 분자 '자기 안'의 레이어가 덮은 경우만 센다. 팝업 · 전체 덮개처럼 분자 바깥이 덮은 것은 그 화면의 사정이지 분자의 성질이 아니다
            if (f.contains(e) || !el.contains(e) || !paintsOver(e, rootEl)) continue;
            if (e.tagName === 'IMG' ? await opaqueAt(e, x, y) : true) { covered = true; break; }
          }
          if (!covered) { hidden = false; break; }
        }
      }
      if (hidden) fields[key].hidden = true;
    }
    // 떠돌이 글자 — 같은 분자 안의 다른 글자와 크게 겹치는 1~2자짜리 글자. Figma 원본 자체의 실수다
    // (예: HANA 네트워크현황 02 'ACI 내부망' 위의 'T'). 템플릿 화면은 원본 그대로 두고, 따로 쓸 때만 숨긴다.
    const vis = v.order.map((key, fi) => ({ key, f: nodeAt(el, v.fieldPaths[fi]), b: fields[key] })).filter(x => x.f && x.b && !x.b.hidden && x.b.w && x.b.h);
    for (const a of vis) for (const c of vis) {
      if (a === c || a.f.textContent.trim().length > 2 || c.f.textContent.trim().length <= a.f.textContent.trim().length) continue;
      const w = Math.min(a.b.x + a.b.w, c.b.x + c.b.w) - Math.max(a.b.x, c.b.x), h = Math.min(a.b.y + a.b.h, c.b.y + c.b.h) - Math.max(a.b.y, c.b.y);
      if (w > 1 && h > 1 && w * h > 0.3 * a.b.w * a.b.h) fields[a.key].hidden = true;
    }
  }
}

/** 페이지 구역 · 유기체 상자 — 경로 '0.3.1' → 페이지 기준 {x,y,w,h} (1:1 로 그린 상태에서) */
function measureRects(rootEl, template) {
  const o = rootEl.getBoundingClientRect(), out = {};
  for (const p of [...(template.regions || []), ...(template.sections || [])]) {
    const el = nodeAt(rootEl, p.path);
    if (!el) continue;
    const r = ownRect(el);
    if (r.width > 0 && r.height > 0) out[p.path.join('.')] = { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  }
  return out;
}

/** 유기체(구역) 한 개 — 페이지를 그린 뒤 그 구역만 보이게 잘라 보여 준다.
 *  구역은 페이지 배치(격자 · 부모 크기)에 기대어 있어 떼어 그리지 않는다. rect = 잰 상자(없으면 그려서 잰다) */
export async function mountSection(host, { template, path, theme, rect = null }) {
  host.style.overflow = '';
  const prev = host.style.transform;
  host.style.transform = 'none';
  try {
    const { root: rootEl } = await mountTemplate(host, { template, molecules: registry, theme, stripImages: true });
    const frame = host.shadowRoot.querySelector('.wa-frame');
    const el = nodeAt(rootEl, path);
    if (!el) return { width: 0, height: 0 };
    rootEl.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    for (const img of el.querySelectorAll('img[data-src]')) img.setAttribute('src', img.getAttribute('data-src'));
    let box = rect;
    const fr = frame.getBoundingClientRect();
    // 조상이 배율로 그려지면(조립 화면 '맞춤' 등) 화면 좌표도 그만큼 줄어 있다 → 1920 기준 좌표로 되돌린다
    const k = frame.offsetWidth ? fr.width / frame.offsetWidth : 1;
    if (!box) { const r = ownRect(el); box = { x: (r.left - fr.left) / k, y: (r.top - fr.top) / k, w: r.width / k, h: r.height / k }; }
    if (!(box.w > 0 && box.h > 0)) return { width: 0, height: 0 };
    // 실제로 칠해진 범위로 좁힌다 — 화면 폭을 다 차지하지만 글자는 왼쪽에만 있는 Breadcrumb 같은 구역이 점으로 보이지 않게
    const v = visualBounds(el, fr, true), vb = { minX: v.minX / k, minY: v.minY / k, maxX: v.maxX / k, maxY: v.maxY / k };
    if (vb.maxX > vb.minX && vb.maxY > vb.minY) {
      const x1 = Math.max(box.x, vb.minX), y1 = Math.max(box.y, vb.minY), x2 = Math.min(box.x + box.w, vb.maxX), y2 = Math.min(box.y + box.h, vb.maxY);
      if (x2 - x1 > 4 && y2 - y1 > 4) box = { x: x1 - 4, y: y1 - 4, w: x2 - x1 + 8, h: y2 - y1 + 8 };
    }
    frame.style.transform = `translate(${-box.x}px, ${-box.y}px)`;
    host.style.overflow = 'hidden';
    host.dataset.w = Math.ceil(box.w); host.dataset.h = Math.ceil(box.h);
    return { width: +host.dataset.w, height: +host.dataset.h };
  } finally { host.style.transform = prev; }
}
/** 페이지 한 장 — 원본 화면 그대로 1920×1080 */
export async function mountPage(host, { template, theme }) {
  host.style.overflow = 'hidden';
  await mountTemplate(host, { template, molecules: registry, theme });
  return { width: 1920, height: 1080 };
}

export async function measureTemplate(template, molecules) {
  const host = document.createElement('div');
  // visibility:hidden 으로 숨기면 안쪽 글자에도 물려 내려가 '가려진 글자' 판정이 틀어진다 → 투명도로 숨긴다
  host.style.cssText = 'position:fixed;left:-30000px;top:0;width:1920px;height:1080px;pointer-events:none;opacity:0';
  document.body.append(host);
  try {
    const { root, elements } = await mountTemplate(host, { template, molecules, theme: { mode: template.defaultTheme, seed: null }, stripImages: true });
    // 창이 가려져 있으면 requestAnimationFrame 이 멈춘다. 레이아웃은 getBoundingClientRect 가 동기로 계산하므로 타이머로 충분하다.
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
    await new Promise(r => setTimeout(r, 30));
    const boxes = measureElements(root, elements);
    // 구성도 노드 — 심볼 묶음 · 라벨 묶음 각각의 상자 (분리 등록한 조각을 원래 모양대로 보여 줄 때 쓴다)
    const origin = root.getBoundingClientRect();
    for (const inst of template.instances) {
      const split = variant(inst.variant)?.split, el = elements.get(inst.id);
      if (!split || !el || !boxes[inst.id]) continue;
      const parts = {};
      for (const [part, idx] of Object.entries(split)) {
        // 묶음 칸보다 안쪽 그림 레이어(빛 번짐 · 옆면 등)가 더 크게 삐져나오므로, 자손까지 모두 합친 범위를 잰다
        const all = n => [n, ...[...n.children].flatMap(all)];
        const kids = idx.map(i => el.children[i]).filter(Boolean).flatMap(all);
        const rs = [...kids.map(c => boxOf(c, origin)), ...kids.map(c => textBoxOf(c, origin))].filter(b => b && b.w > 0 && b.h > 0);
        if (!rs.length) continue;
        const x = Math.min(...rs.map(b => b.x)), y = Math.min(...rs.map(b => b.y));
        parts[part] = { x, y, w: Math.max(...rs.map(b => b.x + b.w)) - x, h: Math.max(...rs.map(b => b.y + b.h)) - y };
      }
      if (Object.keys(parts).length) boxes[inst.id].parts = parts;
    }
    // 구역 · 유기체 상자 — 화면 밖 1:1 일 때 잰다 (아래에서 화면 안으로 옮기면 배율이 걸린다)
    const rects = measureRects(root, template);
    // 글자 필드마다 — 분자 안 위치(1:1)와, 원본에서 실제로 보이는지(쌓임 순서 확인은 화면 안에서만 된다)
    const fieldBoxes = measureFieldBoxes(template, elements);
    const scale = Math.min(1, innerWidth / 1920, innerHeight / 1080);
    host.style.cssText = `position:fixed;left:0;top:0;width:1920px;height:1080px;transform:scale(${scale});transform-origin:0 0;opacity:0;z-index:2147483647`;
    await new Promise(r => setTimeout(r, 30));
    await markHidden(host.shadowRoot, root, template, elements, fieldBoxes);
    for (const [iid, fields] of fieldBoxes) if (boxes[iid]) boxes[iid].fields = fields;
    // 따로 그려 보기 — 글자 위치가 원본과 2px 넘게 다르면 이 분자는 문맥 그리기(ctx)로 보여 준다
    registry ||= molecules;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-30000px;top:0;pointer-events:none;opacity:0';
    document.body.append(probe);
    try {
      for (const inst of template.instances) {
        const b = boxes[inst.id], v = variant(inst.variant), m = molecules.get(inst.molecule);
        if (!b?.fields || !v || !m) continue;
        const one = document.createElement('div');
        probe.append(one);
        await mountMolecule(one, { molecule: m, variantId: inst.variant, version: null, theme: { mode: template.defaultTheme, seed: null }, box: b, noContext: true });
        const r0 = one.shadowRoot.firstElementChild.firstElementChild;
        const base = ownRect(r0);
        const off = v.order.some((key, i) => {
          const want = b.fields[key], f = nodeAt(r0, v.fieldPaths[i]);
          if (!want || want.hidden || !f) return false;
          const got = textRectOf(f);
          return Math.abs(got.left - base.left - want.x) > 2 || Math.abs(got.top - base.top - want.y) > 2;
        });
        if (off) b.ctx = true;
        one.remove();
        // 떼어 낸 심볼 · 라벨 조각도 따로 그려 본다 (노드는 괜찮아도 조각만 어긋나는 경우가 있다)
        if (!b.ctx && v.split && b.parts) {
          for (const part of ['label', 'symbol']) {
            const pid = inst.variant + '~' + part, pv = (await loadVariants([pid]))[pid], pb = b.parts[part];
            const pm = pv && registry.get(pv.molecule);
            if (!pv || !pb || !pm || !pv.order.length) continue;
            const two = document.createElement('div');
            probe.append(two);
            await mountMolecule(two, { molecule: pm, variantId: pid, version: null, theme: { mode: template.defaultTheme, seed: null }, box: b, noContext: true });
            const w = two.shadowRoot.firstElementChild, o = w.getBoundingClientRect(), pr = w.firstElementChild;
            const bad = pv.order.some((key, i) => {
              const want = b.fields[key], f = nodeAt(pr, pv.fieldPaths[i]);
              if (!want || want.hidden || !f) return false;
              const got = textRectOf(f);
              return Math.abs(got.left - o.left - (want.x - (pb.x - b.x))) > 2 || Math.abs(got.top - o.top - (want.y - (pb.y - b.y))) > 2;
            });
            two.remove();
            if (bad) { b.ctx = true; break; }
          }
        }
      }
    } finally { probe.remove(); }
    await api('api/measure/' + template.id, { method: 'POST', body: { boxes, rects } });
    return { boxes, rects };
  } finally { host.remove(); }
}
