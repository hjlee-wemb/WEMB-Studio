/* 스튜디오 — 이벤트 표 정렬: 처음 · 글자가 바뀐 뒤 · 접고 편 뒤에 칸마다 머리 칸 가운데와 차이(px) */
async (page) => {
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(1800);
  await p.evaluate(() => window.__gotoPlantdpScene('event'));
  await p.waitForSelector('#dtStage .pde-root', { timeout: 8000 });
  await p.waitForTimeout(1800);
  const diffs = () => p.evaluate(() => {
    const el = document.querySelector('#dtStage [data-name="Event Log"]');
    const L = ['발생시간', '설비명', '설비타입', '메시지'];
    const H = {}; [...el.querySelectorAll('p')].forEach((q) => { const t = q.textContent.trim(); if (L.includes(t) && !H[t] && !q.closest('[data-name^="Row/"]')) { const b = q.getBoundingClientRect(); H[t] = b.left + b.width / 2; } });
    const c = (e) => { const b = e.getBoundingClientRect(); return b.left + b.width / 2; };
    let worst = 0;
    [...el.querySelectorAll('[data-name^="Row/"]')].filter((r) => r.getBoundingClientRect().width).forEach((r) => {
      const ps = [...r.querySelectorAll('p')].filter((q) => !q.closest('[data-name^="btn-"]'));
      const g = (ps[0].getBoundingClientRect().left + ps[1].getBoundingClientRect().right) / 2;
      [g - H['발생시간'], c(ps[2]) - H['설비명'], c(ps[3]) - H['설비타입'], c(ps[4]) - H['메시지']].forEach((d) => { worst = Math.max(worst, Math.abs(d)); });
    });
    return +worst.toFixed(1);
  });
  const out = { first: await diffs() };
  await p.evaluate(() => { const r = document.querySelector('#dtStage [data-name="Event Log"] [data-name="Row/2"]'); const ps = [...r.querySelectorAll('p')].filter((q) => !q.closest('[data-name^="btn-"]')); ps[4].textContent = '가스 누출 감지 — 연료설비동 B1 밸브실 (농도 412 ppm)'; ps[2].textContent = '가스감지기 104'; });
  await p.waitForTimeout(300);
  out.afterText = await diffs();
  const fold = async (n) => { const b = await p.evaluate((n) => { const e = document.querySelector('#dtStage [data-name="Event Log"] [data-name="' + n + '"] img'); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, n); await p.mouse.click(b[0], b[1]); await p.waitForTimeout(900); };
  await fold('Button/Collapse'); await fold('Button/Expand');
  out.afterFold = await diffs();
  await p.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/studio-align.png', clip: { x: 352, y: 780, width: 1568, height: 300 } });
  out.errs = errs;
  await ctx.close();
  return out;
}
