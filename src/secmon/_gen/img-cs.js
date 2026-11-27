async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/' + args[0] + '.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(700);
  return await page.evaluate((names) => names.map((n) => { const e = [...document.querySelectorAll('img')].find((i) => (i.getAttribute('src') || '').endsWith('/' + n) || (i.getAttribute('src') || '').endsWith(n)); if (!e) return n + ' none'; let o = [], a = e; while (a && o.length < 4) { const cs = getComputedStyle(a); if (cs.opacity !== '1' || cs.filter !== 'none' || cs.mixBlendMode !== 'normal') o.push((a.getAttribute('data-name') || a.tagName) + ' op=' + cs.opacity + ' f=' + cs.filter + ' mb=' + cs.mixBlendMode); a = a.parentElement; } return n + ' | ' + o.join(' ; '); }), args.slice(1));
}
