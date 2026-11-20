async (page, args) => {
  await page.goto('http://localhost:5580/src/fems/' + args[0] + '.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate((rx) => { const R = new RegExp(rx), seen = {}, out = [];
    document.querySelectorAll('[data-name]').forEach((e) => { const n = e.getAttribute('data-name'); if (!R.test(n) || seen[n]) return; seen[n] = 1;
      let b; if (getComputedStyle(e).display !== 'contents') { const r = e.getBoundingClientRect(); b = [r.width, r.height]; } else { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; e.querySelectorAll('*').forEach((c) => { if (getComputedStyle(c).display === 'contents' || c.ownerSVGElement) return; const q = c.getBoundingClientRect(); if (!q.width) return; x0 = Math.min(x0, q.left); y0 = Math.min(y0, q.top); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom); }); b = [x1 - x0, y1 - y0]; }
      const t = [...e.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean).slice(0, 3).join('/').slice(0, 40);
      out.push(n + ' #' + e.getAttribute('data-node-id') + ' ' + b.map(Math.round).join('x') + (t ? ' "' + t + '"' : '')); });
    return out; }, args[1]);
}
