/* ── 템플릿 그림 → 3D — 템플릿 화면의 건물 렌더 그림 자리에 같은 크기의 3D 캔버스를 얹는다 ──
   POSCO KDB(main · ack · overview · SOP)의 공장동, LS Electric 미니맵의 공장 단지, 한진 통합관제의 물류센터.
   - 투명 캔버스는 그림 칸보다 넓게 — POSCO · 한진은 화면 전체, LS 는 미니맵 카드(쌓임 순서는 그림 자리라 패널 · 단추는 위에 남는다).
     첫 장면이 그려지면 원래 그림을 숨긴다(지우지 않는다).
   - 처음 시점 = 그림 그대로(칸 안만 그린다). 끌면 한 바퀴(360°) 돌고 모형 전체가 칸 안에 들어오게 물러서며,
     확대해도 칸 가장자리에서 잘리지 않고 캔버스 끝까지 이어 그린다(js/preview/3d/engine.js 의 frame).
   - 화면이 바뀌어 그림이 사라지면 캔버스도 정리한다(WebGL 컨텍스트 반납).
   - 한진: '기본위치' = 처음 시점, 시점 단추 6개(Button/View 1~6) = 처음 · 오른쪽 · 왼쪽 · 위 · 가까이 · 뒤, 층 목록(1F~5F) = 그 층 테두리,
     나침반 = 지금 방향. 그림을 끌어 옮기던 평면 이동(src/hanjin-live.js)은 3D 캔버스 위에서는 비켜 준다.
   - three.js 는 로컬 사본이 먼저라 인터넷 없이도 뜬다. 그래도 못 실으면 그림이 그대로 남는다. */
