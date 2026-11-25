/* 새 분자 이름 확정 — 스마트 빌딩 에너지 관리에만 쓰이는 미확정 분자를 이름 제안(원본 레이어 이름 · 규칙) 그대로 확정한다.
   다른 프로젝트의 미확정 분자는 건드리지 않는다. 서버(5510 · wemb-atomic)의 PUT /api/names 를 쓴다(쓰기는 x-wemb-atomic 헤더 필수, node:http).
   실행: node src/bems-assets/_gen/atomic-names.js */
'use strict';
const http = require('http'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..', 'wemb-atomic');
const L = require(path.join(ROOT, 'library', 'library.json'));
const N = require(path.join(ROOT, 'data', 'names.json'));
const FAM = ['bems'];
const set = {};
L.molecules.filter((m) => !N[m.id] && m.families.every((f) => FAM.includes(f))).forEach((m) => {
  const p = m.proposal || {};
  if (!p.name) return;
  const fields = {};
  (p.fields || []).forEach((f) => { if (f.to) fields[f.key] = f.to; });
  set[m.id] = { name: p.name, fields };
});
const body = JSON.stringify({ set, remove: [] });
const req = http.request({ host: '127.0.0.1', port: 5510, path: '/api/names', method: 'PUT', headers: { 'content-type': 'application/json', 'x-wemb-atomic': '1', 'content-length': Buffer.byteLength(body) } }, (res) => {
  let s = ''; res.on('data', (d) => { s += d; }); res.on('end', () => { console.log(res.statusCode, Object.keys(set).length + '개 보냄', s.slice(0, 200)); });
});
req.on('error', (e) => console.error(e.message));
req.end(body);
