/* ── 심볼 상태 ─────────────────────────────────────────────
   심볼 · 배지의 색은 분자 전체 색이 아니라 상태값(심각 · 경계 · 주의 · 정상 · 기본)에 딸린 색이다.
   원본 Figma 도 상태마다 같은 그림을 다른 색으로 칠해 둔다(HANA 서버 심볼: 기본 회색 · 정상 청록 · 주의 올리브 · 경계 갈색 · 심각 적갈색).

   칸(slot) — 서버(lib/states.mjs · library.mjs)가 찾아 준 '상태를 값으로 갖는 자리'.
     · 심볼 칸 (v.slots: HANA data-hn-status 심볼, 구성도 노드의 심볼 묶음) — 칸 안 그림 전체를 상태 색으로 다시 칠한다
     · 분자 전체 상태 (m.slots[0].root: 배지 · 줄) — 원래 상태 색 계열(v.stateHue)인 색만 다시 칠한다
   값 — 배치마다 props['@칸'] = 상태. 색 — 버전 states[상태] = 테마 토큰(없으면 WEMB 상태 기본색).
   원래 상태 그대로이고 버전에서 그 상태 색을 정하지 않았으면 원본 그림을 건드리지 않는다. */

export const STATES = ['critical', 'major', 'warning', 'normal', 'basic'];
export const STATE_LABELS = { critical: '심각', major: '경계', warning: '주의', normal: '정상', basic: '기본' };
// WEMB 상태 기본색 — HANA 네트워크현황 범례(status-level)의 심각 · 경계 · 주의 · 정상 색
export const STATE_COLORS = { critical: '#f43031', major: '#fd7f04', warning: '#fdd01f', normal: '#32d28c', basic: null };
const STATE_HUE = { critical: 'red', major: 'orange', warning: 'yellow', normal: 'green', basic: null };

/* 색 계산 */
let ctx = null;
function rgbOf(str, depth = 0) {
  const s = String(str || '').trim();
  let m = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
  }
  m = /^rgba?\(([^)]*)\)$/i.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    if (p.length < 3) return null;
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : +p[3];
    return { r: +p[0], g: +p[1], b: +p[2], a };
  }
  // color-mix() 의 계산값 — color(srgb r g b / a), 0~1
  m = /^color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+%?))?\)$/i.exec(s);
  if (m) return { r: Math.round(+m[1] * 255), g: Math.round(+m[2] * 255), b: Math.round(+m[3] * 255), a: m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4] };
  if (depth) return null;
  // hsl() · 이름 색 등 — 캔버스로 바꾼다(한 번만)
  ctx ||= document.createElement('canvas').getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillStyle = s;
  return ctx.fillStyle === '#000000' && !/^(#000|black|#000000)$/i.test(s) ? null : rgbOf(ctx.fillStyle, 1);
}
function hsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}
function rgbFromHsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map(v => Math.round((v + m) * 255));
}
/** 서버 hueBucket 과 같은 칸 나누기 */
export function hueBucket(str) {
  const c = rgbOf(str);
  if (!c || c.a === 0) return null;
  const { h, s, l } = hsl(c);
  if (s < 0.28 || l < 0.12 || l > 0.92) return null;
  return h >= 340 || h < 15 ? 'red' : h < 40 ? 'orange' : h < 72 ? 'yellow' : h < 175 ? 'green' : h < 265 ? 'blue' : 'purple';
}
/** 한 색을 목표 상태 색으로.
 *  심볼(mode 'all') — 곱하기 물들이기: 원래 밝기(명암)가 상태 색의 밝기를 정한다. 밝은 심볼은 또렷한 상태 색,
 *    어두운 심볼(HANA 서버 심볼 #525252)은 어두운 상태 색(→ #4F2020, 원본 심각 #4B2626 과 비슷)이 되고 입체 명암은 그대로 남는다.
 *  배지(mode 'hue') — 원래 상태 색 자리이므로 목표 색 그대로(투명도는 원래대로).
 *  목표가 없으면(기본) 같은 밝기의 회색. */
function tint(str, target, mode = 'all') {
  const c = rgbOf(str);
  if (!c) return null;
  const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  let rgb;
  if (!target) { const g = Math.round(lum * 255); rgb = [g, g, g]; }
  else if (mode === 'hue') rgb = [target.r, target.g, target.b];
  else {
    // 색상 · 채도는 상태 색 그대로(흐릿해지지 않게), 밝기만 원래 명암을 따라 상태 색의 어두운 쪽 ~ 밝은 쪽 사이에 놓는다
    const t = hsl(target);
    const dark = t.l * 0.3, light = Math.min(0.8, t.l + (1 - t.l) * 0.3);
    rgb = rgbFromHsl(t.h, Math.min(1, t.s), dark + (light - dark) * Math.pow(lum, 1.25));
  }
  return c.a < 1 ? `rgba(${rgb.join(',')},${+c.a.toFixed(3)})` : '#' + rgb.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

/* SVG 그림 다시 칠하기 — 같은 파일 · 같은 색이면 한 번만 만든다 */
const svgText = new Map(), tinted = new Map();
const COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\([^)]*\)/gi;
async function tintedSvg(src, key, fn) {
  const k = src + '|' + key;
  if (!tinted.has(k)) {
    tinted.set(k, (async () => {
      if (!svgText.has(src)) svgText.set(src, fetch(src).then(r => (r.ok ? r.text() : '')).catch(() => ''));
      const text = await svgText.get(src);
      if (!text) return null;
      const out = text.replace(COLOR_RE, m => fn(m) || m);
      return out === text ? null : URL.createObjectURL(new Blob([out], { type: 'image/svg+xml' }));
    })());
  }
  return tinted.get(k);
}

