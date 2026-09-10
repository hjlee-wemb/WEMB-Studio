/* ── WCAG 대비 계산과 자동 보정 ── */

function normHex(h) {
  const { r, g, b } = hexToRgb(h);
  const to = (x) => x.toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
function cssHslToHex(str) {
  const m = str.match(/hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/);
  return m ? hslToHex(+m[1], +m[2], +m[3]) : '#000';
}
function contrast(hex) {
  /* 배경(hex) 위 글자색 — 흰/검 중 WCAG 대비가 높은 쪽을 고름 (11px 칩에서도 4.5:1 확보) */
  return wcagRatio('#FFFFFF', hex) >= wcagRatio('#15151A', hex) ? '#fff' : '#15151a';
}
/* ===== WCAG 대비비(контраст) 계산 ===== */
function relLum(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function wcagRatio(a, b) {
  const L1 = relLum(a),
    L2 = relLum(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
/* 글자색을 배경 대비 AAA(≥7:1) 통과하도록 자동 보정 — 통과한 색만 콘텐츠에 사용 */
const AAA_MIN = 7;
function enforceAAA(hexMap, overrides) {
  overrides = overrides || state.overrides;
  const bgs = [hexMap['bg/page'], hexMap['bg/surface']];
  const worst = (c) => Math.min(...bgs.map((b) => wcagRatio(c, b)));
  const bgLight = relLum(hexMap['bg/page']) > 0.4; /* 배경이 밝으면 글자를 어둡게 */
  ['text/strong', 'text/weak'].forEach((role) => {
    if (overrides[role]) return; /* 직접 지정한 색은 그대로 둠 */
    let cur = hexMap[role];
    if (worst(cur) >= AAA_MIN) return;
    const { h, s } = rgbToHsl(hexToRgb(cur));
    let { l } = rgbToHsl(hexToRgb(cur));
    const dir = bgLight ? -1 : 1;
    let best = cur;
    for (let i = 0; i < 110; i++) {
      l = clamp(l + dir, 0, 100);
      best = hslToHex(h, s, l);
      if (worst(best) >= AAA_MIN || l === 0 || l === 100) break;
    }
    hexMap[role] = best.toUpperCase();
  });
}
/* 색상(명도만 이동)을 조정해 배경 대비 ≥bgMin, (textMin>0이면) 그 위 글자(흰/검 중 나은 쪽) 대비 ≥textMin 을 만족시키는 가장 가까운 값.
   흰 글자 고정이 아니라 '최적 글자색' 기준 — 어두운 배경에서 4.5+4.5 동시 충족이 가능해짐 */
const UI_MIN = 3;
function bestTextRatio(c) {
  return Math.max(wcagRatio('#FFFFFF', c), wcagRatio('#15151A', c));
}
function fixContrastLightness(hex, bgs, bgMin, textMin) {
  bgMin = bgMin || UI_MIN;
  textMin = textMin || 0;
  const { h, s } = rgbToHsl(hexToRgb(hex));
  const l0 = rgbToHsl(hexToRgb(hex)).l;
  const ok = (L) => {
    const c = hslToHex(h, s, L);
    let good = bgs.every((b) => wcagRatio(c, b) >= bgMin);
    if (textMin) good = good && bestTextRatio(c) >= textMin;
    return good;
  };
  if (ok(l0)) return hex;
  for (let d = 1; d <= 100; d++) {
    if (l0 + d <= 100 && ok(l0 + d)) return hslToHex(h, s, l0 + d);
    if (l0 - d >= 0 && ok(l0 - d)) return hslToHex(h, s, l0 - d);
  }
  /* 완벽한 값이 없으면 각 기준 대비 여유(ratio/min)가 가장 큰 명도 선택 */
  let best = l0,
    bestScore = -Infinity;
  for (let L = 0; L <= 100; L++) {
    const c = hslToHex(h, s, L);
    let m = Math.min(...bgs.map((b) => wcagRatio(c, b) / bgMin));
    if (textMin) m = Math.min(m, bestTextRatio(c) / textMin);
    if (m > bestScore) {
      bestScore = m;
      best = L;
    }
  }
  return hslToHex(h, s, best);
}
/* 강조·상태색을 '작은 글씨 기준' 배경 대비 ≥4.5:1(흰 버튼글자는 큰글씨 ≥3:1)로 자동 보정 — 직접 지정한 색은 건드리지 않음 */
function enforceContrast(hexMap, overrides) {
  overrides = overrides || {};
  const bgP = hexMap['bg/page'],
    bgS = hexMap['bg/surface'];
  const fix = (role, bgs, bgMin, whiteMin) => {
    if (overrides[role]) return; /* 사용자가 직접 지정한 색은 그대로 둠 */
    hexMap[role] = fixContrastLightness(hexMap[role], bgs, bgMin, whiteMin).toUpperCase();
  };
  fix('point/main', [bgP, bgS], 4.5, 4.5); /* 강조1: 배경 대비 AA 4.5 + 칩 글자(자동 선택) 4.5 */
  fix('point/sub', [bgS], 4.5, 0); /* 강조2: 표면 대비 AA 4.5 */
  fix('danger', [bgS], 4.5, 4.5); /* 경고: 표면 대비 AA 4.5 + 칩 글자(자동 선택) 4.5 */
  fix('warning', [bgS], 4.5, 0); /* 주의: 표면 대비 AA 4.5 */
}
/* 임의 테마(s)의 최종 색상표를 계산 — 미리보기·A/B 비교에서도 동일 결과를 재사용 */
function computeHexMap(s) {
  let P = s.mapMode === 'direct' && s.imgCols ? buildDirect(s.imgCols, s.mode) : genPalette(s.seed, s.harmony, s.mode, s.subHex);
  P = applyAdjust(P, s.adjust);
  const hexMap = {};
  for (const k in P) hexMap[k] = ((s.overrides && s.overrides[k]) || cssHslToHex(P[k])).toUpperCase();
  enforceAAA(hexMap, s.overrides || {}); /* 본문·보조 글자: 배경 대비 AAA */
  enforceContrast(hexMap, s.overrides || {}); /* 강조·상태색: 배경/버튼 대비 ≥3:1 */
  return hexMap;
}
