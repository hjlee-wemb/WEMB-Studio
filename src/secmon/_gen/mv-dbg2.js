async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/main.html?r=' + Date.now());
  await page.waitForTimeout(1500);
  return await page.evaluate(() => {
    const st = document.querySelector('.sl-root').__sl;
    return document.elementsFromPoint(1700, 160).slice(0, 6).map((e) => { const p = st.panels.find((p) => p.els.some((x) => x === e)); return (e.getAttribute('data-name') || e.tagName) + ' → ' + (p ? p.name : 'NONE') + ' ' + JSON.stringify(e.getBoundingClientRect()).slice(0, 60); });
  });
}
