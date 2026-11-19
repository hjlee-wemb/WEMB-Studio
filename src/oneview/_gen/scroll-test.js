/* 스크롤 목록 검증 — 목록 높이 · 행 수 · 휠 · 막대 끌기 · 트랙 누르기. node pw.js scroll-test.js [page…] */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.setViewportSize({ width: 1568, height: 1032 });
  const out = {};
  for (const pg of (args.length ? args : ['main', 'vibration', 'heat'])) {
    await page.goto('http://localhost:5590/src/oneview/' + pg + '.html?r=' + Date.now());
    await page.waitForTimeout(2600);
    const sbs = await page.evaluate(() => [...document.querySelectorAll('.ov-sb')].map((sb, i) => {
      const l = sb.parentElement.querySelector(':scope > .ov-scroll'), t = sb.querySelector('.ov-sbthumb');
      const lr = l.getBoundingClientRect(), tr = t.getBoundingClientRect(), sr = sb.getBoundingClientRect();
      sb.dataset.ti = i;
      return { i, where: sb.parentElement.parentElement.getAttribute('data-name'), rows: l.children.length, ch: l.clientHeight, sh: l.scrollHeight, list: [lr.x + lr.width / 2, lr.y + lr.height / 2], thumb: [tr.x + tr.width / 2, tr.y + tr.height / 2, Math.round(tr.height)], track: [sr.x + sr.width / 2, sr.bottom - 4] };
    }));
    const res = [];
    for (const s of sbs) {
      const vis = await page.evaluate((i) => { const t = document.querySelectorAll('.ov-sb')[i].querySelector('.ov-sbthumb'), r = t.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!e && (e === t || t.contains(e) || e.closest('.ov-sb') === t.closest('.ov-sb')); }, s.i);
      if (!vis) { res.push({ where: s.where, covered: true }); continue; }
      const r = { where: s.where, rows: s.rows, view: s.ch + '/' + s.sh, thumbH: s.thumb[2] };
      await page.mouse.move(s.list[0], s.list[1]);
      await page.mouse.wheel(0, 60);
      await page.waitForTimeout(350);
      r.wheel = await page.evaluate((i) => { const sb = document.querySelectorAll('.ov-sb')[i]; const l = sb.parentElement.querySelector(':scope > .ov-scroll'); return [Math.round(l.scrollTop), sb.querySelector('.ov-sbthumb').style.transform]; }, s.i);
      await page.evaluate((i) => { const sb = document.querySelectorAll('.ov-sb')[i]; sb.parentElement.querySelector(':scope > .ov-scroll').scrollTop = 0; }, s.i);
      await page.waitForTimeout(150);
      const tb = await page.evaluate((i) => { const t = document.querySelectorAll('.ov-sb')[i].querySelector('.ov-sbthumb').getBoundingClientRect(); return [t.x + t.width / 2, t.y + t.height / 2]; }, s.i);
      await page.mouse.move(tb[0], tb[1]); await page.mouse.down(); await page.mouse.move(tb[0], tb[1] + 30, { steps: 5 }); await page.mouse.up();
      await page.waitForTimeout(200);
      r.drag = await page.evaluate((i) => Math.round(document.querySelectorAll('.ov-sb')[i].parentElement.querySelector(':scope > .ov-scroll').scrollTop), s.i);
      res.push(r);
    }
    await page.screenshot({ path: GEN + 'scroll-' + pg + '.png' });
    out[pg] = res;
  }
  out.errs = errs;
  return out;
}
