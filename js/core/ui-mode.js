/* ── 현장 모드 — 고객사 앞에서는 디자이너 · 개발자 도구를 숨긴다 ──
   설정은 이 브라우저 전체에 하나(localStorage 'wemb-ui-mode' = 'field' | 'designer')이고 프로젝트 묶음에는 들어가지 않는다
   (projects.js PROJ_GLOBAL · home.js · reset.js 의 KEEP). 켜면 <html data-field> — 숨길 것은 css/base/tokens.css 맨 끝에 모았다.
   숨기는 것: 분자 라이브러리 · 원자 변경 · 3단계 검증(대비비 · 컴포넌트 시트) · 개발자용 코드 · 팔레트 SVG · 디자인 사양서 ·
   색 테마 링크 · 컴포넌트별 코드 · 버전 표기. 왼쪽 단계 번호 · 이전/다음은 chrome.js 가 보이는 단계만으로 다시 센다.
   [data-ui-toggle="field" | "meeting"] 단추는 여기서 한꺼번에 켜고 끈다(홈 사이드바 · 작업공간 아래쪽).

   WEMB.uiMode.get() / field() / set(v) / toggle() / onChange(fn) */
(function () {
  const KEY = 'wemb-ui-mode';
  const read = () => { try { return localStorage.getItem(KEY) === 'field' ? 'field' : 'designer'; } catch (e) { return 'designer'; } };
  let cur = read();
  const subs = new Set();
  const paint = () => { if (cur === 'field') document.documentElement.dataset.field = '1'; else delete document.documentElement.dataset.field; };
  const emit = () => subs.forEach((fn) => { try { fn(cur); } catch (e) {} });
  paint();
  function set(v) {
    cur = v === 'field' ? 'field' : 'designer';
    try { localStorage.setItem(KEY, cur); } catch (e) {}
    paint(); emit();
  }
  /* 다른 탭 · 발표 화면의 iframe 도 따라 바뀐다 */
  window.addEventListener('storage', (e) => { if (e.key !== KEY) return; cur = read(); paint(); emit(); });

  window.WEMB = window.WEMB || {};
  WEMB.uiMode = {
    KEY,
    get: () => cur,
    field: () => cur === 'field',
    set,
    toggle: () => set(cur === 'field' ? 'designer' : 'field'),
    onChange: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  };

  /* 켜고 끄는 단추 — 현장 모드 · 회의 모드를 같은 모양으로 */
  function syncToggles() {
    const meetOn = !!(WEMB.meeting && WEMB.meeting.on());
    document.querySelectorAll('[data-ui-toggle]').forEach((b) => {
      const on = b.dataset.uiToggle === 'field' ? cur === 'field' : meetOn;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('on', on);
    });
  }
  function bind() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ui-toggle]');
      if (!b) return;
      if (b.dataset.uiToggle === 'field') {
        WEMB.uiMode.toggle();
        if (typeof toast === 'function') toast(cur === 'field' ? '현장 모드 — 디자이너 · 개발자 도구를 숨겼어요.' : '현장 모드를 껐어요 — 모든 도구가 보여요.', { type: 'info' });
      } else if (WEMB.meeting) {
        const on = !WEMB.meeting.on();
        WEMB.meeting.set({ on });
        if (typeof toast === 'function') toast(on ? '회의 모드 — 다른 고객사 이름을 가려요.' : '회의 모드를 껐어요.', { type: 'info' });
      }
      syncToggles();
    });
    subs.add(syncToggles);
    if (WEMB.meeting) WEMB.meeting.onChange(syncToggles);
    syncToggles();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
