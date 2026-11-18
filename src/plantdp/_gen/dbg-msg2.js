async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5570/src/plantdp/building.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1600);
  return page.evaluate(() => {
    const root = document.querySelector('.pd-root'), st = root.__pd;
    const el = st.elog;
    const sameRows = (st.elogRows || []).length;
    const c = (p) => { const b = p.getBoundingClientRect(); return Math.round(b.left + b.width / 2); };
    const head = [...el.querySelectorAll('p')].filter((p) => p.textContent.trim() === '메시지')[0];
    const r = st.elogRows[0];
    const ps = [...r.querySelectorAll('p')].filter((p) => !p.closest('[data-name^="btn-"]'));
    return { sameRows, hasRealign: !!st.realign, headC: c(head), msgC: c(ps[4]), msgW: Math.round(ps[4].getBoundingClientRect().width), offW: ps[4].offsetWidth, sw: ps[4].scrollWidth, cls: ps[4].className, ov: getComputedStyle(ps[4]).overflow, ws: getComputedStyle(ps[4]).whiteSpace, ta: getComputedStyle(ps[4]).textAlign };
  });
}
