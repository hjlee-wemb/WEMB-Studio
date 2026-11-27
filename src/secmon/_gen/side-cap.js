/* 왼쪽 판 다크 · 라이트 나란히 — node pw.js side-cap.js 장면… */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  for (const pg of args) for (const t of ['dark', 'light']) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=' + t);
    await page.waitForTimeout(900);
    await page.screenshot({ path: GEN + 'side-' + pg + '-' + t + '.png', clip: pg === 'asset' ? { x: 0, y: 60, width: 300, height: 700 } : { x: 0, y: 55, width: 270, height: 960 } });
  }
  return 'ok';
}
