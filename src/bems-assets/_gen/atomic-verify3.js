/* 검증 문제 항목을 페이지(template) · 변형까지 — verifyAll 을 직접 부른다. 실행: node src/fems/_gen/pw.js ../../fems-assets/_gen/atomic-verify3.js */
async (page) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('http://localhost:5510/index.html#/molecules/verify');
  await page.waitForSelector('#run', { timeout: 60000 });
  await page.waitForTimeout(1500);
  return await page.evaluate(async () => {
    const { verifyAll } = await import('/js/atomic/verify.js');
    const lib = await (await fetch('/api/library')).json();
    const measures = await (await fetch('/api/measure')).json();
    const res = await verifyAll({ lib, measures });
    return { checked: res.checked, issues: res.issues.filter((i) => !i.kind.startsWith('참고')).map((i) => i.kind + ' ' + i.molecule + ' ' + i.template + ' ' + i.variant + ' ' + i.detail),
      newNotes: res.issues.filter((i) => i.kind.startsWith('참고') && /^bems-/.test(i.template)).length };
  });
}
