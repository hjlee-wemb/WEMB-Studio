async (page, args) => {
  await page.goto('http://localhost:5570/src/plantdp/' + (args[0] || 'weather') + '.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1500);
  return await page.evaluate(() => (window.__pdDbg || []).map((x) => x.join(' ')));
}
