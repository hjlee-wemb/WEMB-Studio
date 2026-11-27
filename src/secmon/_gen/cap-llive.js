/* 라이트 + 라이브 켠 화면 캡처(카드 · 툴팁 등 라이브 쪽 라이트 규칙 확인). node pw.js cap-llive.js [장면…] → llive-<장면>.png */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const P = args.length ? args : ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'];
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const pg of P) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2600);
    await page.screenshot({ path: GEN + 'llive-' + pg + '.png' });
  }
  return P.length;
}
