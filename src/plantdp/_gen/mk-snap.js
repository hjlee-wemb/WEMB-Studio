/* Playwright browser_run_code_unsafe filename — 그림(<img> · <svg>)의 소수 좌표 차이를 재서 snap-<key>.json 으로 저장한다(patch-snap).
   회전 · 뒤집힌 조상이 있는 그림은 뺀다. 먼저 snap-*.json 을 지우고 conv 를 돌린 화면에서 잰다. */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const out = {};
  for (const [pg, key] of [['overview', '1-2']]) {
    await page.goto('http://localhost:5541/src/plant/' + pg + '.html?live=0&t=dark&nosnap=1&r=' + Date.now());
    await page.waitForTimeout(600);
    await page.evaluate(() => document.fonts.ready);
    out[pg] = await page.evaluate(async (key) => {
      const res = {};
      const root = document.querySelector('[id="lsroot"]');
      root.querySelectorAll('img, svg').forEach((el) => {
        if (el.ownerSVGElement) return;
        const uc = (el.getAttribute('class') || '').split(/\s+/)[0];
        if (!uc || !/^(n|x)/.test(uc)) return;
        for (let a = el; a && a !== root; a = a.parentElement) { const t = getComputedStyle(a).transform; if (t && t !== 'none' && a !== el) { const m = new DOMMatrix(t); if (!m.isIdentity && !(m.a === 1 && m.d === 1 && m.b === 0 && m.c === 0)) return; } if (a !== el && !t) return; }
        const cs = getComputedStyle(el);
        if (cs.transform && cs.transform !== 'none') return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const x0 = Math.round(r.left), x1 = Math.round(r.right), y0 = Math.round(r.top), y1 = Math.round(r.bottom);
        if (x1 === x0 || y1 === y0) return;
        const tx = r.left - x0, ty = r.top - y0, sx = r.width / (x1 - x0), sy = r.height / (y1 - y0);
        if (Math.abs(tx) < 0.04 && Math.abs(ty) < 0.04 && Math.abs(sx - 1) < 0.002 && Math.abs(sy - 1) < 0.002) return;
        res[uc] = 'translate(' + +tx.toFixed(3) + 'px,' + +ty.toFixed(3) + 'px) scale(' + +sx.toFixed(5) + ',' + +sy.toFixed(5) + ')';
      });
      await fetch('/__save?f=snap-' + key + '.json', { method: 'POST', body: JSON.stringify(res, null, 0) });
      return Object.keys(res).length;
    }, key);
  }
  return out;
}
