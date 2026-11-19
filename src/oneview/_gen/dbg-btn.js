/* 스튜디오 패널편집에서 차트 단추 크기 · 스타일 원인 찾기. node pw.js dbg-btn.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview/_gen/';
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5590/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /oneview|ov-/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  await page.waitForTimeout(1000);
  await page.locator('text=Integrated Operations One-View').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .ovm-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.locator('#editAll').click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: GEN + 'st-edit-base.png' });
  return await page.evaluate(() => {
    const b = [...document.querySelectorAll('#dtStage .ovm-root .ov-chartbtn')];
    const out = b.map((x) => { const r = x.getBoundingClientRect(), cs = getComputedStyle(x); return [x.parentElement.getAttribute('data-name'), Math.round(r.width), Math.round(r.height), cs.width, cs.position, cs.left, cs.right, cs.display, x.style.cssText]; });
    const x = b[0]; const rules = [];
    for (const s of document.styleSheets) { let rs; try { rs = s.cssRules; } catch (e) { continue; } for (const r of rs) { if (r.selectorText && x.matches(r.selectorText) && /width|right|inset|flex/.test(r.style.cssText)) rules.push(r.selectorText.slice(0, 120) + ' {' + r.style.cssText.slice(0, 160)); } }
    return { out, rules: rules.slice(0, 20) };
  });
}
