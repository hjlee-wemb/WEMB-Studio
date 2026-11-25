async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/power.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  const info = await page.evaluate(() => {
    const steps = document.querySelector('[data-name="Scenario Steps"]');
    const flow = steps && steps.querySelector('[data-name="Flowchart"]');
    const hosts = [...document.querySelectorAll('.dc-scrollhost')].map(e => (e.getAttribute('data-name') || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().y) + ' ' + Math.round(e.getBoundingClientRect().height));
    const kids = flow ? [...flow.children].map(c => (c.getAttribute('data-name')||c.tagName) + ' ' + Math.round(c.getBoundingClientRect().y) + ' ' + Math.round(c.getBoundingClientRect().height) + ' ' + getComputedStyle(c).display) : null;
    return { steps: !!steps, flowDisp: flow && getComputedStyle(flow).display, hosts, kids, stepsKids: steps ? [...steps.children].map(c => (c.getAttribute('data-name')||c.tagName) + ' ' + Math.round(c.getBoundingClientRect().y) + ' ' + Math.round(c.getBoundingClientRect().height)) : null };
  });
  await page.mouse.move(130, 780); await page.mouse.wheel(0, 400); await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/ia-scroll2.png', clip: { x: 0, y: 560, width: 300, height: 480 } }); info.after = await page.evaluate(() => { const t = document.querySelector('.dc-thumb'); return { thumb: t && t.style.translate, first: (document.querySelector('[data-name="Flowchart"] > *') || {}).style?.translate }; });
  return info;
}
