/* 툴팁 — 평소 숨김, 짝 단추에 마우스를 올리면 그것만 보인다. 실행: node pw.js tip-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const out = {};
  for (const sc of ['main', 'event', 'sop', 'sop-standby']) {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=light&r=' + Date.now());
    await page.waitForTimeout(1600);
    await page.mouse.move(800, 450);
    await page.waitForTimeout(300);
    const vis = () => page.evaluate(() => [...document.querySelectorAll('.pd-tip')].filter((t) => +getComputedStyle(t).opacity > 0.5).map((t) => t.textContent.replace(/\s+/g, ' ').trim()));
    const r = { idle: await vis(), pairs: await page.evaluate(() => (document.querySelector('.pd-root').__pd.tipPairs || []).map((p) => p.tip.textContent.replace(/\s+/g, ' ').trim() + ' ↔ ' + p.target.dataset.name)), hover: [] };
    const targets = await page.evaluate(() => (document.querySelector('.pd-root').__pd.tipPairs || []).map((p) => { const b = p.target.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, p.target.dataset.name]; }));
    for (const [x, y, n] of targets) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(350);
      r.hover.push(n + ' → ' + JSON.stringify(await vis()));
    }
    if (targets[0]) { await page.mouse.move(targets[0][0], targets[0][1]); await page.waitForTimeout(350); await page.screenshot({ path: GEN + 'tip-' + sc + '.png' }); }
    out[sc] = r;
  }
  return out;
}
