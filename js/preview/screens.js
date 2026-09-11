/* ── 화면 종류(대시보드 / 디지털 트윈) 전환 ── */

/* ===== 화면 종류(대시보드 / Digital Twin / 포탈) =====
   팔레트는 .main에 주입되므로 두 화면 모두 같은 변수를 물려받는다.
   여기서는 어떤 화면을 보여줄지와, 그 화면에서 쓸 수 없는 사이드바 탭만 정리한다. */
const SCREENS = {
  dash: document.querySelector('.stage'),
  dt: document.getElementById('dtStage'),
};
/* SK하이닉스 시안 화면(고정 색·형상)에는 Flat/Enterprise 버전 구분이 없으므로,
   이 화면이 활성일 때 버전 토글을 '해당없음'으로 비활성화한다(혼란 방지). */
function syncSkxControls() {
  let skx = false;
  try { const t = localStorage.getItem('wemb-tpl-dt'); skx = (state.screen === 'dt') && (t === 'skhynix' || t === 'skhynix-hub'); } catch (e) {}
  document.querySelectorAll('#version button').forEach((b) => {
    b.disabled = skx;
    b.classList.toggle('locked', skx);
    b.title = skx ? 'SK하이닉스 시안 화면에는 버전 구분이 없어요' : '';
  });
  /* '화면 테마'(dark/light)와 '색 고르기' 게이트는 원래 "버전 → 밝기 → 색" 순서로 열리는데,
     이 화면은 버전을 비활성화하므로 게이트가 영구 잠긴다 → skhynix에선 직접 열어 준다.
     (버전만 없을 뿐 색은 이 화면에서도 정상 동작해야 하므로) */
  if (skx) {
    document.getElementById('gateMode')?.classList.remove('locked');
    document.getElementById('gateColor')?.classList.remove('locked');
  }
  /* ── 'Digital Twin: SKHynix Icheon 1level'(tpl 'skhynix') = 다크 전용 ──
     Figma 원본(64:1782 · UPS 팝업 64:2504)이 다크 시안 한 벌뿐이라 라이트로 바꿀 기준이 없다.
     → 화면 테마 토글을 잠그고 '다크 전용'임을 적어 둔다. applySkhynixDT() 가 열 때마다
       모드를 dark 로 맞추므로 값 자체는 이미 고정돼 있고, 여기서는 조작만 막는다.
     (같은 SK하이닉스라도 'Dashboard: Icheon main'(skhynix-hub)은 라이트·다크 시트를 둘 다
      갖고 있으므로 해당 없음 — 그래서 skx 가 아니라 skxDarkOnly 로 따로 판정한다.) */
  let skxDarkOnly = false;
  try { skxDarkOnly = (state.screen === 'dt') && localStorage.getItem('wemb-tpl-dt') === 'skhynix'; } catch (e) {}
  document.getElementById('gateMode')?.classList.toggle('darkonly', skxDarkOnly);
  document.querySelectorAll('#mode button').forEach((b) => {
    b.disabled = skxDarkOnly;
    b.classList.toggle('locked', skxDarkOnly);
    b.title = skxDarkOnly ? '이 시안(SK하이닉스 이천 FMS)은 다크 전용이에요' : '';
  });
}
function applyScreen() {
  const s = state.screen || 'dash';
  if (window.__dashEditExit) window.__dashEditExit();
  if (window.__dtEditExit) window.__dtEditExit();
  for (const k in SCREENS) if (SCREENS[k]) SCREENS[k].hidden = k !== s;
  const main = document.querySelector('.main');
  if (main) main.setAttribute('data-screen', s);
  document.querySelectorAll('#screen button').forEach((x) => x.classList.toggle('on', x.dataset.s === s));
  /* '대시보드 편집'(배치·내용)은 대시보드 화면 전용 — 다른 화면에선 잠그고 테마 탭으로 되돌림 */
  const dashTab = document.querySelector('.sbtab[data-tab="dash"]');
  if (dashTab) {
    const lock = s !== 'dash' && s !== 'dt';
    dashTab.disabled = lock;
    dashTab.classList.toggle('locked', lock);
    dashTab.title = lock ? '대시보드 화면에서만 편집할 수 있어요' : '';
    if (lock && dashTab.classList.contains('on')) selectSidebarTab('theme');
  }
  /* 화면 만들기 — 종류에 맞춰 그리드/와이어프레임 선택 UI를 갱신한다. */
  if (window.__refreshScreenBuilder) window.__refreshScreenBuilder();
  /* 레이아웃 목록도 화면 종류(대시보드/디지털 트윈)에 맞게 다시 구성한다. */
  if (window.__syncSideLayout) window.__syncSideLayout();
  syncSkxControls(); /* SK하이닉스 화면이면 버전 토글 비활성 */
  if (window.__syncCanvas1920) window.__syncCanvas1920(); /* 1920x1080 고정 캔버스는 요청한 화면에서만 */
  if (s === 'dt' && window.__paintDtFromPrd) window.__paintDtFromPrd(); /* PRD 답변을 트윈 패널에 반영 */
  if (s === 'dt' && window.__dtRestampLog) window.__dtRestampLog(); /* 이벤트 현황 시각을 '방금'으로 */
  try {
    localStorage.setItem('wemb-screen', s);
  } catch (e) {}
}

/* ── 템플릿 시안 위에 '콘텐츠 추가' 패널이 얹힐 자리를 시안 레이어 안에 만들어 둔다 ──
   activeCols()가 '.dt-added > .cols'를 찾아 그대로 쓰므로, 여기서 미리 만들어 두면
   추가한 패널이 시안 위에 보이고 선택·글자 편집·이동이 모두 정상 동작한다. */
function ensureTplAddedLayer(host) {
  if (!host || host.querySelector(':scope > .dt-added')) return;
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  host.appendChild(added);
}
