async (page, args) => {
  const out = {};
  for (const pg of args) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=light');
    await page.waitForTimeout(700);
    out[pg] = await page.evaluate(() => [...document.querySelectorAll('.sh-pop img')].filter((im) => { const r = im.getBoundingClientRect(); return r.width < 20 && r.height < 20 && r.width > 0; }).map((im) => im.getAttribute('src').split('/').pop() + '@' + Math.round(im.getBoundingClientRect().x) + ',' + Math.round(im.getBoundingClientRect().y) + ' ' + (im.closest('[data-name]') || {}).getAttribute?.('data-name')));
  }
  return out;
}