(function initTpl3d() {
  const stage = document.getElementById('dtStage');
  if (!stage || !window.WEMB3D) return;
  /* area = 3D 가 그려질 수 있는 곳. 그림 칸은 처음 시점의 자리이고, 돌리거나 확대하면 이 안 전체에 그린다(칸 가장자리에서 잘리지 않게).
     POSCO · 한진은 화면 전체(패널 · 단추는 캔버스 위에 그대로), LS 는 미니맵 카드 안 */
  const TARGETS = [
    { tpl: 'posco', sel: '#pkm-Asset_2, #pka-Asset_2, #pko-Asset_2, #pks1-Asset_2', model: 'poscoKdb' },
    { tpl: 'lselectric', sel: '#lsm-Asset_36, #lsd-Asset_36', model: 'lsCampus', area: (img) => { const w = img.closest('[id$="Widget/Mini Map"]'); return w && (w.querySelector('[id*="Card BG"]') || w); }, inset: 3 },
    { tpl: 'hanjin', sel: '#hjc-Asset_2', model: 'hanjinHub', wire: wireHanjin },
  ];
  const mounts = new Map(); // img → { api, ro }
  const pending = new Set();
  let failed = false;

  const areaOf = (img, t) => (t.area && t.area(img)) || img.closest('[class*="-root"]') || img.parentElement;
  /* 캔버스 자리 — 그림 바로 뒤(그림을 자르는 칸이 있으면 그 칸 뒤)에 두어 쌓임 순서는 그림과 같다(뒤에 오는 패널 · 단추가 위).
     크기는 area 전체. 그림 칸은 캔버스 안의 frame 으로 엔진에 넘긴다 */
  function anchorOf(img, area) {
    let a = img;
    for (let e = img.parentElement; e && !e.contains(area); e = e.parentElement) if (getComputedStyle(e).overflow !== 'visible') a = e;
    return a;
  }
  function sync(c, img, t) {
    const area = areaOf(img, t), P = c.offsetParent || c.parentElement;
    if (!P) return null;
    const pr = P.getBoundingClientRect(), s = pr.width / (P.offsetWidth || 1) || 1; // 화면 배율(템플릿은 축소돼 보인다)
    const ar = area.getBoundingClientRect(), ir = img.getBoundingClientRect(), d = t.inset || 0;
    if (!ar.width || !pr.width || !img.offsetWidth) return null; // 숨은 화면
    const L = (v) => (v - pr.left) / s - P.clientLeft, T = (v) => (v - pr.top) / s - P.clientTop;
    const x = L(ar.left) + d, y = T(ar.top) + d, w = ar.width / s - 2 * d, h = ar.height / s - 2 * d;
    const z = getComputedStyle(img).zIndex;
    const css = 'position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' + (z !== 'auto' ? 'z-index:' + z + ';' : '');
    if (c.__css !== css) { c.__css = css; c.style.cssText = css; }
    return { x: L(ir.left) - x, y: T(ir.top) - y, w: img.offsetWidth, h: img.offsetHeight };
  }
  function mount(img, t) {
    pending.add(img);
    WEMB3D.load().then(() => {
      pending.delete(img);
      if (!img.isConnected || mounts.has(img)) return;
      const root = img.closest('[class*="-root"]') || stage;
      let hideT = 0, frame = null, api = null;
      const resync = () => {
        if (!api || !api.canvas.isConnected) return;
        const f = sync(api.canvas, img, t);
        if (f && (!frame || ['x', 'y', 'w', 'h'].some((k) => Math.abs(f[k] - frame[k]) > 0.25))) { frame = f; api.wake(); }
      };
      api = WEMB3D.create({
        model: t.model, cls: 'tpl3d', transparent: true, themeEl: root,
        // 그림이 칸에 깔리는 방식 그대로(object-fit · object-position) — 사진 맞춤 모형은 처음 시점이 그림과 픽셀까지 같아야 한다
        fit: getComputedStyle(img).objectFit === 'fill' ? 'fill' : 'cover',
        fitPos: getComputedStyle(img).objectPosition.split(' ').map((v) => (parseFloat(v) || 50) / 100),
        frame: () => frame,
        isActive: () => !stage.hidden && stage.getAttribute('data-tpl') === t.tpl && img.isConnected && img.offsetWidth > 0,
        place: (c) => { anchorOf(img, areaOf(img, t)).after(c); frame = sync(c, img, t); },
        onFirst: () => { api.canvas.classList.add('is-on'); hideT = setTimeout(() => { img.style.visibility = 'hidden'; }, 420); },
      });
      const ro = new ResizeObserver(resync);
      ro.observe(img);
      ro.observe(areaOf(img, t));
      mounts.set(img, { api, ro, resync, stop: () => clearTimeout(hideT) });
      if (t.wire) t.wire(api, root);
      api.wake();
    }).catch((e) => { pending.delete(img); failed = true; console.warn('[tpl-3d] 3D 를 띄우지 못해 그림을 그대로 둡니다.', e); });
  }
  function scan() {
    for (const [img, m] of mounts) {
      /* 그림 칸이 transform 으로만 옮겨지면(화면 넓히기 · 배치 이동) 크기 감시에 안 잡힌다 — 주기적으로 맞춘다 */
      if (img.isConnected && m.api.canvas.isConnected) { m.resync(); continue; }
      m.stop(); m.ro.disconnect(); m.api.dispose();
      if (img.isConnected) img.style.visibility = '';
      mounts.delete(img);
    }
    if (failed || stage.hidden || !stage.hasAttribute('data-tpl')) return;
    for (const t of TARGETS) if (stage.getAttribute('data-tpl') === t.tpl) for (const img of stage.querySelectorAll(t.sel)) {
      if (mounts.has(img) || pending.has(img) || !img.offsetWidth) continue;
      mount(img, t);
    }
  }
  let scanT = 0;
  const soon = () => { clearTimeout(scanT); scanT = setTimeout(scan, 120); };
  const mo = new MutationObserver(soon);
  mo.observe(stage, { attributes: true, attributeFilter: ['hidden', 'data-tpl'], childList: true });
  /* 템플릿은 화면 안쪽을 다시 그리기도 하고(팝업 · 화면 전환) 팝업은 나중에 보인다 — 가볍게 주기적으로 본다 */
  setInterval(() => { if (!stage.hidden && !document.hidden) scan(); }, 1500);
  soon();

  /* ── 한진 — 기본위치 · 시점 단추 · 층 목록 · 나침반 ── */
  function wireHanjin(api, root) {
    root.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('[data-name="Map Action/Default View"]')) { api.view('home'); return; }
      const v = t.closest('[data-name^="Button/View "]');
      if (v) { const n = /View (\d)/.exec(v.dataset.name || ''); if (n) api.view('v' + n[1]); return; }
      const row = t.closest('[data-name="Floor"]') || (t.closest('[data-name="View Presets"]') && floorRow(t));
      if (row) { const f = /([1-5])F/.exec(row.textContent || ''); if (f) api.select('f' + f[1], false); }
    });
    /* 나침반 — 처음 시점이 시안의 방위(273°)이고, 돌린 만큼 숫자와 바늘이 따라 돈다(src/hanjin-live.js 의 __setHeading) */
    const comp = root.querySelector('[data-name="Compass"]');
    if (comp) {
      comp.dataset.w3d = '1';
      const home = api.homeHeading;
      api.onView = (sph) => { if (comp.__setHeading) comp.__setHeading(273 - ((sph.theta - home) * 180) / Math.PI); };
    }
  }
  /* 층 목록의 한 줄 — '3F 상차도크' 처럼 층 글자가 든 가장 가까운 줄 */
  function floorRow(t) {
    for (let e = t; e && e.dataset && e.dataset.name !== 'View Presets'; e = e.parentElement) if (/^\s*[1-5]F\b/.test(e.textContent || '') && e.textContent.length < 40) return e;
    return null;
  }
})();
