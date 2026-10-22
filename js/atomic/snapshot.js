/* ── PNG 내보내기 — 분자 · 유기체 · 조립 화면을 그림 파일로 ──
   분자 · 페이지 그림은 섀도 DOM 안에 있고, 템플릿마다 클래스 번호(x211)가 겹쳐 스타일시트를 한 문서로 모을 수 없다.
   그래서 '지금 그려진 계산 스타일'을 요소마다 그대로 적어 복제하고(섀도 DOM 도 펼쳐서), 그림 · 글꼴은 data: 로 넣은
   SVG(foreignObject)를 캔버스에 그린다. html2canvas 처럼 화면을 처음부터 다시 그리지 않아 숨은 창에서도 멈추지 않는다.

   · 상속되는 속성은 부모와 다를 때만, 상속 안 되는 속성은 초기값과 다를 때만 적는다(나머지는 all:unset 이 맞춰 준다).
   · ::before / ::after 는 글자가 있으면 span 으로 옮긴다.
   · 섀도 루트마다 id 앞에 접두어를 붙인다 — 다른 템플릿의 같은 그라데이션 id(paint0 …)가 서로 덮지 않게.
   · 글꼴은 실제로 쓴 글꼴 · 글자 범위(unicode-range)만 넣는다. */

const XHTML = 'http://www.w3.org/1999/xhtml';
const SVGNS = 'http://www.w3.org/2000/svg';
const SKIP_TAGS = new Set(['style', 'script', 'link', 'template', 'noscript', 'iframe', 'video', 'audio', 'object', 'embed', 'title', 'desc', 'metadata']);
// -webkit-border-image 는 border-image 의 옛 별칭인데 적으면 fill 이 붙어 그라데이션 테두리가 판 전체를 칠한다
const SKIP_PROP = /^(--|-webkit-border-image|-webkit-mask-box-image|transition|animation|will-change|cursor|pointer-events|user-select|-webkit-user-select|caret-color|scroll-|overscroll|touch-action|content-visibility|contain-intrinsic|view-transition|anchor-|position-anchor|position-try|interpolate-size)/;
const INHERITED = new Set(('color font-family font-size font-style font-weight font-variant font-stretch font-kerning font-feature-settings font-variation-settings font-optical-sizing ' +
  'font-variant-ligatures font-variant-caps font-variant-numeric font-variant-east-asian font-variant-alternates font-variant-position font-synthesis-weight font-synthesis-style font-synthesis-small-caps font-palette font-size-adjust ' +
  'letter-spacing word-spacing line-height text-align text-align-last text-indent text-transform text-shadow white-space white-space-collapse text-wrap text-wrap-mode text-wrap-style word-break overflow-wrap word-wrap hyphens line-break ' +
  'tab-size text-rendering -webkit-font-smoothing text-underline-position text-underline-offset text-decoration-skip-ink text-emphasis-color text-emphasis-position text-emphasis-style ' +
  'direction writing-mode text-orientation unicode-bidi visibility list-style-type list-style-position list-style-image quotes border-collapse border-spacing caption-side empty-cells ' +
  'fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit paint-order marker-start marker-mid marker-end ' +
  'clip-rule color-interpolation color-interpolation-filters shape-rendering text-anchor dominant-baseline image-rendering color-scheme forced-color-adjust print-color-adjust ' +
  '-webkit-text-fill-color -webkit-text-stroke-color -webkit-text-stroke-width -webkit-text-security -webkit-locale -webkit-rtl-ordering ruby-position orphans widows').split(' '));

