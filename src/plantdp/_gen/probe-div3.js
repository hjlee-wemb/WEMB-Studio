async (page) => {
  const out = {};
  for (const sc of ['event', 'building']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForTimeout(1200);
    out[sc] = await page.evaluate(() => {
      const el = document.querySelector('[data-name="Event Log"]');
      const thin = (scope) => [...scope.querySelectorAll('*')].filter((x) => { const b = x.getBoundingClientRect(); return b.width > 0 && b.width <= 2.5 && b.height >= 10; }).map((x) => { const b = x.getBoundingClientRect(); return (x.dataset.name || x.tagName) + '@' + (b.left).toFixed(1) + ' h' + Math.round(b.height) + ' y' + Math.round(b.top) + (x.parentElement.getBoundingClientRect().width <= 2.5 ? ' (inThin)' : ''); });
      const head = [...el.querySelectorAll('p')].find((p) => p.textContent.trim() === '설비명' && !p.closest('[data-name^="Row/"], [data-name="grid-row"]'));
      let hr = head; while (hr && thin(hr).length < 3) hr = hr.parentElement;
      const row = el.querySelector('[data-name^="Row/"], [data-name="grid-row"]');
      return { hr: hr.dataset.name, header: thin(hr), row: thin(row) };
    });
  }
  return out;
}
