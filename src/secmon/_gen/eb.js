async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/main.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(700);
  return await page.evaluate(() => {
    const bg = document.querySelector('[data-name="Event Bar"] [data-name="event"] > [data-name="Background"]');
    const cs = getComputedStyle(bg);
    return { bg: cs.backgroundImage.slice(0, 80), kids: [...bg.children].map((c) => c.tagName + ' ' + (c.getAttribute('src') || '') + ' ' + getComputedStyle(c).content.slice(0, 60) + ' ' + JSON.stringify(c.getBoundingClientRect()).slice(0, 50)), match: bg.matches('[data-name="Event Bar"] [data-name="Background"]:not([data-name^="Count/"] *):not([data-name^="Button/"] *)') };
  });
}
