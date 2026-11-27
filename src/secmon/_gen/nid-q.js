async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/asset.html?live=0');
  await page.waitForTimeout(800);
  const a = await page.evaluate(() => ['조회', '엑셀', '등록', '삭제', '[ 483 ]', '전력자산관리'].map((t) => { const p = [...document.querySelectorAll('p')].find((x) => x.textContent.trim() === t); if (!p) return t + ' ?'; const h = p.parentElement; const r = h.getBoundingClientRect(); return t + ' p#' + p.getAttribute('data-node-id') + ' host#' + h.getAttribute('data-node-id') + ' ' + (h.getAttribute('data-name') || '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); }));
  await page.goto('http://localhost:5600/src/datacenter/main.html?live=0');
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => ['Select/Small', 'Checkbox', 'CR', 'ALL', 'Top', 'Drop Down Default', 'Row'].map((n) => { const e = [...document.querySelectorAll('[data-name="' + n + '"]')].find((x) => x.getClientRects().length); const r = e && e.getBoundingClientRect(); return n + ' #' + (e && e.getAttribute('data-node-id')) + ' ' + (r ? Math.round(r.width) + 'x' + Math.round(r.height) : ''); }));
  return { a, m };
}