/* 초기값 — all:initial 인 요소의 계산 스타일(태그 · 이름공간마다 한 번) */
let sandbox = null;
const initialCache = new Map();
function initialOf(el) {
  const key = el.namespaceURI + '|' + el.localName;
  if (initialCache.has(key)) return initialCache.get(key);
  if (!sandbox) {
    sandbox = document.createElement('div');
    sandbox.setAttribute('aria-hidden', 'true');
    sandbox.style.cssText = 'position:fixed;left:-99999px;top:0;width:10px;height:10px;overflow:hidden;contain:strict';
    document.body.append(sandbox);
  }
  const probe = el.namespaceURI === SVGNS ? document.createElementNS(SVGNS, el.localName) : document.createElement(el.localName);
  probe.style.cssText = 'all:initial';
  const holder = el.namespaceURI === SVGNS && el.localName !== 'svg' ? document.createElementNS(SVGNS, 'svg') : null;
  if (holder) { holder.append(probe); sandbox.append(holder); } else sandbox.append(probe);
  const cs = getComputedStyle(probe), map = new Map();
  for (let i = 0; i < cs.length; i++) map.set(cs[i], cs.getPropertyValue(cs[i]));
  (holder || probe).remove();
  initialCache.set(key, map);
  return map;
}

/* 선 굵기는 선 모양이 none 이면 0 으로 계산된다 — 초기값(none)과 같아 보여도, 모양만 적고 굵기를 빠뜨리면 복제본은 medium(3px)이 된다 */
const ALWAYS = new Set(['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'outline-width', 'column-rule-width']);
function styleText(cs, init, parentCs, rewrite) {
  let t = '';
  for (let i = 0; i < cs.length; i++) {
    const p = cs[i];
    if (SKIP_PROP.test(p)) continue;
    const v = cs.getPropertyValue(p);
    if (!ALWAYS.has(p) && (INHERITED.has(p) ? parentCs && parentCs.getPropertyValue(p) === v : init.get(p) === v)) continue;
    t += p + ':' + rewrite(v) + ';';
  }
  return t;
}

const URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g; // 스타일시트 글(@font-face src)용 — 계산 스타일에는 mapUrls 를 쓴다
/** url(…) 토큰마다 fn(주소) 로 바꾼다. 따옴표 · 이스케이프를 따라 토큰 하나를 통째로 넘기므로,
    data: 주소 안에 든 url(%23grad) 같은 것을 따로 잡지 않는다(잡으면 그림이 깨지고 없는 주소를 부른다). */
function mapUrls(str, fn) {
  let out = '', i = 0;
  for (;;) {
    const at = str.indexOf('url(', i);
    if (at < 0) return out + str.slice(i);
    let j = at + 4;
    while (str[j] === ' ') j++;
    const q = str[j] === '"' || str[j] === "'" ? str[j] : '';
    let k = q ? j + 1 : j, u = '';
    for (; k < str.length; k++) {
      const c = str[k];
      if (c === '\\' && q) { u += str[k + 1]; k++; continue; }
      if (q ? c === q : c === ')') break;
      u += c;
    }
    const end = str.indexOf(')', q ? k + 1 : k);
    if (end < 0) return out + str.slice(i);
    const rep = fn(q ? u : u.trim());
    out += str.slice(i, at) + (rep == null ? str.slice(at, end + 1) : 'url("' + rep.replace(/["\\]/g, '\\$&') + '")');
    i = end + 1;
  }
}
/* 섀도 루트 안의 id 참조를 접두어 붙은 id 로 — url(#a) · url("http://…#a") · href="#a" */
function idRewriter(prefix) {
  if (!prefix) return (v) => v;
  return (v) => (v.includes('url(') ? mapUrls(v, (u) => {
    const i = u.indexOf('#');
    if (i < 0 || u.startsWith('data:')) return null;
    const before = u.slice(0, i);
    if (before && before !== location.href.split('#')[0]) return null;
    return '#' + prefix + u.slice(i + 1);
  }) : v);
}

const SPAN = document.createElement('span');
function pseudoSpan(live, which, liveCs, rewrite) {
  const ps = getComputedStyle(live, which);
  const content = ps.getPropertyValue('content');
  if (!content || content === 'none' || content === 'normal') return null;
  const m = /^(["'])(.*)\1$/.exec(content.trim());
  const text = m ? m[2].replace(/\\([0-9a-f]{1,6})\s?/gi, (x, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/\\(.)/g, '$1') : '';
  if (!m && !/^url\(/.test(content.trim())) return null;
  const span = document.createElementNS(XHTML, 'span');
  span.setAttribute('data-pseudo', which.slice(2));
  span.setAttribute('style', styleText(ps, initialOf(SPAN), liveCs, rewrite).replace(/(^|;)content:[^;]*;/, '$1'));
  if (text) span.textContent = text;
  return span;
}

/** live 를 그려진 모습 그대로 복제한다. ctx = { prefix, rewrite, n } */
function cloneNode(live, parentCs, ctx, rootOverride) {
  if (live.nodeType === 3) return document.createTextNode(live.data);
  if (live.nodeType !== 1 || SKIP_TAGS.has(live.localName.toLowerCase())) return null;
  const cs = getComputedStyle(live);
  if (cs.display === 'none') return null;
  const svg = live.namespaceURI === SVGNS;
  const c = svg ? document.createElementNS(SVGNS, live.localName) : document.createElementNS(XHTML, live.localName === 'slot' ? 'span' : live.localName);
  for (const a of live.attributes) {
    const n = a.name;
    if (n === 'style' || n === 'class' || n.startsWith('on') || n === 'contenteditable' || n === 'draggable' || n === 'tabindex' || n === 'srcset' || n === 'loading') continue;
    let v = a.value;
    if (n === 'id' && ctx.prefix) v = ctx.prefix + v;
    else if ((n === 'href' || n === 'xlink:href') && v.startsWith('#') && ctx.prefix) v = '#' + ctx.prefix + v.slice(1);
    else v = ctx.rewrite(v);
    try { a.namespaceURI ? c.setAttributeNS(a.namespaceURI, n, v) : c.setAttribute(n, v); } catch (e) {}
  }
  let st = styleText(cs, initialOf(live), parentCs, ctx.rewrite);
  if (svg && live.localName === 'svg' && !(live.parentNode && live.parentNode.namespaceURI === SVGNS)) st += 'overflow:' + cs.overflow + ';'; // 바깥 svg 는 UA 기본이 hidden
  if (rootOverride) st += rootOverride;
  c.setAttribute('style', st);
  if (live.localName === 'img') { c.setAttribute('src', live.currentSrc || live.src); c.removeAttribute('data-src'); }
  if (live.localName === 'input' || live.localName === 'textarea') c.setAttribute('value', live.value);
  if (live.localName === 'canvas') {
    const im = document.createElementNS(XHTML, 'img');
    try { im.setAttribute('src', live.toDataURL()); } catch (e) {}
    im.setAttribute('style', st);
    return im;
  }
  const before = !svg && pseudoSpan(live, '::before', cs, ctx.rewrite);
  if (before) c.append(before);
  // 섀도 루트는 펼친다 — 그 안은 새 접두어(id 충돌 방지)
  let kids = live.childNodes, inner = ctx;
  if (live.shadowRoot) {
    kids = live.shadowRoot.childNodes;
    const prefix = 's' + ++ctx.n.v + '-';
    inner = { prefix, rewrite: idRewriter(prefix), n: ctx.n };
  }
  for (const k of kids) { const kc = cloneNode(k, cs, inner); if (kc) c.append(kc); }
  const after = !svg && pseudoSpan(live, '::after', cs, ctx.rewrite);
  if (after) c.append(after);
  return c;
}

/* ── 그림 · 글꼴을 data: 로 ── */
const dataCache = new Map();
function toData(url) {
  if (/^data:/.test(url)) return Promise.resolve(url);
  if (!dataCache.has(url)) {
    dataCache.set(url, fetch(url).then((r) => (r.ok ? r.blob() : null)).then((b) => b && new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); })).catch(() => null));
  }
  return dataCache.get(url);
}
async function inlineUrls(root) {
  const jobs = [];
  const abs = (u, base) => { try { return new URL(u, base || location.href).href; } catch (e) { return null; } };
  for (const el of root.querySelectorAll('*')) {
    if (el.localName === 'img' && el.getAttribute('src')) {
      const u = abs(el.getAttribute('src'));
      if (u) jobs.push(toData(u).then((d) => (d ? el.setAttribute('src', d) : el.removeAttribute('src'))));
    }
    if (el.localName === 'image') {
      for (const n of ['href', 'xlink:href']) {
        const v = el.getAttribute(n); if (!v || v.startsWith('#')) continue;
        const u = abs(v); if (u) jobs.push(toData(u).then((d) => d && el.setAttribute(n, d)));
      }
    }
    const st = el.getAttribute('style');
    if (st && st.includes('url(')) {
      const found = [];
      mapUrls(st, (u) => { if (!u.startsWith('#') && !u.startsWith('data:')) found.push(u); return null; });
      if (found.length) jobs.push(Promise.all(found.map((u) => toData(abs(u)))).then((ds) => {
        const got = new Map(found.map((u, i) => [u, ds[i]]));
        el.setAttribute('style', mapUrls(el.getAttribute('style'), (u) => (got.has(u) ? got.get(u) || '' : null)));
      }));
    }
  }
  await Promise.all(jobs);
}

/* 문서에 실린 @font-face 중 쓴 글꼴 · 쓴 글자 범위만 */
async function fontFaces() {
  const out = [];
  const take = (text, base) => {
    for (const m of text.matchAll(/@font-face\s*{[^}]*}/g)) out.push({ css: m[0], base });
  };
  const walk = async (sheet, base) => {
    let rules;
    try { rules = sheet.cssRules; } catch (e) {
      if (sheet.href) { try { take(await (await fetch(sheet.href)).text(), sheet.href); } catch (err) {} }
      return;
    }
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) out.push({ css: r.cssText, base: sheet.href || base });
      else if (r.type === CSSRule.IMPORT_RULE) {
        if (r.styleSheet) await walk(r.styleSheet, r.href);
      }
    }
  };
  for (const s of document.styleSheets) await walk(s, location.href);
  return out;
}
function inRange(range, codes) {
  if (!range) return true;
  return range.split(',').some((part) => {
    const p = part.trim().replace(/^u\+/i, '');
    let lo, hi;
    if (p.includes('?')) { lo = parseInt(p.replace(/\?/g, '0'), 16); hi = parseInt(p.replace(/\?/g, 'f'), 16); }
    else if (p.includes('-')) { const [a, b] = p.split('-'); lo = parseInt(a, 16); hi = parseInt(b, 16); }
    else lo = hi = parseInt(p, 16);
    for (const c of codes) if (c >= lo && c <= hi) return true;
    return false;
  });
}
const famName = (f) => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
const faceFamily = (css) => famName((/font-family\s*:\s*([^;]+)/i.exec(css) || [])[1] || '');
/** 글자가 실제로 쓰는 (글꼴, 굵기) — 글꼴 목록에서 @font-face 가 있는 첫 글꼴. 복제본은 상속을 지웠으니 원래 요소 기준으로 모은다 */
function usedFaces(live, declared, out = new Map()) {
  const walk = (el) => {
    if (el.nodeType !== 1) return;
    if ([...el.childNodes].some((k) => k.nodeType === 3 && k.data.trim())) {
      const cs = getComputedStyle(el);
      const fam = cs.fontFamily.split(',').map(famName).find((f) => declared.has(f));
      if (fam) {
        const codes = out.get(fam) || { weights: new Set(), codes: new Set() };
        codes.weights.add(parseFloat(cs.fontWeight) || 400);
        for (const ch of el.textContent) codes.codes.add(ch.codePointAt(0));
        out.set(fam, codes);
      }
    }
    for (const k of el.shadowRoot ? el.shadowRoot.childNodes : el.childNodes) walk(k);
  };
  walk(live);
  return out;
}
const weightRange = (css) => {
  const d = ((/font-weight\s*:\s*([^;}]+)/i.exec(css) || [])[1] || '400').trim().replace('normal', '400').replace('bold', '700');
  const [lo, hi = lo] = d.split(/\s+/).map(Number);
  return [lo, hi];
};
async function fontCss(live) {
  const all = await fontFaces();
  const declared = new Set(all.map(({ css }) => faceFamily(css)));
  const used = usedFaces(live, declared);
  if (!used.size) return '';
  // 쓴 굵기마다 가장 가까운 굵기의 글꼴 하나씩(글자 범위가 나뉜 글꼴은 그 범위마다)
  const faces = new Set();
  for (const [fam, u] of used) {
    const cands = all.filter(({ css }) => faceFamily(css) === fam && inRange((/unicode-range\s*:\s*([^;}]+)/i.exec(css) || [])[1], u.codes));
    for (const w of u.weights) {
      const dist = (f) => { const [lo, hi] = weightRange(f.css); return w < lo ? lo - w : w > hi ? w - hi : 0; };
      const best = Math.min(...cands.map(dist));
      cands.filter((f) => dist(f) === best).forEach((f) => faces.add(f));
    }
  }
  let total = 0;
  const parts = await Promise.all([...faces].map(async ({ css, base }) => {
    const srcs = [...css.matchAll(URL_RE)].map((m) => m[2]);
    const pick = srcs.find((u) => /woff2/i.test(u)) || srcs[0];
    if (!pick) return '';
    const d = await toData(new URL(pick, base).href);
    if (!d || (total += d.length) > 30e6) return ''; // 글꼴이 너무 크면 그만 넣는다(그 글자는 기본 글꼴)
    return css.replace(/src\s*:[^;}]+/i, 'src: url(' + d + ')');
  }));
  return parts.join('\n');
}

