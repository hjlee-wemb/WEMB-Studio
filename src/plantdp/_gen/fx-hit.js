/* SOP 연출 층이 클릭을 가로채지 않는지 — 연출 층의 pointer-events, 진행 중 카드 · 작업 줄 · 다음 단계 단추 가운데 점의 맨 위 요소. 실행: node pw.js fx-hit.js */
async (page) => {
  await page.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await page.waitForSelector('#dtStage .pdm-root', { timeout: 20000 });
  const out = {};
  for (const sc of ['sop', 'sop-popup']) {
    await page.evaluate((s) => window.__gotoPlantdpScene(s), sc);
    await page.waitForTimeout(2500);
    out[sc] = await page.evaluate(() => {
      const R = document.querySelector('#dtStage .pd-root');
      const pe = [...R.querySelectorAll('.pd-fx')].map((e) => getComputedStyle(e).pointerEvents);
      const hit = (el) => { if (!el) return 'none'; const b = el.getBoundingClientRect(); const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return (t && t.classList.contains('pd-fx')) ? 'BLOCKED' : 'ok'; };
      return { fxPE: [...new Set(pe)], card: hit(R.querySelector('.pd-stg-on')), next: hit(R.querySelector('[data-name="Button/Next Stage"]')), task: hit(R.querySelector('[data-name="Task (Active)"]')), item: hit(R.querySelector('[data-name="Item/1"]')) };
    });
  }
  return out;
}
