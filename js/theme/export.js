/* ── 내보내기 — CSS · JSON · Figma · Tailwind · PNG · SVG · 공유 URL ── */

/* ============================================================
 *  내보내기(Export): 토큰(CSS/JSON/Figma/Tailwind) · PNG/SVG · 공유 URL
 * ============================================================ */
const exRadius = () => (state.radius != null ? state.radius : 8);
const kebab = (role) => role.replace('/', '-');
/* 내보내기용 색 계산 — 현재 모드(직접지정 색 반영) + 반대 모드(같은 기준색에서 자동 생성).
   Enterprise면 확장 토큰(EV) 전체 포함 → 화면에 보이는 토큰과 산출물이 일치 */
function exMaps() {
  const cur = captureTheme();
  const other = Object.assign({}, cur, { mode: cur.mode === 'dark' ? 'light' : 'dark', overrides: {} });
  const isEnt = (cur.version || 'flat') === 'enterprise';
  return {
    isEnt,
    curMode: cur.mode,
    core: themeCoreMap(cur),
    coreOther: themeCoreMap(other),
    ent: isEnt ? genEnterprise(cur) : null,
    entOther: isEnt ? genEnterprise(other) : null,
  };
}
function genCSS(m) {
  const block = (core, ent) => {
    const lines = Object.keys(RV).map((k) => `  ${RV[k]}: ${core[k]};`);
    if (ent) Object.keys(EV).forEach((k) => lines.push(`  ${EV[k]}: ${ent[k]};`));
    return lines.join('\n');
  };
  const otherName = m.curMode === 'dark' ? 'light' : 'dark';
  const indent = (s) =>
    s
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n');
  return (
    `/* WEMB Theme — 기본: ${m.curMode} 모드 (직접 지정 색 반영${m.isEnt ? ' · Enterprise 확장 토큰 포함' : ''}) */\n` +
    `:root {\n${block(m.core, m.ent)}\n  --radius-panel: ${exRadius()}px;\n}\n\n` +
    `/* ${otherName} 모드 — 같은 기준 색에서 자동 생성 (직접 지정 색 미반영) */\n` +
    `@media (prefers-color-scheme: ${otherName}) {\n  :root {\n${indent(block(m.coreOther, m.entOther))}\n  }\n}`
  );
}
function genJSON(m) {
  const obj = {};
  Object.keys(RV).forEach((k) => {
    const parts = k.split('/');
    let cur = obj;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) cur[p] = { $type: 'color', $value: m.core[k] };
      else cur = cur[p] = cur[p] || {};
    });
  });
  if (m.ent) {
    obj.enterprise = {};
    Object.keys(EV).forEach((k) => (obj.enterprise[EV[k].replace(/^--/, '')] = { $type: 'color', $value: m.ent[k] }));
  }
  obj.radius = { panel: { $type: 'dimension', $value: exRadius() + 'px' } };
  return JSON.stringify(obj, null, 2);
}
function genFigma(m) {
  const dark = m.curMode === 'dark' ? m.core : m.coreOther;
  const light = m.curMode === 'light' ? m.core : m.coreOther;
  const variables = Object.keys(RV).map((k) => ({ name: k, type: 'COLOR', valuesByMode: { Dark: dark[k], Light: light[k] } }));
  if (m.ent) {
    const eDark = m.curMode === 'dark' ? m.ent : m.entOther;
    const eLight = m.curMode === 'light' ? m.ent : m.entOther;
    Object.keys(EV).forEach((k) => variables.push({ name: 'enterprise/' + EV[k].replace(/^--/, ''), type: 'COLOR', valuesByMode: { Dark: eDark[k], Light: eLight[k] } }));
  }
  variables.push({ name: 'radius/panel', type: 'FLOAT', valuesByMode: { Dark: exRadius(), Light: exRadius() } });
  return JSON.stringify({ name: 'WEMB Theme', modes: ['Dark', 'Light'], variables }, null, 2);
}
function genTailwind(m) {
  const entries = Object.keys(RV).map((k) => `        '${kebab(k)}': '${m.core[k]}',`);
  if (m.ent) Object.keys(EV).forEach((k) => entries.push(`        'ent-${EV[k].replace(/^--/, '')}': '${m.ent[k]}',`));
  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries.join('\n')}\n      },\n      borderRadius: {\n        panel: '${exRadius()}px',\n      },\n    },\n  },\n};`;
}
let exFmt = 'css';
function exContent() {
  const m = exMaps();
  if (exFmt === 'json') return genJSON(m);
  if (exFmt === 'figma') return genFigma(m);
  if (exFmt === 'tw') return genTailwind(m);
  return genCSS(m);
}
function renderExport() {
  document.getElementById('exCode').textContent = exContent();
}
function exHintMsg(msg, cls) {
  const h = document.getElementById('exHint');
  h.textContent = msg;
  h.className = 'exhint' + (cls ? ' ' + cls : '');
}
/* 파일 다운로드 헬퍼 */
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('load fail'));
    document.head.appendChild(s);
  });
}
/* html2canvas-pro 로더 — 인터넷 없이도 되도록 로컬 번들(src/vendor)을 먼저 쓰고, 실패하면 CDN으로 폴백한다.
   이미 로드돼 있으면 즉시 반환. 캡처(썸네일)·PNG 내보내기가 공통으로 사용. */
function loadH2C() {
  if (window.html2canvas || window.html2canvasPro) return Promise.resolve();
  return loadScript('src/vendor/html2canvas-pro.min.js')
    .catch(() => loadScript('https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js'));
}
/* 대시보드 PNG — html2canvas-pro(최신 color-mix/색함수 지원)를 필요할 때 CDN에서 불러와 캡처 */
async function exportPNG() {
  exHintMsg('이미지를 만드는 중… (처음엔 라이브러리 다운로드로 잠시 걸려요)');
  try {
    const h2c = () => window.html2canvas || window.html2canvasPro;
    if (!h2c()) await loadH2C();
    const render = h2c();
    if (!render) throw new Error('no lib');
    const el = document.querySelector('.main'); /* 지금 보이는 화면만 잡힘 — 숨은 화면은 display:none */
    const canvas = await render(el, { backgroundColor: themeCoreMap(captureTheme())['bg/page'], scale: 2, logging: false, useCORS: true });
    const isDT = state.screen === 'dt';
    await new Promise((res) =>
      canvas.toBlob((b) => {
        downloadBlob(b, isDT ? 'wemb-digital-twin.png' : 'wemb-dashboard.png');
        res();
      }, 'image/png')
    );
    exHintMsg((isDT ? 'Digital Twin' : '대시보드') + ' PNG를 저장했어요.', 'ok');
  } catch (e) {
    exHintMsg('PNG 생성에 실패했어요(오프라인이면 인터넷 연결이 필요). 대신 팔레트 SVG를 이용하세요.', 'err');
  }
}
/* 팔레트 SVG — 색상표(스와치+코드)를 벡터로 직접 생성 */
function genPaletteSVG() {
  const hex = themeCoreMap(captureTheme());
  const pad = 22,
    rh = 48,
    cw = 320,
    headH = 70;
  const W = pad * 2 + cw,
    H = headH + AB_ROLES.length * rh + pad;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let y = headH;
  const rows = AB_ROLES.map(([k, l]) => {
    const sw = `<rect x="${pad}" y="${y}" width="34" height="34" rx="7" fill="${hex[k]}" stroke="rgba(0,0,0,0.12)"/>`;
    const lab = `<text x="${pad + 46}" y="${y + 15}" font-family="Pretendard, sans-serif" font-size="13.5" font-weight="600" fill="#15151a">${esc(l)}</text>`;
    const code = `<text x="${pad + 46}" y="${y + 31}" font-family="Consolas, monospace" font-size="12" fill="#6b7280">${hex[k]} · ${esc(k)}</text>`;
    y += rh;
    return sw + lab + code;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#ffffff"/><text x="${pad}" y="34" font-family="Pretendard, sans-serif" font-weight="700" font-size="18" fill="#15151a">WEMB Theme Palette</text><text x="${pad}" y="54" font-family="Pretendard, sans-serif" font-size="12.5" fill="#9aa0ac">${state.mode === 'dark' ? '다크' : '라이트'} · 모서리 ${exRadius()}px · 10 토큰</text>${rows}</svg>`;
}
function exportSVG() {
  downloadBlob(new Blob([genPaletteSVG()], { type: 'image/svg+xml' }), 'wemb-palette.svg');
  exHintMsg('팔레트 SVG를 저장했어요.', 'ok');
}
/* 공유 URL — 현재 테마를 직렬화해 링크 해시에 담음 */
function encodeState(t) {
  const slim = Object.assign({}, t);
  if (slim.imgCols) slim.imgCols = slim.imgCols.slice(0, 16).map((c) => ({ h: +(+c.h).toFixed(1), s: +(+c.s).toFixed(1), l: +(+c.l).toFixed(1), score: +(+(c.score || 0)).toFixed(4) }));
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
}
function decodeState(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}
function shareURL() {
  return location.href.split('#')[0] + WEMB.router.href('/studio', { t: encodeState(captureTheme()) });
}
async function copyShare() {
  const url = shareURL();
  try {
    history.replaceState(history.state, '', WEMB.router.href('/studio', { t: encodeState(captureTheme()) }));
  } catch (e) {}
  try {
    await navigator.clipboard.writeText(url);
    exHintMsg('공유 링크를 복사했어요. 이 링크를 열면 같은 시안이 그대로 적용돼요.', 'ok');
  } catch (e) {
    exHintMsg('복사 권한이 없어요. 주소창의 링크를 직접 복사하세요.', 'err');
  }
}
function applyShareFromURL() {
  /* 공유 시안 — 지금 형식 #/studio?t=…(퍼센트 인코딩), 예전 형식 #t=…(원문) 둘 다 읽는다 */
  const h = location.hash;
  const qi = h.indexOf('?');
  let enc = h.charAt(1) === '/' && qi > 0 ? new URLSearchParams(h.slice(qi + 1)).get('t') : null;
  if (!enc) { const m = h.match(/[#&]t=([^&]+)/); enc = m && m[1]; }
  if (!enc) return false;
  try {
    restoreTheme(decodeState(enc));
    return true;
  } catch (e) {
    return false;
  }
}
function openExport() {
  renderExport();
  exHintMsg('탭을 눌러 형식을 고르고 “복사”로 코드를 가져가세요.');
  updateExportGuard(); /* (2-b) 대비 미달이면 상단에 경고 */
  document.getElementById('exModal').classList.add('show');
}
function closeExport() {
  document.getElementById('exModal').classList.remove('show');
}
function initExport() {
  document.getElementById('exportOpen').onclick = openExport;
  document.getElementById('exClose').onclick = closeExport;
  document.getElementById('exModal').addEventListener('click', (e) => {
    if (e.target.id === 'exModal') closeExport();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('exModal').classList.contains('show')) closeExport();
  });
  document.querySelectorAll('#exTabs button').forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll('#exTabs button').forEach((x) => x.classList.toggle('on', x === b));
      exFmt = b.dataset.fmt;
      renderExport();
    };
  });
  document.getElementById('exCopy').onclick = async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(exContent());
      btn.classList.add('done');
      btn.textContent = '복사됨';
      exHintMsg('클립보드에 복사했어요.', 'ok');
      setTimeout(() => {
        btn.classList.remove('done');
        btn.textContent = '복사';
      }, 1200);
    } catch (err) {
      exHintMsg('복사 권한이 없어요. 코드를 직접 선택해 복사하세요.', 'err');
    }
  };
  document.getElementById('exPng').onclick = exportPNG;
  document.getElementById('exSvg').onclick = exportSVG;
  document.getElementById('exShare').onclick = copyShare;
  document.getElementById('exScreen').onclick = exportPreviewHTML;
}
