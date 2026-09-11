/* ── 작업공간의 화면 — 레이아웃 적용 · 썸네일 · 스튜디오 진입 · 홈으로 ── */

(function () {
  const { DT_GROUPS, DT_LAYOUTS, GROUPS, LAYOUTS, findLayout, groupsFor, layoutsFor, wfEl } = WEMB.layouts;
  const { CUR_PROJ, loadProjects, persistCurrentProjectData, saveGuideProject, saveProjects, touchGroup } = WEMB.projects;

  /* 옛 시작 진입점(와이어프레임 피커 · 온보딩 오버레이)은 쓰지 않는다 — 작업공간은 주소로 열린다 */
  document.getElementById('wfModal')?.classList.remove('show');
  document.getElementById('onbd')?.classList.remove('show');

  /* ── 선택한 레이아웃을 실제 대시보드 미리보기에 반영 ──
     .cols를 CSS grid로 바꾸고 기존 패널을 셀에 배치(스팬 포함). 패널이
     셀보다 많으면 남는 패널은 숨기고, 되돌릴 땐 4열 기둥으로 복원한다. */
  const dashCols = () =>
    document.querySelector('.stage .dashpage:not([hidden]) .cols') || document.querySelector('.stage .cols');
  function ensurePanels(cols) {
    if (!cols.__panels || !cols.__panels.length) cols.__panels = [...cols.querySelectorAll('.panel')];
    return cols.__panels;
  }
  function restoreCols(cols, panels) {
    panels.forEach((p) => {
      if (p.parentElement !== cols) cols.appendChild(p);
    });
    [...cols.querySelectorAll(':scope > .col')].forEach((c) => c.remove());
    cols.classList.remove('gridmode');
    cols.style.gridTemplateColumns = '';
    cols.style.gridTemplateRows = '';
    const N = 4;
    const colEls = [];
    for (let i = 0; i < N; i++) {
      const c = document.createElement('div');
      c.className = 'col';
      cols.appendChild(c);
      colEls.push(c);
    }
    panels.forEach((p, i) => {
      p.style.gridColumn = '';
      p.style.gridRow = '';
      p.style.display = '';
      colEls[i % N].appendChild(p);
    });
  }
  function applyDashLayout(layoutId) {
    const cols = dashCols();
    if (!cols) return;
    const panels = ensurePanels(cols);
    /* 어느 경로로 빠져나가든 내용은 PRD 어휘로 맞춘다 — 배치만 바꾸고 끝나면 은행 데모가 남는다 */
    const paintPrd = () => { try { if (window.__applyPrdToPanels) window.__applyPrdToPanels(cols); } catch (e) {} };
    /* 디지털 트윈 전용 레이아웃은 대시보드 미리보기에 적용하지 않는다(3D 씬 유지) */
    if (typeof layoutId === 'string' && layoutId.startsWith('dt-')) { restoreCols(cols, panels); paintPrd(); return; }
    const lay = findLayout(layoutId);
    if (!lay) {
      restoreCols(cols, panels);
      paintPrd();
      return;
    }
    /* 패널을 .cols 직속으로 옮긴 뒤 빈 .col 제거 → grid 배치 */
    panels.forEach((p) => {
      if (p.parentElement !== cols) cols.appendChild(p);
    });
    [...cols.querySelectorAll(':scope > .col')].forEach((c) => c.remove());
    cols.classList.add('gridmode');
    cols.style.gridTemplateColumns = 'repeat(' + lay.cols + ',1fr)';
    cols.style.gridTemplateRows = 'repeat(' + lay.rows + ',minmax(0,1fr))';
    lay.cells.forEach((cell, i) => {
      const p = panels[i];
      if (!p) return;
      p.style.display = '';
      p.style.gridColumn = cell[0] + ' / span ' + cell[2];
      p.style.gridRow = cell[1] + ' / span ' + cell[3];
    });
    for (let i = lay.cells.length; i < panels.length; i++) {
      panels[i].style.display = 'none';
      panels[i].style.gridColumn = '';
      panels[i].style.gridRow = '';
    }
    /* 배치만 바꾸고 내용은 은행 데모 그대로 두면, PRD 6단계를 채운 사용자가
       발전소를 골라도 '타 기관 지연 TOP5 · 국민은행'을 보게 된다.
       디지털 트윈 경로가 이미 쓰는 엔진(__prdPanelSpec)을 여기서도 태운다. */
    paintPrd();
  }
  window.__applyDashLayout = applyDashLayout;
  /* 현재 스튜디오 화면을 캡처해 그 화면의 썸네일(작은 JPEG)로 저장.
     홈으로 나갈 때 호출. 실패해도 조용히 넘어가고 와이어프레임 폴백을 쓴다.

     ── 왜 html2canvas 를 기본으로 쓰지 않는가 (실측) ──
     SK하이닉스 같은 템플릿 화면은 통째로 인라인 SVG(약 1.4MB·필터 88개·그라데이션 211개)다.
     html2canvas 는 이걸 iframe 으로 복제해 처음부터 다시 그리기 때문에 1920×1080 기준
     캡처 13.3초 + toDataURL 1.0초, 총 14초가 걸렸다. 홈으로 나간 직후 이 작업이 돌면서
     메인 스레드를 붙잡아, 런처에서 누르는 모든 동작이 멈춘 것처럼 느껴졌다.
     브라우저는 SVG 를 직접 래스터화할 수 있으므로 직렬화해 <img> 로 그리면 같은 그림이
     0.2~0.3초에 나온다(약 40배). 그래서 아래 순서로 시도한다.
       1) 인라인 SVG 시안  → SVG 직렬화 래스터
       2) 통짜 이미지 시안 → 그 <img> 를 캔버스에 바로 그림(즉시)
       3) 그 밖의 대시보드 → html2canvas (가벼운 DOM 이라 부담이 작다)
     시안 위에 얹은 '추가 패널'은 그 레이어만 따로 잡아 합성한다. */
  const THUMB_W = 480;
  /* html2canvas 폴백이 이 기기에서 '지나치게' 느리면 기억해 뒀다가 갱신 캡처를 건너뛴다.
     ── 기준값을 4초로 올린 이유(실측) ──
     예전 기준은 1.5초였는데, 이 앱의 보통 대시보드가 1,221노드에 **2.55초**다. 즉 첫 캡처에서
     거의 항상 '느림'으로 찍히고, 그 플래그가 localStorage 에 영구 저장돼 **그 뒤로 만든 모든
     일반 대시보드가 썸네일 없이 와이어프레임으로만 보였다**(템플릿 화면은 SVG 직렬화 경로라
     멀쩡했으므로 "새로 만든 화면만 안 나온다"로 보였다).
     1.5초 기준이 원래 노렸던 건 6.5초짜리 트윈 대시보드인데, 그건 이제 SVG 경로(0.3초)로 빠진다.
     → 보통 대시보드는 정상 통과시키고, 정말 느린 기기만 걸리도록 4초로 둔다.
     키 이름도 바꿔 이미 '1' 로 굳어 버린 옛 플래그를 무시한다(기준이 달라졌으므로 재측정). */
  const SLOW_KEY = 'wemb-thumb-slowpath2';
  const SLOW_MS = 4000;
  let __slowPath = false; try { __slowPath = localStorage.getItem(SLOW_KEY) === '1'; } catch (e) {}

  try { localStorage.removeItem('wemb-thumb-slowpath'); } catch (e) {} /* 옛 키 정리 */
  let __capturing = false;
  /* file:// 로 열면 로컬 이미지 때문에 캔버스가 '오염'되어 toDataURL 이 차단된다(브라우저 보안).
     이 경우 캡처는 매번 실패하면서 3초씩 메인 스레드를 잡아먹으므로, 한 번 실패하면 더 시도하지 않는다.
     (http/https 로 열거나 배포본에서는 정상 동작한다.) */
  let __captureBlocked = false;

  /* .skx-svg 를 겨냥한 CSS 규칙 모음(모드별 캐시). 직렬화한 SVG 안에 <style> 로 심어야
     theme.css 의 [fill="#…"]→var(--skx-c…) 매핑이 살아나 '지금 화면 색' 그대로 찍힌다.
     바깥 스타일시트는 <img> 로 그린 SVG 안까지 따라 들어가지 않기 때문이다. */
  const __shotCss = {};
  function shotCssFor(mode) {
    if (__shotCss[mode] != null) return __shotCss[mode];
    let css = '';
    for (const sh of document.styleSheets) {
      let rs; try { rs = sh.cssRules; } catch (e) { continue; }
      for (const r of rs || []) {
        const sel = r.selectorText;
        if (!sel || sel.indexOf('.skx-svg') < 0) continue;
        if (/:hover|:focus|:active/.test(sel)) continue;                    /* 상호작용 상태는 캡처에 불필요 */
        if (/data-mode/.test(sel) && sel.indexOf(mode) < 0) continue;        /* 지금 모드의 규칙만 */
        const parts = sel.split(',').map((s) => {
          const i = s.lastIndexOf('.skx-svg'); if (i < 0) return null;
          const rest = s.slice(i + 8).trim(); return rest || ':root';        /* 복제본의 루트가 곧 .skx-svg */
        }).filter(Boolean);
        if (parts.length) css += parts.join(',') + '{' + r.style.cssText + '}';
      }
    }
    return (__shotCss[mode] = css);
  }
  /* 인라인 SVG → 캔버스. 브라우저가 직접 래스터화하므로 빠르다. */
  async function svgToCanvas(svg, W, H) {
    const clone = svg.cloneNode(true);
    /* 호스트에 걸린 CSS 변수(--skx-c*·--skx-accent 등)를 복제본으로 옮겨야 시안 색이 유지된다 */
    const cs = getComputedStyle(svg);
    let vars = '';
    for (let i = 0; i < cs.length; i++) { const n = cs[i]; if (n.indexOf('--') === 0) vars += n + ':' + cs.getPropertyValue(n) + ';'; }
    clone.setAttribute('style', (svg.getAttribute('style') || '') + vars);
    clone.setAttribute('width', W); clone.setAttribute('height', H);
    const css = shotCssFor(document.querySelector('.main')?.dataset.mode || 'dark');
    if (css) {
      const st = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      st.textContent = css; clone.insertBefore(st, clone.firstChild);
    }
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res; img.onerror = () => rej(new Error('svg raster fail'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(img, 0, 0, W, H);
    return cv;
  }
  /* 시안 위에 얹은 '추가 패널'만 따로 캡처해 합성. 패널 몇 개뿐이라 html2canvas 라도 가볍다. */
  async function overlayAdded(stage, cv, W) {
    try {
      const layer = stage.querySelector('.dt-added');
      if (!layer || !layer.offsetWidth || !layer.querySelector('.panel')) return cv;
      if (!(window.html2canvas || window.html2canvasPro)) { try { await loadH2C(); } catch (e) {} }
      const render = window.html2canvas || window.html2canvasPro;
      if (!render) return cv;
      const sc = W / stage.offsetWidth;
      const oc = await render(layer, { scale: sc, backgroundColor: null, logging: false, useCORS: true });
      const sr = stage.getBoundingClientRect(), lr = layer.getBoundingClientRect();
      cv.getContext('2d').drawImage(oc, (lr.left - sr.left) * sc, (lr.top - sr.top) * sc);
    } catch (e) {}
    return cv;
  }
  async function captureScreenThumb() {
    if (__capturing || __captureBlocked) return;
    let id = null; try { id = localStorage.getItem(CUR_PROJ); } catch (e) {}
    if (!id) return;
    /* 이 화면에 아직 썸네일이 없으면 무슨 일이 있어도 한 번은 만든다 — 런처에 와이어프레임으로
       남지 않게. '느린 기기' 판정은 **이미 있는 썸네일을 다시 찍는** 경우에만 건너뛰는 근거다. */
    let hasThumb = false;
    try { hasThumb = !!(loadProjects().find((x) => x.id === id) || {}).thumb; } catch (e) {}
    /* 캡처 대상은 실제 대시보드 캔버스(.stage) — 디지털 트윈이면 #dtStage. 보이는 쪽을 고른다.
       (예전엔 .main 전체를 잡아 편집 크롬·여백까지 들어갔다.) 없으면 .main으로 폴백. */
    const dtStage = document.getElementById('dtStage');
    const dashStage = document.querySelector('.stage');
    const el = (dtStage && !dtStage.hidden) ? dtStage
             : (dashStage && !dashStage.hidden) ? dashStage
             : document.querySelector('.main');
    if (!el || !el.offsetWidth) return;
    __capturing = true;
    /* 런처가 덮고 있으면 스튜디오는 content-visibility:hidden 이라 레이아웃이 없다 —
       그대로 찍으면 빈 그림이 나온다. 찍는 동안만 되살린다(끝나면 finally 에서 되돌린다). */
    document.body.classList.add('wemb-capturing');
    try {
      const W = THUMB_W, H = Math.max(1, Math.round(W * (el.offsetHeight / el.offsetWidth)));
      let bg = '#0a0a0e'; try { const cb = getComputedStyle(el).backgroundColor; if (cb && cb !== 'rgba(0, 0, 0, 0)' && cb !== 'transparent') bg = cb; } catch (e) {}
      let canvas = null;

      /* 1) 인라인 SVG 시안 — 가장 빠른 길 */
      const svg = el.querySelector('svg.skx-svg');
      if (svg && svg.getBoundingClientRect().width > 1) {
        try { canvas = await overlayAdded(el, await svgToCanvas(svg, W, H), W); } catch (e) { canvas = null; }
      }
      /* 2) 통짜 이미지 시안(한진·이미지 템플릿) — 이미 로드된 그림이라 그리기만 하면 된다 */
      if (!canvas) {
        const shot = el.querySelector('img.tplimg-shot, img.hj-studioimg');
        if (shot && shot.complete && shot.naturalWidth) {
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          const cx = cv.getContext('2d'); cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
          const sc = W / el.offsetWidth, sr = el.getBoundingClientRect(), ir = shot.getBoundingClientRect();
          cx.drawImage(shot, (ir.left - sr.left) * sc, (ir.top - sr.top) * sc, ir.width * sc, ir.height * sc);
          canvas = await overlayAdded(el, cv, W);
        }
      }
      /* 2-b) FMS Hub 시안(HTML/CSS DOM 635노드) — html2canvas 로는 실측 4.9초가 걸려 홈 전환이 멈춘 것처럼 보인다.
              형상이 고정된 시안이므로 같은 화면을 그대로 캡처해 둔 이미지를 대신 그린다(추가 패널만 따로 합성). */
      if (!canvas && (el.querySelector('.skh-root') || el.querySelector('.skv-root'))) {
        try {
          const shotSrc = el.querySelector('.skv-root') ? 'src/templates/icheon-hvac.jpg' : 'src/templates/icheon-hub.jpg';
          const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = shotSrc; });
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          const cx = cv.getContext('2d'); cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
          /* 시안은 16:9, 스테이지는 그렇지 않을 수 있다 → 늘이지 말고 cover 로 채운다 */
          const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight);
          const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
          cx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
          canvas = await overlayAdded(el, cv, W);
        } catch (e) { canvas = null; }
      }
      /* 3) 일반 대시보드 — DOM 이라 html2canvas 로 그린다.
            이 경로는 화면 하나에 수 초가 걸린다(실측: 1,227노드 대시보드에 6.5초). 그래서
            한 번 시간을 재 보고 느리면 그 뒤로는 자동 캡처를 하지 않는다 — 이미 만들어 둔
            썸네일(없으면 배치 와이어프레임)을 그대로 쓰고, 조작 중에 다시 멈추지 않게 한다. */
      if (!canvas) {
        /* ── 무거운 길(html2canvas)은 **썸네일이 아직 없을 때만** 간다 ──
           이미 있는 썸네일을 홈으로 나갈 때마다 다시 찍느라, 런처가 뜬 직후 메인 스레드가
           통째로 멈췄다(실측: 한 프레임 4.8초 · 막힌 시간 합 5.4초). 목록이 떠 있는데 스크롤도
           호버도 몇 초간 안 먹는 게 '스튜디오 홈이 버벅인다' 의 정체였다.
           갱신해서 얻는 건 '조금 더 최신인 그림' 하나뿐이라 바꿀 값이 아니다.
           · 시안(인라인 SVG·통짜 이미지·이천 FMS)은 위쪽 빠른 길이 밀리초에 끝내므로 매번 갱신된다.
           · 썸네일이 없는 화면은 scheduleThumbCapture 가 **스튜디오에 있는 동안 유휴 시점에**
             한 번 찍어 두므로, 홈으로 나갈 때는 대개 여기까지 오지도 않는다. */
        if (hasThumb) return;
        /* 런처가 떠 있는 동안에도 가지 않는다 — 목록이 뜬 채로 몇 초씩 얼어붙는다.
           썸네일이 없는 화면은 다음에 그 화면을 열 때 enterStudio 가 걸어 둔 유휴 캡처
           (scheduleThumbCapture)가 스튜디오 안에서 조용히 찍는다. */
        if (document.getElementById('flowHome')?.classList.contains('show')) return;
        const h2c = () => window.html2canvas || window.html2canvasPro;
        if (!h2c()) { try { await loadH2C(); } catch (e) {} }
        const render = h2c();
        if (!render) return;
        const tSlow = (window.performance && performance.now) ? performance.now() : 0;
        /* html2canvas는 캡처 대상을 iframe으로 '복제'해 그리는데, 복제본에선 진입 애니메이션(panelIn: opacity 0→1)이
           처음부터 다시 시작된다. 스태거 지연(animation-delay)까지 겹쳐 패널이 opacity:0(backwards 채움) 상태로 찍혀
           썸네일이 빈(어두운) 사각형이 됐다. onclone에서 복제본의 애니메이션·트랜지션을 끄고 최종 표시 상태로 고정한다. */
        canvas = await render(el, {
          scale: W / el.offsetWidth, logging: false, useCORS: true, backgroundColor: bg,
          onclone: (doc) => {
            try {
              const s = doc.createElement('style');
              s.textContent = '*,*::before,*::after{animation:none !important;transition:none !important;}'
                + '.kpi,.col .panel,.panel,.dashpage{opacity:1 !important;transform:none !important;}';
              (doc.head || doc.documentElement).appendChild(s);
            } catch (e) {}
          },
        });
        if (tSlow && performance.now() - tSlow > SLOW_MS) {
          __slowPath = true;
          try { localStorage.setItem(SLOW_KEY, '1'); } catch (e) {}
        }
      }
      if (!canvas) return;
      const dataURL = canvas.toDataURL('image/jpeg', 0.72);
      if (dataURL && dataURL.length > 100) {
        const arr = loadProjects(); const s = arr.find((x) => x.id === id);
        if (s) {
          s.thumb = dataURL; try { saveProjects(arr); } catch (e) {} if (s.projectId) touchGroup(s.projectId);
          /* 런처가 보이는 중이면 새 썸네일이 바로 반영되도록 다시 그린다 */
        }
      }
    } catch (e) {
      /* 캔버스 오염(SecurityError) 이면 이후 캡처를 중단 — 무의미한 3초 멈춤 방지 */
      if (e && (e.name === 'SecurityError' || /[Tt]ainted/.test(String(e.message || e)))) __captureBlocked = true;
    } finally { __capturing = false; document.body.classList.remove('wemb-capturing'); }
  }
  window.__wembCaptureThumb = captureScreenThumb;
  /* 캡처 라이브러리(html2canvas-pro)를 미리 받아둔다 — 나중 캡처가 지연 없이 즉시 되게 */
  function preloadThumbLib() {
    try { if (!(window.html2canvas || window.html2canvasPro)) loadH2C().catch(() => {}); } catch (e) {}
  }
  /* 스튜디오가 화면에 보일 때(런처 홈이 아닐 때) 현재 화면을 자동 캡처 — 단, '사용자가 조작을 멈춘 뒤'에만.
     html2canvas 캡처는 메인 스레드를 수 초 붙잡는데, 예전엔 고정 시간(1.2초)에 무조건 실행돼서
     그 순간 메뉴 클릭이 '멈춘 것처럼' 느껴졌다(딜레이). 이제 클릭·키·스크롤이 있을 때마다 타이머를 미뤄,
     실제로 손을 뗀 뒤에만 조용히 캡처한다 → 조작 중엔 멈춤이 생기지 않는다. */
  let __thumbCleanup = null;
  function scheduleThumbCapture(delay) {
    preloadThumbLib();
    if (__thumbCleanup) __thumbCleanup(); /* 이전 예약 취소(중복 방지) */
    const IDLE = Math.max(1600, delay || 1600);
    let timer = null;
    const events = ['pointerdown', 'keydown', 'wheel'];
    const cleanup = () => { clearTimeout(timer); events.forEach((t) => window.removeEventListener(t, arm, true)); __thumbCleanup = null; };
    function run() {
      cleanup();
      try {
        let id = null; try { id = localStorage.getItem(CUR_PROJ); } catch (e) {}
        if (!id) return;
        /* 자동(유휴) 캡처는 **아직 썸네일이 없는 화면**에만 — 이미 있는 화면까지 매번 다시 찍으면
           편집 중에 수 초씩 멈춘다. 이미 있는 썸네일의 갱신은 홈으로 나갈 때(goHome)가 맡는다. */
        let has = false;
        try { has = !!(loadProjects().find((x) => x.id === id) || {}).thumb; } catch (e) {}
        if (!has) captureScreenThumb();
      } catch (e) {}
    }
    function arm() { clearTimeout(timer); timer = setTimeout(run, IDLE); }
    __thumbCleanup = cleanup;
    events.forEach((t) => window.addEventListener(t, arm, true));
    arm();
  }
  window.__wembScheduleThumb = scheduleThumbCapture;

  /* ── 스튜디오 진입 ── */
  function enterStudio(screen, layoutId) {
    try {
      if (typeof state !== 'undefined' && (screen === 'dash' || screen === 'dt')) state.screen = screen;
    } catch (e) {}
    if (typeof applyScreen === 'function') applyScreen();
    try {
      localStorage.setItem('wemb-layout', layoutId || '');
    } catch (e) {}
    /* 대시보드는 선택 레이아웃대로 패널 재배치, 디지털 트윈은 씬 위 유리 패널로 재현 */
    if (screen === 'dash') applyDashLayout(layoutId);
    if (typeof syncSideLayout === 'function') syncSideLayout();
    /* 오버레이를 걷어 스튜디오가 실제 크기를 갖게 된 뒤 DT 레이아웃을 반영해야
       유리 패널 보드가 화면 크기에 맞게 축소된다(캔버스 0 크기면 fitBoard가 대기). */
    if (typeof window.__applyDtLayout === 'function') window.__applyDtLayout(screen === 'dt' ? findLayout(layoutId) : null);
    if (screen === 'dt' && layoutId && typeof toast === 'function')
      toast('선택한 레이아웃을 디지털 트윈 화면에 반영했어요.', { type: 'info' });
    /* 스튜디오에 들어왔으면 모든 단계 잠금 해제 + 유저플로우 메뉴를 상단 내비에 반영 */
    try { if (window.__wembStep) window.__wembStep.advance(4); } catch (e) {}
    try { if (window.__setStudioNav && typeof window.__WEMBFlowMenu === 'function') window.__setStudioNav(window.__WEMBFlowMenu()); } catch (e) {}
    /* 썸네일이 없는 화면이면 '손을 뗀 뒤'에 조용히 한 번 찍어 둔다.
       예전엔 홈으로 나갈 때(goHome)만 찍었는데, 그 버튼을 거치지 않고 런처에 도착하는 길이 많다
       — 새로고침, 와이어프레임 단계에서 바로 홈, 브라우저 뒤로가기. 그 화면들은 런처에서
       영영 와이어프레임으로 남았다(사용자 신고: "새 프로젝트로 만든 화면만 레이아웃으로 보인다").
       유휴 감지(포인터·키·스크롤이 멈춘 뒤)라 조작 중에는 돌지 않고, 썸네일이 이미 있으면 건너뛴다. */
    try { if (window.__wembScheduleThumb) window.__wembScheduleThumb(1800); } catch (e) {}
    /* 새로 만든 화면으로 들어오면 옵션창을 '대시보드 편집 → 콘텐츠 추가'로 열어 둔다 —
       여기에 '패널편집' 버튼이 있어 카드(위젯)를 바로 끌어 옮길 수 있다.
       예전엔 '화면 정하기' 섹션에 머물러 패널편집 버튼이 숨겨진 채라 이동을 시작할 방법이 없었다. */
    try { if (window.__showSection) window.__showSection('dash-panels'); } catch (e) {}
  }
  /* PRD→기능명세서→유저플로우→와이어프레임 가이드(guide/guide.js)가 레이아웃 정의와 스튜디오 진입을 재사용한다 */
  window.__WEMBLayouts = { LAYOUTS, DT_LAYOUTS, GROUPS, DT_GROUPS, findLayout, wfEl, enterStudio, saveGuideProject, setProjectName: () => {} /* 예전 새 프로젝트 모달용 — 지금은 PRD 가 이름을 정한다 */ };

  /* 사이드바 '새 프로젝트' → 완전히 새 프로젝트로 시작(현재 프로젝트는 저장) */
  const sideNew = document.getElementById('newProject');
  if (sideNew)
    sideNew.onclick = () => { location.href = 'studio.html?new=1#/prd'; };
  /* 사이드바 홈 버튼 · 브랜드 로고 → 홈(index.html). 홈은 다른 문서라 떠나기 전에 저장과 썸네일을 끝낸다.
     썸네일은 빠른 길(SVG · 이미지 시안, 0.3초 안팎)이면 기다리고, 오래 걸리면 기다리지 않고 떠난다 —
     썸네일이 없는 화면은 스튜디오에 있는 동안 유휴 캡처(scheduleThumbCapture)가 이미 찍어 둔다. */
  let leavingHome = false;
  const goHome = async () => {
    if (leavingHome) return;
    leavingHome = true;
    persistCurrentProjectData();
    try { await Promise.race([captureScreenThumb(), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
    location.href = 'index.html#/projects';
  };
  /* 브라우저 뒤로가기로 이 문서가 bfcache 에서 그대로 되살아나면 '떠나는 중' 표시를 풀어 준다 — 안 그러면 홈 버튼이 먹지 않는다 */
  window.addEventListener('pageshow', (e) => { if (e.persisted) leavingHome = false; });
  const quickHome = document.getElementById('quickHome');
  if (quickHome) quickHome.onclick = goHome;
  const brandHome = document.getElementById('brandHome');
  if (brandHome) brandHome.onclick = goHome;
  /* 탭을 닫거나 새로고침해도 현재 프로젝트 상태가 남도록 마지막에 한 번 저장 */
  window.addEventListener('beforeunload', () => { try { persistCurrentProjectData(); } catch (e) {} });

  /* ── 사이드바 레이아웃 메뉴 — 이전 '구성 화면'처럼 인라인 행 목록(.fignav-row).
     화면 종류는 새 프로젝트에서 정하므로 스튜디오에선 레이아웃만 바꾼다. ── */
  const NS = 'http://www.w3.org/2000/svg';
  function layGlyph(lay) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'laygl');
    const pad = 3,
      area = 18,
      gap = 1.4;
    lay.cells.forEach(([x, y, w, h]) => {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', (pad + ((x - 1) / lay.cols) * area + gap / 2).toFixed(2));
      r.setAttribute('y', (pad + ((y - 1) / lay.rows) * area + gap / 2).toFixed(2));
      r.setAttribute('width', ((w / lay.cols) * area - gap).toFixed(2));
      r.setAttribute('height', ((h / lay.rows) * area - gap).toFixed(2));
      r.setAttribute('rx', '1');
      svg.appendChild(r);
    });
    return svg;
  }
  function buildSideLayouts(screen) {
    const list = document.getElementById('layList');
    if (!list) return;
    const scr = screen || (typeof state !== 'undefined' && state.screen ? state.screen : 'dash');
    const isDt = scr === 'dt';
    const groups = groupsFor(scr);
    const sets = layoutsFor(scr);
    list.innerHTML = '';
    groups.forEach((grp) => {
      const sec = document.createElement('div');
      sec.className = 'laygrp-sec';
      /* 카테고리 헤더 — 접기/펴기 + 유일한 화살표 */
      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'laygrp';
      header.setAttribute('aria-expanded', 'false');
      const chev = document.createElement('span');
      chev.className = 'laygrp-chev';
      chev.textContent = '›';
      const lbl = document.createElement('span');
      lbl.className = 'laygrp-lbl';
      lbl.textContent = grp.label;
      const cnt = document.createElement('span');
      cnt.className = 'laygrp-count';
      cnt.textContent = sets[grp.key].length + '종';
      header.appendChild(chev);
      header.appendChild(lbl);
      header.appendChild(cnt);
      /* 하위 레이아웃 행 묶음 — 처음엔 접힘 */
      const rows = document.createElement('div');
      rows.className = 'laygrp-rows';
      rows.hidden = true;
      sets[grp.key].forEach((lay) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'fignav-row';
        row.dataset.lid = lay.id;
        row.setAttribute('role', 'option');
        const ic = document.createElement('span');
        ic.className = 'ficon';
        ic.appendChild(layGlyph(lay));
        const txt = document.createElement('span');
        txt.className = 'txt';
        const b = document.createElement('b');
        b.textContent = lay.name;
        const sub = document.createElement('span');
        sub.className = 'sub';
        sub.textContent = lay.desc;
        txt.appendChild(b);
        txt.appendChild(sub);
        row.appendChild(ic); /* 화살표 없음 — 아이콘 + 제목·설명만 */
        row.appendChild(txt);
        row.onclick = () => {
          /* 디지털 트윈이면 3D 씬 위 유리 패널 배치로, 대시보드면 패널 그리드로 반영 */
          if (isDt) { if (window.__applyDtLayout) window.__applyDtLayout(findLayout(lay.id)); }
          else applyDashLayout(lay.id);
          try {
            localStorage.setItem('wemb-layout', lay.id);
          } catch (e) {}
          markSideLayout();
        };
        rows.appendChild(row);
      });
      header.onclick = () => {
        const open = !sec.classList.contains('open');
        sec.classList.toggle('open', open);
        rows.hidden = !open;
        header.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      sec.appendChild(header);
      sec.appendChild(rows);
      list.appendChild(sec);
    });
    markSideLayout();
  }
  function markSideLayout() {
    let cur = '';
    try {
      cur = localStorage.getItem('wemb-layout') || '';
    } catch (e) {}
    document.querySelectorAll('#layList .fignav-row').forEach((x) => {
      const on = x.dataset.lid === cur;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  function syncSideLayout() {
    const sec = document.getElementById('sideLayoutSec');
    if (!sec) return;
    sec.hidden = false; /* 대시보드·디지털 트윈 모두 레이아웃 사용 */
    const scr = (typeof state !== 'undefined' && state.screen) ? state.screen : 'dash';
    buildSideLayouts(scr); /* 화면 종류에 맞는 레이아웃 목록으로 다시 구성 */
  }
  buildSideLayouts();
  window.__syncSideLayout = syncSideLayout;
  /* 마지막 선택 레이아웃을 대시보드 미리보기에 복원(런처 뒤에서 준비) */
  try {
    const sv = localStorage.getItem('wemb-layout');
    if (sv) applyDashLayout(sv);
  } catch (e) {}
  syncSideLayout();
  window.__openLauncher = () => { location.href = 'index.html#/projects'; };

  /* 새 프로젝트로 새로고침해 진입한 경우 — 깨끗한 기본 상태에서 이 프로젝트로 바로 들어간다 */
  try {
    const fresh = sessionStorage.getItem('wemb-fresh-open');
    if (fresh) {
      sessionStorage.removeItem('wemb-fresh-open');
      const f = JSON.parse(fresh);
      const bn = document.getElementById('brandName');
      if (bn && f.name) {
        bn.value = f.name;
        bn.dispatchEvent(new Event('input', { bubbles: true }));
      }
      enterStudio(f.screen || 'dash', f.layout);
      /* 템플릿 재현 — 한진/SK하이닉스는 실제 화면, 미연결 템플릿은 임시 이미지.
         (새로고침 후에도 유지되게 플래그를 localStorage에 저장) */
      try {
        if (f.tpl === 'hana') {
          localStorage.setItem('wemb-tpl-dt', 'hana'); localStorage.removeItem('wemb-tpl-img');
          /* 템플릿 상세에서 고른 장면(화면 15장 중 하나)을 그대로 연다 */
          const wantHn = (typeof HN_SCREENS !== 'undefined' && HN_SCREENS[f.scene]) ? f.scene
            : (localStorage.getItem('wemb-hana-screen') || 'overview-02');
          try { localStorage.setItem('wemb-hana-screen', wantHn); } catch (e3) {}
          if (typeof applyHanaDT === 'function') applyHanaDT(wantHn);
        }
        else if (f.tpl === 'hanjin') {
          localStorage.setItem('wemb-tpl-dt', 'hanjin'); localStorage.removeItem('wemb-tpl-img');
          /* 템플릿 상세에서 고른 장면(메인 · 입/출문현황 · 하차현황)을 그대로 연다 */
          const wantHj = (f.scene === 'gate' || f.scene === 'unload') ? f.scene
            : (localStorage.getItem('wemb-hanjin-screen') || 'main');
          try { localStorage.setItem('wemb-hanjin-screen', wantHj); } catch (e3) {}
          if (typeof applyHanjinDT === 'function') applyHanjinDT(wantHj);
        }
        else if (f.tpl === 'skhynix') { localStorage.setItem('wemb-tpl-dt', 'skhynix'); localStorage.removeItem('wemb-tpl-img'); if (typeof applySkhynixDT === 'function') applySkhynixDT();
          /* 템플릿 상세에서 팝업(UPS 전력 상세) 장면을 보고 들어왔으면 그 시안을 그린다 */
          try { const wantPopup = f.scene === 'popup' || localStorage.getItem('wemb-skx-screen') === 'popup';
                localStorage.setItem('wemb-skx-screen', wantPopup ? 'popup' : 'main');
                if (wantPopup) setTimeout(() => { try { window.__openSkxScreen && window.__openSkxScreen('popup'); } catch (e3) {} }, 300); } catch (e2) {} }
        else if (f.tpl === 'skhynix-hub') {
          localStorage.setItem('wemb-tpl-dt', 'skhynix-hub'); localStorage.removeItem('wemb-tpl-img');
          /* 템플릿 상세에서 '항온항습기 상세' 장면을 보고 들어왔으면 그 시안을 그린다 */
          const wantHvac = f.scene === 'hvac' || localStorage.getItem('wemb-hub-screen') === 'hvac';
          try { localStorage.setItem('wemb-hub-screen', wantHvac ? 'hvac' : 'main'); } catch (e3) {}
          if (wantHvac) { if (typeof applySkhynixHvac === 'function') applySkhynixHvac(); }
          else if (typeof applySkhynixHub === 'function') applySkhynixHub();
        }
        else if (f.tpl === 'image' && f.img) { localStorage.setItem('wemb-tpl-img', f.img); localStorage.removeItem('wemb-tpl-dt'); if (typeof applyImageTemplate === 'function') applyImageTemplate(f.img, f.screen); }
        /* 시안 없는 프로젝트 — 1920x1080 고정 캔버스를 풀어 준다.
           (하이닉스·한진 시안을 보다가 이 프로젝트로 넘어오면 고정 캔버스가 그대로 남아
            작업 영역을 다 못 쓰고 축소된 채로 열렸다) */
        else { localStorage.removeItem('wemb-tpl-dt'); localStorage.removeItem('wemb-tpl-img'); try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e3) {} try { syncSkxControls(); } catch (e3) {} }
      } catch (e2) {}
    }
  } catch (e) {}
})();
