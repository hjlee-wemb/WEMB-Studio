async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/eventpanel.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  return await page.evaluate(() => {
    const m = document.querySelector('.smx-mount');
    const st = document.querySelector('.sl-root').__sl;
    return { cls: m.className, parent: m.parentElement.getAttribute('data-name'), inPanel: st.panels.filter((p) => p.els.includes(m)).map((p) => p.name), z: getComputedStyle(m).zIndex };
  });
}
