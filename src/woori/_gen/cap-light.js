async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/woori/_gen/';
  for (const pg of ['transaction','performance','event']) {
    await page.goto('http://localhost:5531/src/woori/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForTimeout(700);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: GEN + 'light-' + pg + '.png' });
  }
  return 'ok';
}
