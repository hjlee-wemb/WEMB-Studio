/* ── 템플릿 화면 모듈 — 지금 여는 화면이 쓰는 것만 싣는다 ──

   템플릿 화면(src/<템플릿>-*.js)은 Figma 화면을 통째로 담은 생성물이라 크다(다섯 템플릿 합쳐 약 17MB).
   예전엔 studio.html 이 이것을 전부 <script> 로 실어, LS Electric 화면 하나를 여는데도 HANA · POSCO · 한진 ·
   SK하이닉스 화면까지 받아 파싱했다 — 여는 데 1.6~2.1초(1.5초 규칙 위반, 2026-10-02 측정).

   · 부팅 — 이 스크립트는 studio.html 본문의 원래 그 자리에서 돈다. 열 화면(js/app/session.js 가 전역 키를
     그 화면 것으로 맞춰 둔 뒤다)의 템플릿 모듈만 document.write 로 싣는다. 파서를 막는 보통 <script> 와
     똑같이 순서대로 실행되므로, 뒤에 오는 js/main.js 가 화면을 그릴 때 빌더가 이미 있다.
   · 그 밖 — 다른 화면이 필요해지면(같은 프로젝트 안 장면 바꾸기 · 에셋 라이브러리 썸네일 · 원자 변경)
     WEMB.tplModules.need([빌더 이름 …]) 로 그때 싣는다(Promise). 화면을 얹는 함수(applyXxxDT)는
     WEMB.tplModules.wait(…) 로 '없으면 싣고 나서 다시 그리기'를 건다.
   · 에셋 등록 목록(*-assets.js)과 recent-time.js 는 작고 라이브러리 목록이 처음부터 써서 studio.html 에 그대로 둔다.

   모듈의 ?v= 는 여기서 올린다(studio.html 이 아니다). */
