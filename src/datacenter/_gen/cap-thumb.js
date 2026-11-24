/* 템플릿 카드 썸네일 — 라이브 켠 미리보기(원본 다크)를 1920x1080 JPEG(q82)로 찍어 src/templates/datacenter-<장면>.jpg 에 쓴다. 실행: node pw.js cap-thumb.js */
async (page) => {
  const OUT = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/templates/';
  const done = [];
  for (const pg of ['main', 'power', 'worker', 'asset', 'equipment', 'cardset', 'search', 'scenario']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: OUT + 'datacenter-' + (pg === 'cardset' ? 'card' : pg) + '.jpg', type: 'jpeg', quality: 82 });
    done.push(pg);
  }
  return done;
}
