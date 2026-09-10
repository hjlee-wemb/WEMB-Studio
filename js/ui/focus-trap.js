/* ── 모달 포커스 트랩 ── */

/* (6-b) 모달 포커스 트랩 + 닫을 때 원래 포커스로 복귀
   ------------------------------------------------------------------
   모달을 여닫는 방식이 두 가지다 — .show 클래스(온보딩·내보내기 계열)와
   hidden 속성(PRD 위저드·기능 상세). 어느 쪽이든 '보이면 열린 것'으로 판정해
   한 구현으로 전부 덮는다. 빠뜨리면 그 모달에서 Tab이 배경으로 새어나간다. */
(function initFocusTrap() {
  const MODALS = [
    'onbd', 'exModal', 'abModal', 'ctModal', 'csModal', 'coach',
    /* 아래 다섯은 트랩 밖에 있었다. prdWiz 는 신규 사용자가 반드시 지나는 관문이다. */
    'prdWiz', 'specModal', 'npModal', 'flowLayout', 'wfModal', 'askModal',
  ];
  const SEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const els = MODALS.map((id) => document.getElementById(id)).filter(Boolean);
  const isOpen = (el) => !el.hidden && (el.classList.contains('show') || el.getClientRects().length > 0);
  /* 뒤에 열린 모달이 우선(배열 뒷쪽이 나중에 뜬 계열) — 겹칠 때 가장 위를 잡는다 */
  const topOpen = () => {
    let top = null;
    for (const el of els) if (isOpen(el)) top = el;
    return top;
  };
  /* 배경 잠금 — 모달의 조상 사슬만 남기고 형제들을 inert 로 만든다.
     #npModal 처럼 .app 안에 있는 모달도 있어서 '앱 전체 inert'는 쓸 수 없다. */
  let inerted = [];
  function lockBg(modal) {
    unlockBg();
    for (let n = modal; n && n !== document.body; n = n.parentElement) {
      for (const sib of n.parentElement ? n.parentElement.children : []) {
        if (sib === n || sib.inert) continue;
        if (sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE') continue;
        sib.inert = true;
        inerted.push(sib);
      }
    }
  }
  function unlockBg() {
    inerted.forEach((el) => { el.inert = false; });
    inerted = [];
  }
  const focusables = (el) => [...el.querySelectorAll(SEL)].filter((e) => e.offsetParent !== null || e.getClientRects().length);
  let lastOutside = null,
    returnTo = null,
    wasOpen = false;
  /* 트리거 요소를 '다시 찾을 수 있는 형태'로 기억한다.
     요소 참조만 들고 있으면, 모달이 닫히면서 그 목록이 재렌더될 때(런처의 #lcNew 등)
     참조가 DOM 에서 사라지고 복귀가 조용히 스킵돼 초점이 <body> 로 떨어졌다. */
  function describe(el) {
    if (!el) return null;
    const d = { el };
    if (el.id) d.sel = '#' + CSS.escape(el.id);
    else if (el.dataset && el.dataset.act) d.sel = '[data-act="' + el.dataset.act + '"]';
    else if (el.dataset && el.dataset.rail) d.sel = '[data-rail="' + el.dataset.rail + '"]';
    else if (el.className && typeof el.className === 'string') {
      const c = el.className.trim().split(/\s+/).filter(Boolean).map((x) => '.' + CSS.escape(x)).join('');
      if (c) d.sel = el.tagName.toLowerCase() + c;
    }
    return d;
  }
  /* 원래 요소가 살아 있으면 그것, 아니면 같은 셀렉터로 다시 찾은 것,
     그것도 없으면 그 자리를 대신할 컨테이너에 초점을 둔다 — 어떤 경우에도 <body> 로 떨어뜨리지 않는다. */
  /* 후보가 DOM 에 있어도 '보이지 않으면' focus() 가 조용히 무시된다 —
     런처의 #lcNew 처럼 모달을 연 뒤 감춰지는 트리거가 그렇다.
     그때는 초점이 닫힌 모달의 버튼에 남아 다음 Tab 이 어디서 출발할지 알 수 없게 된다. */
  const visible = (el) => !!el && !el.hidden && el.getClientRects().length > 0;
  function restoreFocus(d) {
    if (!d) return;
    /* 대상은 '초점을 옮기는 순간'에 정한다. 모달을 닫으면 화면이 함께 바뀌는 경우가 있어
       (런처가 사라지고 스튜디오가 드러남) 닫히는 시점에 고른 요소가 곧바로 사라질 수 있다.
       그러면 focus() 가 무시되고 초점이 <body> 로 떨어진다. */
    const pick = () => {
      if (visible(d.el)) return d.el;
      if (d.sel) { try { const c = document.querySelector(d.sel); if (visible(c)) return c; } catch (e) {} }
      /* 트리거가 사라졌으면 그 자리를 대신할 영역으로. 오래 남는 것부터 고른다. */
      const alt = [...document.querySelectorAll('.sidepanel, .main, .lc-grid')].find(visible);
      if (alt && !alt.hasAttribute('tabindex')) alt.setAttribute('tabindex', '-1');
      return alt || null;
    };
    /* 모달이 닫히는 데 애니메이션 시간이 걸리고(실측 약 200ms), 그 사이 런처가 사라지며
       화면이 통째로 바뀐다. 그 전에 고른 대상은 곧 사라져 focus() 가 무시된다.
       → 전환 전·중·후 세 시점에서 시도하고, 초점이 제자리를 찾으면 나머지는 아무것도 하지 않는다. */
    let done = false;
    const go = () => {
      if (done) return;
      const t = pick();
      if (!t) return;                       /* 전환 중이라 아직 아무것도 안 보이면 다음 시도에 맡긴다 */
      if (document.activeElement === t) { done = true; return; }
      try { t.focus({ preventScroll: true }); } catch (e) { try { t.focus(); } catch (e2) {} }
      if (document.activeElement === t) done = true;
    };
    [0, 160, 380].forEach((ms) => setTimeout(go, ms));
  }
  /* 모달 밖에 있을 때 마지막으로 포커스/클릭한 요소 기억 (body·모달 내부 제외).
     클릭으로 여는 경우 focus 이벤트가 누락돼도 pointerdown으로 여는 버튼을 확실히 잡음 */
  document.addEventListener('focusin', (e) => {
    if (topOpen() || e.target === document.body) return;
    lastOutside = e.target;
  });
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (topOpen()) return;
      const t = e.target.closest && e.target.closest('button,a[href],[tabindex]:not([tabindex="-1"])');
      if (t) lastOutside = t;
    },
    true
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Tab') return;
      const m = topOpen();
      if (!m) return;
      const f = focusables(m);
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (!m.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    true
  );
  let curOpen = null;
  const mo = new MutationObserver(() => {
    const m = topOpen();
    if (m === curOpen) return;
    curOpen = m;
    if (m && !wasOpen) {
      /* 방금 열림 — 복귀 대상(연 버튼)을 고정하고 모달 안으로 포커스 이동 */
      wasOpen = true;
      returnTo = describe(lastOutside);
      lockBg(m);
      if (!m.contains(document.activeElement)) {
        const f = focusables(m);
        if (f.length) setTimeout(() => f[0].focus(), 30);
      }
    } else if (m && wasOpen) {
      /* 모달이 겹쳐 있다 — 잠금 대상을 지금 맨 위 모달 기준으로 다시 계산한다. */
      lockBg(m);
      /* 위에 있던 모달이 닫혀 아래 모달이 드러난 경우, 초점은 방금 사라진 요소에 남아
         <body> 로 떨어진다. 드러난 모달 안으로 다시 넣어 준다. */
      if (!m.contains(document.activeElement)) {
        const f = focusables(m);
        if (f.length) setTimeout(() => { if (!m.contains(document.activeElement)) f[0].focus(); }, 30);
      }
    } else if (!m && wasOpen) {
      /* 방금 닫힘 — 배경 잠금 해제 + 원래 포커스로 복귀 */
      wasOpen = false;
      unlockBg();
      restoreFocus(returnTo);
    }
  });
  /* .show 토글과 hidden 속성 양쪽을 본다. style 은 display 로 여닫는 경우 대비. */
  els.forEach((el) => mo.observe(el, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] }));
})();
