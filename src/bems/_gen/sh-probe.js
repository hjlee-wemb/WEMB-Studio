/* 라이트에서 짙은 그림자 · 빛 CSS 찾기(box-shadow · filter drop-shadow · text-shadow). node pw.js sh-probe.js */
async (page) => {
  const P = ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'];
  const seen = {};
  for (const pg of P) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    const L = await page.evaluate(() => {
      const out = [];
      const heavy = (v) => (v.match(/rgba?\([^)]*\)/g) || []).some((c) => { const p = c.match(/[\d.]+/g).map(Number); const a = p.length > 3 ? p[3] : 1; const lum = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255; return a >= 0.12 && (lum < 0.45 || a >= 0.5); });
      document.querySelectorAll('*').forEach((e) => {
        const cs = getComputedStyle(e);
        for (const k of ['boxShadow', 'filter', 'textShadow']) { const v = cs[k]; if (v && v !== 'none' && heavy(v)) out.push(k + ' ' + v.slice(0, 90) + ' | ' + (e.getAttribute('data-name') || e.tagName) + ' .' + String(e.className).split(' ')[0]); }
      });
      return out;
    });
    L.forEach((x) => { const key = x.replace(/ \| .*/, ''); seen[key] = seen[key] || { n: 0, ex: x, pg }; seen[key].n++; });
  }
  return Object.values(seen).sort((a, b) => b.n - a.n).slice(0, 40).map((s) => s.n + ' ' + s.pg + ' ' + s.ex);
}
