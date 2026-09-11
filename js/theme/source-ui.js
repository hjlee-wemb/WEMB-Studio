/* ── 실시간 대비 경고 · 색 소스 세그먼트 ── */

/* (1) 실시간 대비 경고 — 검증표(contrastRows)와 동일한 기준으로 자동 판정 */
function updateContrastWarn() {
  /* 색이 바뀔 때마다 반드시 지나가는 길목이라, 도착지 안내 카드의 숫자도 여기서 같이 갱신한다.
     (setOverride·apply 양쪽 모두 이 함수를 부르므로 훅을 한 곳에만 두면 된다) */
  /* 도착지 안내 카드 숫자만 갱신한다. 인라인 대비 경고/통과 표시는 제거됨. */
  renderRoleNote();
}
/* 인라인 대비 경고(cWarn/cOk) 및 자동 보정·자세히 보기 버튼은 제거됨.
   대비 검증·자동 보정 기능은 '대비비 검증표' 모달(ctFix)에서 계속 쓸 수 있다. */

/* (2) 색 소스 세그먼트 — 활성 표시 + 클릭 시 해당 방식으로 전환/펼침 */
function updateSourceSeg() {
  const view = state.sourceView || state.source || 'seed';
  document.querySelectorAll('#srcSeg [data-srcseg]').forEach((b) => b.classList.toggle('on', b.dataset.srcseg === view));
}
document.querySelectorAll('#srcSeg [data-srcseg]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.srcseg;
    state.sourceView = key; /* 이 방식의 메뉴만 보이게 */
    if (key === 'seed') {
      setSource('seed'); /* 직접색은 바로 활성화(적용) */
      apply();
    } else {
      /* 사진·추천은 패널만 먼저 열어 안내 — 이미지 업로드/항목 선택 시 setSource가 실제 적용 */
      refreshSourceUI();
    }
  });
});
