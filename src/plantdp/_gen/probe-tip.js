/* 화면마다 툴팁 레이어 — 이름 · 자리 · 글자, 가장 가까운 단추 */
async (page) => {
  const out = {};
  for (const sc of ['main', 'weather', 'seismic', 'event', 'sop-popup', 'building', 'floor', 'sop', 'sop-standby', 'login']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForTimeout(900);
    out[sc] = await page.evaluate(() => {
      const tips = [...document.querySelectorAll('[data-name]')].filter((e) => /tooltip|tool tip|툴팁|말풍선|balloon|bubble/i.test(e.dataset.name));
      return tips.map((t) => {
        const b = t.getBoundingClientRect();
        const par = t.parentElement && t.parentElement.closest('[data-name]');
        return [t.dataset.name, par ? par.dataset.name : '-', [b.left, b.top, b.width, b.height].map(Math.round).join(','), t.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), [...t.parentElement.children].map((c) => c.dataset.name || '').filter(Boolean).slice(0, 6).join('|')].join(' :: ');
      });
    });
  }
  return out;
}
