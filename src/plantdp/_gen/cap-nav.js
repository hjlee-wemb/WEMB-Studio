/* 필터 패널 변형 8벌 찍기 → nav-light.png · nav-dark.png */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const out = {};
  for (const t of ['light', 'dark']) {
    await page.setViewportSize({ width: 2420, height: 1000 });
    await page.goto('http://localhost:5570/src/plantdp/_gen/nav-preview.html?t=' + t + '&r=' + Date.now());
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: GEN + 'nav-' + t + '.png' });
    out[t] = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')));
  }
  return out;
}
