/* 라이트에서 선(링 ::after · border)과 면을 역할별로 모은다. node pw.js lt-lines.js <page> */
async (page, args) => {
  const pg = args[0] || 'main';
  await page.goto('http://localhost:5610/src/bems/' + pg + '.html?live=0&t=light&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const out = {};
    document.querySelectorAll('.bem-root [data-name], .bef-root [data-name]').forEach((e) => {
      const a = getComputedStyle(e, '::after');
      const c = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      if (!r.width) return;
      const ring = a.content !== 'none' && parseFloat(a.borderTopWidth) > 0 ? a.borderTopWidth + ' ' + a.borderTopColor : '';
      const sh = c.boxShadow !== 'none' ? c.boxShadow.slice(0, 70) : '';
      const bg = (c.backgroundImage !== 'none' ? 'G:' + c.backgroundImage.slice(0, 90) : '') + (c.backgroundColor !== 'rgba(0, 0, 0, 0)' ? ' C:' + c.backgroundColor : '');
      if (!ring && !bg && !sh) return;
      const k = e.getAttribute('data-name');
      const key = k + ' | ' + Math.round(r.width) + 'x' + Math.round(r.height);
      if (!out[key]) out[key] = { n: 0, ring, bg, sh, id: e.getAttribute('data-node-id') };
      out[key].n++;
    });
    return Object.entries(out).map(([k, v]) => v.n + ' ' + k + ' #' + v.id + ' || ' + v.ring + ' || ' + v.bg + ' || ' + v.sh).sort();
  });
}
