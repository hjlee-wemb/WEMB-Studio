/* 검증 탭 문제 항목의 자세한 내용(어느 변형 · 어느 페이지) — 실행: node src/plantdp/_gen/pw.js ../../plantdp-assets/_gen/atomic-verify2.js */
async (page) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('http://localhost:5510/index.html#/molecules/verify');
  await page.waitForSelector('#run', { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.click('#run');
  const start = Date.now();
  while (Date.now() - start < 560000) {
    await page.waitForTimeout(3000);
    const st = await page.evaluate(() => (document.getElementById('state') || {}).textContent || '');
    if (/문제 \d+건/.test(st)) break;
  }
  return await page.evaluate(() => {
    const out = document.getElementById('out');
    const first = out.querySelector('li');
    const box = first ? first.closest('ul, ol, section, div') : out;
    return box.innerText.slice(0, 3000) + '\n---\n' + [...box.querySelectorAll('a,[data-id],[data-variant]')].slice(0, 20).map((a) => (a.getAttribute('href') || '') + ' ' + (a.dataset.id || '') + ' ' + (a.dataset.variant || '')).join('\n');
  });
}
