/* 깊은 곳(표 줄 · 키-값 · 탭 조각) 나무. 실행: node src/ccpp/_gen/pw.js ../../ccpp-assets/_gen/tree2.js */
async (page) => {
  const fs = require('fs');
  const walkFn = (rootSel, maxD) => {
    const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
    const L = [];
    const walk = (el, d) => {
      if (d > maxD) return;
      [...el.children].forEach((c) => {
        const nm = c.getAttribute('data-name');
        if (nm) {
          const b = c.getBoundingClientRect();
          const t = (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36);
          L.push('  '.repeat(d) + nm + ' [' + c.getAttribute('data-node-id') + '] ' + Math.round(b.width) + 'x' + Math.round(b.height) + (t ? ' "' + t + '"' : ''));
          walk(c, d + 1);
        } else walk(c, d);
      });
    };
    walk(root, 0);
    return L;
  };
  const out = [];
  await page.goto('http://localhost:5575/src/ccpp/library.html?live=0&r=' + Date.now()); await page.waitForTimeout(700);
  out.push('### library List', ...(await page.evaluate((f) => eval('(' + f + ')')('[data-node-id="427:759"]', 3), walkFn.toString())).slice(0, 30));
  await page.goto('http://localhost:5575/src/ccpp/detail.html?live=0&r=' + Date.now()); await page.waitForTimeout(700);
  out.push('### detail maint list', ...(await page.evaluate((f) => eval('(' + f + ')')('[data-node-id="427:1232"]', 3), walkFn.toString())).slice(0, 30));
  out.push('### detail maint detail', ...(await page.evaluate((f) => eval('(' + f + ')')('[data-node-id="427:1275"]', 3), walkFn.toString())).slice(0, 40));
  for (const k of ['design', 'equipment', 'materials']) {
    const L = await page.evaluate(([k, f]) => {
      const F = window.CC_TABS[k];
      const s = document.createElement('style'); s.textContent = F.css; document.head.appendChild(s);
      const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:0;top:0;width:1010px;height:909px;z-index:99'; box.innerHTML = F.build(); document.body.appendChild(box);
      const L = eval('(' + f + ')')(box, 5); box.remove(); return L;
    }, [k, walkFn.toString()]);
    out.push('### tab ' + k, ...L.slice(0, 120));
  }
  fs.writeFileSync(__dirname + '/tree2.txt', out.join('\n'));
  return out.length;
}
