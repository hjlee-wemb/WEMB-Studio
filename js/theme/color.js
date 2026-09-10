/* ── 색 계산 — hex/HSL 변환 · 팔레트 생성 · 미세조정 ── */

/* ===== color utils ===== */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h,
    s,
    l = (mx + mn) / 2;
  if (mx === mn) {
    h = s = 0;
  } else {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}
function hslToCss(h, s, l) {
  return `hsl(${((h % 360) + 360) % 360} ${clamp(s, 0, 100).toFixed(1)}% ${clamp(l, 0, 100).toFixed(1)}%)`;
}
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}
const SUB_OFFSET = { complement: 180, analog: 35, triad: 120, split: 150 };
function genPalette(seed, harmony, mode, subHex) {
  const { h, s } = rgbToHsl(hexToRgb(seed));
  const subH = subHex ? rgbToHsl(hexToRgb(subHex)).h : h + (SUB_OFFSET[harmony] || 35);
  const bS = clamp(s, 35, 95);
  const P = {};
  if (mode === 'dark') {
    P['bg/page'] = hslToCss(h, clamp(bS * 0.35, 10, 34), 7);
    P['bg/surface'] = hslToCss(h, clamp(bS * 0.32, 10, 30), 12.5);
    P['bg/accent'] = hslToCss(h, clamp(bS * 0.38, 12, 40), 19);
    P['line'] = hslToCss(h, clamp(bS * 0.3, 10, 34), 26);
    P['text/strong'] = hslToCss(h, 16, 96);
    P['text/weak'] = hslToCss(h, 14, 66);
    P['point/main'] = hslToCss(h, clamp(bS, 45, 95), 62);
    P['point/sub'] = hslToCss(subH, clamp(bS * 0.85, 40, 85), 64);
    P['danger'] = hslToCss(2, 78, 62);
    P['warning'] = hslToCss(38, 90, 58);
  } else {
    P['bg/page'] = hslToCss(h, clamp(bS * 0.3, 8, 26), 97.8);
    P['bg/surface'] = hslToCss(h, 24, 100);
    P['bg/accent'] = hslToCss(h, clamp(bS * 0.45, 20, 52), 94.5);
    P['line'] = hslToCss(h, clamp(bS * 0.35, 14, 40), 87);
    P['text/strong'] = hslToCss(h, 32, 13);
    P['text/weak'] = hslToCss(h, 16, 42);
    P['point/main'] = hslToCss(h, clamp(bS, 45, 90), 48);
    P['point/sub'] = hslToCss(subH, clamp(bS * 0.8, 40, 80), 46);
    P['danger'] = hslToCss(2, 72, 50);
    P['warning'] = hslToCss(35, 86, 46);
  }
  return P;
}
/* direct role-mapping from extracted image colors */
function buildDirect(cols, mode) {
  if (!cols || !cols.length) return genPalette('#4f6ce0', 'analog', mode);
  const byL = [...cols].sort((a, b) => a.l - b.l);
  const vib = [...cols].filter((c) => c.s > 18).sort((a, b) => b.score - a.score);
  const main = vib[0] || cols[0];
  let sub = null;
  for (const o of vib) {
    const dh = Math.abs(((o.h - main.h + 540) % 360) - 180);
    if (dh > 35) {
      sub = o;
      break;
    }
  }
  sub = sub || vib[1] || main;
  const dk = byL[0],
    lt = byL[byL.length - 1];
  const P = {};
  if (mode === 'dark') {
    P['bg/page'] = hslToCss(dk.h, clamp(dk.s, 8, 34), 8);
    P['bg/surface'] = hslToCss(dk.h, clamp(dk.s, 8, 32), 13);
    P['bg/accent'] = hslToCss(dk.h, clamp(dk.s, 10, 38), 19);
    P['line'] = hslToCss(dk.h, clamp(dk.s, 8, 32), 26);
    P['text/strong'] = hslToCss(lt.h, 14, 96);
    P['text/weak'] = hslToCss(lt.h, 12, 66);
    P['point/main'] = hslToCss(main.h, clamp(main.s, 45, 95), clamp(main.l, 55, 68));
    P['point/sub'] = hslToCss(sub.h, clamp(sub.s, 40, 90), clamp(sub.l, 55, 68));
    P['danger'] = hslToCss(2, 78, 62);
    P['warning'] = hslToCss(38, 90, 58);
  } else {
    P['bg/page'] = hslToCss(lt.h, clamp(lt.s, 8, 28), 97.8);
    P['bg/surface'] = hslToCss(lt.h, 20, 100);
    P['bg/accent'] = hslToCss(lt.h, clamp(lt.s, 16, 48), 94.5);
    P['line'] = hslToCss(lt.h, clamp(lt.s, 12, 40), 87);
    P['text/strong'] = hslToCss(dk.h, 30, 14);
    P['text/weak'] = hslToCss(dk.h, 16, 42);
    P['point/main'] = hslToCss(main.h, clamp(main.s, 45, 90), clamp(main.l, 42, 55));
    P['point/sub'] = hslToCss(sub.h, clamp(sub.s, 40, 85), clamp(sub.l, 42, 55));
    P['danger'] = hslToCss(2, 72, 50);
    P['warning'] = hslToCss(35, 86, 46);
  }
  return P;
}
/* fine-tune: shift hue, scale saturation, shift lightness across the whole palette */
function applyAdjust(P, a) {
  a = a || state.adjust;
  if (!a || (!a.h && !a.s && !a.l)) return P;
  const out = {};
  for (const k in P) {
    const m = P[k].match(/hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/);
    if (!m) {
      out[k] = P[k];
      continue;
    }
    out[k] = hslToCss(+m[1] + a.h, clamp(+m[2] * (1 + a.s / 100), 0, 100), clamp(+m[3] + a.l, 0, 100));
  }
  return out;
}
