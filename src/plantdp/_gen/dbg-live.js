/* 라이브 문제 찾기 — node pw.js dbg-live.js <scene> */
async (page, args) => {
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') logs.push(m.text().slice(0, 300)); });
  await page.goto('http://localhost:5570/src/plantdp/' + (args[0] || 'weather') + '.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const plots = [...document.querySelectorAll('[data-name="Plot"]')].map((p) => {
      const w = p.closest('[data-name^="Widget/"]');
      const g = p.querySelector('[data-name="Graph"]');
      return { w: w && w.dataset.name, kids: g ? [...g.children].map((c) => c.dataset.name || c.tagName) : null, ya: !!p.querySelector('[data-name="Y Axis"]') };
    });
    const fp = document.querySelector('[data-name="Filter Panel"]');
    const g38 = fp && fp.querySelector('[data-name="Group 38"]');
    const masked = fp ? [...fp.querySelectorAll('*')].filter((x) => getComputedStyle(x).maskImage !== 'none').map((x) => (x.dataset.name || x.tagName) + ' ' + getComputedStyle(x).maskSize).slice(0, 5) : [];
    return { plots, g38: !!g38, masked };
  });
  return { logs, info };
}
