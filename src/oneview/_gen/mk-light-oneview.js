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
/* 라이트 역할 색 표(11-20 다시 짬 — 자동 밝히기가 판을 연보라 회청으로 뭉치고 흰 테두리를 짙은 남색 윤곽으로 만들어 '어색하다'는 지적)
   바탕 #eef2f7 · 판 흰색 · 칸 #f3f6fa · 선 #d6dfea / 진한 선 #c3cfdf · 글자 #14213d / #4b5b73 · 강조 파랑 hsl(216) */
const LT = { surface: '#ffffff', surface2: '#f3f6fa', surface3: '#e9eef6', line: '#d6dfea', line2: '#c3cfdf', ink: '#1f3150', ink2: '#5a6b85' };
/* big = 판 · 띠 · 바탕 그림(가로나 세로 72px 이상, 또는 넓이 6000px² 이상) — 흰 선은 옅은 선이 되고 짙은 면은 흰 판이 된다.
   작은 그림(아이콘 · 단추 · 글리프)은 흰 글리프를 잉크로, 짙은 원판은 아주 옅은 칸 색으로 */
function relight(c, attr, big, wide) {
  const o = parse(c); if (!o) return null;
  const { h, s, l } = toHsl(o);
  const stroke = attr === 'stroke';
  if (l >= 0.85 && s < 0.4) {                                                           /* 흰 · 옅은 무채색 */
    if (big) return stroke ? LT.line2 : LT.surface;
    return hex(INK_H, 0.38, 0.26 + (1 - l) * 0.5);
  }
  if (l <= 0.3) {                                                                         /* 짙은 면 · 선(채도 높은 짙은 남색 #010d35 도 — 체크박스 · 도넛 속이 남았다) */                                                            /* 짙은 면 · 선 */
    if (big) return stroke ? LT.line : (l <= 0.16 ? LT.surface : LT.surface2);
    return stroke ? LT.line2 : hex(214, 0.35, 0.95);
  }
  if (s < 0.45) {                                                                       /* 중간 회청 */
    if (big) return stroke ? LT.line2 : LT.surface3;
    return hex(h || INK_H, Math.min(0.3, s * 0.7), Math.max(0.36, Math.min(0.8, 1.06 - l)));
  }
  /* 채도 높은 색 — 면(상태 · 그래프 · 강조)은 그대로. 판 테두리 네온 선만 짙은 강조색으로 눌러 흰 판에서 번쩍이지 않게 */
  if (big && stroke && l > 0.45) return hex(h, Math.min(0.78, s), 0.56);
  /* 큰 판의 짙은 파랑 장식 면(KPI 띠 아래 그라디언트 등, 색상각 190~260 · 명도 .3~.5) → 옅은 하늘빛(흰 바탕에서 회청 띠로 무거웠다) */
  if (wide && !stroke && h >= 190 && h <= 260 && l < 0.5) return hex(h, 0.55, 0.9);
  if (l > 0.74) return hex(h, Math.min(1, s * 0.9 + 0.1), 0.45);                        /* 옅은 파스텔 글리프 → 짙게 */
  return null;
}
/* 파일별 색 대응 — 다크 그림의 모양 · 구성은 그대로 두고 색만 라이트용으로(11-20 사용자: 상상해서 새로 그리지 말고 색만)
   · KPI 배지(background-4~7): 짙은 남색 육각 면 → 그 배지 강조색의 옅은 색, 강조색 띠는 그대로
   · 팝업 제목 띠(title-background*): 짙은 남색 띠 → 파랑(흰 제목이 그대로 읽힌다), 회색 반사 멈춤점은 옅은 하늘 */
