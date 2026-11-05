/* STATCOM 생성기 → 이 시안(신사업 관리)으로 옮긴다. 한 번만 돌린다. */
'use strict';
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', '..', 'statcom', '_gen');
const SCREENS = [
  ['1-2634', '1:2634', 'nbw', '재생에너지 사업현황 풍향', 'wind'],
  ['1-3482', '1:3482', 'nbs', '재생에너지 사업현황 태양광', 'solar'],
  ['1-4335', '1:4335', 'nbe', '재생에너지 사업현황 에너지', 'energy'],
  ['1-52', '1:52', 'nbk', '풍향 툴팁 · 인풋', 'wind-input'],
  ['1-912', '1:912', 'nbl', '태양광 툴팁 · 인풋', 'solar-input'],
  ['1-1773', '1:1773', 'nbg', '에너지 툴팁 · 인풋', 'energy-input'],
  ['1-6841', '1:6841', 'nbm', '계측현황', 'measure'],
  ['1-5184', '1:5184', 'nbt', '계측현황 툴팁 풍력', 'measure-wind'],
  ['1-6013', '1:6013', 'nbu', '계측현황 툴팁 태양광', 'measure-solar'],
  ['1-7644', '1:7644', 'nbp', '계측현황 사업 팝업', 'measure-popup'],
  ['1-8494', '1:8494', 'nbo', '해외사업', 'overseas'],
];
let c = fs.readFileSync(path.join(SRC, 'conv.js'), 'utf8');
const a = c.indexOf('const SCREENS = ['), b = c.indexOf('];', a) + 2;
c = c.slice(0, a) + 'const SCREENS = [\n' + SCREENS.map(([key, node, px, name, page]) =>
  "  { key: '" + key + "', node: '" + node + "', px: '" + px + "', name: '" + name + "', out: 'newbiz-" + page + "', page: '" + page + "', meta: ['meta-page.xml'] },").join('\n') + '\n];' + c.slice(b);
c = c.replace(/^const GRAFT = .*$/m, 'const GRAFT = {};');
c = c.replace(/const RING_STROKE = \[[^\]]*\];/, 'const RING_STROKE = [];');
c = c.replace("if (fam === 'Noto_Sans_KR' || fam === 'Brand_New_Hyosung') fam = 'Pretendard';", "if (fam === 'SUIT' || fam === 'Noto_Sans_KR') fam = 'Pretendard';");
c = c.replace(/STATCOM HMI 디지털 트윈/g, '신사업 관리 대시보드');
c = c.split('statcom-live.js').join('newbiz-live.js').split('src/statcom').join('src/newbiz').split("'src', 'statcom'").join("'src', 'newbiz'").split('initStatcom').join('initNewbiz');
fs.writeFileSync(path.join(__dirname, 'conv.js'), c);
for (const f of ['light.js']) fs.copyFileSync(path.join(SRC, f), path.join(__dirname, f));
const left = c.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /statcom/i.test(l) && !/^\s*(\/\*|\*)/.test(l));
console.log('남은 statcom 언급', left.length); left.slice(0, 12).forEach(([n, l]) => console.log(n, l.slice(0, 140)));
/* dl.js 화면 목록 */
let d = fs.readFileSync(path.join(__dirname, 'dl.js'), 'utf8');
d = d.replace(/\['1-426'[^\]]*\]/, JSON.stringify(SCREENS.map((s) => s[0])));
fs.writeFileSync(path.join(__dirname, 'dl.js'), d);
/* 메타데이터 */
const RES = 'C:/Users/wemb/.claude/projects/C--Users-wemb/2cb4295e-82bc-4f2b-897a-569d13892f42/tool-results';
const metas = fs.readdirSync(RES).filter((f) => /get_metadata/.test(f)).map((f) => path.join(RES, f)).sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs);
const xml = JSON.parse(fs.readFileSync(metas[0], 'utf8')).map((x) => x.text || '').join('\n');
if (!/Screen\/Overseas Business/.test(xml)) throw new Error('최신 메타데이터가 아니다 ' + metas[0]);
fs.writeFileSync(path.join(__dirname, 'meta-page.xml'), xml);
console.log('meta', xml.length);