/* 토큰 → 실제 색(테마 · 시드 반영) */
function tokenColor(host, token) {
  const cs = getComputedStyle(host);
  const val = cs.getPropertyValue('--wa-' + token).trim() || cs.getPropertyValue('--wa-d-' + token).trim();
  return val ? rgbOf(val) : null;
}
const nodeAt = (root, path) => (path || []).reduce((n, i) => n?.children[i], root);
const COLOR_PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'fill', 'stroke', 'outline-color'];

/**
 * 분자 루트(el)의 칸들을 상태값대로 칠한다.
 * values['@칸'] = 상태, version.states[상태] = 토큰. host = 테마 변수가 걸린 요소.
 */
export async function paintStates(el, v, molecule, version, values, host) {
  if (!el) return;
  const slots = v.slots?.length ? v.slots.map(sl => ({ ...sl, mode: 'all' }))
    : molecule.slots?.[0]?.root && v.state ? [{ key: molecule.slots[0].key, paths: [[]], state: v.state, mode: 'hue', hue: v.stateHue }] : [];
  const jobs = [];
  for (const sl of slots) {
    const target = values?.[`@${sl.key}`] || sl.state;
    const token = version?.states?.[target];
    for (const p of sl.paths) {
      const node = nodeAt(el, p);
      if (!node) continue;
      node.setAttribute('data-wa-slot', sl.key);
      node.setAttribute('data-wa-st', target);
      if (target === sl.state && !token) continue; // 원본 그대로
      // HANA 심볼은 '기본'만 반투명(60%)으로 흐리게, 나머지 상태는 90% 로 그린다 — 상태가 바뀌면 투명도도 따라간다
      if (sl.mode === 'all') {
        const op = parseFloat(getComputedStyle(node).opacity);
        if (target === 'basic' && op > 0.85 && sl.state !== 'basic') node.style.setProperty('opacity', '0.6', 'important');
        if (target !== 'basic' && op < 0.85) node.style.setProperty('opacity', '0.9', 'important');
      }
      const color = token ? tokenColor(host, token) : STATE_COLORS[target] ? rgbOf(STATE_COLORS[target]) : null;
      // 칠할 색 고르기 — 심볼 칸은 그림 전체(흰 반사광 · 검은 그림자는 둔다), 분자 전체 상태는 원래 상태 색 계열만
      const fromHue = sl.mode === 'hue' ? sl.hue : null;
      const pick = str => {
        const c = rgbOf(str);
        if (!c || c.a === 0) return false;
        if (sl.mode === 'hue') return !!fromHue && hueBucket(str) === fromHue;
        const { l } = hsl(c);
        return l > 0.04 && l < 0.97;
      };
      const fn = str => (pick(str) ? tint(str, color, sl.mode) : null);
      const key = (sl.mode === 'hue' ? 'h:' + fromHue : 'a4') + ':' + (color ? [color.r, color.g, color.b].join(',') : 'gray');
      for (const e of [node, ...node.querySelectorAll('*')]) {
        if (e.tagName === 'IMG') {
          const src = e.getAttribute('src');
          if (src && /\.svg(\?|$)/i.test(src)) jobs.push(tintedSvg(new URL(src, location.href).href, key, fn).then(url => { if (url) e.src = url; }));
          continue;
        }
        const cs = getComputedStyle(e);
        for (const prop of COLOR_PROPS) {
          const val = cs.getPropertyValue(prop);
          if (!val || (prop === 'color' && !e.childNodes.length)) continue;
          if (prop.startsWith('border') && parseFloat(cs.getPropertyValue(prop.replace('color', 'width'))) === 0) continue;
          const out = fn(val);
          if (out) e.style.setProperty(prop, out, 'important');
        }
        // 인라인 SVG 의 fill · stroke 속성
        if (e instanceof SVGElement) for (const a of ['fill', 'stroke', 'stop-color']) {
          const val = e.getAttribute(a);
          const out = val && fn(val);
          if (out) e.setAttribute(a, out);
        }
      }
    }
  }
  await Promise.all(jobs);
}

/** 이 분자가 상태 칸을 가졌나 — 편집 화면이 상태 고르기를 보여 줄지 */
export const slotsOf = molecule => molecule?.slots || [];
