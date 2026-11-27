async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/mq.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(700);
  return await page.evaluate(() => document.elementsFromPoint(908, 738).slice(0, 4).map((e) => (e.getAttribute('data-name') || e.tagName) + ' ' + (e.getAttribute('src') || e.getAttribute('data-src') || '')));
}
