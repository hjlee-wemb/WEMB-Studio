/* ── 발표 모드 부팅 — 발표 화면(present.html)이 작업공간을 iframe 안에 ?present=1 로 연다 ──
   studio.html 의 <head> 에서 js/app/session.js 바로 뒤에 돈다(세션이 주소의 화면을 연 다음).
   - <html data-present> → css/base/present.css 가 도구(상단 바 · 왼쪽 패널 · 안내 · 알림)를 숨기고 화면만 꽉 채운다.
   - 저장 잠금: 이 문서는 이제 localStorage 에 쓰지 않는다. 발표 화면은 iframe 을 바꿔 가며 화면을 넘기는데,
     앞 화면의 앱이 뒤늦게 저장하면(자동 저장 · 떠날 때 저장) 지금 열린 다른 화면의 작업 상태를 덮어쓴다.
     보여 주기만 하는 화면이므로 쓰기를 막는다(읽기는 그대로). 회의 모드 같은 설정은 바깥 발표 화면이 바꾼다. */
(function presentBoot() {
  let on = false;
  try { on = new URL(location.href).searchParams.get('present') === '1'; } catch (e) {}
  if (!on) return;
  document.documentElement.setAttribute('data-present', '');
  window.__wembPresent = true;
  let ls = null;
  try { ls = window.localStorage; } catch (e) { return; }
  const S = Storage.prototype;
  const lock = (fn) => function () { return this === ls ? undefined : fn.apply(this, arguments); };
  S.setItem = lock(S.setItem);
  S.removeItem = lock(S.removeItem);
  S.clear = lock(S.clear);
})();
