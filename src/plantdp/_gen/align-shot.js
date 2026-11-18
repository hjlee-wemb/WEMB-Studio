/* 스튜디오 이벤트 표 — 머리 칸 가운데에 세로 기준선을 그어 찍는다(눈으로 확인). 실행: node pw.js align-shot.js W H */
async (page, args) => {
  const W = +(args[0] || 1920), H = +(args[1] || 1080);
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.__gotoPlantdpScene('event'));
  await p.waitForSelector('#dtStage .pde-root', { timeout: 8000 });
  await p.mouse.move(5, 5);
  await p.waitForTimeout(2500);
  const clip = await p.evaluate(() => {
    const el = document.querySelector('#dtStage [data-name="Event Log"]');
    const L = ['등급', '발생시간', '설비명', '설비타입', '메시지'];
    const xs = [];
    [...el.querySelectorAll('p')].forEach((q) => { const t = q.textContent.trim(); if (L.includes(t) && !q.closest('[data-name^="Row/"]') && !xs.some((x) => x.t === t)) { const g = document.createRange(); g.selectNodeContents(q); const b = g.getBoundingClientRect(); xs.push({ t, x: b.left + b.width / 2 }); } });
    const b = el.getBoundingClientRect();
    xs.forEach((o) => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;width:1px;background:rgba(255,0,80,.7);left:' + o.x + 'px;top:' + (b.top + 40) + 'px;height:' + (b.height - 40) + 'px'; document.body.appendChild(d); });
    return { x: Math.max(0, b.left), y: b.top, width: Math.min(innerWidth, b.right) - Math.max(0, b.left), height: Math.min(innerHeight, b.bottom) - b.top };
  });
  await p.screenshot({ path: GEN + 'align-' + W + '.png', clip });
  await ctx.close();
  return clip;
}
