/* Playwright filename — 화면마다 글자 노드의 위치 · 크기 · 소속을 재서 text-rects.json 에 저장한다(font-fit.js 용). */
async (page) => {
  const P = [["main","1-105"],["main-menu","1-199"],["main-select","1-298"],["main-popup","1-393"],["search","1-1890"],["search-detail","1-2550"],["preview","1-7737"],["preview-popup","1-9189"],["register","1-3119"],["equipment","1-2787"],["help","1-2950"],["checkin","1-3909"],["cctv","1-3471"],["desk","1-3738"],["desk-write","1-3648"],["desk-detail","1-3597"],["total-search","1-6530"],["total-result","1-6934"],["login","1-73"]];
  const H = { checkin: 1174, 'total-result': 1576 };
  const all = {};
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: H[pg] || 1080 });
    await page.goto('http://localhost:5544/src/drawing/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    all[key] = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('p,span').forEach((el) => {
        if (el.children.length && el.tagName === 'P' && el.querySelector('span')) return;
        const tx = (el.textContent || '').trim(); if (!tx) return;
        const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect();
        if (b.width < 8 || b.height < 6) return;
        const cs = getComputedStyle(el);
        let holder = el; while (holder && !holder.getAttribute('data-node-id')) holder = holder.parentElement;
        const clip = (() => { let p = el.parentElement; while (p && p.tagName !== 'BODY') { const s = getComputedStyle(p); if (s.overflow !== 'visible') { const q = p.getBoundingClientRect(); return Math.round(q.right); } p = p.parentElement; } return 1920; })();
        const named = (() => { let p = holder; while (p) { const n = p.getAttribute('data-name'); if (n) return n.replace(/\/.*$/, ''); p = p.parentElement; } return ''; })();
        out.push({ id: holder && holder.getAttribute('data-node-id'), t: tx.slice(0, 24), x: b.left, y: b.top, w: b.width, h: b.height, fs: parseFloat(cs.fontSize), ws: cs.fontWeight, a: cs.textAlign, n: named, clip });
      });
      return out;
    });
  }
  await page.evaluate((body) => fetch('/__save?f=text-rects.json', { method: 'POST', body }), JSON.stringify(all));
  return Object.keys(all).map((k) => k + ':' + all[k].length).join(' ');
}
