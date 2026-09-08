/* 위험 상태 심볼은 숨 쉬듯 깜빡이게 한다 — '변화가 있다'를 눈에 띄게.
   대상은 conv.js 가 남긴 `data-hn-status` 가 warning · major · critical 인 것뿐.
   normal · default · basic · 정상 같은 평상 상태는 원본 그대로 가만히 있는다.
   색·형상은 하나도 건드리지 않는다 — 투명도와 아주 약간의 크기만 오간다
   (crescendo: 심각할수록 빠르고 깊게). `scale` 속성을 쓰므로 원본 transform 을 덮지 않는다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');

if (s.indexOf('hnRisk') >= 0) { console.log('already patched'); process.exit(0); }

const A = "    '@media (prefers-reduced-motion:reduce)";
if (s.indexOf(A) < 0) { console.error('anchor not found'); process.exit(1); }

const RULES = [
  "    /* ── 위험 감지 — warning · major · critical 심볼만 숨 쉬듯 깜빡인다 ──",
  "       평상 상태(normal · default · basic …)는 원본 그대로 가만히 둔다.",
  "       투명도와 미세한 크기만 오가므로 색·모양·자리는 원본과 같다. */",
  "    '@keyframes hnRisk{0%,100%{opacity:1;scale:1;}50%{opacity:var(--hn-risk-min,.55);scale:var(--hn-risk-max,1.04);}}',",
  "    '.hn-root [data-hn-status=\"warning\"],'",
  "    + '.hn-root [data-hn-status=\"major\"],'",
  "    + '.hn-root [data-hn-status=\"critical\"]{'",
  "    + 'animation:hnRisk var(--hn-risk-dur,1.8s) ease-in-out infinite;will-change:opacity;}',",
  "    /* 등급이 올라갈수록 빠르고 깊게 — 주의는 느긋하게, 심각은 다급하게 */",
  "    '.hn-root [data-hn-status=\"warning\"]{--hn-risk-dur:2.3s;--hn-risk-min:.64;--hn-risk-max:1.03;}',",
  "    '.hn-root [data-hn-status=\"major\"]{--hn-risk-dur:1.7s;--hn-risk-min:.55;--hn-risk-max:1.04;}',",
  "    '.hn-root [data-hn-status=\"critical\"]{--hn-risk-dur:1.25s;--hn-risk-min:.45;--hn-risk-max:1.05;}',",
  "    /* 라이트에서는 바탕이 밝아 같은 투명도면 덜 보인다 → 조금 더 깊게 */",
  "    '.hn-root[data-theme=\"light\"] [data-hn-status=\"warning\"]{--hn-risk-min:.5;}',",
  "    '.hn-root[data-theme=\"light\"] [data-hn-status=\"major\"]{--hn-risk-min:.42;}',",
  "    '.hn-root[data-theme=\"light\"] [data-hn-status=\"critical\"]{--hn-risk-min:.34;}',",
  "    /* 글자를 고치는 동안에는 멈춘다 — 깜빡임이 편집을 방해하지 않게 */",
  "    '.hn-root.hn-editing [data-hn-status]{animation:none!important;opacity:1;scale:1;}',",
  A,
].join('\n');

s = s.replace(A, RULES);

/* 패널편집 중에는 멈추도록 루트에 표시를 켠다(라이브 루프가 이미 editing() 을 본다) */
const B = '    try { installHanaMenu(root, st); } catch (e) { }';
if (s.indexOf(B) < 0) { console.error('install anchor not found'); process.exit(1); }
s = s.replace(B, B + '\n    try { installRiskEditGuard(root, st); } catch (e) { }');

const C = '  /* ══════════════════ 7. 설치 ══════════════════ */';
s = s.replace(C, [
  '  /* 패널편집이 켜지면 위험 깜빡임을 멈춘다(글자를 고치는 동안 시선이 튀지 않게) */',
  '  function installRiskEditGuard(root, st) {',
  '    if (!root.querySelector(\'[data-hn-status="warning"],[data-hn-status="major"],[data-hn-status="critical"]\')) return;',
  '    var sync = function () { root.classList.toggle("hn-editing", !!editing()); };',
  '    sync();',
  '    var id = setInterval(sync, 400);',
  '    st.cleanup.push(function () { clearInterval(id); root.classList.remove("hn-editing"); });',
  '  }',
  '',
  C,
].join('\n'));

fs.writeFileSync(F, s);
console.log('patched: risk blink (warning/major/critical)');
