async (page) => {
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ' ' + m.text().slice(0, 200)));
  await page.goto('http://localhost:5600/src/datacenter/main.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  return { logs, n: await page.evaluate(() => document.querySelectorAll('[data-dc-tip]').length), tipEl: await page.evaluate(() => !!document.querySelector('.dc-tip')), sc: await page.evaluate(() => { const e = document.querySelector('[data-name="Button/Scenario"]'); return e && [e.getAttribute('data-dc-tip'), getComputedStyle(e).display]; }) };
}
