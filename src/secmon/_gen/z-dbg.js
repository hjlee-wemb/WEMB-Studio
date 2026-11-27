async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/eventpanel.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  return await page.evaluate(() => {
    const a = [...document.querySelectorAll('.sl-abovepanel')];
    const bg = a.find((e) => e.getAttribute('data-name') === 'Background' && e.getBoundingClientRect().width > 1000);
    const m = document.querySelector('.smx-mount');
    const chain = (e) => { const o = []; while (e && e !== document.body) { const cs = getComputedStyle(e); if (cs.zIndex !== 'auto' || cs.transform !== 'none' || cs.translate !== 'none' || cs.isolation !== 'auto' || +cs.opacity < 1 || cs.filter !== 'none') o.push((e.getAttribute('data-name') || e.className.slice(0, 20)) + ' z=' + cs.zIndex + ' pos=' + cs.position + ' tr=' + cs.translate + ' op=' + cs.opacity); e = e.parentElement; } return o; };
    return { n: a.length, bg: bg && chain(bg), mount: m && chain(m), chartRowLive: !!document.querySelector('.sl-root').__sl.chartRow };
  });
}
