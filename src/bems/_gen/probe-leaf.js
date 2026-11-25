async (page) => {
  await page.goto('http://localhost:5610/src/bems/floor.html?t=light&r=' + Date.now());
  await page.waitForTimeout(2600);
  return page.evaluate(() => [...document.querySelectorAll('.be-leaf p')].slice(0, 5).map((p) => p.textContent + ' ' + getComputedStyle(p).color + ' ' + p.closest('.be-leaf').className));
}
