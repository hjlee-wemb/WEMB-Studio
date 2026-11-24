async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/power.html?live=0');
  await page.waitForTimeout(1000);
  return page.evaluate(() => ['View/Plan Diagram', 'View/3D Scene'].map((n) => { const v = document.querySelector('[data-name="' + n + '"]'); const r = (e) => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(Math.round).join(',') + ' ' + getComputedStyle(e).display + ' ov=' + getComputedStyle(e).overflow; }; return n + ': ' + r(v) + ' | ' + [...v.children].map((c) => c.getAttribute('data-name') + ' ' + r(c)).join(' | '); }));
}
