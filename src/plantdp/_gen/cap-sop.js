/* SOP 화면 단계 진행 — 스튜디오(라이브)에서 다크 · 라이트로 찍고 카드 안 요소 상자를 잰다. 실행: node pw.js cap-sop.js [tag] */
async (page, args) => {
  const tag = args[0] || 'now';
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await page.waitForSelector('#dtStage .pdm-root', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__gotoPlantdpScene('sop'));
  await page.waitForTimeout(2500);
  const out = {};
  for (const th of ['dark', 'light']) {
    await page.evaluate((t) => document.querySelector('#mode button[data-m="' + t + '"]').click(), th);
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const w = document.querySelector('#dtStage [data-name="Widget/Stage Progress"]');
      const b = w.getBoundingClientRect();
      const cards = [...w.querySelectorAll('[data-name^="Card/Stage"]')].map((c) => {
        const cb = c.getBoundingClientRect();
        const kids = [...c.querySelectorAll('*')].filter((k) => k.getBoundingClientRect().width).map((k) => { const q = k.getBoundingClientRect(); const cs = getComputedStyle(k); return (k.getAttribute('data-name') || k.tagName) + ' ' + Math.round(q.left - cb.left) + ',' + Math.round(q.top - cb.top) + ' ' + Math.round(q.width) + 'x' + Math.round(q.height) + (k.tagName === 'P' ? ' lh' + cs.lineHeight + ' fs' + cs.fontSize : '') + (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? ' bg' + cs.backgroundColor : ''); });
        return c.getAttribute('data-name') + ' ' + Math.round(cb.width) + 'x' + Math.round(cb.height) + '\n   ' + kids.join('\n   ');
      });
      return { box: [b.left, b.top, b.width, b.height].map(Math.round), cards };
    });
    out[th] = r;
    await page.screenshot({ path: GEN + 'sop-stage-' + tag + '-' + th + '.png', clip: { x: r.box[0] - 10, y: r.box[1] - 10, width: r.box[2] + 20, height: r.box[3] + 20 } });
  }
  out.errs = errs;
  return out;
}
