/* ── A/B 테마 비교 ── */

/* ---------- A/B 비교 ---------- */
function abThemeList() {
  return [{ id: '__current__', name: '● 현재 테마' }].concat(snapshots.map((s) => ({ id: s.id, name: s.name })));
}
function refreshABOptions() {
  ['abSelA', 'abSelB'].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    const opts = abThemeList();
    sel.innerHTML = opts.map((o) => `<option value="${o.id}">${o.name}</option>`).join('');
    if (opts.some((o) => o.id === prev)) sel.value = prev;
  });
}
function abResolve(id) {
  if (id === '__current__' || !id) return captureTheme();
  const s = snapshots.find((x) => x.id === id);
  return s ? s.theme : captureTheme();
}
/* 차트 그라디언트 등 id 충돌 방지: 복제본 내부 id와 url(#)/href 참조를 고유 접두사로 네임스페이스 */
function namespaceIds(root, prefix) {
  root.querySelectorAll('[id]').forEach((el) => (el.id = prefix + el.id));
  const urlAttrs = ['fill', 'stroke', 'filter', 'clip-path', 'mask'];
  root.querySelectorAll('*').forEach((el) => {
    urlAttrs.forEach((a) => {
      const v = el.getAttribute(a);
      if (v && v.indexOf('url(#') > -1)
        el.setAttribute(
          a,
          v.replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${prefix}${id})`)
        );
    });
    const st = el.getAttribute('style');
    if (st && st.indexOf('url(#') > -1)
      el.setAttribute(
        'style',
        st.replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${prefix}${id})`)
      );
    ['href', 'xlink:href'].forEach((a) => {
      const v = el.getAttribute(a);
      if (v && v.charAt(0) === '#') el.setAttribute(a, '#' + prefix + v.slice(1));
    });
  });
}
function fitScale(slot, scaler, virt) {
  const VW = +virt.dataset.vw || 1440,
    VH = +virt.dataset.vh || 900;
  const w = slot.clientWidth || 1,
    h = slot.clientHeight || 1;
  const f = Math.min(w / VW, h / VH);
  virt.style.transform = 'scale(' + f + ')';
  scaler.style.width = VW * f + 'px';
  scaler.style.height = VH * f + 'px';
}
/* 지금 보고 있는 화면(대시보드 또는 Digital Twin)을 통째로 복제해 해당 테마 색으로
   칠한 뒤, 칸에 맞춰 축소 표시. 가상 캔버스 크기를 실제 .main과 똑같이 잡아
   동일 레이아웃으로 잘리지 않게 함 */