(function () {
  /* [파일, 정의하는 빌더 · 장면] — 순서가 곧 싣는 순서다(화면 모듈 → 라이브). 장면 이름은 js/templates/*.js 의 표와 같다.
     part: 'base' 는 그 템플릿의 어느 화면을 열든 함께 싣는 라이브 층. */
  const T = {
    /* SK하이닉스 이천 FMS — 메인 화면에서 팝업(UPS 전력 상세)을 그 자리에서 띄우므로 통째로 */
    skhynix: [
      { src: 'src/skhynix-screen.js?v=7', build: ['buildSkhynixScreen'] },
      { src: 'src/skhynix-popup.js?v=5', build: ['buildSkhynixPopup'] },
    ],
    /* Icheon main — 메인(FMS Hub) · 항온항습기 상세를 그 자리에서 오가므로 통째로 */
    'skhynix-hub': [
      { src: 'src/skhynix-hub.js?v=1', build: ['buildSkhynixHub'] },
      { src: 'src/skhynix-hub-live.js?v=16', part: 'base' },
      { src: 'src/skhynix-hvac.js?v=1', build: ['buildSkhynixHvac'] },
      { src: 'src/skhynix-hvac-live.js?v=3', part: 'base' },
    ],
    /* 한진 SMART 통합관제 — Figma A11hAZefK5FSuEE9MagOgj */
    hanjin: [
      { src: 'src/hanjin-control.js?v=1', build: ['build_hjc'], scene: 'main' },
      { src: 'src/hanjin-gate.js?v=1', build: ['build_hjg'], scene: 'gate' },
      { src: 'src/hanjin-unload.js?v=1', build: ['build_hju'], scene: 'unload' },
      { src: 'src/hanjin-live.js?v=4', part: 'base' },
    ],
    /* HANA Bank H.I.T — Figma H3S2M7DUCvuJgi75oBqg6W 화면 14장(합쳐 9MB — 장면마다 따로 싣는다) */
    hana: [
      { src: 'src/hana-overview-02.js?v=2', build: ['build_hno2'], scene: 'overview-02' },
      { src: 'src/hana-cloud-01.js?v=2', build: ['build_hnc1'], scene: 'cloud-01' },
      { src: 'src/hana-cloud-02.js?v=2', build: ['build_hnc2'], scene: 'cloud-02' },
      { src: 'src/hana-middleware.js?v=2', build: ['build_hnm'], scene: 'middleware' },
      { src: 'src/hana-infra-main.js?v=2', build: ['build_hni1'], scene: 'infra-main' },
      { src: 'src/hana-infra-detail.js?v=2', build: ['build_hni2'], scene: 'infra-detail' },
      { src: 'src/hana-event.js?v=2', build: ['build_hne'], scene: 'event' },
      { src: 'src/hana-network-01.js?v=2', build: ['build_hnn1'], scene: 'network-01' },
      { src: 'src/hana-network-02.js?v=2', build: ['build_hnn2'], scene: 'network-02' },
      { src: 'src/hana-network-03.js?v=2', build: ['build_hnn3'], scene: 'network-03' },
      { src: 'src/hana-facility.js?v=2', build: ['build_hnf'], scene: 'facility' },
      { src: 'src/hana-security-01.js?v=2', build: ['build_hns1'], scene: 'security-01' },
      { src: 'src/hana-security-02.js?v=2', build: ['build_hns2'], scene: 'security-02' },
      { src: 'src/hana-login.js?v=2', build: ['build_hnl'], scene: 'login' },
      { src: 'src/hana-live.js?v=2', part: 'base' },
    ],
    /* POSCO KDB CCTV 관제 — Figma dj0SONcO5BySCm7yDdZrNc. SOP 장면은 STEP 1 위에 STEP 2 · 3 · 4 를 겹친다 */
    posco: [
      { src: 'src/posco-main.js?v=4', build: ['build_pkm'], scene: 'main' },
      { src: 'src/posco-ack.js?v=2', build: ['build_pka'], scene: 'ack' },
      { src: 'src/posco-overview.js?v=2', build: ['build_pko'], scene: 'overview' },
      { src: 'src/posco-route.js?v=3', build: ['build_pkr'], scene: 'route' },
      { src: 'src/posco-floors.js?v=2', build: ['build_pkf'], scene: 'floors' },
      { src: 'src/posco-detail.js?v=2', build: ['build_pkd'], scene: 'detail' },
      { src: 'src/posco-sop1.js?v=2', build: ['build_pks1'], scene: 'sop' },
      { src: 'src/posco-sop2.js?v=2', build: ['build_pks2'], scene: 'sop' },
      { src: 'src/posco-sop3.js?v=2', build: ['build_pks3'], scene: 'sop' },
      { src: 'src/posco-sop4.js?v=1', build: ['build_pks4'], scene: 'sop' },
      { src: 'src/posco-live.js?v=52', part: 'base' },
    ],
    /* LS Electric STATCOM — Figma KkmCQi05F7eSb3tHO7ZW0Q. 헤더 '팝업' 단추가 다른 장면의 팝업을
       그 자리에서 겹쳐 띄우므로(src/lselectric-live.js installPopupLinks) 통째로 */
    lselectric: [
      { src: 'src/lselectric-statcom.js?v=3', build: ['build_lsm'] },
      { src: 'src/lselectric-datacenter.js?v=3', build: ['build_lsd'] },
      { src: 'src/lselectric-acb.js?v=3', build: ['build_lsa', 'build_lsm_acb'] },
      { src: 'src/lselectric-system.js?v=2', build: ['build_lsy', 'build_lsm_system'] },
      { src: 'src/lselectric-energy.js?v=2', build: ['build_lse', 'build_lsm_energy'] },
      { src: 'src/lselectric-transformer.js?v=1', build: ['build_lst', 'build_lsm_transformer'] },
      { src: 'src/lselectric-acroom.js?v=1', build: ['build_lsp', 'build_lsm_acroom'] },
      { src: 'src/lselectric-charger.js?v=1', build: ['build_lsb', 'build_lsm_charger'] },
      { src: 'src/lselectric-cooling.js?v=1', build: ['build_lsc', 'build_lsm_cooling'] },
      { src: 'src/lselectric-alarm.js?v=1', build: ['build_lsr', 'build_lsm_alarm'] },
      { src: 'src/lselectric-live.js?v=9', part: 'base' },
    ],
    /* 신한카드 정보보호 대시보드 — Figma zXb8i3nonD9Hpu5kdZQs6t. 헤더 메뉴로 장면끼리 오가고,
       이상징후 탐지 표에서 등록 창(sha)을 그 자리에 겹쳐 띄우므로 통째로 */
    shinhan: [
      { src: 'src/shinhan-overview.js?v=3', build: ['build_shm'] },
      { src: 'src/shinhan-register.js?v=3', build: ['build_sha', 'build_shm_register'] },
      { src: 'src/shinhan-entry.js?v=3', build: ['build_shi'] },
      { src: 'src/shinhan-anomaly.js?v=3', build: ['build_shd'] },
      { src: 'src/shinhan-live.js?v=7', part: 'base' },
    ],
  };
  /* 장면마다 따로 싣는 템플릿(나머지는 통째로) · 장면을 적어 두는 전역 키 · 기본 장면 */
  const PER_SCENE = {
    hana: { key: 'wemb-hana-screen', def: 'overview-02' },
    posco: { key: 'wemb-posco-screen', def: 'main' },
    hanjin: { key: 'wemb-hanjin-screen', def: 'main' },
  };

  const byBuild = {};
  Object.keys(T).forEach((tpl) => T[tpl].forEach((m) => { m.tpl = tpl; (m.build || []).forEach((b) => (byBuild[b] = m)); }));
  const loaded = new Set();   /* 실었거나 싣는 중인 파일 */
  const has = (name) => typeof window[name] === 'function';

  /* 빌더들을 쓰려면 실어야 할 파일 — 그 템플릿의 라이브 층을 포함해, 표의 순서대로.
     장면마다 따로 싣지 않는 템플릿은 하나만 불러도 통째로 싣는다(부팅과 같게) */
  function filesFor(names) {
    const want = new Set();
    names.forEach((n) => {
      const m = byBuild[n];
      if (!m) return;
      want.add(m);
      T[m.tpl].forEach((x) => { if (x.part === 'base' || !PER_SCENE[m.tpl]) want.add(x); });
    });
    const out = [];
    Object.keys(T).forEach((tpl) => T[tpl].forEach((m) => { if (want.has(m) && !loaded.has(m.src)) out.push(m.src); }));
    return out;
  }

  /* ── 부팅 — 열 화면의 모듈만 ── */
  function bootFiles() {
    let tpl = null;
    const scenes = [];
    try {
      const fresh = JSON.parse(sessionStorage.getItem('wemb-fresh-open') || 'null');   /* 홈에서 '이 구성으로 스튜디오 열기' */
      if (fresh && fresh.tpl) { tpl = fresh.tpl; if (fresh.scene) scenes.push(fresh.scene); }
    } catch (e) {}
    try {
      if (!tpl) tpl = localStorage.getItem('wemb-tpl-dt');
      const P = window.WEMB && WEMB.projects;
      const list = P ? P.loadProjects() : [];
      const cur = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (cur && cur.tpl === tpl && cur.tplScene) scenes.push(cur.tplScene);
      /* js/templates/*.js 의 __xxxSceneOf 가 먼저 보는 옛 표시(open)도 — 부팅이 그 장면을 그릴 수 있다 */
      const open = list.find((x) => x && x.open && x.tpl === tpl);
      if (open && open.tplScene) scenes.push(open.tplScene);
      if (PER_SCENE[tpl]) scenes.push(localStorage.getItem(PER_SCENE[tpl].key) || PER_SCENE[tpl].def);
    } catch (e) {}
    if (!tpl || !T[tpl]) return [];
    const ps = PER_SCENE[tpl];
    /* 모르는 장면 이름이면 그 템플릿이 그리는 기본 장면 */
    const known = new Set(T[tpl].map((m) => m.scene).filter(Boolean));
    const pick = new Set(scenes.filter((s) => known.has(s)));
    if (ps && !pick.size) pick.add(ps.def);
    const names = [];
    T[tpl].forEach((m) => { if (!ps || pick.has(m.scene)) (m.build || []).forEach((b) => names.push(b)); });
    return filesFor(names);
  }
  const boot = bootFiles();
  boot.forEach((s) => loaded.add(s));
  if (boot.length) document.write(boot.map((s) => '<script src="' + s + '"><\/script>').join(''));

  /* ── 필요할 때 싣기 ── */
  const inflight = new Map();   /* 파일 → Promise */
  function loadFile(src) {
    if (inflight.has(src)) return inflight.get(src);
    const p = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;   /* 동적으로 넣어도 넣은 순서대로 실행 */
      s.onload = () => res();
      s.onerror = () => { loaded.delete(src); inflight.delete(src); rej(new Error('모듈을 싣지 못했어요: ' + src)); };
      document.body.appendChild(s);
    });
    loaded.add(src);
    inflight.set(src, p);
    return p;
  }
  /* 빌더들이 다 있게 한다. 표에 없는 이름은 무시(실을 것이 없다) */
  function need(names) {
    names = [].concat(names || []).filter(Boolean);
    if (names.every(has)) return Promise.resolve();
    const files = filesFor(names.filter((n) => !has(n)));
    /* 이미 싣는 중인 파일(다른 부름이 먼저 시작한 것)도 기다린다 */
    names.forEach((n) => { const m = byBuild[n]; if (m && !has(n)) T[m.tpl].forEach((x) => { if (inflight.has(x.src) && !files.includes(x.src)) files.push(x.src); }); });
    return Promise.all(files.map(loadFile)).then(() => {});
  }
  /* 화면을 얹는 함수용 — 빌더가 다 있으면 false(그대로 그리면 된다).
     없으면 실은 뒤 retry 를 부르고 true(지금은 그리지 말 것). 그사이 다른 화면을 얹으라는 부름이 오면
     (wait 가 다시 불리면) 늦게 도착한 retry 는 버린다 — 마지막 부름이 이긴다. */
  let seq = 0;
  function wait(names, retry) {
    const my = ++seq;
    names = [].concat(names || []).filter(Boolean);
    if (names.every(has) || !names.some((n) => byBuild[n])) return false;
    need(names).then(() => { if (my === seq && names.every(has)) retry(); }, (e) => {
      try { console.warn(e); if (typeof toast === 'function') toast('화면 모듈을 불러오지 못했어요. 새로고침해 주세요.', { type: 'err' }); } catch (er) {}
    });
    return true;
  }
  const known = (name) => !!byBuild[name];
  /* 급하지 않은 곳(에셋 라이브러리 썸네일 · 원자 변경 썸네일)용 — 페이지 로드가 끝나 막이 걷힌 뒤에 싣는다.
     라이브러리를 펼쳐 둔 채 열면 부팅 중에 다른 템플릿 모듈 수 MB 를 받아 실행하게 되고, load 가 그만큼 늦어져
     막이 늦게 걷힌다(js/shell/routes.js 는 load 를 기다린다). */
  const afterBoot = new Promise((res) => {
    const go = () => setTimeout(res, 400);
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  });
  const later = (names) => afterBoot.then(() => need(names));

  window.WEMB = window.WEMB || {};
  WEMB.tplModules = { need, later, wait, has, known, boot: boot.slice() };
})();
