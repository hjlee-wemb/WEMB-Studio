/* TP 화면의 Line Chart · Chart 상자와 부모 이름. node pw.js dbg-tp.js */
async (page) => {
  await page.goto('http://localhost:5590/src/oneview/tp.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate(() => {
    const R = (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(','); };
    return [...document.querySelectorAll('[data-name="Line Chart"],[data-name="Chart"],[data-name="Column"]')].map((e) =>
      e.getAttribute('data-name') + ' <' + (e.parentElement.getAttribute('data-name') || '') + '<' + (e.parentElement.parentElement.getAttribute('data-name') || '') + ' @' + R(e) + ' disp=' + getComputedStyle(e).display + ' kids=' + [...e.children].map((c) => c.getAttribute('data-name')).slice(0, 6).join('|'));
  });
}
