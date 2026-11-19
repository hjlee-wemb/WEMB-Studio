/* 화면마다 프레임 바로 아래 · 위젯 이름과 상자를 뽑는다(라이브 셀렉터 정하기용). node pw.js peek-tree.js */
async (page) => {
  const P = ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'];
  const out = {};
  for (const pg of P) {
    await page.goto('http://localhost:5590/src/oneview/' + pg + '.html?live=0&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    out[pg] = await page.evaluate(() => {
      const fr = document.querySelector('[class$="-root"] > [data-node-id]');
      const R = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(','); };
      const lines = [];
      for (const c of fr.children) {
        lines.push(c.getAttribute('data-name') + ' @' + R(c));
        for (const g of c.children) { const n = g.getAttribute('data-name'); if (n && /^(Widget|Popup|KPI|Card Row|Node Group|Zone|Event Log|Table|Body|Header|Line Chart|Legend|Column|Panel|Toolbar|Row Panel|Donut)/.test(n)) lines.push('   ' + n + ' @' + R(g)); }
      }
      const wid = [...fr.querySelectorAll('[data-name^="Widget/"],[data-name^="Popup/"],[data-name="Event Log"],[data-name="Line Chart"],[data-name="Chart"],[data-name="Donut Chart"]')].map((w) => w.getAttribute('data-name') + ' @' + R(w));
      return { top: lines, widgets: wid };
    });
  }
  return out;
}
