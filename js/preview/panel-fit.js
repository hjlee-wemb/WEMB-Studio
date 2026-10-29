/* ── 패널 맞춤 — 작은 화면(노트북)에서 패널 속 표 · 목록이 잘려 스크롤바가 생기던 것 ──
   대시보드 미리보기의 패널은 화면 높이를 나눠 갖는다. 1536×864 노트북에서는 패널이 145px 남짓이라
   5~6줄짜리 표가 반쯤 잘리고 패널마다 스크롤바가 생겨 고객 앞에서 '깨진 화면'처럼 보였다.
   → 들어가는 만큼만 **줄 단위로** 보여 주고(반쯤 잘린 줄 없음) 나머지는 숨긴다. 숨긴 게 있으면 아래를 흐리게 하고,
     화면이 넓어지면 숨긴 줄이 다시 나온다. 글자를 고치는 중(패널 편집 · 배치 편집)에는 맞추지 않는다 — 숨은 줄도 고칠 수 있게.
   줄 = 표의 tbody 행 · 진행률 목록 줄 · 도넛 범례 줄. 이벤트 로그는 줄이 계속 위로 흘러들어서 숨기지 않고 흐림만 준다.
   WEMB.panelFit.run() — 내용이 바뀐 뒤(PRD 칠하기 등) 다시 맞출 때 */
(function panelFit() {
  const main = document.querySelector('.main');
  if (!main) return;
  const editing = () => main.classList.contains('editing') || main.classList.contains('content-editing');
  const visiblePanels = () => [...main.querySelectorAll('.cols .panel')].filter((p) => p.offsetParent);

  function reset(body) {
    body.querySelectorAll('[data-fit-hide]').forEach((r) => { r.style.display = ''; r.removeAttribute('data-fit-hide'); });
    body.classList.remove('is-clipped');
  }
  function fit(body) {
    reset(body);
    if (editing()) return;
    if (body.scrollHeight <= body.clientHeight + 1) return;
    /* 뒤에 있는 표 · 목록부터 줄인다. 두 줄 아래로 줄어야 하면 그 표(목록)는 머리말째 접고 앞의 표에 자리를 준다
       — '1줄짜리 표 두 개'보다 '3줄짜리 표 하나'가 읽힌다. 맨 앞 표는 최소 한 줄을 남긴다. */
    const over = () => body.scrollHeight > body.clientHeight + 1;
    const hide = (el) => { el.style.display = 'none'; el.setAttribute('data-fit-hide', '1'); };
    const groups = [...body.querySelectorAll('tbody, .plist, .dleg')];
    for (let g = groups.length - 1; g >= 0 && over(); g--) {
      const grp = groups[g];
      const rows = () => [...grp.querySelectorAll('tr, .prow, .row')].filter((r) => r.style.display !== 'none');
      const keep = g > 0 ? 2 : 1;
      while (over() && rows().length > keep) hide(rows()[rows().length - 1]);
      if (over() && g > 0) {
        const box = grp.tagName === 'TBODY' ? (grp.closest('table') || grp) : grp;
        hide(box);
        const prev = box.previousElementSibling;
        if (prev && prev.matches('.sec-lab')) hide(prev);
      }
    }
    /* 흐림은 실제로 감춘 게 있을 때만 — 차트가 몇 px 넘치는 정도로는 축 글자를 흐리지 않는다 */
    body.classList.toggle('is-clipped', !!body.querySelector('[data-fit-hide]') || body.scrollHeight - body.clientHeight > 20);
  }
  let raf = 0;
  function run() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => visiblePanels().forEach((p) => { const b = p.querySelector('.pbody'); if (b) fit(b); }));
  }
  /* 패널 크기가 바뀌면(창 크기 · 배치 · 밀도 · 옵션 패널 접기) 다시 맞춘다 */
  const ro = new ResizeObserver(run);
  const observeAll = () => { ro.disconnect(); main.querySelectorAll('.cols .panel').forEach((p) => ro.observe(p)); };
  observeAll();
  /* 편집 시작 · 끝, 대시보드 페이지 전환 */
  new MutationObserver(() => { observeAll(); run(); }).observe(main, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('dash-page', run);
  window.WEMB = window.WEMB || {};
  WEMB.panelFit = { run, observeAll };
  run();
})();
