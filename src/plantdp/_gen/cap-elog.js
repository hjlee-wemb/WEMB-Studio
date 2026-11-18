async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const t of ['light', 'dark']) {
    await page.goto('http://localhost:5570/src/plantdp/event.html?t=' + t + '&r=' + Date.now());
    await page.waitForTimeout(1800);
    await page.mouse.move(960, 300);
    await page.screenshot({ path: GEN + 'elog-' + t + '.png', clip: { x: 0, y: 780, width: 1920, height: 300 } });
  }
  return page.evaluate(() => [...document.querySelectorAll('[data-name="Event Log"] [data-name^="Row/"]')].map((r) => { const d = r.querySelector('[data-name="disability component"]') || r.querySelector('img'); const b = d.getBoundingClientRect(); return (d.dataset.name || d.tagName) + ' ' + Math.round(b.left + b.width / 2); }));
}
