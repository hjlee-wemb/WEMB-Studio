/* 왼쪽 판 안 '선'이 있는 상자(테두리 · 1~2px 막대 · 선 그림) — 위치 · 색, 다크 · 라이트. node pw.js side-lines.js 장면 x0 x1 y0 y1 */
async (page, args) => {
  const [pg, X0, X1, Y0, Y1] = [args[0], +args[1], +args[2], +args[3], +args[4]];
  const res = {};
  for (const t of ['dark', 'light']) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=' + t);
    await page.waitForTimeout(900);
    res[t] = await page.evaluate(([X0, X1, Y0, Y1]) => {
      const out = [];
      document.querySelectorAll('[data-node-id], img').forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.right < X0 || r.left > X1 || r.bottom < Y0 || r.top > Y1 || !r.width) return;
        const cs = getComputedStyle(e), a = getComputedStyle(e, '::after');
        const bw = ['Top', 'Right', 'Bottom', 'Left'].map((s) => parseFloat(cs['border' + s + 'Width']));
        const thin = (r.width <= 3 || r.height <= 3) && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || e.tagName === 'IMG');
        const ring = a.content !== 'none' && a.content !== 'normal' && parseFloat(a.borderTopWidth) > 0;
        if (!bw.some((x) => x > 0) && !thin && !ring && !(cs.boxShadow !== 'none' && /inset/.test(cs.boxShadow))) return;
        const name = (e.getAttribute('data-name') || e.tagName) + (e.tagName === 'IMG' ? ':' + e.getAttribute('src').split('/').pop() : '');
        out.push(name + ' ' + [r.left, r.top, r.width, r.height].map((v) => +v.toFixed(2)).join(',') + (bw.some((x) => x > 0) ? ' border=' + bw.join('/') + ' ' + cs.borderTopColor + ' ' + cs.borderTopStyle : '') + (thin ? ' bar ' + (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : cs.backgroundImage.slice(0, 50)) : '') + (ring ? ' ring ' + a.borderTopWidth + ' ' + a.borderTopColor + ' inset=' + a.inset : '') + (/inset/.test(cs.boxShadow) ? ' shadow ' + cs.boxShadow.slice(0, 60) : ''));
      });
      return out;
    }, [X0, X1, Y0, Y1]);
  }
  return res;
}
