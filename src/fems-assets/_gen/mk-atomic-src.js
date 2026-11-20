/* 분자 라이브러리(wemb-atomic) 원본 사본 만들기 — 스마트팩토리 에너지관리 + 통합 운영 원뷰.
   wemb-atomic 은 파일 하나 = 페이지 하나(id = 파일 이름)로 본다.
   · FEMS: 장면 빌더 5개(build_fmm · fmd · fme · fms · fmq)는 그대로. 팝업 모듈의 합성 장면(build_fmm_<장면> — 종합 현황 위에 팝업을 얹음)은
     wemb-atomic 쪽(atomic-catalog.mjs)에서 뺀다. 펼친 이벤트 로그 조각(src/fems-frags.js 의 FM_FRAGS['event-log'])은
     빌더가 없는 객체라 사본에서만 fems-frag-event-log.js(build_fmx · FMX_CSS · FMX_LIGHT_CSS)로 나눈다.
   · 원뷰: 장면 11장 모두 단독 화면이라 그대로 복사.
   그림 폴더는 미리보기 html · _gen 을 빼고 복사한다.
   실행: node src/fems-assets/_gen/mk-atomic-src.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const DST = path.join(ROOT, 'wemb-atomic', 'sources', 'WEMB-Studio', 'src');
const FEMS = ['fems-main', 'fems-diagram', 'fems-event', 'fems-solar', 'fems-equipment', 'fems-live'];
const OV = ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'].map((s) => 'oneview-' + s).concat(['oneview-live']);
FEMS.concat(OV).forEach((f) => fs.copyFileSync(path.join(ROOT, 'src', f + '.js'), path.join(DST, f + '.js')));

global.window = {};
require(path.join(ROOT, 'src', 'fems-frags.js'));
const F = global.window.FM_FRAGS['event-log'], P = F.px.toUpperCase();
const js = '/* 자동 생성물 — 분자 라이브러리용 사본. 스튜디오 원본은 src/fems-frags.js 의 FM_FRAGS["event-log"] (' + F.name + ').\n'
  + '   생성기: WEMB Studio/src/fems-assets/_gen/mk-atomic-src.js */\n'
  + 'window.' + P + '_CSS = ' + JSON.stringify(F.css) + ';\n'
  + 'window.' + P + '_LIGHT_CSS = ' + JSON.stringify(F.light) + ';\n'
  + 'window.build_' + F.px + ' = function (base) { return ' + JSON.stringify(F.html) + ".split('{{B}}').join(base || 'src/fems/'); };\n";
fs.writeFileSync(path.join(DST, 'fems-frag-event-log.js'), js);
console.log('fems-frag-event-log.js', F.px, F.html.length);

let n = 0;
['fems', 'oneview'].forEach((dir) => {
  const IMG = path.join(ROOT, 'src', dir), DIMG = path.join(DST, dir);
  fs.mkdirSync(DIMG, { recursive: true });
  fs.readdirSync(IMG).forEach((f) => { const p = path.join(IMG, f); if (fs.statSync(p).isFile() && !/\.html$/.test(f)) { fs.copyFileSync(p, path.join(DIMG, f)); n++; } });
});
console.log('빌더', FEMS.length + OV.length, '· 그림', n);
