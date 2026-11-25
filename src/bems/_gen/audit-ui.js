/* 조작 요소 감사 — 화면마다 단추 · 셀렉트 · 입력 · 탭 · 체크 · 카드 · 줄 이름과, 가운데 점을 눌렀을 때 그 요소가 받는지(hit-test).
   실행: node pw.js audit-ui.js [장면…] */
async (page, args) => {
  const P = args.length ? args : ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'];
  const out = {};
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const pg of P) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2200);
    out[pg] = await page.evaluate(() => {
      const RX = /^(Button|Btn|Tab|Select|Dropdown|Combo|Input|Search|Field|Check|Checkbox|Radio|Toggle|Switch|Filter|Count|Page|Chip|Option|Menu|Icon Button|Nav Item|Card|Node|Legend|Item|Row|Server Cube|Network Device|Stepper|Spin|Date|Calendar)/i;
      const cnt = {};
      const bad = [];
      document.querySelectorAll('[data-name]').forEach((e) => {
        const n = e.getAttribute('data-name');
        const head = n.split('/')[0];
        if (!RX.test(n)) return;
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height || r.right < 0 || r.bottom < 0 || r.left > 1920 || r.top > 1080) return;
        const key = head + (n.includes('/') ? '/…' : '');
        cnt[key] = cnt[key] || { n: 0, miss: 0, ex: new Set(), cover: new Set() };
        cnt[key].n++;
        if (cnt[key].ex.size < 6) cnt[key].ex.add(n);
        const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (h && !e.contains(h) && !h.contains(e)) {
          cnt[key].miss++;
          let c = h; const path = []; for (let i = 0; i < 3 && c; i++) { path.push(c.getAttribute && (c.getAttribute('data-name') || c.className || c.tagName)); c = c.parentElement; }
          if (cnt[key].cover.size < 3) cnt[key].cover.add(path.join('<'));
        }
      });
      const res = {};
      Object.keys(cnt).forEach((k) => { const c = cnt[k]; res[k] = c.n + (c.miss ? ' miss ' + c.miss + ' by ' + [...c.cover].join(' | ') : '') + ' :: ' + [...c.ex].join(', '); });
      return res;
    });
  }
  return out;
}
