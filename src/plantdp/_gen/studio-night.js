/* 스튜디오 — 다크로 바꾸면 밤 그림, 라이트로 돌리면 원본, 색 정하기 상태에서도 밤 그림이 그대로(칠하지 않음) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  p.on('requestfailed', (r) => { if (/-dk\./.test(r.url())) errs.push('FAIL ' + r.url()); });
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(1500);
  const look = () => p.evaluate(() => [...document.querySelectorAll('#dtStage img')].filter((i) => /screen-main|background\.png|stage-/.test(i.getAttribute('src'))).map((i) => { const c = getComputedStyle(i); return i.getAttribute('src').split('/').pop().replace('.png', '') + '→' + ((c.content.match(/[\w-]+\.(png|jpg)/) || ['orig'])[0]) + ' f=' + c.filter.slice(0, 30) + ' mix=' + c.mixBlendMode + ' natural=' + i.naturalWidth; }));
  const out = {};
  for (const [mode, seed] of [['dark', '#2a74f4'], ['dark', '#0f8f7a'], ['light', '#2a74f4']]) {
    await p.evaluate(([m, s]) => { document.querySelector('#mode button[data-m="' + m + '"]').click(); const i = document.getElementById('seed'); i.value = s; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, [mode, seed]);
    for (const sc of ['building', 'login']) {
      await p.evaluate((s) => window.__gotoPlantdpScene(s), sc);
      await p.waitForTimeout(1800);
      out[mode + seed + ' ' + sc] = await look();
      await p.screenshot({ path: GEN + 'studio-night-' + mode + seed.slice(1) + '-' + sc + '.png' });
    }
  }
  out.errs = errs;
  await ctx.close();
  return out;
}
