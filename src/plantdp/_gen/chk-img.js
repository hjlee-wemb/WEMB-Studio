/* 깨진 그림 · 안 보이는 글자 점검 — node pw.js chk-img.js [page] */
async (page, args) => {
  const pg = args[0] || 'main';
  await page.goto('http://localhost:5570/src/plantdp/' + pg + '.html?live=0&t=light&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(300);
  return await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push({ src: i.getAttribute('src'), name: (i.closest('[data-name]') || {}).dataset && i.closest('[data-name]').dataset.name }); });
    return { bad };
  });
}
