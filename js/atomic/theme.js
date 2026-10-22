// 테마 = { mode: 'dark' | 'light', seed: '#RRGGBB' | null }
// seed 가 없으면 역할 토큰을 정하지 않는다 → 모든 색이 원본(fallback) 그대로 나온다.
// seed 가 있으면 같은 역할의 색이 한꺼번에 바뀐다 (WEMB Studio '색 정하기'와 같은 방식).
export const ROLE_TOKENS = ['bg', 'surface', 'line', 'text', 'text-sub', 'point', 'ok', 'warn', 'danger'];
export const TOKEN_LABELS = { bg: '배경', surface: '면', line: '선', text: '글자', 'text-sub': '보조 글자', point: '포인트', ok: '정상', warn: '주의', danger: '위험' };
export const DEFAULT_SEED = '#7c5cff';

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}
const hsl = (h, s, l) => `hsl(${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;

/** 시드 색 → 역할 토큰 값 */
export function paletteFor(seed, mode) {
  const { h, s, l } = hexToHsl(seed);
  const tint = Math.min(s, 0.35);
  if (mode === 'light') {
    return {
      bg: hsl(h, tint * 0.6, 0.965), surface: hsl(h, tint * 0.5, 0.995), line: hsl(h, tint * 0.4, 0.84),
      text: hsl(h, tint * 0.6, 0.13), 'text-sub': hsl(h, tint * 0.3, 0.42),
      point: hsl(h, Math.max(s, 0.45), Math.min(l, 0.48)), ok: hsl(150, 0.62, 0.36), warn: hsl(34, 0.9, 0.44), danger: hsl(356, 0.72, 0.5),
    };
  }
  return {
    bg: hsl(h, tint * 0.7, 0.06), surface: hsl(h, tint * 0.6, 0.12), line: hsl(h, tint * 0.5, 0.26),
    text: hsl(h, tint * 0.4, 0.95), 'text-sub': hsl(h, tint * 0.25, 0.7),
    point: hsl(h, Math.max(s, 0.55), Math.max(l, 0.6)), ok: hsl(150, 0.58, 0.52), warn: hsl(36, 0.92, 0.6), danger: hsl(356, 0.85, 0.64),
  };
}

/** 요소에 테마를 건다 — 섀도 DOM 안으로 CSS 변수가 상속된다. */
export function applyTheme(el, theme) {
  const defaults = paletteFor(DEFAULT_SEED, theme.mode);
  for (const t of ROLE_TOKENS) el.style.setProperty('--wa-d-' + t, defaults[t]); // 분자 공통 스타일의 기본값
  if (theme.seed) {
    const p = paletteFor(theme.seed, theme.mode);
    for (const t of ROLE_TOKENS) el.style.setProperty('--wa-' + t, p[t]);
  } else {
    for (const t of ROLE_TOKENS) el.style.removeProperty('--wa-' + t);
  }
}

/** 토큰 색 미리보기용 (편집 패널의 색 점) */
export function tokenSwatch(token, theme) {
  return paletteFor(theme.seed || DEFAULT_SEED, theme.mode)[token];
}

/* 측정한 '물려받은 글자색'도 원본 CSS 와 같은 규칙으로 토큰에 태운다 (서버 lib/css.mjs 와 같은 분류) */
export function tokenizeInherited(color) {
  const m = /rgba?\(([^)]+)\)/.exec(color || '');
  if (!m) return color;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  const hx = '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const { h, s, l } = hexToHsl(hx);
  let role;
  if (s > 0.28 && l > 0.12 && l < 0.92) role = h >= 345 || h < 18 ? 'danger' : h < 62 ? 'warn' : h < 165 ? 'ok' : 'point';
  else role = Math.abs(l - 0.5) > 0.33 ? 'text' : 'text-sub';
  return a >= 1 ? `var(--wa-${role}, ${hx})` : `color-mix(in srgb, var(--wa-${role}, ${hx}) ${a * 100}%, transparent)`;
}
