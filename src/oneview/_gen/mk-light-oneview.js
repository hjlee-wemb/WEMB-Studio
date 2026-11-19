/* 라이트 그림 사본 — src/oneview/*.svg → *-lt.svg, background.png → background-lt.png, light-assets.json
   원본이 다크(짙은 남색 유리판 · 흰 선 · 하늘색 글리프)라 역할별로 다시 칠한다 — 자동 반전이 아니다(메모리 dark-render-light-theme):
     · 짙은 면(명도 ≤ .28)      → 같은 색상각의 아주 밝은 면(.93~.97)
     · 흰 · 옅은 무채색 선/아이콘 → 짙은 남색 잉크
     · 중간 회청(채도 낮음)      → 명도만 거울(1.05 − L)
     · 채도 높은 색(상태 · 강조 · 그래프) → 그대로, 아주 옅은 파스텔 글리프만 짙게(흰 판에서 보이게)
   형상 · 좌표 · 필터 · 불투명도는 한 점도 안 건드린다. <mask>/<clipPath> 안 색은 알파라 그대로 둔다.
   그래프 선(line-*) · 범례 점(key-* · dot-*)은 색이 곧 뜻이라 사본을 만들지 않는다.
   실행: node mk-light-oneview.js  (다시 만든 뒤 node conv.js) */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const DIR = path.join(__dirname, '..');
const PNG = require('./png.js');

function parse(c) {
  c = c.trim().toLowerCase();
  if (c === 'white') return { r: 255, g: 255, b: 255 };
  if (c === 'black') return { r: 0, g: 0, b: 0 };
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c);
  if (m) { let h = m[1]; if (h.length === 3) h = h.split('').map((x) => x + x).join(''); const n = parseInt(h, 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 }; }
  return null;
}
function toHsl(o) {
  const r = o.r / 255, g = o.g / 255, b = o.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d) h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const l = (mx + mn) / 2; return { h: h * 60, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
}
function hex(h, s, l) {
  s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, hp = ((h % 360) + 360) % 360 / 60, x = c * (1 - Math.abs(hp % 2 - 1)), m = l - c / 2;
  const [r, g, b] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
const INK_H = 218;
function relight(c) {
  const o = parse(c); if (!o) return null;
  const { h, s, l } = toHsl(o);
  if (l >= 0.85 && s < 0.4) return hex(INK_H, 0.42, 0.24 + (1 - l) * 0.6);           /* 흰 선 · 아이콘 → 짙은 남색 잉크 */
  if (l <= 0.28) return hex(h || INK_H, Math.min(s, 0.6) * 0.55, 0.955 - (0.28 - l) * 0.08); /* 짙은 면 → 밝은 면 */
  if (s < 0.45) return hex(h || INK_H, s * 0.8, Math.max(0.32, Math.min(0.82, 1.06 - l)));  /* 회청 → 거울 */
  if (l > 0.74) return hex(h, Math.min(1, s * 0.9 + 0.1), 0.42);                       /* 옅은 파스텔 글리프 → 짙게 */
  return null;                                                                            /* 채도 높은 색 그대로 */
}
function maskRanges(s) {
  const r = [];
  for (const tag of ['mask', 'clipPath']) { const re = new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>', 'g'); let m; while ((m = re.exec(s))) r.push([m.index, m.index + m[0].length]); }
  return r;
}
const SKIP = /^(line-|key-|dot-|indicator|status-)/;
const map = {};
let made = 0;
for (const f of fs.readdirSync(DIR)) {
  if (/-lt\.(svg|png)$/.test(f)) { fs.unlinkSync(path.join(DIR, f)); continue; }
  if (!/\.svg$/.test(f) || SKIP.test(f)) continue;
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');
  const mr = maskRanges(s);
  let changed = 0;
  const out = s.replace(/(fill|stroke|stop-color|flood-color)=("|')(#[0-9a-fA-F]{3,6}|white|black)\2/g, (all, attr, q, col, at) => {
    if (mr.some(([a, b]) => at >= a && at < b)) return all;
    const nv = relight(col);
    if (!nv || nv.toLowerCase() === col.toLowerCase()) return all;
    changed++;
    return attr + '=' + q + nv + q;
  });
  if (!changed) continue;
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, lt), out);
  map[f] = lt; made++;
}

/* 화면 바탕(background.png, 짙은 남색 물결) → 맑은 하늘빛 바탕. 원래 밝은 곳(물결 · 빛)일수록 옅은 파랑이 진해져 물결 모양이 남는다 */
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; ih[10] = 0; ih[11] = 0; ih[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
for (const f of ['background.png']) {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) continue;
  const img = PNG.decode(fs.readFileSync(p));
  const w = img.w, h = img.h;
  const src = img.data, n = w * h;
  const out = Buffer.alloc(n * 4);
  /* 원본 밝기 범위를 재서 0~1 로 늘린다 */
  let lo = 1, hi = 0;
  const Y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const y = (0.2126 * src[i * 4] + 0.7152 * src[i * 4 + 1] + 0.0722 * src[i * 4 + 2]) / 255; Y[i] = y; if (y < lo) lo = y; if (y > hi) hi = y; }
  const A = [244, 248, 253], B = [196, 216, 242];
  for (let i = 0; i < n; i++) {
    const t = Math.pow(Math.max(0, Math.min(1, (Y[i] - lo) / ((hi - lo) || 1))), 0.85);
    out[i * 4] = Math.round(A[0] + (B[0] - A[0]) * t); out[i * 4 + 1] = Math.round(A[1] + (B[1] - A[1]) * t); out[i * 4 + 2] = Math.round(A[2] + (B[2] - A[2]) * t);
    out[i * 4 + 3] = src[i * 4 + 3];
  }
  const lt = f.replace(/\.png$/, '-lt.png');
  fs.writeFileSync(path.join(DIR, lt), encodePng(w, h, out));
  map[f] = lt; made++;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light copies', made);
