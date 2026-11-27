/* 오버 전수 검사 — 마우스가 닿는 모든 단추에 실제로 마우스를 올려, 단추(또는 묶음 조각 · 자식)의 모양(필터 · 색 · 바탕 · 그림자 · 회전 · 글자 그림자)이 바뀌는지 본다.
   바뀌지 않는 것만 적는다. 실행: node pw.js hover-audit.js [장면…] */
async (page, args) => {
  const pages = args.length ? args : ['main', 'power', 'worker', 'asset', 'equipment', 'cardset', 'search', 'scenario'];
  const out = {};
  for (const pg of pages) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?r=' + Date.now());
    await page.waitForTimeout(1800);
    const targets = await page.evaluate(() => {
      const els = [...new Set([...document.querySelectorAll('.dc-click, .dc-navhit')])];
      const res = [];
      els.forEach((e, i) => {
        if (e.closest('.dc-dd') || e.closest('.dc-hid')) return;
        const parts = getComputedStyle(e).display === 'contents' ? [...e.querySelectorAll('*')].filter((x) => getComputedStyle(x).display !== 'contents') : [e];
        for (const x of parts) {
          const r = x.getBoundingClientRect(); if (r.width < 3 || r.height < 3) continue;
          const px = r.left + r.width / 2, py = r.top + r.height / 2;
          if (px < 0 || py < 0 || px > innerWidth || py > innerHeight) continue;
          const h = document.elementFromPoint(px, py);
          if (h && (h === e || e.contains(h))) { e.setAttribute('data-hv', i); res.push({ i, x: px, y: py, n: e.getAttribute('data-name') || e.textContent.trim().slice(0, 14) || e.tagName }); break; }
        }
      });
      return res;
    });
    const sig = (i) => page.evaluate((i) => {
      const e = document.querySelector('[data-hv="' + i + '"]'); if (!e) return 'gone';
      const list = [e].concat([...e.querySelectorAll('*')].slice(0, 12));
      return list.map((x) => { const c = getComputedStyle(x); return [c.filter, c.color, c.backgroundColor, c.boxShadow, c.rotate, c.textShadow, c.translate, c.opacity, c.borderColor].join('|'); }).join('#');
    }, i);
    const none = [];
    for (const t of targets) {
      await page.mouse.move(5, 1075);
      await page.waitForTimeout(260);
      const a = await sig(t.i);
      await page.mouse.move(t.x, t.y);
      await page.waitForTimeout(320);
      const b = await sig(t.i);
      if (a === b) none.push(t.n);
    }
    out[pg] = { n: targets.length, noChange: none };
  }
  return out;
}
