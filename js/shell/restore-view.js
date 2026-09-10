/* ── 새로고침 시 작업 화면 복원 ── */

/* ── 새로고침 복원 ──
   새로고침 직전에 '작성 중이던 화면'(PRD·기능명세서·유저플로우·와이어프레임·스튜디오)이었다면
   런처(스튜디오 홈)로 튕기지 않고 그 화면을 그대로 다시 연다.
   스튜디오 홈(런처)에 있었거나 기록이 없으면 기존대로 런처를 유지한다. */
(function restoreBootView() {
  var WORK = ['prd', 'spec', 'flow', 'wireframe', 'wire'];
  var homeEl = document.getElementById('flowHome');
  if (WORK.indexOf(__bootView) >= 0) {
    if (__bootView === 'wire') {
      /* 스튜디오 배경은 이미 초기화(테마·레이아웃·수정 내용)로 복원돼 런처 뒤에 준비돼 있다.
         enterStudio를 다시 부르면 레이아웃 프리셋이 사용자의 수동 편집을 덮을 수 있으므로,
         런처만 걷어 이미 준비된 스튜디오를 드러내고 단계 잠금 해제·내비 반영만 한다. */
      if (homeEl) homeEl.classList.remove('show');
      try { if (window.__wembStep) window.__wembStep.advance(4); } catch (e) {}
      try { if (window.__setStudioNav && typeof window.__WEMBFlowMenu === 'function') window.__setStudioNav(window.__WEMBFlowMenu()); } catch (e) {}
      if (window.__setPage) window.__setPage('wire');
      /* 저장된 화면을 다시 열 때도 옵션창을 '대시보드 편집 → 콘텐츠 추가'로 —
         '패널편집' 버튼이 바로 보여야 카드(위젯)를 끌어 옮길 수 있다. */
      try { if (window.__showSection) window.__showSection('dash-panels'); } catch (e) {}
    } else {
      if (homeEl) homeEl.classList.remove('show');
      /* 저장된 화면이 아직 잠긴 단계면(예: 진행 기록이 초기화된 뒤) 그 탭을 복원하면
         '현재 위치'가 잠긴 탭을 가리켜 버린다. 열려 있는 마지막 단계로 되돌린다. */
      var lvl = window.__wembStep ? window.__wembStep.level() : 0;
      var want = WORK.indexOf(__bootView);
      if (window.__setPage) window.__setPage(WORK[Math.min(want, lvl)]);
    }
  } else if (homeEl && homeEl.classList.contains('show')) {
    /* 런처(스튜디오 홈)에 있던 상태 — 초기 setPage('wire')가 덮어쓴 기록을 'home'으로 되돌려
       다음 새로고침에도 홈을 유지한다.
       그 setPage('wire')는 상단 탭의 '현재 위치'까지 스튜디오(=대개 잠긴 탭)로 옮겨 놓는다.
       런처 뒤에 남는 표시가 거짓이 되지 않게 열려 있는 첫 단계로 되돌린다. */
    try { localStorage.setItem('wemb-view', 'home'); } catch (e) {}
    try {
      var lv = window.__wembStep ? window.__wembStep.level() : 0;
      if (window.__setPage) window.__setPage(WORK[Math.min(0, lv)] || 'prd', { noHistory: true });
      localStorage.setItem('wemb-view', 'home');
    } catch (e) {}
  }
})();
