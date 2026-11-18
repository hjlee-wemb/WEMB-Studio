/* SOP 세 화면 전체 — 스튜디오 다크 · 라이트. 연출 층 개수 · 오류. 실행: node pw.js cap-sop2.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (/\[pd\]/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await page.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await page.waitForSelector('#dtStage .pdm-root', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const out = {};
  for (const sc of ['sop', 'sop-popup', 'sop-standby']) {
    await page.evaluate((s) => window.__gotoPlantdpScene(s), sc);
    await page.waitForTimeout(2500);
    for (const th of ['dark', 'light']) {
      await page.evaluate((t) => document.querySelector('#mode button[data-m="' + t + '"]').click(), th);
      await page.waitForTimeout(1800);
      out[sc + ' ' + th] = await page.evaluate(() => { const R = document.querySelector('#dtStage .pd-root'); const c = (s) => R.querySelectorAll(s).length; return { ring: c('.pd-ring'), sweep: c('.pd-sweep'), strip: c('.pd-strip'), live: c('.pd-livetxt'), wait: c('.pd-stg-wait'), seg: c('.pd-seg-on'), head: c('.pd-seg-head'), task: c('.pd-taskglow'), badge: c('.pd-badge-live'), pulse: c('.pd-pulse'), spin: c('.pd-spin'), caret: c('.pd-caret-on'), gauge: [...R.querySelectorAll('[data-name="Gauge Group"] p')].map((p) => p.textContent).join() }; });
      const r = await page.evaluate(() => { const b = document.querySelector('#dtStage').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
      await page.screenshot({ path: GEN + 'sopfx-' + sc + '-' + th + '.png', clip: { x: r[0], y: r[1], width: r[2], height: r[3] } });
    }
  }
  out.errs = errs;
  return out;
}
