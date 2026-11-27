async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/eventpanel.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  return await page.evaluate(() => {
    const out = [];
    const clip = document.querySelector('.smx-mount .sl-clip');
    out.push('clip ' + (clip && JSON.stringify(clip.getBoundingClientRect())) + ' parent=' + (clip && clip.parentElement.className.slice(0, 40)));
    document.querySelectorAll('.smx-mount .sl-inner > [data-name]').forEach((c, i) => {
      if (i > 6) return;
      const r = c.getBoundingClientRect(), cs = getComputedStyle(c);
      const p = c.querySelector('p'); const pr = p && p.getBoundingClientRect();
      out.push(c.getAttribute('data-name') + ' ' + cs.position + ' ' + cs.display + ' [' + [r.left, r.top, r.width, r.height].map(Math.round) + '] p=' + (p && p.textContent) + ' [' + (pr ? [pr.left, pr.top, pr.width, pr.height].map(Math.round) : '') + '] color=' + (p && getComputedStyle(p).color) + ' op=' + (p && getComputedStyle(p).opacity) + ' vis=' + (p && getComputedStyle(p).visibility));
    });
    return out.join('\n');
  });
}
