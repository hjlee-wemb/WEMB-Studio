/* ── 도움말(?) 툴팁 ── */

/* ---------- 도움말(?) 툴팁 — 표시 시 body로 옮겨 어떤 조상(스크롤·filter·transform)에도
   갇히지 않게 하고, 좌표는 뷰포트 안으로 보정. 표시/숨김은 JS가 .tip-on 으로 관리. ---------- */
(function () {
  const GAP = 9;
  let active = null;
  function hide() {
    if (active) {
      active.classList.remove('tip-on');
      active = null;
    }
  }
  function show(info) {
    /* 최초 표시 때 tip을 body로 이동(그 뒤로도 body에 유지) */
    let tip = info._tip || info.querySelector(':scope > .tip');
    if (!tip) return;
    info._tip = tip;
    if (tip.parentElement !== document.body) document.body.appendChild(tip);
    const r = info.getBoundingClientRect();
    const tw = tip.offsetWidth || 248;
    const th = tip.offsetHeight || 120;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    /* 오른쪽(프리뷰 방향)으로 펼침 — 뷰포트를 벗어나면 왼쪽으로 당겨 잘림 방지 */
    let left = r.left - 2;
    if (left + tw > vw - 8) left = vw - 8 - tw;
    if (left < 8) left = 8;
    /* 아래로 펼치되, 아래 공간이 부족하면 위로 */
    let up = false;
    let top = r.bottom + GAP;
    if (top + th > vh - 8) {
      top = r.top - th - GAP;
      up = true;
    }
    if (top < 8) {
      top = r.bottom + GAP;
      up = false;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    tip.classList.toggle('up', up);
    /* 화살표를 배지 중심에 맞춤 */
    tip.style.setProperty('--arrow-x', Math.max(8, r.left + r.width / 2 - left - 6) + 'px');
    if (active && active !== tip) active.classList.remove('tip-on');
    tip.classList.add('tip-on');
    active = tip;
  }
  document.addEventListener('mouseover', (e) => {
    const info = e.target.closest && e.target.closest('.info');
    if (info) show(info);
  });
  document.addEventListener('mouseout', (e) => {
    const info = e.target.closest && e.target.closest('.info');
    if (!info) return;
    /* 배지 내부 자식으로 이동한 경우는 유지, 배지를 완전히 벗어나면 숨김 */
    const to = e.relatedTarget;
    if (!to || !to.closest || !to.closest('.info')) hide();
  });
  document.addEventListener('focusin', (e) => {
    const info = e.target.closest && e.target.closest('.info');
    if (info) show(info);
    else hide();
  });
  /* 스크롤·리사이즈 중엔 좌표가 틀어지므로 즉시 숨김 */
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
})();
