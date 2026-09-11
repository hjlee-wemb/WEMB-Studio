/* ── 빠른 가이드 · 스포이드 ── */

/* index3 — '빠른 가이드' 프로모 카드도 같은 온보딩을 엶 */
document.getElementById('promoTour').onclick = () => {
  if (typeof window.__showOnboarding === 'function') window.__showOnboarding();
};

/* (4-b) 스포이드(EyeDropper) — 지원 브라우저에서만 버튼 노출 */
(function initEyeDropper() {
  const btn = document.getElementById('seedPick');
  if (!btn || !window.EyeDropper) return;
  btn.style.display = '';
  btn.addEventListener('click', async () => {
    try {
      const res = await new EyeDropper().open();
      const hex = (res.sRGBHex || '').toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(hex)) return;
      state.seed = hex;
      state.subHex = null;
      state.mapMode = 'auto';
      setSource('seed');
      apply();
      commitHistory();
      toast(`화면에서 <b>${hex}</b> 색을 가져왔어요.`, { type: 'ok' });
    } catch (e) {
      /* 사용자가 취소(Esc) — 무시 */
    }
  });
})();
