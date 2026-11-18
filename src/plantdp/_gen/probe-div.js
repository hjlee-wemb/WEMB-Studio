/* 세로 구분선 — 머리 줄과 줄마다의 x(가는 세로 판), 정지 화면(?live=0 = Figma 그대로)과 라이브 */
async (page) => {
  const out = {};
  for (const q of ['live=0&', '']) {
    for (const sc of ['event', 'building']) {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?' + q + 't=light&r=' + Date.now());
      await page.waitForTimeout(1500);
      out[(q ? 'figma ' : 'live ') + sc] = await page.evaluate(() => {
        const el = document.querySelector('[data-name="Event Log"]');
        const thin = (scope) => [...scope.querySelectorAll('*')].filter((x) => { const b = x.getBoundingClientRect(); return b.width > 0 && b.width <= 2.5 && b.height >= 10; }).map((x) => Math.round(x.getBoundingClientRect().left * 10) / 10).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
        const head = [...el.querySelectorAll('p')].find((p) => p.textContent.trim() === '설비명' && !p.closest('[data-name^="Row/"], [data-name="grid-row"]'));
        let hr = head; for (let i = 0; i < 6 && hr; i++) { if (thin(hr).length >= 3) break; hr = hr.parentElement; }
        const rows = [...el.querySelectorAll('[data-name^="Row/"], [data-name="grid-row"]')].filter((x) => !x.parentElement.closest('[data-name^="Row/"], [data-name="grid-row"]'));
        return { header: hr ? thin(hr) : null, headerName: hr && hr.dataset.name, rows: rows.slice(0, 4).map((r) => r.dataset.name + ' ' + thin(r).join(',')) };
      });
    }
  }
  return out;
}
