/* '스튜디오 열기' 로 들어온 직후(세션 플래그 wemb-fresh-open)와 프로젝트를 다시 열 때
   HANA 시안을 그리는 갈래를 더한다. 한진과 같은 자리, 같은 방식이다.
   실행: node src/hana/_gen/patch-studio2.js  (여러 번 돌려도 안전) */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
const CRLF = s.indexOf(CR + NL) >= 0;
if (CRLF) s = s.split(CR + NL).join(NL);
const done = [];
function must(a) { if (s.indexOf(a) < 0) { console.error('anchor missing:', a.slice(0, 80)); process.exit(1); } }

/* ① 스튜디오 열기 직후 — 상세에서 고른 장면 그대로 그린다 */
if (s.indexOf("f.tpl === 'hana'") < 0) {
  const A = "              if (f.tpl === 'hanjin') {";
  must(A);
  s = s.replace(A, [
    "              if (f.tpl === 'hana') {",
    "                localStorage.setItem('wemb-tpl-dt', 'hana'); localStorage.removeItem('wemb-tpl-img');",
    '                /* 템플릿 상세에서 고른 장면(화면 14장 중 하나)을 그대로 연다 */',
    "                const wantHn = (typeof HN_SCREENS !== 'undefined' && HN_SCREENS[f.scene]) ? f.scene",
    "                  : (localStorage.getItem('wemb-hana-screen') || 'overview-02');",
    "                try { localStorage.setItem('wemb-hana-screen', wantHn); } catch (e3) {}",
    "                if (typeof applyHanaDT === 'function') applyHanaDT(wantHn);",
    '              }',
    '              else ' + A.trim(),
  ].join('\n'));
  done.push('fresh-open');
}

/* ② 열 장면 계산 — hana 는 tplScene 이 곧 화면 키다 */
if (s.indexOf("openProj.tpl === 'hana'") < 0) {
  const A = "          const openScene = openProj.tplScene === 'popup' ? 'popup' : openProj.tplScene === 'hvac' ? 'hvac' : 'main';";
  must(A);
  s = s.replace(A, "          const openScene = openProj.tpl === 'hana' ? (openProj.tplScene || 'overview-02')\n"
    + "            : openProj.tplScene === 'popup' ? 'popup' : openProj.tplScene === 'hvac' ? 'hvac' : 'main';");
  const B = "            if (openProj.tpl === 'skhynix-hub') localStorage.setItem('wemb-hub-screen', openScene === 'hvac' ? 'hvac' : 'main');";
  must(B);
  s = s.replace(B, B + "\n            if (openProj.tpl === 'hana') localStorage.setItem('wemb-hana-screen', openScene);");
  done.push('openScene');
}

/* ③ 프로젝트를 다시 열 때 — 그 화면의 장면을 기억한다 */
if (s.indexOf("wemb-hana-screen', t.tplScene") < 0) {
  const A = "          try { localStorage.setItem('wemb-hanjin-screen', (t.tplScene === 'gate' || t.tplScene === 'unload') ? t.tplScene : 'main'); } catch (e) {}";
  must(A);
  s = s.replace(A, A + "\n          try { if (t.tpl === 'hana') localStorage.setItem('wemb-hana-screen', t.tplScene || 'overview-02'); } catch (e) {}");
  done.push('openProject');
}

/* ④ 화면 테마 — 원본이 다크라 처음엔 다크로 시작하고 고른 값을 되살린다(한진과 같은 처리) */
if (s.indexOf("=== 'hana') {\n          const want") < 0) {
  const A = "        if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hanjin') {";
  must(A);
  s = s.replace(A, [
    "        if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hana') {",
    "          const want = localStorage.getItem('wemb-hana-mode') === 'light' ? 'light' : 'dark';",
    '          if (state.mode !== want) {',
    '            state.mode = want;',
    "            document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));",
    '          }',
    '        }',
    A,
  ].join('\n'));
  done.push('theme-restore');
}

fs.writeFileSync(F, CRLF ? s.split(NL).join(CR + NL) : s);
console.log('patched index.html:', done.join(', ') || '(nothing to do)');
