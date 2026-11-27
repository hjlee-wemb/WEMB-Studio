async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/eventpanel.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/z-ep.png' });
  return await page.evaluate(() => [[200, 900], [700, 900], [1100, 880], [1600, 900], [18, 860]].map(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    const inEv = !!e.closest('.smx-mount, .sl-evmount'), inChart = !!e.closest('[data-name="Chart Row"], [data-name="Button/Open Panel"]');
    return x + ',' + y + ' → ' + (e.getAttribute('data-name') || e.tagName) + (inChart ? ' [차트 판]' : '') + (inEv ? ' [이벤트 판]' : '');
  }));
}
