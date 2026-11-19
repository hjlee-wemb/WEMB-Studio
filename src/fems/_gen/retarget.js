/* 복합화력(ccpp) 생성기 도구를 스마트팩토리 에너지관리(fems) 로 옮긴다 — 한 번만 돌린다.
   실행: node retarget.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const rep = (s) => s
  .split('r7V2rTKcUto2Yd1qL4XSfZ').join('FwLj96v9IlQSHRPURiJouD')
  .split('Digital Twin: Combined Cycle Power Plant').join('Digital Twin: Smart Factory Energy Management')
  .split('digital-twin-combined-cycle-power-plant').join('digital-twin-smart-factory-energy-management')
  .split('복합화력 설비정보 디지털트윈').join('스마트팩토리 에너지관리 디지털트윈')
  .split('복합화력 설비정보').join('스마트팩토리 에너지관리')
  .split('ccpp-tabs.js').join('fems-frags.js').split('CC_TABS').join('FM_FRAGS')
  .split('initCcpp').join('initFems').split('disposeCcpp').join('disposeFems')
  .split('ccpp').join('fems').split('Ccpp').join('Fems').split('CCPP').join('FEMS')
  .split('localhost:5575').join('localhost:5580').split("'5575'").join("'5580'").split(' 5575').join(' 5580');
for (const f of fs.readdirSync(G)) {
  if (!/\.(js|ps1|md)$/.test(f) || f === 'retarget.js' || f === 'save-dc.js') continue;
  const p = path.join(G, f);
  const o = fs.readFileSync(p, 'utf8');
  const s = rep(o);
  if (s !== o) { fs.writeFileSync(p, s); console.log('retarget', f); }
}

/* conv.js 의 SCREENS 표 — 팝업 4장은 종합 현황(fmm) 위에 얹는다(Figma 는 팝업만 그려 두었다, 1920x1080 한가운데 정수 픽셀) */
const cp = path.join(G, 'conv.js');
let c = fs.readFileSync(cp, 'utf8');
const pop = (w, h) => ({ left: Math.floor((1920 - w) / 2), top: Math.floor((1080 - h) / 2), w, h });
const SC = [
  { key: '2141-505', node: '2141:505', px: 'fmm', name: '종합 현황', page: 'main' },
  { key: '2142-296', node: '2142:296', px: 'fmd', name: '계통도', page: 'diagram', ov: pop(1900, 1070) },
  { key: '2143-549', node: '2143:549', px: 'fme', name: '이벤트 브라우저', page: 'event', ov: pop(1310, 460) },
  { key: '2144-543', node: '2144:543', px: 'fms', name: '태양광 PV', page: 'solar', ov: pop(1417, 445) },
  { key: '2144-1312', node: '2144:1312', px: 'fmq', name: '장비 상세', page: 'equipment', ov: pop(1080, 805) },
];
const lines = SC.map((x) => "  { key: '" + x.key + "', node: '" + x.node + "', px: '" + x.px + "', name: '" + x.name + "', out: 'fems-" + x.page + "', page: '" + x.page + "', meta: ['meta-" + x.key + ".xml']"
  + (x.ov ? ", overlay: { base: 'fmm', build: 'build_fmm_" + x.page + "', left: " + x.ov.left + ', top: ' + x.ov.top + ', w: ' + x.ov.w + ', h: ' + x.ov.h + ' }' : '') + ' },');
lines.push('  /* 이벤트 로그 펼친 판 — 바(Bar (Collapsed)) 의 펼침 단추를 누르면 live 가 이 조각을 바 위로 펼친다(src/fems-frags.js) */');
lines.push("  { key: '2141-967', node: '2141:967', px: 'fmx', name: '이벤트 로그 펼침', frag: 'event-log', meta: ['meta-2141-967.xml'] },");
c = c.replace(/const SCREENS = \[\n[\s\S]*?\n\];/, 'const SCREENS = [\n' + lines.join('\n') + '\n];');
/* ccpp 전용 노드 규칙은 걷어 낸다 */
c = c.replace(/const NODE_CSS = \[\n[\s\S]*?\n\];/, 'const NODE_CSS = [\n];');
fs.writeFileSync(cp, c);
console.log('conv SCREENS', SC.length + 1);

/* dl.js 화면 목록 */
const dp = path.join(G, 'dl.js');
let d = fs.readFileSync(dp, 'utf8');
d = d.replace(/\["427-674"[^\]]*\]/, JSON.stringify(SC.map((x) => x.key).concat(['2141-967'])));
fs.writeFileSync(dp, d);

fs.writeFileSync(path.join(G, 'meta-page.xml'), '<canvas>\n</canvas>\n');
fs.writeFileSync(path.join(G, 'screen-css.json'), '{}\n');
fs.writeFileSync(path.join(G, 'asset-map.json'), '{}\n');
fs.writeFileSync(path.join(G, 'dark-assets.json'), '{}\n');
console.log('done');
