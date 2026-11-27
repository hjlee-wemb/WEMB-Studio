async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/eventpanel.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  return await page.evaluate(async () => {
    const st = document.querySelector('.sl-root').__sl;
    const p = st.panels.find((x) => x.name === 'Chart Row');
    const m = document.querySelector('.smx-mount');
    const src = await (await fetch('../secmon-live.js?x=' + Date.now())).text();
    return { idx: p.els.indexOf(m), n: p.els.length, hasFix: src.indexOf('-mount|-dim') >= 0, scripts: [...document.scripts].map((s) => s.src).filter(Boolean) };
  });
}
