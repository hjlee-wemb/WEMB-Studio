/* ── 발표 — 프로젝트의 화면들을 도구 없이 크게 ──
   present.html?group=<프로젝트 id>[&screen=<처음 화면 id>]
   - 화면 하나 = 작업공간(studio.html?screen=<id>&present=1)을 담은 iframe. 작업공간은 발표 모드로 열려
     도구를 숨기고(css/base/present.css), 화면을 연 뒤 저장을 잠근다(js/app/present-boot.js).
   - iframe 두 장을 번갈아 쓴다 — 보이는 화면 뒤에서 다음 화면을 미리 열어 두었다가, 다 그려지면 바꿔 끼운다.
   - ←/→ · PageUp/PageDown · Home/End 화면 넘기기, F 전체 화면, M 회의 모드, Esc 끝내기.
     키는 바깥 문서와 iframe 안 문서 모두에서 받는다(같은 출처).
   - 끝내면 들어온 곳으로 — 작업공간에서 왔으면 그 화면, 홈에서 왔으면 그 프로젝트 목록. */
(function present() {
  const P = WEMB.projects, M = WEMB.meeting;
  const q = new URLSearchParams(location.search);
  const gid = q.get('group') || '';
  const fromScreen = q.get('screen') || '';
  const grp = P.groupById(gid);
  const screens = grp ? P.loadProjects().filter((s) => s.projectId === gid) : [];
  const $ = (id) => document.getElementById(id);
  const frames = [$('pvA'), $('pvB')];
  const hud = $('pvHud'), where = $('pvWhere'), loading = $('pvLoading');
  let at = Math.max(0, screens.findIndex((s) => s.id === fromScreen));
  let shown = -1; // frames 중 보이는 것
  const slot = [null, null]; // 각 iframe 에 열린(열리는) 화면 순번
  const ready = [false, false];
  let started = false, ending = false;

  const backURL = () => (fromScreen && screens.some((s) => s.id === fromScreen) ? 'studio.html?screen=' + encodeURIComponent(fromScreen) + '#/studio' : 'index.html#/projects/' + encodeURIComponent(gid));
  const screenURL = (i) => 'studio.html?screen=' + encodeURIComponent(screens[i].id) + '&present=1#/studio';
  const name = (s) => M.text(s && s.name ? s.name : '화면');

  /* 화면이 없으면 */
  if (!grp || !screens.length) {
    $('pvStartTitle').textContent = '발표할 화면이 없어요';
    $('pvStartLead').textContent = grp ? '이 프로젝트에 화면이 없어요. 홈에서 화면을 만든 뒤 다시 시작하세요.' : '프로젝트를 찾지 못했어요 — 다른 브라우저에서 만든 주소이거나 지워진 프로젝트예요.';
    $('pvGoFull').hidden = $('pvGoWin').hidden = true;
    document.querySelector('.pv-keys').hidden = true;
    document.querySelector('.pv-meet').hidden = true;
    $('pvCancel').onclick = () => location.replace(grp ? backURL() : 'index.html#/projects');
    return;
  }

  /* ── iframe 에 화면 열기 · 다 그려졌는지 ── */
  function load(k, i) {
    const f = frames[k];
    slot[k] = i;
    ready[k] = false;
    f.onload = () => {
      wire(f);
      /* 작업공간이 다 그려지면 부팅 막(data-boot)을 걷는다(js/shell/routes.js) — 그때가 보여 줄 때 */
      const t0 = performance.now();
      const poll = () => {
        if (slot[k] !== i) return;
        let booting = true;
        try { booting = f.contentDocument.documentElement.hasAttribute('data-boot'); } catch (e) { booting = false; }
        if (booting && performance.now() - t0 < 6000) return setTimeout(poll, 60);
        requestAnimationFrame(() => requestAnimationFrame(() => { if (slot[k] !== i) return; ready[k] = true; if (want === i) swapIn(k); }));
      };
      poll();
    };
    f.src = screenURL(i);
  }
  let want = at;
  function go(i) {
    if (i < 0 || i >= screens.length) { bump(i < 0 ? -1 : 1); return; }
    want = i;
    at = i;
    label();
    const k = slot[0] === i ? 0 : slot[1] === i ? 1 : -1;
    if (k >= 0 && k === shown) return;
    if (k >= 0) { if (ready[k]) swapIn(k); else loading.classList.add('on'); return; }
    const free = shown === 0 ? 1 : 0;
    loading.classList.add('on');
    load(free, i);
  }
  function swapIn(k) {
    loading.classList.remove('on');
    frames[k].classList.add('on');
    frames[1 - k].classList.remove('on');
    shown = k;
    try { frames[k].contentWindow.focus(); } catch (e) {}
    /* 다음 화면을 뒤에서 미리 — 바로 넘어가게. 앞 화면이 그려지는 걸 방해하지 않게 조금 뒤에 */
    clearTimeout(preT);
    preT = setTimeout(() => {
      const nx = at + 1;
      if (nx < screens.length && slot[1 - k] !== nx) load(1 - k, nx);
    }, 900);
  }
  let preT = 0;
  /* 처음 · 끝에서 더 넘기면 살짝 흔들어 알린다 */
  function bump(dir) {
    showHud();
    where.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + 6 * dir + 'px)' }, { transform: 'translateX(0)' }], { duration: 220, easing: 'ease-out' });
  }
  function label() {
    where.innerHTML = '';
    const n = document.createElement('b');
    n.textContent = at + 1 + ' / ' + screens.length;
    const t = document.createElement('span');
    t.textContent = name(screens[at]);
    where.append(n, t);
    $('pvPrev').disabled = at <= 0;
    $('pvNext').disabled = at >= screens.length - 1;
    document.title = name(screens[at]) + ' · ' + M.text(grp.name) + ' — 발표';
  }

  /* ── 조작 띠 — 움직이면 나타나고 2.5초 뒤 사라진다 ── */
  let hudT = 0;
  function showHud() {
    if (!started) return;
    hud.hidden = false;
    hud.classList.add('on');
    document.body.classList.remove('pv-idle');
    clearTimeout(hudT);
    hudT = setTimeout(() => { if (!hud.matches(':hover')) { hud.classList.remove('on'); document.body.classList.add('pv-idle'); } }, 2500);
  }
  hud.addEventListener('mouseleave', showHud);
  const meetChip = $('pvMeet');
  function syncMeet() {
    const on = M.on();
    meetChip.textContent = '회의 모드 ' + (on ? '켬' : '끔');
    meetChip.classList.toggle('on', on);
    meetChip.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (started) label();
  }
  M.onChange(syncMeet);
  syncMeet();
  const toggleMeet = () => { M.set({ on: !M.on() }); showHud(); };
  const isFull = () => !!document.fullscreenElement;
  const toggleFull = () => {
    try {
      if (isFull()) document.exitFullscreen();
      else document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch (e) {}
  };
  document.addEventListener('fullscreenchange', () => $('pvFull').classList.toggle('on', isFull()));
  function end() {
    if (ending) return;
    ending = true;
    const leave = () => location.replace(backURL());
    if (isFull()) document.exitFullscreen().then(leave, leave);
    else leave();
  }

  $('pvPrev').onclick = () => go(at - 1);
  $('pvNext').onclick = () => go(at + 1);
  meetChip.onclick = toggleMeet;
  $('pvFull').onclick = toggleFull;
  $('pvEnd').onclick = end;

  /* ── 키 — 바깥 문서와 iframe 안 문서에서 모두 ── */
  function onKey(e) {
    if (!started) {
      if (e.key === 'Enter') { e.preventDefault(); begin(true); }
      else if (e.key === 'Escape') { e.preventDefault(); end(); }
      return;
    }
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    let used = true;
    if (k === 'ArrowRight' || k === 'PageDown') go(at + 1);
    else if (k === 'ArrowLeft' || k === 'PageUp') go(at - 1);
    else if (k === 'Home') go(0);
    else if (k === 'End') go(screens.length - 1);
    else if (k === 'f' || k === 'F' || k === 'ㄹ') toggleFull();
    else if (k === 'm' || k === 'M' || k === 'ㅡ') toggleMeet();
    else if (k === 'Escape') end();
    else used = false;
    if (used) { e.preventDefault(); e.stopPropagation(); showHud(); }
  }
  window.addEventListener('keydown', onKey, true);
  document.addEventListener('mousemove', showHud);
  /* iframe 안 — 키 · 마우스 움직임을 바깥과 같이 */
  function wire(f) {
    try {
      const w = f.contentWindow;
      if (w.__pvWired) return;
      w.__pvWired = true;
      w.addEventListener('keydown', onKey, true);
      w.document.addEventListener('mousemove', showHud);
    } catch (e) {}
  }

  /* ── 시작 ── */
  $('pvStartTitle').textContent = M.text(grp.name);
  $('pvStartLead').textContent = '화면 ' + screens.length + '개 · ' + (at + 1) + '번째 “' + name(screens[at]) + '”부터 보여 줘요. 도구는 숨기고 시안만 크게 보여요.';
  $('pvMeetStart').checked = M.on();
  $('pvMeetStart').onchange = (e) => M.set({ on: e.target.checked });
  function begin(full) {
    if (started) return;
    started = true;
    $('pvStart').classList.add('out');
    setTimeout(() => ($('pvStart').hidden = true), 260);
    if (full) toggleFull();
    label();
    if (slot[0] === at && ready[0]) swapIn(0);
    else loading.classList.add('on');
    showHud();
  }
  $('pvGoFull').onclick = () => begin(true);
  $('pvGoWin').onclick = () => begin(false);
  $('pvCancel').onclick = end;
  $('pvGoFull').focus();
  /* 시작을 누르기 전부터 첫 화면을 뒤에서 연다 */
  load(0, at);
  want = at;
})();
