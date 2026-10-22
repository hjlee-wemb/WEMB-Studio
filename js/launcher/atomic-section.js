/* ── 홈 좌측 메뉴 '분자 라이브러리' — 주소와 본문 칸 ──
   #/molecules …  주소가 오면 홈 본문(.lc-main)의 다른 내용을 가리고 분자 라이브러리 칸을 보여 준다.
   화면을 그리는 코드는 ES 모듈(js/atomic/app.js)이라 처음 들어올 때 한 번만 불러온다.
   라우터가 시작(home.js 끝의 router.start)하기 전에 라우트를 등록해야 하므로 home.js 보다 먼저 싣는다. */
(function () {
  const router = WEMB.router;
  const lc = document.querySelector('#flowHome .lc');
  const main = lc && lc.querySelector('.lc-main');
  if (!main) return;
  const box = document.createElement('div');
  box.className = 'atm';
  box.id = 'lcAtomic';
  box.hidden = true;
  main.append(box);

  let mod = null;
  let active = false;
  const load = () => mod || (mod = import('../atomic/app.js?v=48'));

  function enter(page, id) {
    active = true;
    lc.classList.add('atm-on');
    box.hidden = false;
    document.querySelectorAll('.lc-navi').forEach((b) => b.classList.toggle('on', b.hasAttribute('data-atomic')));
    load()
      .then((m) => m.show(box, page, id))
      .catch((e) => { box.innerHTML = '<div class="atm-offline"><b>분자 라이브러리를 불러오지 못했어요.</b><p></p></div>'; box.querySelector('p').textContent = e.message; });
  }
  router.add('atomic:lib', '/molecules', () => enter('lib'));
  router.add('atomic:mol', '/molecules/m/:id', (p) => enter('mol', p.id));
  router.add('atomic:screens', '/molecules/screens', () => enter('screens'));
  router.add('atomic:verify', '/molecules/verify', () => enter('verify'));
  router.add('atomic:names', '/molecules/names', () => enter('names'));
  router.add('atomic:screen', '/molecules/s/:id', (p) => enter('screen', p.id));
  // 아토믹 5단계 — 원자 · 유기체 · 템플릿(화면 틀) · 페이지(원본 화면). 분자는 /molecules
  router.add('atomic:atoms', '/molecules/atoms', () => enter('atoms'));
  router.add('atomic:organisms', '/molecules/organisms', () => enter('organisms'));
  router.add('atomic:org', '/molecules/o/:id', (p) => enter('org', p.id));
  router.add('atomic:templates', '/molecules/templates', () => enter('templates'));
  router.add('atomic:tpl', '/molecules/t/:id', (p) => enter('tpl', p.id));
  router.add('atomic:pages', '/molecules/pages', () => enter('pages'));
  router.add('atomic:page', '/molecules/p/:id', (p) => enter('page', p.id));
  router.onChange((next) => {
    if (active && next.name.indexOf('atomic:') !== 0) {
      active = false;
      lc.classList.remove('atm-on');
      box.hidden = true;
      if (mod) mod.then((m) => m.hide());
    }
  });

  const nav = document.querySelector('.lc-nav');
  /* 분자 라이브러리에 있을 때 왼쪽 메뉴는 라우터로 이동한다 (capture — home.js 의 메뉴 처리보다 먼저).
     저장 안 한 조립 화면이 있으면 라우터의 나가기 막기(app.js screenEditor 의 setGuard)가 먼저 묻는다. */
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-navi');
    if (!b || !active || !mod) return;
    e.stopImmediatePropagation();
    if (b.hasAttribute('data-atomic')) router.navigate('/molecules');
    else if (b.dataset.view) b.dispatchEvent(new CustomEvent('atm-go', { bubbles: true }));
  }, true);
  /* 다른 메뉴 이동 — 주소로 넘긴다 */
  nav.addEventListener('atm-go', (e) => {
    const paths = { all: '/projects', recent: '/recent', fav: '/favorites', trash: '/trash', tpl: '/templates' };
    router.navigate(paths[e.target.dataset.view] || '/projects');
  });
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-navi[data-atomic]');
    if (b && !active) router.navigate('/molecules');
  });
})();
