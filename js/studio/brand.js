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
        /* 올리면 곧바로 시안 헤더에 반영하고 프로젝트의 다른 화면에도 쓴다.
           예전엔 '로고에서 기준색'을 눌러야 시안 로고가 바뀌어, 올려도 안 바뀌는 것처럼 보였다. */
        try {
          TPLLOGO.setOn(true);
          TPLLOGO.apply();
          const P = window.WEMB && WEMB.projects;
          if (P && !P.setGroupLogo(P.currentGroupId(), rd.result)) say('이 화면의 로고는 바꿨지만 저장 공간이 모자라 프로젝트의 다른 화면에는 적용하지 못했어요. 더 작은 파일로 다시 올려 주세요.', 'warn');
          else say('로고를 바꿨어요. 이 프로젝트의 모든 화면에 적용돼요.', 'ok');
        } catch (e2) {}
      };
      rd.readAsDataURL(f);
    };
  document.getElementById('brandLogoClear')?.addEventListener('click', () => {
    setLogo(null);
    store(LS.logo, null);
    /* 시안에 얹었던 로고도 걷어내 WEMB Studio 로고로 되돌린다 — 프로젝트의 다른 화면도 함께 */
    try { TPLLOGO.setOn(false); TPLLOGO.apply(); } catch (e) {}
    try { const P = window.WEMB && WEMB.projects; if (P) P.setGroupLogo(P.currentGroupId(), null); } catch (e) {}
  });
  document.getElementById('brandLogoSeed')?.addEventListener('click', () => {
    const cur = document.querySelector('#brandLogoPrev img');
    if (!cur || !cur.src) return;
    const im = new Image();
    im.onload = () => {
      try {
        const t = extractLogoColors(im);
        /* 유채색이 없는 흑백 로고 — 기준 색을 정할 수 없으므로 지금 색을 두고 알린다 */
        if (!t) {
          say('로고에서 대표색을 찾지 못했어요 — 흑백이거나 색이 거의 없는 로고예요. 기준 색을 직접 골라 주세요.', 'warn');
          return;
        }
        state.seed = t.seed;
        state.subHex = t.sub; /* 로고의 두 번째 색 — 팔레트의 강조 2 · 템플릿의 두 번째 색 계열이 된다 */
        /* 앞서 고른 색이 남아 있으면 기준 색을 바꿔도 화면이 그대로다:
           컬러 모음 · 사진 원본 색(direct)은 기준 색을 안 보고, 강조색 직접 지정은 그 값이 이기고, 미세 조정은 색상을 비튼다 */
        state.mapMode = 'auto';
        if (typeof syncExtractUI === 'function') syncExtractUI('auto');
        if (typeof resetAdjust === 'function') resetAdjust();
        if (state.overrides) {
          delete state.overrides['point/main'];
          delete state.overrides['point/sub'];
        }
        const s = document.getElementById('seed'),
          h = document.getElementById('hex');
        if (s) s.value = t.seed;
        if (h) h.value = t.seed.toUpperCase();
        if (typeof setSource === 'function') setSource('seed');
        apply();
        /* 템플릿 시안의 헤더 로고(기본은 WEMB Studio 로고)도 업로드한 로고로 바꾼다 */
        try {
          TPLLOGO.setOn(true);
          TPLLOGO.apply();
        } catch (e2) {}
        say('로고 색을 적용했어요 — 기준 색 ' + t.seed.toUpperCase() + (t.sub ? ' · 강조 2 ' + t.sub.toUpperCase() : '') + '.', 'ok');
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
  /* 프로젝트명 — PRD에서 저장한 값(wemb-prd.site)을 우선, 없으면 현재 프로젝트 카드 이름. 편집 불가. */
  const readProjectName = () => {
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
    return pname;
  };
  /* 새 프로젝트는 PRD 와 스튜디오가 같은 페이지라, 열 때 한 번 읽어서는 PRD 에서 정한 이름이 안 들어온다
     (칸은 잠겨 있고 머리말엔 '프로젝트'). PRD 를 저장할 때마다 guide.js 가 이 함수를 부른다. */
  const refreshProjectName = () => {
    const pname = readProjectName();
    if (bn && bn.value !== pname) {
      bn.value = pname;
      bn.dispatchEvent(new Event('input', { bubbles: true }));   /* 상단 바 프로젝트명(chrome.js)이 따라온다 */
    }
    setBrandName(pname);
    try { if (window.__meetingSyncCustomer) window.__meetingSyncCustomer(); } catch (e) {}
  };
  window.__refreshProjectName = refreshProjectName;
  try {
    /* 프로젝트 로고가 있으면 이 화면도 그 로고로(로고를 올린 뒤에 추가한 화면) */
    try {
      const P = window.WEMB && WEMB.projects;
      const gl = P && P.groupLogo(P.currentGroupId());
      if (gl && localStorage.getItem(LS.logo) !== gl) { localStorage.setItem(LS.logo, gl); TPLLOGO.setOn(true); }
      /* 예전에 올려 둔 로고 — 그때는 올려도 시안에 안 붙었다. 다시 올리지 않아도 시안 · 프로젝트에 쓴다 */
      const own = localStorage.getItem(LS.logo);
      if (own && !gl) { TPLLOGO.setOn(true); if (P) P.setGroupLogo(P.currentGroupId(), own); }
    } catch (e) {}
    const l = localStorage.getItem(LS.logo);
    if (l) setLogo(l);
    const pname = readProjectName();
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
