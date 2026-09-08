/* 생성물 HTML 에 자바스크립트 조각이 글자로 새어 나온 곳이 있는지 훑는다.
   (조건식·삼항·prop 이름이 화면에 찍히던 버그를 다시는 놓치지 않으려고) */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..');
const PATTERNS = [
  ['조건식', /&amp;&amp;|&&/],
  ['비교식', /===|!==/],
  ['삼항', /\?\s*"[^"]*"\s*:/],
  ['미정의', /\bundefined\b/],
  ['템플릿', /\$\{/],
];
let bad = 0;
for (const f of fs.readdirSync(SRC).filter((x) => /^hana-.*\.js$/.test(x) && x !== 'hana-live.js')) {
  const s = fs.readFileSync(path.join(SRC, f), 'utf8');
  const m = /\n  var HTML = ("(?:[^"\\]|\\.)*");\n/.exec(s);
  if (!m) { console.log(f, '— HTML 못 찾음'); continue; }
  const html = JSON.parse(m[1]);
  /* 태그 밖 텍스트만 본다(속성 안의 값은 정상) */
  const textOnly = html.replace(/<[^>]*>/g, '');
  const hits = [];
  for (const [name, re] of PATTERNS) {
    const g = new RegExp(re.source, 'g');
    let x;
    while ((x = g.exec(textOnly))) {
      const around = textOnly.slice(Math.max(0, x.index - 40), x.index + 40).replace(/\s+/g, ' ').trim();
      hits.push(name + ': ' + around);
      if (hits.length > 4) break;
    }
  }
  if (hits.length) { bad++; console.log('\n!! ' + f); hits.forEach((h) => console.log('   ' + h)); }
}
console.log(bad ? '\n새어 나온 화면 ' + bad + '개' : '\n새어 나온 조각 없음 — 모든 화면 깨끗');
