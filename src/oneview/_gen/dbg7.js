async (page) => {
  await page.setViewportSize({ width: 1216, height: 984 });
  await page.goto('http://localhost:5590/src/oneview/main.html?r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
  return await page.evaluate(() => {
    const q = (sel) => { const e = document.querySelector(sel); if (!e) return sel + ' none'; const r = e.getBoundingClientRect(); return sel + ' y' + Math.round(r.y) + ' tr:' + getComputedStyle(e).translate + ' tf:' + getComputedStyle(e).transform.slice(0, 40) + ' cls:' + e.className; };
    const win = [...document.querySelectorAll('p')].find((p) => p.textContent.trim() === 'WINDOWS');
    const node = win && win.closest('[data-name^="Node/"]');
    const chain = []; let e = win; while (e && !/-root/.test(e.className)) { const s = getComputedStyle(e); if (s.translate !== 'none' || s.transform !== 'none') chain.push((e.getAttribute('data-name') || e.tagName) + ' tr:' + s.translate + ' tf:' + s.transform.slice(0, 50)); e = e.parentElement; }
    return { title: q('[data-name="Widget/Infrastructure"] > [data-name="Title"]'), was: q('[data-name="Widget/Key WAS Monitoring"] [data-name="Title Bar"]'), node: node && node.getAttribute('data-name'), chain };
  });
}
