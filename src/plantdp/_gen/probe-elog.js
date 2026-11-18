/* 이벤트 표 — 머리 칸 · 줄 칸 글자의 자리(가운데 x · 왼쪽 x · 정렬 · 상자 폭) */
async (page, args) => {
  const sc = args[0] || 'event';
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const el = document.querySelector('[data-name="Event Log"]');
    const r = (e) => { const b = e.getBoundingClientRect(); return b; };
    const hdr = el.querySelector('[data-name="Header Row"]') || el.querySelector('[data-name="grid-header"]');
    const fmt = (p) => { const b = r(p), c = getComputedStyle(p); let host = p.parentElement; const hb = r(host); return p.textContent.trim().slice(0, 14) + ' [L' + Math.round(b.left) + ' C' + Math.round(b.left + b.width / 2) + ' W' + Math.round(b.width) + ' ' + c.textAlign + ' / box L' + Math.round(hb.left) + ' W' + Math.round(hb.width) + ' ' + getComputedStyle(host).display + ' jc:' + getComputedStyle(host).justifyContent + ']'; };
    const out = { header: hdr ? [...hdr.querySelectorAll('p')].map(fmt) : 'no header', headerName: hdr && hdr.dataset.name };
    const rows = [...el.querySelectorAll('[data-name^="Row/"], [data-name="grid-row"]')].filter((x) => !x.parentElement.closest('[data-name^="Row/"], [data-name="grid-row"]'));
    out.rows = rows.slice(0, 7).map((row) => [...row.querySelectorAll('p')].map(fmt).join(' | '));
    out.dividers = hdr ? [...hdr.querySelectorAll('*')].filter((x) => { const b = r(x); return b.width <= 2 && b.height > 8; }).map((x) => Math.round(r(x).left)) : [];
    return out;
  });
}
