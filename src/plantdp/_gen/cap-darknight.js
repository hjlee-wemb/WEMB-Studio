/* 다크 · 라이트 — 바탕 그림이 바뀐 화면 6장(미리보기, 라이브 켬) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const out = {};
  for (const t of ['dark', 'light']) for (const sc of ['main', 'weather', 'sop-popup', 'building', 'floor', 'login']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=' + t + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.mouse.move(1919, 1079);
    await page.waitForTimeout(2200);
    await page.screenshot({ path: GEN + 'night-' + t + '-' + sc + '.png' });
    out[t + ' ' + sc] = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => /screen-main|background\.png/.test(i.getAttribute('src'))).map((i) => i.getAttribute('src').split('/').pop() + '→' + (getComputedStyle(i).content.match(/[\w-]+\.(png|jpg)/) || ['-'])[0] + ' op' + getComputedStyle(i).opacity).join(' | '));
  }
  return out;
}
