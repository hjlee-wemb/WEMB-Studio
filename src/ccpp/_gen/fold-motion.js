/* 왼쪽 판 접기 움직임 표본(40ms 마다): 판 오른쪽 끝 · 단추 왼쪽 · 간격(단추가 판에 붙어 가는지) · 판 불투명도 · 화살표 각도.
   실행: node pw.js fold-motion.js [main|library] */
async (page) => {
  const sc = (globalThis.__ARGS || [])[0] || 'main';
  await page.goto('http://localhost:5575/src/ccpp/' + sc + '.html?t=light&r=' + Date.now());
  await page.evaluate(() => { try { localStorage.removeItem('wemb-ccpp-leftfold'); } catch (e) {} });
  await page.reload(); await page.waitForTimeout(1900);
  const run = async () => page.evaluate(() => new Promise((res) => {
    const p = document.querySelector('.cc-lpanel'), b = document.querySelector('.cc-lfold'), i = b.querySelector('i');
    const rows = [], t0 = performance.now();
    b.click();
    (function tick() {
      const pr = p.getBoundingClientRect(), br = b.getBoundingClientRect();
      rows.push([Math.round(performance.now() - t0), Math.round(pr.right), Math.round(br.left), Math.round(br.left - pr.right), (+getComputedStyle(p).opacity).toFixed(2), getComputedStyle(i).rotate]);
      if (performance.now() - t0 < 1000) setTimeout(tick, 40); else res(rows.filter((r, k) => k % 2 === 0).map((r) => r.join(' ')));
    })();
  }));
  const dur = await page.evaluate(() => getComputedStyle(document.querySelector('.cc-root')).getPropertyValue('--ccl-dur'));
  const close = await run();
  await page.waitForTimeout(300);
  const open = await run();
  return { scene: sc, dur, cols: 'ms panelRight btnLeft gap opacity arrow', close, open };
}