/**
 * el 을 PNG Blob 으로. width · height = 잘라 낼 크기(원래 px), root = 맨 바깥에 덧붙일 스타일(배율 · 위치 해제 등)
 * @returns {Promise<Blob>}
 */
export async function snapshot(el, opts = {}) {
  const { width, height, scale = 2 } = opts;
  const svg = await svgOf(el, opts);
  // blob: 주소로 그린 foreignObject 는 캔버스를 '오염'시켜 PNG 로 못 뽑는다 — data: 주소로 그린다
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('그림으로 바꾸지 못했어요.')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  const cv = document.createElement('canvas');
  cv.width = Math.round(width * scale); cv.height = Math.round(height * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return await new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('PNG 로 만들지 못했어요.'))), 'image/png'));
}

/** el 을 그려진 모습 그대로 담은 SVG 글(그림 · 글꼴 포함) */
export async function svgOf(el, { width, height, background = null, root = 'transform:none;left:0;top:0;margin:0;position:relative;' } = {}) {
  const n = { v: 0 };
  const clone = cloneNode(el, null, { prefix: '', rewrite: (v) => v, n }, root + 'width:' + width + 'px;height:' + height + 'px;');
  if (!clone) throw new Error('보이는 것이 없어 그림으로 만들 수 없어요.');
  const wrap = document.createElementNS(XHTML, 'div');
  wrap.setAttribute('style', `display:block;width:${width}px;height:${height}px;overflow:hidden;position:relative;${background ? 'background:' + background + ';' : ''}`);
  wrap.append(clone);
  await inlineUrls(wrap);
  const fonts = await fontCss(el);
  const reset = document.createElementNS(XHTML, 'style');
  // all:unset — 복제본에는 원래 스타일시트가 없다. 적지 않은 속성은 '상속 또는 초기값'이 되어 계산 스타일과 같아진다(svg 안쪽은 그림 속성을 지우지 않게 뺀다)
  reset.textContent = fonts + '\n*:not(svg):not(svg *):not(style){all:unset}style{display:none!important}';
  wrap.prepend(reset);
  const xml = new XMLSerializer().serializeToString(wrap);
  return `<svg xmlns="${SVGNS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject x="0" y="0" width="${width}" height="${height}">${xml}</foreignObject></svg>`;
}

/** 파일로 내려받기 */
export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[\\/:*?"<>|]+/g, '_') + '.png';
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
