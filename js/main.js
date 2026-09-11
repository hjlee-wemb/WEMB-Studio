/* ── 초기화 순서 — 저장 상태 복원 후 각 모듈 init ── */

/* ---------- 초기화 ---------- */
applyScreen(); /* 저장된 화면 종류(대시보드 / Digital Twin) 복원 */
/* 한진 템플릿(디지털 트윈)로 열려 있었으면 새로고침 후에도 그 페이지를 재현 */
try {
  const __tdt = localStorage.getItem('wemb-tpl-dt');
  if (state.screen === 'dt') {
    if (__tdt === 'hana' && typeof applyHanaDT === 'function') {
      /* 이 화면이 15장 중 어느 것인지는 열려 있는 프로젝트의 tplScene 이 정답 */
      applyHanaDT(window.__hanaSceneOf ? window.__hanaSceneOf() : localStorage.getItem('wemb-hana-screen'));
    }
    else if (__tdt === 'hanjin' && typeof applyHanjinDT === 'function') {
      /* 이 화면이 세 장 중 어느 것인지는 전역 키가 아니라 열려 있는 프로젝트의 tplScene 이 정답 */
      const __hj = window.__hanjinSceneOf ? window.__hanjinSceneOf() : localStorage.getItem('wemb-hanjin-screen');
      applyHanjinDT(__hj);
    }
    else if (__tdt === 'skhynix-hub') {
      /* 이 화면이 '항온항습기 상세' 장면이면 그 시안을 그린다.
         기준은 전역 키가 아니라 지금 열려 있는 화면(프로젝트)의 tplScene 이다. */
      const __hs = window.__hubSceneOfScreen ? window.__hubSceneOfScreen() : localStorage.getItem('wemb-hub-screen');
      try { localStorage.setItem('wemb-hub-screen', __hs === 'hvac' ? 'hvac' : 'main'); } catch (e2) {}
      if (__hs === 'hvac' && typeof applySkhynixHvac === 'function') applySkhynixHvac();
      else if (typeof applySkhynixHub === 'function') applySkhynixHub();
    }
    else if (__tdt === 'skhynix' && typeof applySkhynixDT === 'function') {
      applySkhynixDT();
      /* 이 화면이 '팝업(UPS 전력 상세)' 장면이면 팝업 시안을 그린다.
         기준은 전역 키가 아니라 지금 열려 있는 화면(프로젝트)의 tplScene 이다 — 그래야
         메인 화면에서 팝업을 열어 둔 채 새로고침해도 메인 화면은 메인으로 돌아온다. */
      try {
        const __scene = window.__skxSceneOfScreen ? window.__skxSceneOfScreen() : localStorage.getItem('wemb-skx-screen');
        try { localStorage.setItem('wemb-skx-screen', __scene === 'popup' ? 'popup' : 'main'); } catch (e2) {}
        if (__scene === 'popup' && typeof applySkhynixPopup === 'function') {
          setTimeout(() => { try { window.__openSkxScreen && window.__openSkxScreen('popup'); } catch (e) {} }, 300);
        }
      } catch (e) {}
    }
  }
  /* 미연결 템플릿 임시 이미지 — 화면 종류(대시보드/DT)에 맞게 오버레이 복원 */
  const __timg = localStorage.getItem('wemb-tpl-img');
  if (__timg && typeof applyImageTemplate === 'function') applyImageTemplate(__timg, state.screen);
} catch (e) {}
apply();
loadSnapshots();
renderSnapshots();
refreshABOptions();
initAB();
initExport();
initContrast();
initSheet();
initComponentCopyMode();
initStepFlow();
initBrand();
initLayoutEditor();
/* 공유 링크로 열렸으면 그 시안을, 아니면 마지막 작업 중이던 테마를 복원 (1-b) */
if (!applyShareFromURL()) restoreCurrentTheme();
/* SK하이닉스 템플릿의 기본 테마는 Dark(Figma 원본). restoreCurrentTheme가 직전 세션의
   라이트 테마를 되살릴 수 있으므로, 복원 '뒤에' 이 화면이 활성이면 다시 Dark로 맞춘다
   (테마를 늘 먼저·마지막에 깔아 준다). 이후 '화면 테마' 토글로 Light 전환은 그대로 유지. */
try {
  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'skhynix' && state.mode !== 'dark') {
    state.mode = 'dark';
    document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === 'dark'));
    if (typeof apply === 'function') apply();
  }
  /* Icheon main 시안은 반대로 Light 가 원본(Figma "Light-시안02").
     두 화면(메인 FMS Hub · 항온항습기 상세) 모두 다크 시트를 함께 만들어 두었으므로
     '화면 테마'로 자유롭게 바꿀 수 있다. 처음 열 때만 원본대로 Light 로 시작하고,
     그 뒤로는 화면별로 고른 값(wemb-skh-mode / wemb-skv-mode)을 그대로 되살린다. */
  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'skhynix-hub') {
    const __hs = window.__hubSceneOfScreen ? window.__hubSceneOfScreen() : localStorage.getItem('wemb-hub-screen');
    const __k = __hs === 'hvac' ? 'wemb-skv-mode' : 'wemb-skh-mode';
    const want = localStorage.getItem(__k) === 'dark' ? 'dark' : 'light';
    if (state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  }
  /* 한진 시안은 Dark 가 원본(Figma "Dark-시안01"). 라이트 시트를 함께 만들어 두었으므로
     '화면 테마'로 자유롭게 바꿀 수 있고, 고른 값(wemb-hanjin-mode)은 그대로 되살아난다. */
  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hana') {
    const want = localStorage.getItem('wemb-hana-mode') === 'light' ? 'light' : 'dark';
    if (state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
    }
  }
  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hanjin') {
    const want = localStorage.getItem('wemb-hanjin-mode') === 'light' ? 'light' : 'dark';
    if (state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  }
} catch (e) {}
commitHistory();
renderHistory();