const NAVY = ['#0c379b', '#0c519b', '#0c669b'];
const tints = (a, b, c) => ({ [NAVY[0]]: a, [NAVY[1]]: b, [NAVY[2]]: c });
const OVERRIDE = {
  'background-4': tints('#d9f0f8', '#c6e8f3', '#b3dfee'),
  'background-5': tints('#f4e6f1', '#ecd6e8', '#e3c6de'),
  'background-6': tints('#fbf0d9', '#f6e3bd', '#f0d6a1'),
  'background-7': tints('#e1f2e5', '#cfe9d6', '#bde0c6'),
  'title-background': { '#0d1129': '#2a63d4', '#a8b5b8': '#cfe0fb', '#44479f': '#3a6fe0', '#676e99': '#2a63d4' },
};
function sizeOf(svg) {
  const w = +((/<svg[^>]*\swidth="([\d.]+)/.exec(svg) || [])[1] || 0), h = +((/<svg[^>]*\sheight="([\d.]+)/.exec(svg) || [])[1] || 0);
  return { w, h, big: w >= 72 || h >= 72 || w * h >= 6000, wide: w >= 400 };
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
  const big = sizeOf(s).big, wide = sizeOf(s).wide;
  let changed = 0;
  const out = s.replace(/(fill|stroke|stop-color|flood-color)=("|')(#[0-9a-fA-F]{3,6}|white|black)\2/g, (all, attr, q, col, at) => {
    if (mr.some(([a, b]) => at >= a && at < b)) return all;
    /* 파일별 색 대응(모양은 그대로, 색만) — 표에 있는 색은 그 값으로 */
    const ovr = OVERRIDE[f.replace(/\.svg$/, '')] || (/^title-background(-\d+)?\.svg$/.test(f) ? OVERRIDE['title-background'] : null);
    if (ovr && ovr[col.toLowerCase()]) { changed++; return attr + '=' + q + ovr[col.toLowerCase()] + q; }
    /* 그라디언트 멈춤점은 그 그라디언트를 쓰는 쪽(면 · 선)을 모르니 면으로 본다 */
    const nv = relight(col, attr === 'stroke' ? 'stroke' : 'fill', big, wide);
    if (!nv || nv.toLowerCase() === col.toLowerCase()) return all;
    changed++;
    return attr + '=' + q + nv + q;
  });
  /* 그림자 · 빛 필터 — Figma 는 그림자 색을 feColorMatrix 값(0 0 0 0 R / 0 0 0 0 G / 0 0 0 0 B / 0 0 0 A 0)에 넣는다.
     다크용 검은 · 짙은 남색 그림자(알파 .2~.55)와 하늘 네온 빛(알파 1)이 흰 판에서 진한 얼룩이 됐다(11-20 지적) →
     짙은 그림자 = 옅은 남색 × 알파 .3, 색 있는 빛 = 같은 색 × 알파 .4, 흰 반사 · 알파 뽑기(127)는 그대로 */
  const out2 = out.replace(/(<feColorMatrix\b[^>]*\bvalues=")([^"]+)(")/g, (all, a, v, b) => {
    const n = v.trim().split(/\s+/).map(Number);
    if (n.length !== 20) return all;
    const zero = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 19].every((i) => n[i] === 0);
    if (!zero || n[18] >= 2) return all;
    const R = n[4], G = n[9], B = n[14], A = n[18];
    const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    let nr = R, ng = G, nb = B, na = A;
    if (lum > 0.9) return all;
    if (lum < 0.45) { nr = 0.12; ng = 0.24; nb = 0.4; na = Math.max(0.03, +(A * 0.3).toFixed(3)); }
    else na = Math.max(0.04, +(A * 0.4).toFixed(3));
    if (nr === R && ng === G && nb === B && na === A) return all;
    changed++;
    return a + ['0 0 0 0', nr, '0 0 0 0', ng, '0 0 0 0', nb, '0 0 0', na, '0'].join(' ') + b;
  });
  /* 레이어 블러 발광(filter id 의 _f_ — 아이콘 밑 파란 타원 · 금속 원판 반사) — 어두운 바탕에서만 빛으로 읽힌다.
     흰 바탕에서는 번진 얼룩이 되므로 그 묶음을 아주 옅게(불투명도 ×0.15) */
  const out3 = out2.replace(/<g\b([^>]*\bfilter="url\(#[^)"]*_f_[^)"]*\)"[^>]*)>/g, (all, at) => {
    const m = /\sopacity="([\d.]+)"/.exec(at), o = m ? +m[1] : 1;
    changed++;
    return '<g' + (m ? at.replace(m[0], ' opacity="' + (o * 0.15).toFixed(3) + '"') : at + ' opacity="' + (o * 0.15).toFixed(3) + '"') + '>';
  });
  if (!changed) continue;
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, lt), out3);
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
  /* 바탕은 맑은 옅은 회청 — 물결은 아주 옅게만 남긴다(진하게 두면 판과 바탕이 같은 색으로 뭉쳤다) */
  const A = [240, 244, 249], B = [222, 231, 243];
  for (let i = 0; i < n; i++) {
    const t = 0.35 * Math.pow(Math.max(0, Math.min(1, (Y[i] - lo) / ((hi - lo) || 1))), 0.85) + 0.25 * (Math.floor(i / w) / h);
    out[i * 4] = Math.round(A[0] + (B[0] - A[0]) * t); out[i * 4 + 1] = Math.round(A[1] + (B[1] - A[1]) * t); out[i * 4 + 2] = Math.round(A[2] + (B[2] - A[2]) * t);
    out[i * 4 + 3] = src[i * 4 + 3];
  }
  const lt = f.replace(/\.png$/, '-lt.png');
  fs.writeFileSync(path.join(DIR, lt), encodePng(w, h, out));
  map[f] = lt; made++;
}
/* 3D 노드 그림(image-1~6.png: 구슬 · 받침) — 받침 아래 검은 그림자와 짙은 남색 받침 옆면이 흰 바탕에서 무거웠다(11-20 사용자 지적).
   어두운 픽셀만(명도 < .42) 어두울수록 옅은 회청 #d3deee 쪽으로 옮기고 투명도도 낮춘다. 빨강 · 주황 받침(상태색)은 색상각을 지켜 덜 옮긴다.
   밝은 구슬 · 글리프는 한 점도 안 바꾼다 */
