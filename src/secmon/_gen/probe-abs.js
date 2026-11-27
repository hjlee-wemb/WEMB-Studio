async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/' + args[0] + '.html?live=0&r=' + Date.now());
  await page.waitForTimeout(800);
  return await page.evaluate((txt) => {
    const out = [];
    document.querySelectorAll('[data-node-id]').forEach((e) => {
      if (e.children.length === 0 && e.textContent.trim().indexOf(txt) === 0) {
        let x = e; const chain = [];
        while (x && x.getAttribute) { if (x.getAttribute('data-node-id')) { const r = x.getBoundingClientRect(); chain.push([x.getAttribute('data-node-id'), x.getAttribute('data-name') || x.tagName, Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width), Math.round(r.height)]); } x = x.parentElement; }
        out.push(chain);
      }
    });
    return out.slice(0, 1);
  }, args[1]);
}
