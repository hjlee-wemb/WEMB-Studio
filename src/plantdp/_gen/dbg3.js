async (page) => {
  await page.goto('http://localhost:5570/src/plantdp/weather.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(800);
  return await page.evaluate(() => {
    const w = document.querySelector('[data-name="Widget/Temperature Trend"]');
    const g = w.querySelector('[data-name="Graph"]');
    return g.outerHTML.replace(/style="[^"]*"/g, '').slice(0, 2500);
  });
}