for (const f of fs.readdirSync(DIR).filter((x) => /^image-\d+(-\d+)?\.png$/.test(x))) {
  const img = PNG.decode(fs.readFileSync(path.join(DIR, f)));
  if (img.w < 90 || img.w > 160 || img.h > 160) continue;   /* 받침 있는 노드(101×86)만 — 받침 없는 작은 구슬은 S 글리프가 옅어졌다 */
  const d = img.data, n = img.w * img.h, out = Buffer.alloc(n * 4);
  const T = [211, 222, 238];
  for (let i = 0; i < n; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
    const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, L = (mx + mn) / 2, S = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * L - 1));
    let nr = r, ng = g, nb = b, na = a;
    if (L < 0.6 && a > 0 && Math.floor(i / img.w) > img.h * 0.5) {   /* 아래쪽(받침 · 그림자)만 */
      const t = Math.min(1, (0.6 - L) / 0.45);   /* 11-20 더 연하게 — 중간 회색 그림자까지 */
      let h = 0; if (mx !== mn) { const R = r / 255, G = g / 255, B = b / 255, dd = mx - mn; h = mx === R ? ((G - B) / dd + (G < B ? 6 : 0)) * 60 : mx === G ? ((B - R) / dd + 2) * 60 : ((R - G) / dd + 4) * 60; }
      const warm = S > 0.45 && (h < 40 || h > 320);
      const k = warm ? Math.min(1, t * 0.7) : Math.min(1, t * 1.1 + 0.15);
      const tgt = warm ? [Math.min(255, r * 1.25 + 40), Math.min(255, g * 1.1 + 40), Math.min(255, b * 1.1 + 40)] : T;
      nr = r + (tgt[0] - r) * k; ng = g + (tgt[1] - g) * k; nb = b + (tgt[2] - b) * k;
      na = a * (1 - t * (warm ? 0.6 : 0.9));
    }
    out[i * 4] = Math.round(nr); out[i * 4 + 1] = Math.round(ng); out[i * 4 + 2] = Math.round(nb); out[i * 4 + 3] = Math.round(na);
  }
  const lt = f.replace(/\.png$/, '-lt.png');
  fs.writeFileSync(path.join(DIR, lt), encodePng(img.w, img.h, out));
  map[f] = lt; made++;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light copies', made);
