async (page) => {
  const r = {};
  for (const t of ['dark', 'light']) {
    await page.goto('http://localhost:5600/src/datacenter/main.html?live=0&t=' + t);
    await page.waitForTimeout(800);
    r[t] = await page.evaluate(() => [...document.querySelectorAll('[data-name="Event Log"] [data-name="Row"] > [data-name="Label"]')].slice(0, 4).map((l) => { const cs = getComputedStyle(l); return l.className + ' | ' + cs.backgroundImage.replace(/%23/g, "#").replace(/%3C/g,"<").slice(0, 400); }));
  }
  return r;
}
