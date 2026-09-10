/* ── 전체 / 색 초기화 ── */

/* ---------- 전체 옵션 초기화 (로고 옆 ↻ 버튼 · 하단 버튼 공용) ---------- */
async function doResetAll() {
  const ok = await askConfirm({
    title: '모든 설정을 처음 상태로 되돌릴까요?',
    /* .ask-b 가 white-space:pre-line 이라 템플릿 리터럴의 줄바꿈이 그대로 살아난다 */
    body: `<b>초기화되는 것</b>
· 색상 · 기준 색 · 배색 방식 · 미세 조정
· 화면 종류 · 패널 모서리 둥글기
· 대시보드 배치 · 내용 · 차트 종류
· 되돌리기 기록

<b>그대로 유지되는 것</b>
· 이름 붙여 저장한 테마 스냅샷`,
    confirmLabel: '초기화',
    irreversible: true,
  });
  if (!ok) return;
  try {
    /* 개별 키를 일일이 적으면 새 옵션이 생길 때마다 빠지기 쉽다(색·페이지 키가 그렇게 누락됐었다).
       → wemb-* 를 통째로 지우되, '디자인'이 아닌 것만 남긴다:
         · wemb-theme-snapshots  이름 붙여 저장한 테마(사용자 자산)
         · wemb-onboarded        둘러보기 완료 여부(리셋마다 다시 뜨면 성가심)
         · wemb-previewhint       편집 가능 힌트 닫음 여부 */
    const KEEP = new Set(['wemb-theme-snapshots', 'wemb-onboarded', 'wemb-previewhint', 'wemb-skx-hinted']);
    Object.keys(localStorage)
      .filter((k) => k.startsWith('wemb-') && !KEEP.has(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
  /* 공유 URL(#t=...)이 남아 있으면 새로고침 시 다시 적용되므로 해시 제거 */
  try {
    history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {}
  location.reload();
}
/* ---------- 색 정하기만 초기화 (로고 옆 ↻ 버튼 전용) ----------
   전체 초기화와 달리 대시보드 배치·내용, 화면 종류, 모서리 둥글기, 되돌리기 기록,
   저장한 스냅샷은 건드리지 않고 '색 정하기' 단계(버전·밝기·기준색·배색·소스·미세조정·
   개별 색 지정)만 기본값으로 되돌린다. */
async function doResetColor() {
  const ok = await askConfirm({
    title: '‘색 정하기’를 처음 상태로 되돌릴까요?',
    body: `<b>초기화되는 것</b>
· 기준 색 · 배색 방식 · 색 소스 · 미세 조정
· 버전(Flat) · 화면 밝기(Dark) · 개별 색 지정

<b>그대로 유지되는 것</b>
· 대시보드 배치 · 내용 · 화면 종류 · 모서리 둥글기 · 저장한 스냅샷`,
    confirmLabel: '초기화',
    irreversible: true,
  });
  if (!ok) return;
  const def = {
    seed: '#4f6ce0',
    harmony: 'analog',
    mode: 'dark',
    subHex: null,
    mapMode: 'auto',
    imgCols: null,
    adjust: { h: 0, s: 0, l: 0 },
    source: 'seed',
    overrides: {},
    version: 'flat',
    radius: state.radius /* 모서리 둥글기는 색과 무관 → 현재 값 유지 */,
  };
  restoreTheme(def);
  commitHistory(); /* 현재 작업 자동 저장 + 되돌리기 기록(색 초기화도 되돌릴 수 있게) */
  if (typeof toast === 'function') toast('색 정하기를 초기화했어요.', { type: 'ok' });
}
/* 'newProject'는 initFlow가 런처 열기로 다시 배선한다(여기선 초기화만) */
window.__wembResetAll = doResetAll; /* 레일 메뉴 '전체 옵션 초기화'가 부른다(하단 버튼은 제거됨) */
const quickResetBtn = document.getElementById('quickReset');
if (quickResetBtn) quickResetBtn.onclick = doResetColor; /* 로고 옆 버튼 = 색 정하기 초기화 */
