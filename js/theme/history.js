/* ── 테마 캡처 · 복원 · 되돌리기 히스토리 · 단축키 ── */

/* ============================================================
 *  테마 저장 · A/B 비교 · 변경 히스토리
 * ============================================================ */

/* 현재 테마 전체를 복제해 저장 가능한 객체로 */
function captureTheme() {
  return {
    seed: state.seed,
    harmony: state.harmony,
    mode: state.mode,
    subHex: state.subHex,
    mapMode: state.mapMode,
    imgCols: state.imgCols ? JSON.parse(JSON.stringify(state.imgCols)) : null,
    adjust: { h: state.adjust.h || 0, s: state.adjust.s || 0, l: state.adjust.l || 0 },
    source: state.source,
    overrides: Object.assign({}, state.overrides),
    radius: state.radius,
    version: state.version || 'flat' /* Flat/Enterprise도 테마의 일부 — 스냅샷·공유·A/B에 보존 */,
  };
}
/* 테마의 실제 표시 코어 10색 — Enterprise면 Enterprise 파생 코어(+직접지정색), Flat이면 기존 생성값.
   검증표·A/B·스냅샷 색견본·내보내기가 모두 이 함수를 쓰므로 화면과 산출물이 일치함 */
function themeCoreMap(theme) {
  if ((theme.version || 'flat') === 'enterprise') {
    const T = genEnterprise(theme);
    const core = entCoreMap(T);
    const ov = theme.overrides || {};
    for (const k in ov) if (core[k] != null) core[k] = ov[k];
    return core;
  }
  return computeHexMap(theme);
}
/* 사이드바 컨트롤을 현재 state에 맞춰 다시 표시 */
function syncControlsFromState() {
  document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === state.mode));
  document.querySelectorAll('#harmony button').forEach((x) => x.classList.toggle('on', x.dataset.h === state.harmony));
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  setVal('adjH', state.adjust.h || 0);
  setVal('adjS', state.adjust.s || 0);
  setVal('adjL', state.adjust.l || 0);
  syncExtractUI(state.mapMode === 'direct' ? 'direct' : 'auto');
  clearPresetSelection();
}
/* 저장된 테마를 화면에 복원 (히스토리 기록 여부는 호출부에서 결정) */
function restoreTheme(t) {
  restoring = true;
  state.seed = t.seed;
  state.harmony = t.harmony;
  state.mode = t.mode;
  state.subHex = t.subHex;
  state.mapMode = t.mapMode;
  state.imgCols = t.imgCols ? JSON.parse(JSON.stringify(t.imgCols)) : null;
  state.adjust = { h: (t.adjust && t.adjust.h) || 0, s: (t.adjust && t.adjust.s) || 0, l: (t.adjust && t.adjust.l) || 0 };
  state.source = t.source || 'seed';
  state.sourceView = state.source; /* 복원 시 실제 소스의 패널을 보여줌 */
  state.overrides = Object.assign({}, t.overrides || {});
  /* Flat/Enterprise 버전도 복원 — 예전 스냅샷(version 없음)은 현재 버전 유지 */
  if (t.version === 'flat' || t.version === 'enterprise') {
    state.version = t.version;
    syncVersionUI();
    try {
      localStorage.setItem('wemb-version', state.version);
    } catch (e) {}
  }
  syncControlsFromState();
  apply();
  applyRadius(t.radius != null ? t.radius : 8, true);
  restoring = false;
}

