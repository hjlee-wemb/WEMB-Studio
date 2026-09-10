/* ── 테마 만들기 단계 흐름 ── */

/* ── 스텝별 자동 유도 ──
   처음엔 1단계(화면 정하기)만 열려 있고, 각 단계의 '완료' 동작을 하면 다음 단계가
   자동으로 펼쳐지며 사용자를 다음 할 일로 이끈다. 한 전환당 한 번만(연타·재조작에 안 튐).
   '완료' 신호: 1→화면 선택 · 2→색 스텝 첫 조작 · 3→검증표/시트 열기 · 4→테마 저장. */
function initStepFlow() {
  const openStep = (id) => {
    const card = document.getElementById(id);
    if (!card || card.open) return;
    if (typeof card.__setOpen === 'function') card.__setOpen(true);
    else card.open = true;
    setTimeout(() => card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80);
  };
  const once = {};
  const advance = (key, nextId) => {
    if (once[key]) return;
    once[key] = true;
    openStep(nextId);
  };
  /* 1 → 2 : 화면 종류를 고르면 (기본값 재선택 포함) */
  document.getElementById('screen')?.addEventListener('click', (e) => {
    if (!e.isTrusted) return; /* 실제 클릭만 — 초기 복원 등 프로그램적 동작엔 반응 안 함 */
    const b = e.target.closest('button[data-s]');
    if (!b || b.disabled) return;
    advance('s1', 'stepColor');
  });
  /* 색 정하기 내부 유도: 버전 → 밝기 → 색 고르기 순으로 옵션을 잠금 해제한다.
     메뉴 이름·구성은 처음부터 보이고(.cgate.locked), 순서대로 옵션만 열린다. */
  const reveal = (id) => {
    const el = document.getElementById(id);
    if (el && el.classList.contains('locked')) {
      el.classList.remove('locked');
      setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    }
  };
  document.getElementById('version')?.addEventListener('click', (e) => {
    if (e.isTrusted && e.target.closest('button')) reveal('gateMode');
  });
  document.getElementById('mode')?.addEventListener('click', (e) => {
    if (e.isTrusted && e.target.closest('button')) reveal('gateColor');
  });
  /* 2 → 3 : 색 고르기(gateColor) 안에서 실제로 색을 조작하면 다음 스텝(검증)이 열린다 — 도움말 배지 제외 */
  const colorGate = document.getElementById('gateColor');
  const on2 = (e) => {
    if (!e.isTrusted || e.target.closest('.info')) return;
    advance('s2', 'stepVerify');
  };
  colorGate?.addEventListener('change', on2);
  colorGate?.addEventListener('click', on2);
  /* 3 → 4 : 검증표 또는 컴포넌트 시트를 열면 */
  ['contrastOpen', 'sheetOpen'].forEach((id) =>
    document.getElementById(id)?.addEventListener('click', (e) => {
      if (e.isTrusted) advance('s3', 'stepSave');
    }),
  );
  /* 4 → 5 : 테마를 저장하면 */
  document.getElementById('snapSave')?.addEventListener('click', (e) => {
    if (e.isTrusted) advance('s4', 'stepExport');
  });
  /* 변경 히스토리 — '히스토리 보기' 버튼으로 타임라인을 펼치고 접는다 */
  const histToggle = document.getElementById('histToggle');
  const histWrap = document.getElementById('histWrap');
  if (histToggle && histWrap) {
    histToggle.addEventListener('click', () => {
      const open = histWrap.classList.toggle('open');
      histToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      const lbl = histToggle.querySelector('.lbl');
      if (lbl) lbl.textContent = open ? '히스토리 숨기기' : '히스토리 보기';
    });
  }
}
