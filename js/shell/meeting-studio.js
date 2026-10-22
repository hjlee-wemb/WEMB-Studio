/* ── 작업공간의 회의 모드 — 화면 · 상단 바 · 옵션 패널의 고객사 이름을 가린다(js/core/meeting.js) ──
   켜고 끄는 곳은 홈의 템플릿 갤러리와 발표 화면이다. 여기서는 설정을 따라 가리기만 한다.
   글자를 고치는 중(패널 편집 · 내용 수정)에는 가리지 않는다 — 가린 글자가 시안에 저장되지 않게. */
(function meetingStudio() {
  const M = WEMB.meeting;
  if (!M) return;
  const main = document.querySelector('.main');
  const stage = document.getElementById('dtStage');
  const editing = () =>
    !!((main && (main.classList.contains('editing') || main.classList.contains('content-editing'))) || (stage && stage.classList.contains('dt-content-editing')));
  M.watch(document.body, editing);
})();
