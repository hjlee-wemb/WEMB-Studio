/* ── 확인 대화상자 ── */

/* ---------- 확인 대화상자 ----------
   window.confirm() 대체. Promise<boolean> 을 준다.
   파괴적 동작에서는 초기 초점을 '취소'에 두어, Enter 한 번으로 영구 삭제가 일어나지 않게 한다.
   (모달 배경 잠금·포커스 트랩·복귀는 initFocusTrap 이 askModal 을 알고 있어 자동으로 처리한다) */
function askConfirm(opts) {
  const o = opts || {};
  const el = document.getElementById('askModal');
  if (!el) return Promise.resolve(window.confirm(o.title || '계속할까요?'));
  const t = document.getElementById('askTitle');
  const b = document.getElementById('askBody');
  const yes = document.getElementById('askYes');
  const no = document.getElementById('askNo');
  t.textContent = o.title || '계속할까요?';
  b.innerHTML =
    (o.body || '') +
    (o.irreversible
      ? '<div class="ask-warn"><svg viewBox="0 0 24 24"><path d="M12 9v5"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><span>되돌릴 수 없어요</span></div>'
      : '');
  yes.textContent = o.confirmLabel || '삭제';
  yes.classList.toggle('danger', o.danger !== false);
  /* 공용 포커스 트랩의 복귀 경로에 기대지 않고, 이 대화상자는 스스로 트리거를 기억한다.
     파괴적 동작을 확인하고 돌아왔을 때 초점이 <body> 로 떨어지면 키보드 사용자는
     방금 무엇을 취소했는지 알 수 없는 자리에서 다시 시작해야 한다. */
  const opener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
  el.hidden = false;
  return new Promise((resolve) => {
    const backToOpener = () => {
      const ok = opener && !opener.hidden && opener.getClientRects().length > 0;
      const t = ok ? opener : document.querySelector('.sidepanel, .main, .lc-grid');
      if (!t) return;
      if (t !== opener && !t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      [0, 120].forEach((ms) => setTimeout(() => {
        if (document.activeElement === t) return;
        try { t.focus({ preventScroll: true }); } catch (e) {}
      }, ms));
    };
    const done = (v) => {
      el.hidden = true;
      backToOpener();
      yes.onclick = no.onclick = el.onclick = null;
      document.removeEventListener('keydown', onKey, true);
      resolve(v);
    };
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); }
    }
    yes.onclick = () => done(true);
    no.onclick = () => done(false);
    el.onclick = (e) => { if (e.target === el) done(false); }; /* 배경 클릭 = 취소 */
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => no.focus(), 40); /* 안전한 쪽에 초점 */
  });
}
window.__askConfirm = askConfirm;
