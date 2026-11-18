/* 미리보기 각 장면의 Event Log 들 — 보이는지 · 단추 이름 */
async (page) => {
  const out = {};
  for (const sc of ['main', 'weather', 'seismic', 'event', 'sop-popup', 'building', 'floor', 'sop', 'sop-standby']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=light&r=' + Date.now());
    await page.waitForTimeout(1200);
    out[sc] = await page.evaluate(() => [...document.querySelectorAll('[data-name="Event Log"]')].map((e) => {
      const b = e.getBoundingClientRect();
      const btns = [...e.querySelectorAll('[data-name]')].filter((x) => /btn|Button|Group 29|arrow|foldbtn/i.test(x.dataset.name)).map((x) => x.dataset.name + ((x.classList.contains('pd-click') ? '*' : '') + (x.classList.contains('pd-foldbtn') ? '^' : '')));
      return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height), [...new Set(btns)].join(',')];
    }));
  }
  return out;
}
