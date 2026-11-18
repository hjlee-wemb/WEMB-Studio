async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5570/src/plantdp/building.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1600);
  return page.evaluate(() => {
    const el = document.querySelector('[data-name="Event Log"]');
    const rows = [...el.querySelectorAll('[data-name="grid-row"]')];
    const r = rows[0];
    const ps = [...r.querySelectorAll('p')].filter((p) => !p.closest('[data-name^="btn-"]'));
    return { n: ps.length, ps: ps.map((p) => p.textContent.trim() + ' tr=' + p.style.translate + ' cs=' + getComputedStyle(p).translate + ' ' + getComputedStyle(p).position), heads: [...el.querySelectorAll('p')].filter((p) => p.textContent.trim() === '메시지').map((p) => { const b = p.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.width), p.closest('[data-name]').dataset.name]; }) };
  });
}
