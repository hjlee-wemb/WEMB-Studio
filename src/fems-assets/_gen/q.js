async (page, args) => {
  await page.goto('http://localhost:5580/src/fems/' + args[0] + '.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate((sels) => sels.split('|').map((s) => { const e = document.querySelector(s); if (!e) return s + ' -> none'; const r = e.getBoundingClientRect(); return s + ' -> ' + e.getAttribute('data-name') + ' #' + e.getAttribute('data-node-id') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + getComputedStyle(e).display; }), args[1]);
}
