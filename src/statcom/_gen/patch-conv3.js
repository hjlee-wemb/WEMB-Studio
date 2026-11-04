/* 고침 3
   ① 글자 레이어 이름표(use_figma 로 읽음) — design context 는 글자 data-name 을 안 준다. Value · Label · Unit 이 class/id 로 남게.
   ② GRAFT — 미니맵 접기/펴기: 메인(닫힘 상태 원본)엔 다른 화면의 Minimap 을, 나머지엔 메인의 Minimap Tab 을 감춰 심는다(새로 그리지 않는다).
   ③ 말풍선 글자는 p 여러 줄이라 줄높이를 글자 상자 높이로 박으면 안 된다(screen-css). 실행: node patch-conv3.js → node mk-meta.js → node mk-screen-css.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const NAMES = {
  'Product Title': '1:430', Date: '58:5276', Time: '58:5277,1:1661,1:1674,1:1687,1:1700,1:1713,1:1726,1:1739,1:1752,1:1765',
  Text: '1:2107,1:650,1:665,1:1410,1:1427,1:1777', Caption: '1:2108,1:654,1:657,1:660,1:1778',
  Title: '1:662,1:697,1:707,1:725,1:751,1:768,1:800,1:201,1:236,1:832,1:851,1:856,1:965,1:1328,278:7538,1:1359,1:1383,1:1387,1:1397,1:1406,1:1444,1:1452,1:1466,1:1486,1:1513,1:1534,1:1549,1:1579,1:1595,1:1837,1:1872,1:1895,1:1900,1:1633,1:1659,1:1672,1:1685,1:1698,1:1711,1:1724,1:1737,1:1750,1:1763',
  'Label/Lagging': '1:670', 'Label/Zero': '1:671', 'Label/Leading': '1:672',
  Unit: '1:680,1:691,1:703,1:713,1:718,1:723,1:732,1:737,1:742,1:766,1:775,1:839,1:844,1:849,1:1335,1:1340,1:1345,1:1350,278:7675,1:1366,1:1371,1:1376,1:1381,1:1394,1:1404,1:1450,1:1532,1:1540,278:7681,278:7689',
  Ratio: '1:684,1:695', Total: '1:790,1:1420,1:1437,1:1511',
  'Tooltip Label': '1:1785,1:1799,1:1813,1:1827', 'Step/Transport': '1:1786,1:1800,1:1814,1:1828', 'Step/Carry In': '1:1787,1:1801,1:1815,1:1829',
  'Step/Install': '1:1788,1:1802,1:1816,1:1830', 'Step/Assemble': '1:1789,1:1803,1:1817,1:1831',
  'Current Time': '1:1868', 'Total Time': '1:1869', Description: '1:1901', 'Button/Confirm All': '1:1634',
  Message: '1:1663,1:1676,1:1689,1:1702,1:1715,1:1728,1:1741,1:1754,1:1767',
  Value: '1:440,1:447,1:679,1:690,1:702,1:712,1:717,1:722,1:731,1:736,1:741,1:757,1:761,1:765,1:774,1:779,1:783,1:789,1:794,1:798,1:819,1:823,1:210,1:217,1:222,1:227,1:232,1:245,1:252,1:257,1:262,1:267,1:838,1:843,1:848,1:859,1:862,1:865,1:968,1:971,1:1302,1:1308,1:1314,1:1320,1:1326,1:1334,1:1339,1:1344,1:1349,278:7636,278:7645,278:7683,278:7691,1:1365,1:1370,1:1375,1:1380,1:1393,1:1403,1:1415,1:1419,1:1424,1:1432,1:1436,1:1441,1:1449,1:1457,1:1472,1:1476,1:1480,1:1484,1:1492,1:1496,1:1500,1:1506,1:1510,1:1519,1:1523,1:1527,1:1531,1:1539,1:1555,1:1559,1:1563,1:1567,1:1573,1:1577,1:1585,1:1589,1:1593,1:1601,1:1605,1:1609,1:1613,1:1619,1:1623,1:1906,1:1910,1:1914,1:1641,1:1645,1:1649',
};
const map = {};
Object.keys(NAMES).forEach((n) => NAMES[n].split(',').forEach((id) => { map[id] = n; }));
fs.writeFileSync(path.join(__dirname, 'text-names.json'), JSON.stringify(map));

/* mk-meta — 이름을 넣는다(표에 없는 글자는 Label) */
const mp = path.join(__dirname, 'mk-meta.js');
let m = fs.readFileSync(mp, 'utf8');
if (!m.includes('text-names.json')) {
  m = m.replace("const lines = T.split(' ').map((e) => { const [k, v] = e.split('='); const [w, h] = v.split(','); return '<text id=\"' + k + '\" name=\"\" width",
    "const NM = JSON.parse(fs.readFileSync(path.join(__dirname, 'text-names.json'), 'utf8'));\nconst lines = T.split(' ').map((e) => { const [k, v] = e.split('='); const [w, h] = v.split(','); return '<text id=\"' + k + '\" name=\"' + (NM[k.split(';').pop()] || 'Label') + '\" width");
  fs.writeFileSync(mp, m);
}

/* conv — GRAFT */
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (!s.includes("key: 'minimap'")) {
  const tab = (into) => [{ key: 'mm-tab', from: '1-313', node: '1:424', into }];
  const G = {
    'statcom-main': [{ key: 'minimap', from: '1-187', node: '1:192', into: '1:313' }],
    'statcom-statcom': tab('1:187'), 'statcom-power': tab('1:271'), 'statcom-valve': tab('1:194'), 'statcom-cooling': tab('1:278'),
    'statcom-supply': tab('1:286'), 'statcom-safety': tab('1:293'), 'statcom-simulation': tab('1:300'), 'statcom-alarm': tab('1:307'),
  };
  s = s.replace('const GRAFT = {};', () => 'const GRAFT = ' + JSON.stringify(G) + ';');
  fs.writeFileSync(p, s);
}
console.log('ok');
