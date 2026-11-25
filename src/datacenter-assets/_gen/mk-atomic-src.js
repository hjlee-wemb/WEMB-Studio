/* 분자 라이브러리(wemb-atomic) 원본 사본 만들기 — 데이터센터 통합 모니터링.
   wemb-atomic 은 파일 하나 = 페이지 하나(id = 파일 이름)로 본다.
   · 장면 빌더 9개(build_dmm · dmp · dmw · dma · dme · dmc · dmi · dms · dmx)는 그대로 복사한다.
     팝업 모듈의 합성 장면(build_dmp_<장면> — 전력 계통도 위에 팝업을 얹음)은 wemb-atomic 쪽(atomic-catalog.mjs)에서 뺀다.
   · 그림 폴더는 미리보기 html · _gen 을 빼고 복사한다.
   실행: node src/datacenter-assets/_gen/mk-atomic-src.js → wemb-atomic 에서 npm run build · npm test → 서버 재시작 · 측정 → npm run export */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const DST = path.join(ROOT, 'wemb-atomic', 'sources', 'WEMB-Studio', 'src');
const FILES = ['main', 'power', 'worker', 'asset', 'equipment', 'card', 'compact', 'search', 'scenario', 'live'].map((s) => 'datacenter-' + s);
FILES.forEach((f) => fs.copyFileSync(path.join(ROOT, 'src', f + '.js'), path.join(DST, f + '.js')));
let n = 0;
const IMG = path.join(ROOT, 'src', 'datacenter'), DIMG = path.join(DST, 'datacenter');
fs.mkdirSync(DIMG, { recursive: true });
fs.readdirSync(IMG).forEach((f) => { const p = path.join(IMG, f); if (fs.statSync(p).isFile() && !/\.html$/.test(f)) { fs.copyFileSync(p, path.join(DIMG, f)); n++; } });
console.log('빌더', FILES.length, '· 그림', n);
