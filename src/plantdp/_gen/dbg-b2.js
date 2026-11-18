/* 건물 목록 block2 가 왜 안 눌리나 — 미리보기에서 */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5570/src/plantdp/main.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1500);
  const b = await page.evaluate(() => { const t = document.querySelector('[data-name="Filter Panel"] [data-name="btn-tab_building"]'); const r = t.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.click(b[0], b[1]);
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('.pd-navfrag [data-name="block2"]')].filter((e) => e.getBoundingClientRect().width > 0);
    return els.slice(0, 3).map((e) => {
      const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const stack = document.elementsFromPoint(x, y).slice(0, 5).map((t) => (t.dataset.name || t.className.toString().slice(0, 30)) + ':' + getComputedStyle(t).pointerEvents);
      let a = e, chain = []; for (let i = 0; i < 5 && a; i++) { chain.push((a.dataset.name || '-') + ':' + getComputedStyle(a).pointerEvents + ':' + a.style.pointerEvents); a = a.parentElement; }
      return { t: e.textContent.trim(), cls: e.className, r: [r.left, r.top, r.width, r.height].map(Math.round), stack, chain, kidsPE: [...e.querySelectorAll('*')].map((k) => getComputedStyle(k).pointerEvents).join(',') };
    });
  });
}
