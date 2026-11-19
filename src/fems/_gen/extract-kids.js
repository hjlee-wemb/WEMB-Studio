/* use_figma 로 받은 '@@kids {…}'(부모 → 보이는 자식 레이어명 순서표)를 세션 기록에서 꺼내 kids.json 으로. 실행: node extract-kids.js <세션 id> */
'use strict';
const fs = require('fs'), path = require('path');
const J = 'C:/Users/wemb/.claude/projects/C--Users-wemb/' + process.argv[2] + '.jsonl';
let found = null;
for (const ln of fs.readFileSync(J, 'utf8').split('\n')) {
  if (ln.indexOf('@@kids ') < 0) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  const c = o.message && o.message.content; if (!Array.isArray(c)) continue;
  for (const it of c) {
    if (it.type !== 'tool_result') continue;
    const parts = Array.isArray(it.content) ? it.content : [{ type: 'text', text: it.content }];
    for (const p of parts) if (p && p.type === 'text' && p.text.indexOf('@@kids ') === 0) found = p.text.slice(7);
  }
}
if (!found) throw new Error('@@kids 없음');
fs.writeFileSync(path.join(__dirname, 'kids.json'), JSON.stringify(JSON.parse(found), null, 1));
console.log('kids.json', Object.keys(JSON.parse(found)).length, '화면');