function renderThemeInto(slotEl, theme, side) {
  const hex = themeCoreMap(theme);
  const radius = theme.radius != null ? theme.radius : 8;
  const main = document.querySelector('.main');
  const VW = main.clientWidth || 1440,
    VH = main.clientHeight || 900;
  slotEl.innerHTML = '';
  const scaler = document.createElement('div');
  scaler.className = 'abscaler';
  const virt = document.createElement('div');
  virt.className = 'abstage';
  virt.dataset.vw = VW;
  virt.dataset.vh = VH;
  virt.style.width = VW + 'px';
  virt.style.height = VH + 'px';
  virt.setAttribute('data-mode', theme.mode);
  for (const k in RV) virt.style.setProperty(RV[k], hex[k]);
  virt.style.setProperty('--on-point', contrast(hex['point/main']));
  virt.style.setProperty('--on-danger', contrast(hex['danger']));
  virt.style.setProperty('--radius-panel', radius + 'px');
  virt.style.background = hex['bg/page'];
  virt.style.color = hex['text/strong'];
  /* 지금 화면을 복제 — 숨김 속성은 떼야 복제본이 보인다 */
  const src = SCREENS[state.screen] || SCREENS.dash;
  const clone = src.cloneNode(true); /* 이미 그려진 차트 SVG까지 그대로 복제 */
  if (window.WEMB3D) WEMB3D.bakeClone(clone); /* 3D 캔버스는 복제하면 비어 있다 → 지금 모습 그림으로 */
  clone.hidden = false;
  clone.removeAttribute('hidden');
  clone.classList.remove('content-editing');
  const banner = clone.querySelector('.editbanner');
  if (banner) banner.remove();
  clone.querySelectorAll('[contenteditable]').forEach((e) => e.removeAttribute('contenteditable'));
  namespaceIds(clone, 'ab' + side + '_'); /* 차트 그라디언트 id 충돌 방지 → 각 복제본이 자기 테마색으로 칠해짐 */
  virt.appendChild(clone);
  scaler.appendChild(virt);
  slotEl.appendChild(scaler);
  fitScale(slotEl, scaler, virt);
}
/* 하단 메타: 색상 썸네일(겹친 원) + 이름 + 모서리 + 전체 색상표 */
const AB_ROLES = [
  ['bg/page', '배경'],
  ['bg/surface', '표면'],
  ['bg/accent', '강조배경'],
  ['line', '구분선'],
  ['point/main', '강조1'],
  ['point/sub', '강조2'],
  ['text/strong', '본문'],
  ['text/weak', '보조'],
  ['danger', '경고'],
  ['warning', '주의'],
];
function fillMeta(metaEl, theme, name) {
  const hex = themeCoreMap(theme);
  const r = theme.radius != null ? theme.radius : 8;
  const circles = ['bg/page', 'bg/surface', 'point/main', 'point/sub', 'text/strong'].map((k) => `<i style="background:${hex[k]}"></i>`).join('');
  const chips = AB_ROLES.map(([k, l]) => `<span class="abchip"><i style="background:${hex[k]}"></i><b>${l}</b><code>${hex[k]}</code></span>`).join('');
  metaEl.innerHTML = `<div class="abthumb"><span class="circles">${circles}</span><span class="abname" title="${name}">${name}</span><span class="abradius">모서리 ${r}px</span></div><div class="abcolors">${chips}</div>`;
}
function renderAB() {
  const selA = document.getElementById('abSelA'),
    selB = document.getElementById('abSelB');
  const tA = abResolve(selA.value),
    tB = abResolve(selB.value);
  const nA = selA.selectedOptions[0] ? selA.selectedOptions[0].text.replace(/^●\s*/, '') : 'A';
  const nB = selB.selectedOptions[0] ? selB.selectedOptions[0].text.replace(/^●\s*/, '') : 'B';
  renderThemeInto(document.getElementById('abPrevA'), tA, 'A');
  renderThemeInto(document.getElementById('abPrevB'), tB, 'B');
  fillMeta(document.getElementById('abMetaA'), tA, nA);
  fillMeta(document.getElementById('abMetaB'), tB, nB);
}
function refitAB() {
  ['abPrevA', 'abPrevB'].forEach((id) => {
    const slot = document.getElementById(id);
    if (!slot) return;
    const scaler = slot.querySelector('.abscaler');
    const virt = slot.querySelector('.abstage');
    if (scaler && virt) fitScale(slot, scaler, virt);
  });
}
/* 처음 열면 저장한 안이 없어 A · B 가 모두 '현재 테마'였다 — 비교할 게 없으면 무엇을 하면 되는지 띠에 말해 준다.
   기본 짝: A = 가장 최근에 저장한 안, B = 지금 화면(저장 → 색 바꾸기 → 비교 순서에 맞게) */
function abSyncNote() {
  const n = document.getElementById('abNote');
  if (!n) return;
  n.textContent = snapshots.length
    ? 'A = 저장한 안 · B = 지금 화면. 다른 안은 위 목록에서 고르세요.'
    : '비교할 안이 아직 없어요 — ‘지금 안 저장’을 누르고 닫은 뒤 색을 바꿔 다시 열면 A(저장한 안) · B(지금 화면)로 비교돼요.';
}
function openAB() {
  refreshABOptions();
  document.getElementById('abSelA').value = snapshots.length ? snapshots[0].id : '__current__';
  document.getElementById('abSelB').value = '__current__';
  abSyncNote();
  document.getElementById('abModal').classList.add('show');
  renderAB(); /* 모달이 보인 뒤 렌더해야 칸 크기를 기준으로 정확히 축소됨 */
}
/* '지금 안 저장' — A안, B안 … 순서로 이름을 붙여 스냅샷으로 남긴다 */
function abKeepCurrent() {
  const used = new Set(snapshots.map((s) => s.name));
  let i = 0;
  while (used.has(String.fromCharCode(65 + i) + '안') && i < 25) i++;
  const name = String.fromCharCode(65 + i) + '안';
  addSnapshot(name);
  document.getElementById('abSelA').value = snapshots[0].id;
  document.getElementById('abSelB').value = '__current__';
  abSyncNote();
  renderAB();
  if (typeof toast === 'function') toast('지금 테마를 “' + name + '”으로 저장했어요. 닫고 색을 바꾸면 B(지금 화면)와 비교돼요.', { type: 'ok' });
}
function closeAB() {
  document.getElementById('abModal').classList.remove('show');
}
function initAB() {
  document.getElementById('abOpen').onclick = openAB;
  document.getElementById('abClose').onclick = closeAB;
  const keep = document.getElementById('abKeep');
  if (keep) keep.onclick = abKeepCurrent;
  document.getElementById('abSelA').onchange = renderAB;
  document.getElementById('abSelB').onchange = renderAB;
  document.getElementById('abModal').addEventListener('click', (e) => {
    if (e.target.id === 'abModal') closeAB();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('abModal').classList.contains('show')) closeAB();
  });
  window.addEventListener('resize', () => {
    if (document.getElementById('abModal').classList.contains('show')) refitAB();
  });
}
