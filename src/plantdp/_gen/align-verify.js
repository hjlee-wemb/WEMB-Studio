/* 이벤트 표 정렬 최종 검증 — 스튜디오에서 여러 화면 비율로(16:9 · 넓은 화면 · 좁은 화면):
   ① 머리 구분선 = 줄 구분선 ② 칸 글자(글리프) 가운데 = 머리 글자 가운데 ③ 가운데 칸은 두 구분선의 한가운데. 값은 화면 px. 실행: node pw.js align-verify.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const SIZES = [[1920, 1080], [1920, 820], [2560, 1080], [1600, 900], [1366, 768], [1024, 768], [1280, 1024]];
  const out = {};
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(1500);
  for (const sc of ['event', 'building']) {
    await p.evaluate((s) => window.__gotoPlantdpScene(s), sc);
    await p.waitForTimeout(2200);
    for (const [w, h] of SIZES) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(1800);
      out[sc + ' ' + w + 'x' + h] = await p.evaluate(() => {
        const el = document.querySelector('#dtStage [data-name="Event Log"]');
        const L = ['등급', '발생시간', '설비명', '설비타입', '메시지'];
        const ink = (e) => { if (e.tagName !== 'P') return e.getBoundingClientRect(); const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect(); };
        const cx = (e) => { const b = ink(e); return b.left + b.width / 2; };
        const inRow = (q) => !!q.closest('[data-name^="Row/"], [data-name="grid-row"]');
        const H = {}; const head = {};
        [...el.querySelectorAll('p')].forEach((q) => { const t = q.textContent.trim(); if (L.includes(t) && !head[t] && !inRow(q)) { head[t] = q; H[t] = cx(q); } });
        const st = document.querySelector('#dtStage .pd-root').__pd, S = st.S;
        const divs = (scope, yRef) => { let els = [...scope.querySelectorAll('*')].filter((x) => { const b = x.getBoundingClientRect(); return b.width > 0 && b.width <= 2.5 * S && b.height >= 10 * S; }); els = els.filter((x) => !els.includes(x.parentElement)); if (yRef != null) els = els.filter((x) => { const b = x.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - yRef) < 14 * S; }); const xs = els.map((x) => { const b = x.getBoundingClientRect(); return b.left + b.width / 2; }).sort((a, b) => a - b); const g = []; xs.forEach((x) => { if (g.length && x - g[g.length - 1].x <= 2 * S) { const l = g[g.length - 1]; l.n++; l.x += (x - l.x) / l.n; } else g.push({ x, n: 1 }); }); return g.map((o) => o.x); };
        let hr = head['설비명']; while (hr && !(hr.contains(head['메시지']) && divs(hr).length >= 3)) hr = hr.parentElement;
        const hb = head['설비명'].getBoundingClientRect(); const hd = divs(hr, hb.top + hb.height / 2);
        const rows = [...el.querySelectorAll('[data-name^="Row/"], [data-name="grid-row"]')].filter((x) => !x.parentElement.closest('[data-name^="Row/"], [data-name="grid-row"]') && x.getBoundingClientRect().width);
        let wDiv = 0, wTxt = 0, wMid = 0, where = '';
        rows.forEach((r, i) => {
          const rd = divs(r);
          rd.forEach((x, k) => { const d = Math.abs(x - hd[k]); if (d > wDiv) { wDiv = d; } });
          const ps = [...r.querySelectorAll('p')].filter((q) => !q.closest('[data-name^="btn-"]'));
          const vals = { 발생시간: (ink(ps[0]).left + ink(ps[1]).right) / 2, 설비명: cx(ps[2]), 설비타입: cx(ps[3]), 메시지: cx(ps[4]) };
          Object.keys(vals).forEach((k) => { const d = Math.abs(vals[k] - H[k]); if (d > wTxt) { wTxt = d; where = 'row' + (i + 1) + ' ' + k; } });
          [['발생시간', 0, 1], ['설비명', 1, 2], ['설비타입', 2, 3]].forEach(([k, a, b]) => { const d = Math.abs(vals[k] - (rd[a] + rd[b]) / 2); if (d > wMid) wMid = d; });
        });
        return { div: +wDiv.toFixed(1), text: +wTxt.toFixed(1), mid: +wMid.toFixed(1), at: where, nDiv: hd.length, rows: rows.length };
      });
      if (sc === 'event' && (w === 1920 && h === 820 || w === 1366)) await p.screenshot({ path: GEN + 'verify-' + w + 'x' + h + '.png' });
    }
    await p.setViewportSize({ width: 1920, height: 1080 });
  }
  out.errs = errs;
  await ctx.close();
  return out;
}
