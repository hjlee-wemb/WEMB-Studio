/* 스튜디오에서 구분선 · 칸 상자 — 머리 줄 vs 줄(반응형 몫 __fx 까지) */
async (page, args) => {
  const W = +(args[0] || 1920), H = +(args[1] || 1080);
  const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.__gotoPlantdpScene('event'));
  await p.waitForSelector('#dtStage .pde-root', { timeout: 8000 });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const st = document.querySelector('#dtStage .pd-root').__pd;
    const el = document.querySelector('#dtStage [data-name="Event Log"]');
    const f = st.frame.getBoundingClientRect(), S = st.S;
    const X = (b) => Math.round(((b.left - f.left) / S) * 10) / 10;
    const thin = (scope) => [...scope.querySelectorAll('*')].filter((x) => { const b = x.getBoundingClientRect(); return b.width > 0 && b.width <= 2.5 * S && b.height >= 10 * S; }).map((x) => X(x.getBoundingClientRect()) + (x.__fx ? '(fx' + Math.round(x.__fx) + ')' : '')).filter((v, i, a) => a.indexOf(v) === i);
    const hr = el.querySelector('[data-name="Header Row"]');
    const rows = [...el.querySelectorAll('[data-name^="Row/"]')];
    const fx = (scope) => [...scope.querySelectorAll('*')].filter((x) => x.__fx).map((x) => (x.dataset.name || x.tagName) + ':' + Math.round(x.__fx)).slice(0, 12);
    return { S, exW: st.exW, exH: st.exH, header: thin(hr), row1: thin(rows[0]), headerFx: fx(hr), row1Fx: fx(rows[0]), rowW: Math.round(rows[0].getBoundingClientRect().width / S), hdrW: Math.round(hr.getBoundingClientRect().width / S) };
  });
  await ctx.close();
  return r;
}
