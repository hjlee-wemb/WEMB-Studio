async (page) => {
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await page.goto('http://localhost:5580/src/fems/main.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1500);
  return bad;
}
