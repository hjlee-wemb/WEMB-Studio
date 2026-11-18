/* 스튜디오 다크 — 헤더 · 오른쪽 위젯이 밝게 남는 이유 */
async (page) => {
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(2500);
  const pts = [[1680, 250, 'widget'], [700, 72, 'header'], [560, 320, 'filter row']];
  const res = await p.evaluate((pts) => pts.map(([x, y, n]) => {
    const chain = document.elementsFromPoint(x, y).map((e) => { const c = getComputedStyle(e); return [e.tagName, e.dataset.name || '', String(e.className).slice(0, 50), c.backgroundColor, c.backgroundImage.slice(0, 50), e.tagName === 'IMG' ? getComputedStyle(e).content.slice(0, 60) + ' ' + e.getAttribute('src') : ''] }).filter((r) => r[0] === 'IMG' || r[3] !== 'rgba(0, 0, 0, 0)' || r[4] !== 'none').slice(0, 4);
    return [n, chain];
  }), pts);
  await p.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/dbg-dark-a.png' });
  await p.evaluate(() => window.__gotoPlantdpScene('event'));
  await p.waitForTimeout(2000);
  await p.evaluate(() => window.__gotoPlantdpScene('main'));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/dbg-dark-b.png' });
  res.push(await p.evaluate(() => { const e = document.querySelector('#dtStage .pdm-root [data-name="Widget/Weather Observation"] [data-name="Body"]'); const h = document.querySelector('#dtStage .pdm-root [data-name="Header"] > [data-name="Background"]'); return ['after-switch', getComputedStyle(e).backgroundColor, h && getComputedStyle(h).backgroundColor, document.querySelector('#dtStage .pdm-root').dataset.theme, [...document.querySelectorAll('#dtStage [class*="-root"]')].map((x) => x.className.split(' ')[0])]; }));
  res.push(await p.evaluate(() => { const R = document.querySelector('#dtStage .pdm-root'); const q = (s) => R.querySelector(s); const ps = (e) => e ? ['', '::before', '::after'].map((pe) => { const c = getComputedStyle(e, pe || null); return pe + ':' + c.backgroundColor + '|' + c.backgroundImage.slice(0, 40) + '|op' + c.opacity + '|f' + c.filter + '|' + c.content.slice(0,10); }) : null;
    const t = [...R.querySelectorAll('p')].find((x) => x.textContent.trim() === '현재 측정값');
    let chainF = []; let e = q('[data-name="Widget/Weather Observation"]'); while (e && e !== document.body) { const c = getComputedStyle(e); if (c.filter !== 'none' || c.mixBlendMode !== 'normal' || c.backdropFilter !== 'none' || +c.opacity < 1) chainF.push([e.className.slice(0, 30), c.filter, c.mixBlendMode, c.backdropFilter, c.opacity]); e = e.parentElement; }
    return ['pseudo', ps(q('[data-name="Widget/Weather Observation"]')), ps(q('[data-name="Widget/Weather Observation"] [data-name="Body"]')), ps(q('[data-name="Header"] > [data-name="Background"]')), t && getComputedStyle(t).color, chainF]; }));
  const sheets = await p.evaluate(() => [...document.querySelectorAll('style')].filter((s) => /pd|plantdp/.test(s.id)).map((s) => [s.id, s.textContent.length, (s.textContent.match(/\[data-theme="dark"\]/g) || []).length]));
  const root = await p.evaluate(() => { const r = document.querySelector('#dtStage .pdm-root'); return [r.className, r.dataset.theme, r.getAttribute('style')]; });
  await ctx.close();
  return { res, sheets, root };
}
