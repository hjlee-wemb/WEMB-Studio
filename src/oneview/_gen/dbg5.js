async (page) => {
  await page.setViewportSize({ width: 1216, height: 984 });
  await page.goto('http://localhost:5590/src/oneview/main.html?r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
  return await page.evaluate(() => {
    const r = document.querySelector('.ov-root'), st = r.__ov;
    const u = st.units.map((u) => u.name + ' ' + u.kind + ' ax' + (u.ax != null ? u.ax.toFixed(2) : '-') + ' ay' + (u.ay != null ? u.ay.toFixed(2) : '-') + ' els' + u.els.length + ' r' + [u.r.x, u.r.y, u.r.w, u.r.h].map(Math.round).join(','));
    const w = document.querySelector('[data-name="Widget/Infrastructure"]');
    const inner = [...w.querySelectorAll('.ov-place')].slice(0, 8).map((e) => e.getAttribute('data-name') + ' ' + getComputedStyle(e).translate);
    return { S: st.S, exW: st.exW, exH: st.exH, units: u, widgetDisplay: getComputedStyle(w).display, inner };
  });
}
