async (page, args) => {
  await page.setViewportSize({ width: 1568, height: 1032 });
  const out = {};
  for (const pg of args) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?r=' + Date.now());
    await page.waitForTimeout(1500);
    out[pg] = await page.evaluate(() => {
      const r = document.querySelector('[class*="-root"]'), st = r.__dc;
      return st.units.map(u => [u.name, u.kind, u.ax, u.ay, Math.round(u.r.x), Math.round(u.r.y), Math.round(u.r.w), Math.round(u.r.h), u.els.length].join(' '));
    });
  }
  return out;
}
