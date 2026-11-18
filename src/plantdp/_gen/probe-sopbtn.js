async (page) => {
  const out = {};
  for (const sc of ['sop', 'sop-standby']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForTimeout(900);
    out[sc] = await page.evaluate(() => {
      const r = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(Math.round).join(','); };
      const btns = [...document.querySelectorAll('[data-name="Action Buttons"] > [data-name], [data-name="Button/Manual"], [data-name="Button/Send SMS"], [data-name="Button/End SOP"]')].map((b) => b.dataset.name + ' ' + r(b) + ' img:' + ((b.querySelector('img') || {}).getAttribute ? b.querySelector('img').getAttribute('src').split('/').pop() : ''));
      const tips = [...document.querySelectorAll('[data-name^="Tooltip/"]')].map((t) => t.dataset.name + ' ' + r(t) + ' ' + t.textContent.trim());
      return { btns, tips };
    });
  }
  return out;
}
