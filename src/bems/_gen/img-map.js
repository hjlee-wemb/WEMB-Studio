async (page, args) => {
  const out = {};
  for (const pg of args) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=light');
    await page.waitForTimeout(1000);
    out[pg] = await page.evaluate(() => {
      const m = {};
      document.querySelectorAll('img').forEach((im) => {
        const r = im.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > 1920 || r.top > 1080) return;
        const f = im.getAttribute('src').split('/').pop().split('?')[0];
        const path = []; let e = im.parentElement; while (e && path.length < 3) { const n = e.getAttribute('data-name'); if (n) path.push(n); e = e.parentElement; }
        const k = f; (m[k] = m[k] || []).push(path.reverse().join('>') + '@' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      });
      return Object.entries(m).map(([k, v]) => k + ' ×' + v.length + ' : ' + v.slice(0, 2).join(' | '));
    });
  }
  return out;
}
