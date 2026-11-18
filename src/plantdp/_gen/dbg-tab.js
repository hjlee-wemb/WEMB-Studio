/* 다크 + 색 정하기에서 활성 센서 탭 — 호버 없이 찍고 아이콘 상태를 본다 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(2000);
  const out = {};
  for (const [mode, seed] of [['light', '#2a74f4'], ['dark', '#2a74f4'], ['dark', '#0f8f7a']]) {
    await p.evaluate(([m, s]) => { document.querySelector('#mode button[data-m="' + m + '"]').click(); const i = document.getElementById('seed'); i.value = s; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, [mode, seed]);
    await p.waitForTimeout(1800);
    const b = await p.evaluate(() => { const t = document.querySelector('#dtStage [data-name="Filter Panel"] [data-name="btn-tab_sencer"]'); const r = t.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.click(b[0], b[1]);
    await p.mouse.move(1200, 600);
    await p.waitForTimeout(900);
    out[mode + seed] = await p.evaluate(() => {
      const w = [...document.querySelectorAll('#dtStage .pd-navfrag')].find((x) => x.style.display !== 'none');
      const t = w.querySelector('[data-name="btn-tab_sencer"]'), im = t.querySelector('img');
      return [getComputedStyle(t).backgroundColor, im && im.getAttribute('src'), im && getComputedStyle(im).content.slice(0, 80), im && im.naturalWidth, im && getComputedStyle(im).filter, im && getComputedStyle(im).visibility];
    });
    await p.screenshot({ path: GEN + 'tab-' + mode + seed.slice(1) + '.png', clip: { x: 452, y: 108, width: 300, height: 120 } });
    /* 레이어로 돌아가 다음 바퀴 */
    const l = await p.evaluate(() => { const w = [...document.querySelectorAll('#dtStage .pd-navfrag')].find((x) => x.style.display !== 'none'); const t = [...w.querySelectorAll('[data-name="btn-tab_layer"]')].find((x) => /레이어/.test(x.textContent)); const r = t.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.click(l[0], l[1]); await p.mouse.move(1200, 600); await p.waitForTimeout(600);
  }
  await ctx.close();
  return out;
}
