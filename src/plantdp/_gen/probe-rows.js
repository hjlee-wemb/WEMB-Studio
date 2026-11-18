async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5570/src/plantdp/event.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1800);
  return page.evaluate(() => {
    const el = document.querySelector('[data-name="Event Log"]');
    const ink = (e) => { const g = document.createRange(); g.selectNodeContents(e); const b = g.getBoundingClientRect(); return Math.round(b.left) + '-' + Math.round(b.right); };
    return [...el.querySelectorAll('[data-name^="Row/"]')].map((r) => r.dataset.name + ': ' + [...r.querySelectorAll('p')].map((p) => p.textContent.trim().slice(0, 10) + '{' + ink(p) + (p.closest('[data-name^="btn-"]') ? ' btn' : '') + ' tr=' + (p.style.translate || '0') + '}').join(' '));
  });
}
