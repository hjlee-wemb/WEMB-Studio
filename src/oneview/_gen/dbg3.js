async (page) => {
  const out = {};
  await page.goto('http://localhost:5590/src/oneview/overview2.html?live=0&t=light&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  out.bank = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find((x) => x.textContent.trim() === '가람은행');
    const chain = []; let e = p;
    for (let i = 0; i < 4 && e; i++, e = e.parentElement) { const s = getComputedStyle(e); chain.push(e.tagName + ' ' + (e.getAttribute('data-name') || '') + ' c:' + s.color + ' bg:' + s.backgroundColor + ' bi:' + s.backgroundImage.slice(0, 120) + ' cls:' + e.className); }
    return chain;
  });
  await page.goto('http://localhost:5590/src/oneview/network.html?live=0&t=light&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  out.net = await page.evaluate(() => {
    const lc = document.querySelector('[data-name="Line Chart"]');
    return [...lc.children].map((e) => { const s = getComputedStyle(e); return e.getAttribute('data-name') + ' bg:' + s.backgroundColor + ' bi:' + s.backgroundImage.slice(0, 80) + ' img:' + ((e.querySelector('img') || {}).src || '').split('/').pop() + ' cls:' + e.className; });
  });
  return out;
}