/* ---------- 변경 히스토리 ---------- */
let themeHistory = [];
let hIndex = -1;
let restoring = false;
let hTimer = null;
function themeSig(t) {
  return JSON.stringify([t.seed, t.harmony, t.mode, t.subHex, t.mapMode, t.adjust, t.overrides, t.radius, t.imgCols ? t.imgCols.length : 0, t.source, t.version || 'flat']);
}
function historyLabel(t) {
  const m = t.mode === 'dark' ? '다크' : '라이트';
  let src;
  if (t.source === 'image') src = '이미지 추출';
  else if (t.source === 'preset') src = '추천 테마';
  else src = '기준색 ' + (t.seed || '').toUpperCase();
  return m + ' · ' + src;
}
function scheduleHistory() {
  if (restoring) return;
  clearTimeout(hTimer);
  hTimer = setTimeout(commitHistory, 450);
}
function commitHistory() {
  clearTimeout(hTimer);
  const t = captureTheme();
  persistCurrentTheme(t); /* (1-b) 현재 작업 자동 저장 */
  if (hIndex >= 0 && themeSig(themeHistory[hIndex].theme) === themeSig(t)) return;
  themeHistory = themeHistory.slice(0, hIndex + 1);
  themeHistory.push({ theme: t, label: historyLabel(t), time: Date.now() });
  if (themeHistory.length > 30) themeHistory.shift();
  hIndex = themeHistory.length - 1;
  renderHistory();
}
function fmtTime(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes());
}
function renderHistory() {
  const list = document.getElementById('histList');
  list.innerHTML = '';
  for (let i = themeHistory.length - 1; i >= 0; i--) {
    const h = themeHistory[i];
    const row = document.createElement('div');
    row.className = 'histrow' + (i === hIndex ? ' cur' : '');
    row.innerHTML = `<span class="dot"></span><span class="hl">${h.label}</span><span class="ht">${fmtTime(h.time)}</span>`;
    row.onclick = () => jumpHistory(i);
    list.appendChild(row);
  }
  const canUndo = hIndex > 0,
    canRedo = hIndex < themeHistory.length - 1;
  document.getElementById('histUndo').disabled = !canUndo;
  document.getElementById('histRedo').disabled = !canRedo;
  /* 항상 보이는 상단 되돌리기/다시실행 버튼(브랜드 헤더)도 함께 동기화 */
  const qu = document.getElementById('quickUndo'),
    qr = document.getElementById('quickRedo');
  if (qu) qu.disabled = !canUndo;
  if (qr) qr.disabled = !canRedo;
  /* 현재 단계 위치 표시 (예: 3 / 12) */
  const pos = document.getElementById('histPos');
  if (pos) pos.textContent = themeHistory.length ? hIndex + 1 + ' / ' + themeHistory.length : '–';
}
function jumpHistory(i) {
  if (i < 0 || i >= themeHistory.length || i === hIndex) return;
  clearTimeout(hTimer);
  hIndex = i;
  restoreTheme(themeHistory[i].theme);
  renderHistory();
}
function doUndo() {
  commitHistory(); /* 미확정 변경을 먼저 기록해 한 단계도 놓치지 않음 */
  if (hIndex > 0) jumpHistory(hIndex - 1);
}
function doRedo() {
  if (hIndex < themeHistory.length - 1) jumpHistory(hIndex + 1);
}
document.getElementById('histUndo').onclick = doUndo;
document.getElementById('histRedo').onclick = doRedo;
{
  const qu = document.getElementById('quickUndo'),
    qr = document.getElementById('quickRedo');
  if (qu) qu.onclick = doUndo;
  if (qr) qr.onclick = doRedo;
}
/* ── 전역 단축키: 되돌리기(Ctrl/⌘+Z) · 다시 실행(Ctrl/⌘+Shift+Z 또는 Ctrl+Y) ── */
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  const key = e.key.toLowerCase();
  if (key !== 'z' && key !== 'y') return;
  /* 입력 중(텍스트/색상 필드·편집영역)에는 브라우저 기본 되돌리기를 방해하지 않음 */
  const t = e.target;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if (typing) return;
  /* 모달이 열려 있으면 해당 모달 흐름을 방해하지 않음 */
  if (document.querySelector('.abmodal.show, .exmodal.show, .ctpopup.show, .csmodal.show')) return;
  e.preventDefault();
  if (key === 'y' || (key === 'z' && e.shiftKey)) doRedo();
  else doUndo();
});
/* ── Ctrl/⌘+S: 현재 테마를 스냅샷으로 저장 (브라우저 저장 대화상자 대체) ── */
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
  if (e.key.toLowerCase() !== 's') return;
  e.preventDefault(); /* 어디서 눌러도 브라우저 '페이지 저장' 대신 스냅샷 저장 */
  const inp = document.getElementById('snapName');
  addSnapshot(inp ? inp.value : '');
  if (inp) inp.value = '';
  toast(`“${snapshots[0].name}” 스냅샷으로 저장했어요.`, { type: 'ok', kbd: 'Ctrl S' });
});
