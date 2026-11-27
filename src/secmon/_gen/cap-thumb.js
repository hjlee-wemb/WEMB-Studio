/* 템플릿 카드 썸네일 — 미리보기(원본 다크, 라이브 끔 = Figma 그대로)를 1920x1080 JPEG(q82)로 찍어 src/templates/secmon-<장면>.jpg 에 쓴다. 실행: node pw.js cap-thumb.js */
async (page) => {
  const OUT = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/templates/';
  const done = [];
  for (const pg of ['main', 'channel', 'micro', 'mq', 'infra', 'event', 'eventpanel', 'alert', 'sound']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5620/src/secmon/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    await page.screenshot({ path: OUT + 'secmon-' + pg + '.jpg', type: 'jpeg', quality: 82 });
    done.push(pg);
  }
  return done;
}
