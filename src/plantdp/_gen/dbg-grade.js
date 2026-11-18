/* 이벤트 등급 거름이 왜 안 먹나 */
async (page) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('http://localhost:5570/src/plantdp/event.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const st = document.querySelector('.pde-root').__pd;
    const rows = st.elogRows || [];
    const info = { n: rows.length, grades: rows.map((r) => r.__grade), names: rows.map((r) => r.dataset.name + ':' + getComputedStyle(r).display) };
    st.applyGrade('CR');
    info.after = rows.map((r) => r.style.display + '/' + getComputedStyle(r).display);
    info.chips = [...document.querySelectorAll('.pd-chipon, .pd-chipdim')].length;
    return info;
  });
}
