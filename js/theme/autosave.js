/* ── 작업 중 테마 자동 저장 ── */

/* (1-b) 작업 중 테마 자동 저장/복원 — 새로고침·재접속해도 색 작업이 유지되도록 */
const CUR_KEY = 'wemb-current-theme';
function persistCurrentTheme(t) {
  try {
    localStorage.setItem(CUR_KEY, JSON.stringify(t || captureTheme()));
  } catch (e) {
    storageWarn();
  }
}
/* 저장 실패(용량 초과·시크릿 모드)를 사용자에게 알림 — 세션당 한 번만 */
let storageWarned = false;
function storageWarn() {
  if (storageWarned) return;
  storageWarned = true;
  toast('브라우저 저장 공간에 저장하지 못했어요 — 시크릿 모드이거나 공간이 부족해요. 저장·비교의 <b>백업(파일로 저장)</b>을 이용하세요.', { type: 'err', dur: 7000 });
}
function restoreCurrentTheme() {
  let raw = null;
  try {
    raw = localStorage.getItem(CUR_KEY);
  } catch (e) {}
  if (!raw) return false;
  try {
    restoreTheme(JSON.parse(raw));
    return true;
  } catch (e) {
    return false;
  }
}
