async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const scenes = args.length ? args : ['main', 'weather', 'sop', 'login', 'sop-popup', 'event'];
  for (const sc of scenes) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=dark&r=' + Date.now());
    await page.waitForTimeout(2200);
    await page.screenshot({ path: GEN + 'dk-' + sc + '.png' });
  }
  return scenes;
}
