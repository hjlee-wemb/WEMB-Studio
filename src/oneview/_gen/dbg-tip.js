/* 화면의 라이브 선 svg 상자 · 묶음 이름. node pw.js dbg-tip.js <장면> */
async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5590/src/oneview/' + (args[0] || 'main') + '.html?r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2600);
  return await page.evaluate(() => {
    const st = document.querySelector('.ov-root').__ov;
    return (st.lines || []).map((f) => { const r = f.svg.getBoundingClientRect(); return f.group.getAttribute('data-name') + ' ' + [r.left, r.top, r.width, r.height].map(Math.round).join(',') + ' ' + f.color; });
  });
}
