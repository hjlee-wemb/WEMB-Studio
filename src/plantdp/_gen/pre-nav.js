/* 필터 패널 변형(design context) 앞손질 — 변형 컴포넌트가 조건식(JSX)으로 온 것을 실제로 쓰인 상태로 풀어 conv 가 읽게 한다.
   · 건물별(layer2) 의 Tab 은 tab="tab3", BtnCheckbox 는 "active" 로만 쓰인다 → isTab3 = true, isNormal = false
   · id={V ? "node-A" : "node-B"} → data-node-id="A"(쓰인 쪽), `${V ? X : Y}` · src={V ? a : b} · {x === "active" && (…)} 도 같은 식
   실행: node pre-nav.js (dc-nav-*.txt 를 제자리에서 고친다, 여러 번 돌려도 같다) */
'use strict';
const fs = require('fs'), path = require('path');
const TRUTH = { isTab3: true, isNormal: false, isTab2: false };
const strOf = (x) => { x = x.trim(); let m = /^String\.raw`([^`]*)`$/.exec(x); if (m) return m[1]; m = /^"([^"]*)"$/.exec(x); return m ? m[1] : x; };
for (const f of fs.readdirSync(__dirname).filter((n) => /^dc-nav-.*\.txt$/.test(n))) {
  const p = path.join(__dirname, f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/^\s*const (is\w+) = \w+ === "[^"]+";\n/gm, '');
  s = s.replace(/id=\{(is\w+) \? "node-([\d_]+)" : "node-([\d_]+)"\}/g, (m, v, a, b) => 'data-node-id="' + (TRUTH[v] ? a : b).replace('_', ':') + '"');
  s = s.replace(/src=\{(is\w+) \? (\w+) : (\w+)\}/g, (m, v, a, b) => 'src={' + (TRUTH[v] ? a : b) + '}');
  /* 템플릿 리터럴 className */
  s = s.replace(/className=\{`([^`]*(?:`[^`]*`[^`]*)*?)`\}/g, (m, body) => {
    if (body.indexOf('${') < 0) return m;
    const out = body.replace(/\$\{(is\w+) \? (String\.raw`[^`]*`|"[^"]*") : (String\.raw`[^`]*`|"[^"]*")\}/g, (mm, v, a, b) => strOf(TRUTH[v] ? a : b))
      .replace(/font-\["([^"]+)"\]/g, "font-['$1']").replace(/\s+/g, ' ').trim();
    return 'className="' + out + '"';
  });
  s = s.replace(/\{\w+ === "active" && (<img [^>]*\/>)\}/g, '$1');
  /* 타입의 합집합(“a” | “b”) — conv 의 컴포넌트 읽기가 못 넘는다. 쓰인 쪽 하나만 남긴다 */
  s = s.replace(/\?: "active" \| "normal";/g, '?: "active";').replace(/\?: "tab2" \| "tab3";/g, '?: "tab3";');
  /* 라이브러리 변형은 `export default function Navigation1() { return <Navigation className="relative size-full" />; }` 로 감싸 온다
     → 안쪽 Navigation 을 그대로 export default 로 올리고 뿌리 className 을 size-full 로 */
  const wrap = /\nexport default function \w+\(\) \{\n\s*return <(\w+) className="relative size-full" \/>;\n\}\n?/.exec(s);
  if (wrap) {
    const nm = wrap[1];
    s = s.replace(wrap[0], '\n');
    s = s.replace(new RegExp('function ' + nm + '\\(\\{ className, \\w+ = "[^"]+" \\}: \\w+\\) \\{'), 'export default function ' + nm + '() {');
    const at = s.indexOf('export default function ' + nm + '() {');
    const ci = s.indexOf('className={className || "', at);
    if (ci > 0) { const end = s.indexOf('"}', ci); s = s.slice(0, ci) + 'className="relative size-full"' + s.slice(end + 2); }
  }
  if (s !== before) { fs.writeFileSync(p, s); console.log('fixed', f); }
  const left = (s.match(/\bis[A-Z]\w* \?|\$\{(?!img)/g) || []).length;
  if (left) console.log('  ! 남은 조건식', f, left);
}
