async (page) => {
  await page.setViewportSize({ width: 1216, height: 984 });
  await page.goto('http://localhost:5590/src/oneview/main.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate(() => {
    const fr = document.querySelector('.ovm-root > [data-node-id]');
    const c = [...fr.children].find((x) => x.getAttribute('data-name') === 'Column/Right');
    const box = (e) => { let x = 0, y = 0, k = e, path = []; while (k && k !== fr) { x += k.offsetLeft; y += k.offsetTop; path.push((k.getAttribute('data-name') || k.tagName) + '@' + k.offsetLeft); k = k.offsetParent; } return e.getAttribute('data-name') + ' x' + x + ' y' + y + ' w' + e.offsetWidth + ' ok' + (k === fr) + ' ' + path.slice(0, 3).join('>'); };
    const kids = [...c.children].map(box);
    const h = [...fr.children].find((x) => x.getAttribute('data-name') === 'Header');
    return { frPos: getComputedStyle(fr).position, kids, header: [...h.children].map(box) };
  });
}
