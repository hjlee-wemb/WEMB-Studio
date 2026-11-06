/* 최소 PNG 디코더/인코더 — 픽셀 대조용(외부 의존성 없이 node 만으로).
   Figma 렌더도 브라우저 캡처도 8bit non-interlaced 라 그 경우만 다룬다. */
const zlib = require('zlib');
function decode(buf) {
  let p = 8, w = 0, h = 0, bd = 8, ct = 6;
  const idat = [];
  let pal = null, trns = null;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8);
    const d = buf.slice(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; if (d[12]) throw new Error('interlaced'); }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'PLTE') pal = d;
    else if (type === 'tRNS') trns = d;
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (bd !== 8) throw new Error('bit depth ' + bd);
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = ch, stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++];
    const line = raw.slice(q, q + stride); q += stride;
    const cur = out.slice(y * stride, (y + 1) * stride);
    const prev = y ? out.slice((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev ? prev[i] : 0, c = (prev && i >= bpp) ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      cur[i] = v & 255;
    }
  }
  /* RGBA 로 정규화 */
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0, n = w * h; i < n; i++) {
    let r, g, bl, al = 255;
    if (ct === 6) { r = out[i * 4]; g = out[i * 4 + 1]; bl = out[i * 4 + 2]; al = out[i * 4 + 3]; }
    else if (ct === 2) { r = out[i * 3]; g = out[i * 3 + 1]; bl = out[i * 3 + 2]; }
    else if (ct === 0) { r = g = bl = out[i]; }
    else if (ct === 4) { r = g = bl = out[i * 2]; al = out[i * 2 + 1]; }
    else { const k = out[i]; r = pal[k * 3]; g = pal[k * 3 + 1]; bl = pal[k * 3 + 2]; if (trns && k < trns.length) al = trns[k]; }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = bl; rgba[i * 4 + 3] = al;
  }
  return { w, h, data: rgba };
}
function encode(w, h, rgba) {
  const stride = w * 4, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const chunk = (t, d) => {
    const b = Buffer.alloc(8 + d.length + 4);
    b.writeUInt32BE(d.length, 0); b.write(t, 4, 'latin1'); d.copy(b, 8);
    b.writeUInt32BE(crc(Buffer.concat([Buffer.from(t, 'latin1'), d])) >>> 0, 8 + d.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
let T = null;
function crc(b) {
  if (!T) { T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; } }
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
module.exports = { decode, encode };
