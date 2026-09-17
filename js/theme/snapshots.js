/* ── 이름 붙인 테마 스냅샷 ── */

/* ---------- 명명 스냅샷 저장 ---------- */
const SNAP_KEY = 'wemb-theme-snapshots';
let snapshots = [];
function loadSnapshots() {
  try {
    snapshots = JSON.parse(localStorage.getItem(SNAP_KEY)) || [];
  } catch (e) {
    snapshots = [];
  }
}
function saveSnapshots() {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(snapshots));
  } catch (e) {
    storageWarn(); /* 조용히 삼키지 않고 사용자에게 알림 — 파일 백업 유도 */
  }
}
function defaultSnapName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `테마 ${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function addSnapshot(name) {
  name = (name || '').trim() || defaultSnapName();
  snapshots.unshift({ id: 's' + Date.now(), name: name, theme: captureTheme() });
  if (snapshots.length > 40) snapshots.length = 40;
  saveSnapshots();
  renderSnapshots();
  refreshABOptions();
}
function deleteSnapshot(id) {
  snapshots = snapshots.filter((s) => s.id !== id);
  saveSnapshots();
  renderSnapshots();
  refreshABOptions();
}
function renderSnapshots() {
  const list = document.getElementById('snapList');
  const empty = document.getElementById('snapEmpty');
  list.innerHTML = '';
  empty.style.display = snapshots.length ? 'none' : '';
  snapshots.forEach((s) => {
    const hex = themeCoreMap(s.theme);
    const sw = ['bg/page', 'bg/surface', 'point/main', 'point/sub', 'text/strong'].map((k) => `<i style="background:${hex[k]}"></i>`).join('');
    const row = document.createElement('div');
    row.className = 'snaprow';
    /* 스냅샷 이름은 사용자가 입력한 글자 — HTML 로 넣기 전에 이스케이프 */
    row.innerHTML = `<span class="sws">${sw}</span><span class="nm" title="더블클릭해 이름 변경">${escHTML(s.name)}</span><span class="acts"><button class="ap" title="이 테마를 화면에 적용">적용</button><button class="ovw" title="현재 테마로 이 스냅샷 덮어쓰기(갱신)">갱신</button><button class="del" title="이 스냅샷 삭제">삭제</button></span>`;
    row.querySelector('.ap').onclick = () => {
      restoreTheme(s.theme);
      commitHistory();
    };
    row.querySelector('.ovw').onclick = () => overwriteSnapshot(s.id);
    row.querySelector('.del').onclick = () => deleteSnapshot(s.id);
    const nmEl = row.querySelector('.nm');
    nmEl.ondblclick = () => startRename(nmEl, s);
    list.appendChild(row);
  });
}
document.getElementById('snapSave').onclick = () => {
  const inp = document.getElementById('snapName');
  addSnapshot(inp.value);
  inp.value = '';
  toast(`“${escHTML(snapshots[0].name)}” 스냅샷으로 저장했어요.`, { type: 'ok', kbd: 'Ctrl S' });
};
document.getElementById('snapName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('snapSave').click();
});

/* (5-b) 스냅샷 이름 변경 / 현재 테마로 덮어쓰기(갱신) */
function overwriteSnapshot(id) {
  const s = snapshots.find((x) => x.id === id);
  if (!s) return;
  s.theme = captureTheme();
  saveSnapshots();
  renderSnapshots();
  refreshABOptions();
  toast(`“${escHTML(s.name)}”을(를) 현재 테마로 갱신했어요.`, { type: 'ok' });
}
function renameSnapshot(id, name) {
  const s = snapshots.find((x) => x.id === id);
  if (!s) return;
  name = (name || '').trim();
  if (!name) {
    renderSnapshots();
    return;
  }
  s.name = name.slice(0, 40);
  saveSnapshots();
  renderSnapshots();
  refreshABOptions();
}
function startRename(nmEl, s) {
  const inp = document.createElement('input');
  inp.className = 'nmedit';
  inp.value = s.name;
  inp.maxLength = 40;
  nmEl.replaceWith(inp);
  inp.focus();
  inp.select();
  let done = false;
  const commit = (save) => {
    if (done) return;
    done = true;
    if (save) renameSnapshot(s.id, inp.value);
    else renderSnapshots();
  };
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit(true);
    else if (e.key === 'Escape') commit(false);
  });
  inp.addEventListener('blur', () => commit(true));
}
