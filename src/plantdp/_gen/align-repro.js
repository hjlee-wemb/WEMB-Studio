/* 정렬 재현 — 스튜디오(5570 · 5510)에서 여러 크기 · 크기 바꾼 직후 · 1초 뒤 · 3초 뒤에 '보이는 글자'의 가운데와 머리 칸 가운데 차이(px).
   글자 가운데 = Range 로 잰 실제 글자 폭(상자 폭이 아니라). 실행: node pw.js align-repro.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const out = {};
  const measure = (p) => p.evaluate(() => {
    const el = document.querySelector('#dtStage [data-name="Event Log"]');
    if (!el) return 'no elog';
    const tc = (node) => { const rg = document.createRange(); rg.selectNodeContents(node); const b = rg.getBoundingClientRect(); return b.width ? b.left + b.width / 2 : null; };
    const L = ['발생시간', '설비명', '설비타입', '메시지'];
    const H = {};
    [...el.querySelectorAll('p')].forEach((q) => { const t = q.textContent.trim(); if (L.includes(t) && !H[t] && !q.closest('[data-name^="Row/"]')) H[t] = tc(q); });
    let worst = { d: 0 };
    [...el.querySelectorAll('[data-name^="Row/"]')].filter((r) => r.getBoundingClientRect().width).forEach((r, i) => {
      const ps = [...r.querySelectorAll('p')].filter((q) => !q.closest('[data-name^="btn-"]'));
      const rg = document.createRange(); rg.setStartBefore(ps[0]); rg.setEndAfter(ps[1]);
      const ink = (n) => { const g = document.createRange(); g.selectNodeContents(n); return g.getBoundingClientRect(); }; const a = ink(ps[0]), b = ink(ps[1]);
      const vals = { 발생시간: (a.left + b.right) / 2, 설비명: tc(ps[2]), 설비타입: tc(ps[3]), 메시지: tc(ps[4]) };
      L.forEach((k) => { const d = Math.abs(vals[k] - H[k]); if (d > worst.d) worst = { d: +d.toFixed(1), k, row: i + 1, text: (k === '발생시간' ? ps[0] : ps[[0, 0, 2, 3, 4][L.indexOf(k) + 1]] || ps[4]).textContent.trim().slice(0, 12) }; });
    });
    return worst;
  });
  for (const port of [5570, 5510]) {
    const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
    const p = await ctx.newPage();
    const ok = await p.goto('http://localhost:' + port + '/index.html#/templates/digital-twin-power-plant-disaster-prevention').then(() => true).catch(() => false);
    if (!ok) { out[port] = 'server down'; await ctx.close(); continue; }
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
    await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.__gotoPlantdpScene && window.__gotoPlantdpScene('event'));
    await p.waitForSelector('#dtStage .pde-root', { timeout: 8000 }).catch(() => {});
    const r = {};
    r.live = await p.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /plantdp-live/.test(s)).join(','));
    r.t0 = await measure(p);
    await p.waitForTimeout(1000); r.t1 = await measure(p);
    await p.waitForTimeout(2000); r.t3 = await measure(p);
    for (const [w, h] of [[1440, 900], [1280, 720], [1024, 768], [1920, 1080]]) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(150); const a = await measure(p);
      await p.waitForTimeout(1500); const b = await measure(p);
      r[w + 'x' + h] = { soon: a, later: b };
    }
    await p.screenshot({ path: GEN + 'repro-' + port + '.png' });
    out[port] = r;
    await ctx.close();
  }
  return out;
}
