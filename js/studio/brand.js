/* ── 브랜드 — 로고 · 이름 ── */

/* ── 브랜드 — 로고 업로드 · 브랜드명 · 화면명 → 프리뷰 머리말에 반영, 로고에서 기준색 추출 ── */
function initBrand() {
  const LS = { logo: 'wemb-brand-logo', name: 'wemb-brand-name', screen: 'wemb-brand-screen' };
  const store = (k, v) => {
    try {
      v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    } catch (e) {}
  };
  const setLogo = (src) => {
    const url = src || 'src/logo.svg';
    document.querySelectorAll('.main .wlogo').forEach((im) => (im.src = url));
    const p = document.querySelector('#brandLogoPrev img');
    if (p) p.src = url;
  };
  /* 프로젝트명(PRD에서 저장) → 스튜디오 시안 머리말의 부제(.brand .sub)에 표시. 사용자가 못 바꾸는 고정값. */
  const setBrandName = (v) => {
    const name = (v && v.trim()) || '프로젝트';
    document.querySelectorAll('.main .brand .sub').forEach((s) => (s.textContent = name));
  };
  /* 테마명 → (숨김) .brandname 라벨에 보관. 시안 부제(.sub)는 이제 프로젝트명이 쓰므로 여기서는 건드리지 않는다. */
  const setScreenName = (v) => {
    document.querySelectorAll('.main .brand').forEach((b) => {
      let el = b.querySelector('.brandname');
      if (v) {
        if (!el) {
          el = document.createElement('span');
          el.className = 'brandname';
          const logo = b.querySelector('.logo');
          logo ? logo.after(el) : b.prepend(el);
        }
        el.textContent = v;
      } else if (el) el.remove();
    });
  };
  const fileEl = document.getElementById('brandLogoFile');
  if (fileEl)
    fileEl.onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        setLogo(rd.result);
        store(LS.logo, rd.result);
        /* 이미 시안 로고를 바꿔 쓰는 중이면 새 로고로 곧바로 교체 */
        try { if (TPLLOGO.isOn()) TPLLOGO.apply(); } catch (e2) {}
      };
      rd.readAsDataURL(f);
    };
  document.getElementById('brandLogoClear')?.addEventListener('click', () => {
    setLogo(null);
    store(LS.logo, null);
    /* 시안에 얹었던 로고도 걷어내 원래 템플릿 로고로 되돌린다 */
    try { TPLLOGO.setOn(false); TPLLOGO.apply(); } catch (e) {}
  });
  document.getElementById('brandLogoSeed')?.addEventListener('click', () => {
    const cur = document.querySelector('#brandLogoPrev img');
    if (!cur || !cur.src) return;
    const im = new Image();
    im.onload = () => {
      try {
        const t = extractTheme(im);
        if (!t || !t.seed) return;
        state.seed = t.seed;
        const s = document.getElementById('seed'),
          h = document.getElementById('hex');
        if (s) s.value = t.seed;
        if (h) h.value = t.seed.toUpperCase();
        if (typeof setSource === 'function') setSource('seed');
        apply();
        /* 템플릿 시안(SK하이닉스 SVG·한진·이미지)의 로고도 업로드한 로고로 바꾼다 */
        let swapped = false;
        try {
          TPLLOGO.setOn(true);
          TPLLOGO.apply();
          swapped = !!document.querySelector('.skx-screen, .hj-repro, .tplimg-repro');
        } catch (e2) {}
        if (typeof toast === 'function')
          toast(swapped ? '로고 대표색을 기준 색으로 적용하고, 시안 로고도 바꿨어요.' : '로고 대표색을 기준 색으로 적용했어요.', { type: 'ok' });
      } catch (err) {}
    };
    im.onerror = () => {
      if (typeof toast === 'function') toast('로고 색을 읽지 못했어요.', { type: 'err' });
    };
    im.src = cur.src;
  });
  const bn = document.getElementById('brandName'),
    sn = document.getElementById('screenName');
  /* 프로젝트명은 읽기 전용(PRD 고정값)이라 입력 핸들러가 없다. 테마명만 실시간 반영·저장. */
  if (sn)
    sn.oninput = () => {
      setScreenName(sn.value.trim());
      store(LS.screen, sn.value);
    };
  try {
    const l = localStorage.getItem(LS.logo);
    if (l) setLogo(l);
    /* 프로젝트명 — PRD에서 저장한 값(wemb-prd.site)을 우선, 없으면 현재 프로젝트 카드 이름. 편집 불가. */
    let pname = '';
    try { const r = JSON.parse(localStorage.getItem('wemb-prd')); if (r && r.site) pname = String(r.site).trim(); } catch (e) {}
    if (!pname) {
      try {
        const id = localStorage.getItem('wemb-current-proj');
        const arr = JSON.parse(localStorage.getItem('wemb-projects') || '[]');
        const p = arr.find((x) => x.id === id);
        if (p && p.name) pname = String(p.name).trim();
      } catch (e) {}
    }
    if (bn) { bn.value = pname; bn.readOnly = true; }
    setBrandName(pname);
    /* 테마명 */
    const c = localStorage.getItem(LS.screen);
    if (c) {
      if (sn) sn.value = c;
      setScreenName(c);
    }
  } catch (e) {}
}
