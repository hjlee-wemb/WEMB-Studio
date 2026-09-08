/* 생성물이 가리키는 에셋이 실제로 있는지 확인한다(404 잡기). */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..');
const ART = path.join(__dirname, '..');
const have = new Set(fs.readdirSync(ART).filter((f) => /\.(svg|png|jpg|jpeg|webp)$/i.test(f)));
const missing = new Map();
for (const f of fs.readdirSync(SRC).filter((x) => /^hana-.*\.js$/.test(x))) {
  const s = fs.readFileSync(path.join(SRC, f), 'utf8');
  for (const m of s.matchAll(/\{\{B\}\}([\w.\-]+\.(?:svg|png|jpg|jpeg|webp))/g)) {
    if (!have.has(m[1])) {
      if (!missing.has(m[1])) missing.set(m[1], new Set());
      missing.get(m[1]).add(f);
    }
  }
}
if (!missing.size) console.log('all referenced assets exist (' + have.size + ' files)');
else {
  console.log('MISSING', missing.size, 'of', have.size);
  [...missing.entries()].slice(0, 40).forEach(([k, v]) => console.log(' ', k, '←', [...v].join(',')));
}
