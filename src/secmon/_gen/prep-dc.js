/* 이 세션 tool-results 의 get_design_context 파일들을 화면 키별 dc-<key>.txt 로 옮기고,
   get_metadata(페이지 전체 + 마스터 2개) 를 화면마다 meta-<key>.xml 로 만든다.
   실행: node src/datacenter/_gen/prep-dc.js <세션 id> */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const SID = process.argv[2];
const DIR = 'C:/Users/wemb/.claude/projects/C--Users-wemb/' + SID + '/tool-results';
const KEYS = ['1-3', '96-7914', '56-3639', '42-4769', '50-5951', '63-3639', '66-10016', '76-4561', '77-6526', '84-8482', '22-770'];
const files = fs.readdirSync(DIR).map((f) => path.join(DIR, f)).sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
const done = {};
const metas = [];
for (const f of files) {
  const b = path.basename(f);
  if (/get_design_context/.test(b)) {
    let items; try { items = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
    const t = items.filter((x) => x && typeof x.text === 'string').map((x) => x.text).join('\n');
    const ex = t.indexOf('export default function');
    const m = ex >= 0 && t.slice(ex).match(/return \(\s*<div[^>]*data-node-id="([^"]+)"/);
    if (!m) continue;
    const key = m[1].replace(':', '-');
    if (!KEYS.includes(key)) continue;
    cp.execFileSync('node', [path.join(__dirname, 'save-dc.js'), f, key], { stdio: 'inherit' });
    done[key] = 1;
  } else if (/get_metadata/.test(b)) {
    let items; try { items = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
    metas.push({ f: b, t: items.map((x) => x.text || '').join('') });
  }
}
/* 최신 페이지 메타(0:1, 이름 정리 뒤) + 마스터(50:5950, 42:3226) */
const page = metas.filter((m) => m.t.indexOf('<canvas id="0:1"') >= 0).pop();
const masters = metas.filter((m) => /^<symbol id="(50:5950|42:3226)"/.test(m.t.trim()));
const flat = (t) => t.split('\n').map((l) => l.trim()).filter((l) => /^<\w[\w-]* id="/.test(l)).map((l) => l.replace(/>$/, ' />').replace(/\s*\/\s*\/>$/, ' />'));
const lines = flat(page.t).concat(...masters.map((m) => flat(m.t)));
const xml = '<canvas>\n' + lines.join('\n') + '\n</canvas>\n';
for (const k of KEYS) fs.writeFileSync(path.join(__dirname, 'meta-' + k + '.xml'), xml);
fs.writeFileSync(path.join(__dirname, 'meta-page.xml'), xml);
console.log('dc', Object.keys(done).length, '/', KEYS.length, 'missing', KEYS.filter((k) => !done[k]).join(','), '| meta lines', lines.length, 'masters', masters.length);
