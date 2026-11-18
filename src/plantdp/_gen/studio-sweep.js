/* 스튜디오에서 10장면 × 라이트 · 다크 — 여백 · 오류 · 찍기(sw-<모드>-<장면>.png). 실행: node pw.js studio-sweep.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const SC = [['main', 'pdm'], ['weather', 'pdw'], ['seismic', 'pds'], ['event', 'pde'], ['sop-popup', 'pdp'], ['building', 'pdb'], ['floor', 'pdf'], ['sop', 'pdo'], ['sop-standby', 'pdy'], ['login', 'pdl']];
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 200)));
  p.on('console', (m) => { if ((m.type() === 'error' || /\[pd\]/.test(m.text())) && !/favicon|ERR_|404|WebSocket|api\//.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(2000);
  const out = {};
  for (const mode of ['light', 'dark']) {
    await p.evaluate((m) => document.querySelector('#mode button[data-m="' + m + '"]').click(), mode);
    await p.waitForTimeout(1500);
    for (const [sc, px] of SC) {
      await p.evaluate((s) => window.__gotoPlantdpScene(s), sc);
      await p.waitForSelector('#dtStage .' + px + '-root', { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(1700);
      out[mode + ':' + sc] = await p.evaluate((px) => {
        const r = document.querySelector('#dtStage .' + px + '-root');
        if (!r) return 'no root';
        const st = document.getElementById('dtStage').getBoundingClientRect();
        const f = r.querySelector(':scope > [data-node-id]').getBoundingClientRect();
        const m = [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => Math.round(v));
        const bad = [...r.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth && getComputedStyle(i).display !== 'none').length;
        return r.dataset.theme + ' m' + m.join(',') + (bad ? ' badimg' + bad : '');
      }, px);
      await p.screenshot({ path: GEN + 'sw-' + mode + '-' + sc + '.png' });
    }
  }
  out.errs = errs.slice(0, 10);
  await ctx.close();
  return out;
}
