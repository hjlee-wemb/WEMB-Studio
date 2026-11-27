/* 단추 전수 검사 — 클릭 · 오버를 붙인 모든 것(.dc-click · .dc-navhit · [data-dc-tip])의 보이는 상자 가운데에 실제로 마우스가 닿는지(elementFromPoint).
   실행: node pw.js hit-audit.js [장면…] */
async (page, args) => {
  const pages = args.length ? args : ['main', 'power', 'worker', 'asset', 'equipment', 'cardset', 'search', 'scenario'];
  const out = {};
  for (const pg of pages) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?r=' + Date.now());
    await page.waitForTimeout(1800);
    out[pg] = await page.evaluate(() => {
      const els = [...new Set([...document.querySelectorAll('.dc-click, .dc-navhit, [data-dc-tip]')])];
      const bad = [];
      let ok = 0;
      els.forEach((e) => {
        const parts = getComputedStyle(e).display === 'contents' ? [...e.querySelectorAll('*')].filter((x) => getComputedStyle(x).display !== 'contents') : [e];
        const rs = parts.map((x) => x.getBoundingClientRect()).filter((r) => r.width > 2 && r.height > 2);
        if (!rs.length) return;
        if (e.closest('.dc-dd') || getComputedStyle(e).visibility === 'hidden' || e.closest('.dc-hid')) return;
        const hitAny = rs.some((r) => {
          const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 3, r.top + 3], [r.right - 3, r.bottom - 3]];
          return pts.some(([x, y]) => { if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false; const h = document.elementFromPoint(x, y); return h && (h === e || e.contains(h)); });
        });
        if (hitAny) ok++;
        else { const r = rs[0]; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); bad.push((e.getAttribute('data-name') || e.textContent.trim().slice(0, 12) || e.tagName) + ' @' + Math.round(r.left) + ',' + Math.round(r.top) + ' ← ' + (h ? (h.getAttribute('data-name') || h.tagName) + (h.closest('[data-name]') ? ' in ' + h.closest('[data-name]').getAttribute('data-name') : '') : 'offscreen')); }
      });
      return { ok, bad };
    });
  }
  return out;
}
