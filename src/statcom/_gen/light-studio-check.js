/* Playwright filename — 실제 스튜디오에서 라이트 점검: 테마 전환 · 화면 이동 · 호버 · 추천 차트 · 색 정하기 · 다크로 복귀 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  const out = {};
  await p.goto('http://localhost:5542/index.html#/templates/digital-twin-statcom-hmi');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .tcm-root', { timeout: 15000 });
  await p.waitForTimeout(1800);

  const center = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const clickAt = async (sel) => { const c = await center(sel); if (c) await p.mouse.click(c[0], c[1]); return !!c; };

  /* 라이트로 */
  const t0 = Date.now();
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(1200);
  out.theme = await p.evaluate(() => document.querySelector('#dtStage .tcm-root').dataset.theme);
  out.sceneSrc = await p.evaluate(() => { const i = document.querySelector('#dtStage [data-name="Scene Image"] img'); return i ? getComputedStyle(i).content.slice(-30) : null; });
  await p.screenshot({ path: GEN + 'lts-main.png' });

  /* 화면 이동 — 라이트가 이어지는지, 몇 ms 인지 */
  const NAV = [['Nav Item/STATCOM', 'tcs'], ['Nav Item/VSC Valve Room', 'tcv'], ['Nav Item/Alarm Message', 'tca']];
  out.nav = {};
  for (const [name, px] of NAV) {
    const t = Date.now();
    const ok = await clickAt('#dtStage [data-name="' + name + '"]');
    await p.waitForSelector('#dtStage .' + px + '-root', { timeout: 6000 }).catch(() => {});
    const ms = Date.now() - t;
    await p.waitForTimeout(900);
    out.nav[name] = { ok, ms, theme: await p.evaluate((x) => { const r = document.querySelector('#dtStage .' + x + '-root'); return r && r.dataset.theme; }, px) };
    await p.screenshot({ path: GEN + 'lts-' + px + '.png' });
  }

  /* 호버 — 값이 실제로 바뀌는지 */
  await clickAt('#dtStage [data-name="Nav Item/VSC Valve Room"]');
  await p.waitForSelector('#dtStage .tcv-root', { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(1000);
  const SEL = '#dtStage [data-name="Actions"] > [data-name^="Button/"]';
  const c = await center(SEL);
  const look = () => p.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundImage.slice(0, 70), SEL);
  await p.mouse.move(5, 500); await p.waitForTimeout(300);
  const idle = await look();
  await p.mouse.move(c[0], c[1]); await p.waitForTimeout(350);
  out.headerHover = { idle, hover: await look() };
  await p.screenshot({ path: GEN + 'lts-hover.png', clip: { x: 1400, y: 0, width: 520, height: 70 } });

  /* 패널편집 → 추천 차트 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(700);
  await clickAt('[data-name="Widget/Submodule Status"] .tc-chartbtn');
  await p.waitForTimeout(300);
  await p.screenshot({ path: GEN + 'lts-chartmenu.png' });
  await clickAt('[data-name="Widget/Submodule Status"] .tc-chartmenu button[data-i="0"]');
  await p.waitForTimeout(1400);
  out.chart = await p.evaluate(() => !!document.querySelector('[data-name="Widget/Submodule Status"] .tc-chart'));
  await p.screenshot({ path: GEN + 'lts-chart.png' });
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(500);

  /* 색 정하기 — 라이트에서 */
  const seed = (v) => p.evaluate((x) => { const i = document.getElementById('seed'); i.value = x; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  await seed('#e0662b');
  await p.waitForTimeout(2600);
  await p.screenshot({ path: GEN + 'lts-tint.png' });
  await seed('#00b9f0');
  await p.waitForTimeout(1200);

  /* 다크로 복귀 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(1000);
  out.darkBack = await p.evaluate(() => { const r = document.querySelector('#dtStage .tcv-root'); const i = r.querySelector('[data-name="Scene Image"] img'); return { theme: r.dataset.theme, content: i ? getComputedStyle(i).content.slice(0, 20) : null, side: getComputedStyle(r.querySelector('[data-name="Side Bar"]')).backgroundColor }; });
  await p.screenshot({ path: GEN + 'lts-dark.png' });
  out.errs = errs;
  await ctx.close();
  return out;
}
