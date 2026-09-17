/* ── 브랜드 — 로고 · 이름 ── */

/* ── 브랜드 — 로고 업로드 · 브랜드명 · 화면명 → 프리뷰 머리말에 반영, 로고에서 기준색 추출 ── */
function initBrand() {
  const LS = { logo: 'wemb-brand-logo', name: 'wemb-brand-name', screen: 'wemb-brand-screen' };
  /* 저장 성공 여부를 돌려준다 — 로고(dataURL)는 커서 저장 공간을 넘기기 쉽고, 실패하면 새로고침에 사라진다 */
  const store = (k, v) => {
    try {
      v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
      return true;
    } catch (e) {
      return false;
    }
  };
  const say = (msg, type, dur) => {
    if (typeof toast === 'function') toast(msg, { type, dur });
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
  /* 로고 파일 한도 — 로고는 보통 수십 KB 다. 1MB 를 넘는 사진을 로고로 올리면 dataURL 이 1.3MB 넘게 불어나
     프로젝트 상태 묶음과 함께 브라우저 저장 공간을 금방 채운다. */
  const LOGO_MAX = 1024 * 1024;
  const fileEl = document.getElementById('brandLogoFile');
  if (fileEl)
    fileEl.onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      /* 같은 파일을 다시 골라도 change 가 오도록 바로 비운다 */
      fileEl.value = '';
      if (!/^image\//.test(f.type)) {
        say('이미지 파일(PNG · JPG · SVG)만 로고로 올릴 수 있어요.', 'err');
        return;
      }
      if (f.size > LOGO_MAX) {
        say('로고 파일이 너무 커요(' + (f.size / 1048576).toFixed(1) + 'MB). 1MB 이하로 줄여서 다시 올려 주세요.', 'err');
        return;
      }
      const rd = new FileReader();
      rd.onerror = () => say('로고 파일을 읽지 못했어요. 다른 파일로 시도해 주세요.', 'err');
      rd.onload = () => {
        setLogo(rd.result);
        if (!store(LS.logo, rd.result)) say('로고는 바꿨지만 브라우저에 저장하지 못해 새로고침하면 사라져요. 더 작은 파일로 다시 올려 주세요.', 'warn', 7000);
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
        /* 색을 하나도 못 찾으면(흑백 · 거의 투명한 로고) extractTheme 은 기본색만 돌려준다(cols 없음).
           그대로 적용하면 '로고 색'이라며 엉뚱한 기본 파랑이 들어가므로 알리고 멈춘다. */
        if (!t || !t.seed || !t.cols) {
          say('로고에서 대표색을 찾지 못했어요 — 흑백이거나 색이 거의 없는 로고예요. 기준 색을 직접 골라 주세요.', 'warn');
          return;
        }
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
        say(swapped ? '로고 대표색을 기준 색으로 적용하고, 시안 로고도 바꿨어요.' : '로고 대표색을 기준 색으로 적용했어요.', 'ok');
      } catch (err) {
        say('로고 색을 읽지 못했어요. 다른 로고 파일로 시도해 주세요.', 'err');
      }
    };
    im.onerror = () => say('로고 색을 읽지 못했어요. 다른 로고 파일로 시도해 주세요.', 'err');
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
