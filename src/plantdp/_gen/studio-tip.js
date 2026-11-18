/* 스튜디오 — 툴팁: 평소 숨김 · 호버 때만 · 패널편집 중엔 다 보이고 글자 편집 가능 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(2200);
  const vis = () => p.evaluate(() => [...document.querySelectorAll('#dtStage .pd-tip')].filter((t) => +getComputedStyle(t).opacity > 0.5).map((t) => t.textContent.trim()));
  const out = { idle: await vis() };
  const b = await p.evaluate(() => { const e = document.querySelector('#dtStage [data-name="Button/Multi-Hazard Status"]'); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.mouse.move(b[0], b[1]); await p.waitForTimeout(400);
  out.hover = await vis();
  await p.screenshot({ path: GEN + 'studio-tip.png', clip: { x: 352, y: 700, width: 400, height: 380 } });
  await p.mouse.move(1200, 500); await p.waitForTimeout(400);
  out.after = await vis();
  await p.evaluate(() => document.getElementById('editAll').click()); await p.waitForTimeout(700);
  out.editing = await vis();
  out.editable = await p.evaluate(() => [...document.querySelectorAll('#dtStage .pd-tip p')].map((x) => x.isContentEditable));
  await p.evaluate(() => document.getElementById('editAll').click()); await p.waitForTimeout(500);
  out.afterEdit = await vis();
  out.errs = errs;
  await ctx.close();
  return out;
}
