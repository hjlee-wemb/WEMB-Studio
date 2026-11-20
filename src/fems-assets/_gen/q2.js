async (page, args) => {
  await page.goto('http://localhost:5580/src/fems/' + args[0] + '.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate((files) => files.split(',').map((f) => { const im = [...document.querySelectorAll('img')].find((i) => (i.getAttribute('src') || '').endsWith('/' + f)); if (!im) return f + ' none'; const r = im.getBoundingClientRect(); const ps = [...document.querySelectorAll('p')].map((p) => ({ t: p.textContent.trim(), r: p.getBoundingClientRect() })).filter((p) => p.t && Math.abs(p.r.left + p.r.width / 2 - (r.left + r.width / 2)) < 60 && p.r.top < r.top + 120 && p.r.bottom > r.top - 80).map((p) => p.t).slice(0, 3); return f + ' @' + Math.round(r.left) + ',' + Math.round(r.top) + ' near ' + ps.join('|'); }), args[1]);
}
