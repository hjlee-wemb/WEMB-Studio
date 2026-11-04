/* ── 같은 프로젝트 안 화면 이동 — 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다 ──

   템플릿 장면끼리 옮겨 다닐 때(헤더 메뉴 · 바로가기) 예전엔 ?screen= 주소로 문서를 새로 열었다.
   여는 막이 뜨고, 왼쪽 메뉴가 처음 상태로 돌아가고, 앱이 통째로 다시 부팅했다.
   이제 상태 묶음만 그 화면 것으로 바꿔 끼우고 #dtStage 만 새로 그린다.

   · toScreen(화면)            형제 화면으로 — 묶음 교체 + 주소 + 전환. 못 하면 false(부른 쪽이 예전 길로 간다)
   · transition(그리기, 빌더들) 같은 화면 안에서 장면만 바꿀 때도 같은 전환
   · register(템플릿, 정의)     { sceneOf(화면), draw(장면), builds(장면) } — js/templates/*.js 가 등록한다

   왼쪽 메뉴에 보이는 값과 오른쪽 화면이 어긋나지 않게, 색 · 밝기 · 디자인 편집 값은 메모리의 것을 그대로 잇고
   새 화면의 묶음에도 적어 둔다(KEEP). 부팅 때 한 번만 읽던 화면별 값은 여기서 다시 읽게 한다.

   전환은 View Transitions — 스냅샷에 #dtStage 만 넣어(css/preview/digital-twin.css) 왼쪽 메뉴 · 상단 바는 그대로 살아 있다.
   옛 화면을 띄워 둔 채 새 화면을 다 칠하고 나서 보여 주므로, 원본 색이 비치지 않는다. 기다림은 SETTLE_MS 까지. */
(function () {
  const KEEP = /^wemb-(.+-(seeded|mode)|dash-(gap|pad|elev|border|surface|radius|font|numfont|hdr|tscale)|brand-screen|version)$/;
  const SETTLE_MS = 450;
  const T = {};
  const register = (tpl, def) => { T[tpl] = def; };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const tintNow = () => {
    try { clearTimeout(TPLTINT.timer); TPLTINT.apply(); } catch (e) {}
  };
  /* 그림이 다 풀릴 때까지(상한 있음) — 색 입히기가 원본 그림을 따로 받으므로 그것도 함께 기다린다 */
  async function settle(stage) {
    const end = performance.now() + SETTLE_MS;
    const decoded = () => {
      const imgs = [...stage.querySelectorAll('img')];
      try { imgs.push(...Object.values(TPLTINT.origImg)); } catch (e) {}
      const left = end - performance.now();
      if (left <= 0) return Promise.resolve();
      return Promise.race([Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : null))), sleep(left)]);
    };
    await decoded();
    tintNow();   /* 원본 그림이 도착했으니 그림까지 칠한다 */
    await decoded();
  }

  /* 마지막 부름이 이긴다 — 메뉴를 빠르게 연달아 눌러도 차례로 쌓이지 않는다 */
  let running = false, queued = null;
  function transition(draw, builds) {
    if (running) { queued = [draw, builds]; return; }
    running = true;
    const finish = () => {
      running = false;
      if (queued) { const q = queued; queued = null; transition(q[0], q[1]); }
    };
    const need = (window.WEMB && WEMB.tplModules && builds && builds.length) ? WEMB.tplModules.need(builds) : Promise.resolve();
    need.catch(() => {}).then(() => play(draw, finish));
  }
  function play(draw, finish) {
    const stage = document.getElementById('dtStage');
    const paint = async () => {
      try { draw(); } catch (e) { console.error(e); }
      if (!stage) return;
      tintNow();
      try { await settle(stage); } catch (e) {}
    };
    const root = document.documentElement;
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || calm || document.hidden) {
      /* 전환을 못 쓰는 브라우저는 새 화면이 떠오르기만 한다 */
      paint().then(() => {
        if (stage && !calm && !document.hidden) {
          stage.classList.add('stage-fadein');
          setTimeout(() => stage.classList.remove('stage-fadein'), 320);
        }
        finish();
      });
      return;
    }
    root.classList.add('stage-switching');
    const vt = document.startViewTransition(paint);
    vt.finished.catch(() => {}).then(() => {
      root.classList.remove('stage-switching');
      finish();
    });
  }

  /* 상태 묶음을 그 화면 것으로 — 문서가 살아 있으므로 메모리의 색은 그대로고, 저장 쪽만 맞춘다 */
  function swapBundle(id, push) {
    const P = WEMB.projects;
    try { window.__dtFlushContent && window.__dtFlushContent(); } catch (e) {}
    try { persistCurrentTheme(); } catch (e) {}   /* 떠나는 화면의 마지막 색 — 자동 저장은 디바운스라 아직일 수 있다 */
    const kept = {};
    Object.keys(localStorage).forEach((k) => { if (KEEP.test(k)) kept[k] = localStorage.getItem(k); });
    if (!P.activateScreen(id)) return false;
    Object.keys(kept).forEach((k) => { try { localStorage.setItem(k, kept[k]); } catch (e) {} });
    try { persistCurrentTheme(); } catch (e) {}   /* 새 화면 묶음에 남은 옛 색으로 새로고침 때 되돌아가지 않게 */
    if (push) {
      const url = new URL(location.href);
      url.searchParams.set('screen', id);
      try { history.pushState(history.state, '', url.pathname + url.search + url.hash); } catch (e) {}
    }
    try { window.__atomSwapReload && window.__atomSwapReload(); } catch (e) {}
    try { window.__refreshProjectName && window.__refreshProjectName(); } catch (e) {}
    try { window.__wembScheduleThumb && window.__wembScheduleThumb(1800); } catch (e) {}
    return true;
  }

  function toScreen(target, push) {
    if (window.__wembPresent || !target) return false;   /* 발표 화면은 저장이 잠겨 묶음을 바꿀 수 없다 */
    const def = T[target.tpl];
    const P = window.WEMB && WEMB.projects;
    if (!def || !P) return false;
    let me = null;
    try { me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ)); } catch (e) {}
    if (!me || me.tpl !== target.tpl || me.projectId !== target.projectId) return false;
    const scene = def.sceneOf(target);
    transition(() => {
      if (swapBundle(target.id, push !== false)) def.draw(scene);
    }, def.builds(scene));
    return true;
  }

  /* 뒤로 · 앞으로 — 주소의 화면이 지금 화면과 다르면 그 화면으로. 라우터는 해시만 보므로 여기서 받는다 */
  window.addEventListener('popstate', () => {
    let want = null, cur = null, target = null;
    try {
      const P = WEMB.projects;
      want = new URL(location.href).searchParams.get('screen');
      cur = localStorage.getItem(P.CUR_PROJ);
      target = want && P.loadProjects().find((x) => x.id === want);
    } catch (e) {}
    if (!want || want === cur) return;
    if (!toScreen(target, false)) location.reload();
  });

  window.WEMB = window.WEMB || {};
  WEMB.screenSwitch = { register, toScreen, transition };
})();
