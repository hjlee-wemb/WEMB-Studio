async (page, args) => {
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.url()); });
  for (const pg of args) { await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html'); await page.waitForTimeout(800); }
  return bad;
}
