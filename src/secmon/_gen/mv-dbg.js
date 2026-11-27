async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/main.html?r=' + Date.now());
  await page.waitForTimeout(1500);
  return await page.evaluate(() => {
    const st = document.querySelector('.sl-root').__sl;
    const d = st.panels.find((p) => p.name === 'Delay Top10');
    const out = { n: d.els.length, names: {} };
    d.els.forEach((e) => { const k = e.getAttribute('data-name'); out.names[k] = (out.names[k] || 0) + 1; });
    const cb = [...document.querySelectorAll('[data-name="Cell Background"]')].filter((e) => { const r = e.getBoundingClientRect(); return r.left > 1690 && r.top < 680; });
    out.cells = cb.slice(0, 4).map((e) => { const p = st.panels.find((p) => p.els.includes(e)); let a = e.parentElement; const chain = []; while (a && chain.length < 3) { chain.push(a.getAttribute('data-name') + ':' + getComputedStyle(a).display); a = a.parentElement; } return (p ? p.name : 'NONE') + ' | ' + chain.join(' < ') + ' | ' + getComputedStyle(e).display; });
    return out;
  });
}
