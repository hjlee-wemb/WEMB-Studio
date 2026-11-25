async (page) => {
  const res = {};
  for (const t of ['dark', 'light']) {
    await page.goto('http://localhost:5600/src/datacenter/main.html?live=0&t=' + t);
    await page.waitForTimeout(800);
    res[t] = await page.evaluate(() => {
      const P = ['position', 'left', 'top', 'width', 'height', 'background', 'border', 'border-radius', 'box-shadow', 'color', 'font', 'letter-spacing', 'text-align', 'opacity', 'backdrop-filter', 'display', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'margin', 'justify-self', 'align-self'];
      const pick = (e) => { const cs = getComputedStyle(e); const o = {}; P.forEach((p) => { const v = cs.getPropertyValue(p); if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px') o[p] = v; }); return o; };
      const dd = document.querySelector('[data-name="Drop Down Default"]');
      const out = { dd: pick(dd) };
      [...dd.children].forEach((c, i) => { out[i + ':' + c.getAttribute('data-name')] = pick(c); });
      const labs = ['Label/Monitoring', 'Label/Power'].map((n) => { const e = document.querySelector('[data-name="' + n + '"]'); const cs = getComputedStyle(e); return n + ' ' + cs.color + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily.slice(0, 40); });
      out.labs = labs;
      out.hover = pick(document.querySelector('[data-name="Hover"]'));
      return out;
    });
  }
  return res;
}
