/* 운전정보 탭(라이브 층이 그리는 실시간 차트 카드)을 라이브러리가 자를 수 있는 정적 조각으로 떠낸다 → src/ccpp-oper.js
   · 상세 화면을 라이브로 열고 '운전정보' 탭을 눌러 차트가 그려진 DOM 을 그대로 복사한다(지어내지 않는다 — 라이브와 같은 카드 · 차트).
   · 스타일은 라이브 시트에서 카드 · 차트 규칙만 골라 .cc-root → .ccto-root 로 옮긴다(다크 규칙 포함, 등장 애니메이션은 끈다).
   · 라이브러리가 노드 id 로 자르도록 이름(data-name) · id(data-node-id = op:…)를 붙인다.
   실행: node src/ccpp/_gen/pw.js ../../ccpp-assets/_gen/mk-oper.js   (검증 서버 5575) */
async (page) => {
  const fs = require('fs');
  const OUT = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp-oper.js';
  await page.goto('http://localhost:5575/src/ccpp/detail.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1800);
  await page.evaluate(() => { const t = document.querySelector('[data-name="Tab/Operation Info"]'); t.click(); });
  await page.waitForTimeout(2600);
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.cc-frag .cc-opcard')];
    if (!cards.length) return { err: 'no cards' };
    const NM = ['Card/Exhaust Pressure', 'Card/Steam Turbine Values'];
    const CH = ['Chart/Exhaust Pressure', 'Gauge/Turbine Output', 'Gauge/Turbine Speed', 'Gauge/Exhaust Temperature'];
    let ci = 0;
    const html = cards.map((c, i) => {
      const k = c.cloneNode(true);
      k.setAttribute('data-name', NM[i]); k.setAttribute('data-node-id', 'op:' + (i + 1));
      const h4 = k.querySelector('h4'); h4.setAttribute('data-name', 'Title'); h4.setAttribute('data-node-id', 'op:' + (i + 1) + 't');
      k.querySelectorAll('.cc-oprow').forEach((x) => { x.setAttribute('data-name', 'Row'); x.setAttribute('data-node-id', 'op:' + (i + 1) + 'r'); });
      k.querySelectorAll('.cc-ophost').forEach((h) => { const j = ci++; h.setAttribute('data-name', CH[j]); h.setAttribute('data-node-id', 'op:c' + j); h.removeAttribute('data-op'); });
      k.querySelectorAll('.cc-chostbtn, .cc-chartbtn, .cc-chartmenu').forEach((x) => x.remove());
      /* 분자 라이브러리 자리 색인은 요소 id 로 원본 노드를 찾는다 — 이름 붙인 요소마다 id */
      [k, ...k.querySelectorAll('[data-node-id]')].forEach((x) => { x.id = 'ccto-' + x.getAttribute('data-node-id'); });
      return k.outerHTML;
    }).join('');
    const pick = /cc-opcard|cc-oprow|cc-ophost|cc-chart(?![a-z])/;
    const skip = /cc-chartbtn|cc-chartmenu|cc-chost/;
    const css = [];
    [...document.styleSheets].forEach((s) => { let R; try { R = s.cssRules; } catch (e) { return; } [...R].forEach((x) => { if (x.selectorText && pick.test(x.selectorText) && !skip.test(x.selectorText)) css.push(x.cssText); }); });
    return { html, css, n: cards.length, charts: ci };
  });
  if (r.err) return r;
  /* 테마별 규칙(data-theme)은 둘째 시트로 — 다른 장면처럼 라이트가 원본, *_LIGHT_CSS 에 다크 규칙
     (분자 라이브러리 lib/library.mjs lightOrigin 이 이 시트 내용으로 기본 테마를 라이트로 정한다) */
  const moved = r.css.map((s) => s.split('.cc-root').join('.ccto-root'));
  const themed = moved.filter((s) => s.indexOf('data-theme') >= 0);
  const css = moved.filter((s) => s.indexOf('data-theme') < 0).join('\n')
    + '\n.ccto-root .cc-chart{animation:none!important;}'
    + '\n.ccto-root [data-name="Tab Panel/Operation Info"]{position:relative;width:1010px;padding:0;}';
  const body = '<div id="ccto-op:0" data-name="Tab Panel/Operation Info" data-node-id="op:0">' + r.html + '</div>';
  const js = '/* 자동 생성물 — 복합화력 설비정보 디지털트윈 상세 팝업 \'운전정보\' 탭(라이브 차트 카드)의 정적 사본. 에셋 · 분자 라이브러리가 자르는 용도.\n'
    + '   생성기: src/ccpp-assets/_gen/mk-oper.js — 손으로 고치지 말 것. */\n'
    + 'window.CCTO_CSS = ' + JSON.stringify(css) + ';\n'
    + 'window.CCTO_LIGHT_CSS = ' + JSON.stringify(themed.join('\n')) + ';\n'
    + 'window.build_ccto = function (base) { return ' + JSON.stringify(body) + '; };\n';
  fs.writeFileSync(OUT, js);
  return { cards: r.n, charts: r.charts, rules: r.css.length, bytes: js.length };
}
