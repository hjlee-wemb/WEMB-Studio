/* ── 스냅샷 파일 백업 · 복원 ── */

/* (4) 스냅샷 백업(파일로 저장) / 복원(파일 불러오기) — localStorage 소실 대비 */
document.getElementById('snapExport').addEventListener('click', () => {
  if (!snapshots.length) {
    toast('백업할 저장된 테마가 없어요. 먼저 마음에 드는 테마를 저장해 주세요.', { type: 'warn' });
    return;
  }
  const data = { app: 'wemb-theme-studio', kind: 'snapshots', version: 1, exportedAt: new Date().toISOString(), snapshots: snapshots };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  a.href = url;
  a.download = `wemb-themes-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`저장한 테마 <b>${snapshots.length}개</b>를 파일로 백업했어요.`, { type: 'ok' });
});
document.getElementById('snapImport').addEventListener('click', () => document.getElementById('snapImportFile').click());
document.getElementById('snapImportFile').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (err) {
      toast('불러오지 못했어요. 올바른 백업 파일(.json)이 아니에요.', { type: 'err' });
      e.target.value = '';
      return;
    }
    const incoming = Array.isArray(parsed) ? parsed : parsed && parsed.snapshots;
    const valid = Array.isArray(incoming) ? incoming.filter((s) => s && s.theme && s.theme.seed) : [];
    if (!valid.length) {
      toast('백업 파일에서 복원할 테마를 찾지 못했어요.', { type: 'err' });
      e.target.value = '';
      return;
    }
    const existIds = new Set(snapshots.map((s) => s.id));
    let added = 0;
    valid.forEach((s) => {
      let id = s.id || 's' + Date.now() + Math.random().toString(36).slice(2, 6);
      while (existIds.has(id)) id = 's' + Date.now() + Math.random().toString(36).slice(2, 6);
      existIds.add(id);
      snapshots.push({ id: id, name: (s.name || '복원된 테마').slice(0, 40), theme: s.theme });
      added++;
    });
    if (snapshots.length > 40) snapshots.length = 40;
    saveSnapshots();
    renderSnapshots();
    refreshABOptions();
    e.target.value = '';
    toast(`백업에서 테마 <b>${added}개</b>를 복원했어요.`, { type: 'ok' });
  };
  reader.readAsText(f);
});
