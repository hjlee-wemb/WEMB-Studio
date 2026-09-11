/* ── Enterprise(≤50색) 토큰 생성 ── */

/* ===== Enterprise(≤50색) 토큰 — Figma 'system' Enterprise 페이지 기준 =====
   하나의 시드색에서 표면 4단계·텍스트 계층·강조 알파 단계·상태색·그라데이션까지 파생 */
const EV = {
  base: '--surface-base',
  s1: '--surface-1',
  s2: '--surface-2',
  s3: '--surface-3',
  s1_50: '--surface-1-50',
  s1_70: '--surface-1-70',
  s3_80: '--surface-3-80',
  accent: '--accent',
  accent15: '--accent-15',
  accent20: '--accent-20',
  accent40: '--accent-40',
  accent50: '--accent-50',
  teal: '--teal',
  teal20: '--teal-20',
  tPrimary: '--text-primary',
  tSecondary: '--text-secondary',
  tTertiary: '--text-tertiary',
  tLabel: '--text-label',
  tLabelBright: '--text-label-bright',
  tHeading: '--text-heading-alt',
  tAxis: '--text-axis',
  tDim: '--text-dim',
  ovDivider: '--ov-divider',
  ovSubtle: '--ov-subtle',
  ovDotRing: '--ov-dot-ring',
  ovHigh: '--ov-high-90',
  ovDim45: '--ov-dim-45',
  ovGlow: '--ov-glow-15',
  iconGray: '--ui-icon-gray',
  trackLight: '--track-light',
  trackDark: '--track-dark',
  lighterBlue: '--ui-lighter-blue',
  deepBlue: '--ui-deep-blue',
  dot1: '--dot-1',
  dot2: '--dot-2',
  dot3: '--dot-3',
  dataCyan: '--data-cyan',
  crit: '--crit',
  critBright: '--crit-bright',
  crit15: '--crit-15',
  crit60: '--crit-60',
  warn: '--warn',
  gChartS: '--grad-chart-start',
  gChartE: '--grad-chart-end',
  gFadeS: '--grad-fade-start',
  gFadeE: '--grad-fade-end',
  gProgS: '--grad-prog-start',
  gProgE: '--grad-prog-end',
};
/* 색(알파 포함) 하나에 미세조정(색상 이동·채도·명도)을 적용 — flat의 applyAdjust와 동일 규칙 */
function adjustHex(hex, a) {
  if (!a || (!a.h && !a.s && !a.l)) return hex;
  const m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(hex);
  if (!m) return hex;
  const { h, s, l } = rgbToHsl(hexToRgb('#' + m[1]));
  return hslToHex((((h + a.h) % 360) + 360) % 360, clamp(s * (1 + a.s / 100), 0, 100), clamp(l + a.l, 0, 100)) + (m[2] || '');
}
function genEnterprise(s) {
  const mode = s.mode;
  /* 구동 색: 시드 / 이미지·컬러모음(direct) / 보조색 지정을 모두 반영
     - accent*: 강조1, teal*: 강조2(보조), surf*: 표면·텍스트 톤 */
  let accentH, accentS, tealH, tealS, surfH, surfS;
  if (s.mapMode === 'direct' && s.imgCols && s.imgCols.length) {
    const cols = s.imgCols;
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
    const dk = byL[0];
    accentH = main.h;
    accentS = main.s;
    tealH = sub.h;
    tealS = sub.s;
    surfH = dk.h;
    surfS = dk.s;
  } else {
    const c = rgbToHsl(hexToRgb(s.seed));
    accentH = c.h;
    accentS = c.s;
    surfH = c.h;
    surfS = c.s;
    if (s.subHex) {
      const sc = rgbToHsl(hexToRgb(s.subHex));
      tealH = sc.h;
      tealS = sc.s;
    } else {
      /* 배색 방식(harmony)을 반영 — flat과 동일하게 보조색 색상환 회전 */
      tealH = c.h + (SUB_OFFSET[s.harmony] || 35);
      tealS = c.s;
    }
  }
  const bS = clamp(accentS, 35, 95);
  const tS = clamp(tealS, 40, 90);
  const surfSat = clamp(surfS * 0.3, 8, 26);
  const hx = (hh, ss, ll) => hslToHex(((hh % 360) + 360) % 360, clamp(ss, 0, 100), clamp(ll, 0, 100));
  const al = (hex, f) =>
    hex +
    Math.round(clamp(f, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');
  const T = {};
  if (mode === 'dark') {
    T.accent = hx(accentH, clamp(bS, 55, 100), 64);
    T.teal = hx(tealH, clamp(tS, 45, 80), 67);
    T.base = hx(surfH, surfSat, 5.5);
    T.s1 = hx(surfH, surfSat, 12);
    T.s2 = hx(surfH, surfSat, 19);
    T.s3 = hx(surfH, surfSat * 0.95, 28);
    T.lineSolid = hx(surfH, surfSat, 24);
    T.tPrimary = '#ffffff';
    T.tSecondary = al('#ffffff', 0.7);
    T.tTertiary = al('#ffffff', 0.6);
    T.tLabel = hx(surfH, 24, 68);
    T.tLabelBright = hx(surfH, 26, 76);
    T.tHeading = hx(surfH, 6, 92);
    T.tAxis = al('#ffffff', 0.55);
    T.tDim = al(hx(surfH, 18, 52), 0.6);
    T.ovDivider = al('#ffffff', 0.1);
    T.ovSubtle = al('#ffffff', 0.05);
    T.ovDotRing = al('#ffffff', 0.5);
    T.ovHigh = al('#ffffff', 0.9);
    T.ovDim45 = al('#ffffff', 0.45);
    T.ovGlow = al('#ffffff', 0.15);
    T.iconGray = '#c4c4c4';
    T.trackLight = '#7b7b7b';
    T.trackDark = '#605f5f';
    T.lighterBlue = hx(accentH, clamp(bS, 60, 100), 76);
    T.deepBlue = hx(accentH, clamp(bS * 0.85, 55, 90), 53);
    T.dot1 = hx(surfH, 14, 66);
    T.dot2 = hx(surfH, 16, 40);
    T.dot3 = hx(surfH, 20, 28);
    T.dataCyan = hx(tealH, 95, 50);
  } else {
    T.accent = hx(accentH, clamp(bS, 55, 95), 50);
    T.teal = hx(tealH, clamp(tS, 45, 80), 46);
    T.base = hx(surfH, clamp(surfSat * 0.8, 6, 16), 97.8);
    T.s1 = hx(surfH, 20, 100);
    T.s2 = hx(surfH, clamp(surfSat * 1.0, 10, 22), 95.5);
    T.s3 = hx(surfH, clamp(surfSat * 0.9, 9, 20), 90.5);
    T.lineSolid = hx(surfH, clamp(surfSat * 0.9, 9, 22), 88.5);
    T.tPrimary = hx(surfH, 30, 13);
    T.tSecondary = al(hx(surfH, 28, 18), 0.85);
    /* 알파 0.72가 흰 표면에서 색을 41% 희석하므로, 명도를 다크 쪽 감각대로 잡으면
       간발의 차로 AA를 놓친다(실측 tertiary 4.44 · axis 4.39). 각각 두세 단계 낮춰
       4.6~4.9로 올림 — 알파를 키우면 '흐린 보조 텍스트'라는 성격이 사라져서 명도로 푼다. */
    T.tTertiary = al(hx(surfH, 22, 24), 0.72);
    T.tLabel = hx(surfH, 20, 40);
    T.tLabelBright = hx(surfH, 22, 32);
    T.tHeading = hx(surfH, 26, 16);
    T.tAxis = al(hx(surfH, 18, 26), 0.72);
    T.tDim = al(hx(surfH, 16, 42), 0.62);
    T.ovDivider = al(hx(surfH, 20, 22), 0.16);
    T.ovSubtle = al(hx(surfH, 20, 22), 0.05);
    T.ovDotRing = al(hx(surfH, 20, 30), 0.45);
    T.ovHigh = al(hx(surfH, 26, 16), 0.9);
    T.ovDim45 = al(hx(surfH, 20, 30), 0.45);
    T.ovGlow = al(hx(surfH, 30, 55), 0.14);
    T.iconGray = '#8a8a8a';
    T.trackLight = hx(surfH, 16, 82);
    T.trackDark = hx(surfH, 14, 74);
    T.lighterBlue = hx(accentH, clamp(bS, 55, 95), 62);
    T.deepBlue = hx(accentH, clamp(bS * 0.9, 55, 90), 42);
    T.dot1 = hx(surfH, 16, 54);
    T.dot2 = hx(surfH, 16, 68);
    T.dot3 = hx(surfH, 18, 78);
    T.dataCyan = hx(tealH, 80, 42);
  }
  /* 강조·표면 알파 단계 */
  T.accent15 = al(T.accent, 0.15);
  T.accent20 = al(T.accent, 0.2);
  T.accent40 = al(T.accent, 0.4);
  T.accent50 = al(T.accent, 0.5);
  T.teal20 = al(T.teal, 0.2);
  T.s1_50 = al(T.s1, 0.5);
  T.s1_70 = al(T.s1, 0.7);
  T.s3_80 = al(T.s3, 0.8);
  /* 상태색 + 그라데이션(정상: 강조→teal, 위험: 레드 그라데이션) */
  T.crit = hx(2, 72, mode === 'dark' ? 58 : 50);
  T.critBright = hx(3, 100, mode === 'dark' ? 60 : 55);
  T.crit15 = al(T.crit, 0.15);
  T.crit60 = al(T.crit, 0.6);
  T.warn = hx(38, 90, mode === 'dark' ? 55 : 48);
  T.gChartS = T.accent;
  T.gChartE = T.teal;
  T.gFadeS = al(T.accent, 0.25);
  T.gFadeE = al(T.accent, 0);
  T.gProgS = hx(6, 100, 63);
  T.gProgE = hx(8, 55, 50);
  /* 미세조정(색상 이동·채도·명도) 반영 — 시드 슬라이더가 Enterprise에도 먹히도록 */
  const a = s.adjust;
  if (a && (a.h || a.s || a.l)) for (const k in T) T[k] = adjustHex(T[k], a);
  return T;
}
/* Enterprise 토큰에서 대시보드 기본 10색(코어 변수)·팔레트 UI용 맵을 뽑아냄 */
function entCoreMap(T) {
  return {
    'bg/page': T.base,
    'bg/surface': T.s1,
    'bg/accent': T.s2,
    line: T.lineSolid,
    'text/strong': T.tPrimary,
    'text/weak': T.tLabel,
    'point/main': T.accent,
    'point/sub': T.teal,
    danger: T.crit,
    warning: T.warn,
  };
}
/* Enterprise 전용: 진행률 막대 색을 값에 따라 정상(강조)/위험(레드)로 구분 */
function enhanceEnterpriseBars(root) {
  root = root || document.querySelector('.main');
  if (!root) return;
  const on = root.getAttribute('data-version') === 'enterprise';
  root.querySelectorAll('.fill').forEach((f) => {
    if (!on) {
      f.classList.remove('hot');
      return;
    }
    const pv = f.closest('.prow') ? f.closest('.prow').querySelector('.pv') : null;
    const v = pv ? parseFloat(pv.textContent) : NaN;
    f.classList.toggle('hot', v >= 80);
  });
}
