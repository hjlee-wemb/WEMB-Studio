/* 한진에서 물려온 이벤트 패널 규칙(고정 -269px 이동)을 걷어낸다.
   이 시안은 화면마다 판이 화면 아래로 삐져나온 양이 달라서, 재서 정한 --hn-lift 로 움직인다
   (규칙은 patch-live.js 가 넣는 '이 시안' 묶음에 있다).
   또한 원본 판에는 `translateX(-50%)` 가 걸려 있어 transform 을 덮으면 가로 정렬이 깨진다
   → 그쪽은 CSS `translate` 속성을 쓴다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');
/* 이 파일은 CRLF 다(한진 원본을 그대로 물려받았다) — 다룰 때만 LF 로 펴고 쓸 때 되돌린다 */
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
const CRLF = s.indexOf(CR + NL) >= 0;
if (CRLF) s = s.split(CR + NL).join(NL);

const OLD = [
  "    /* 이벤트 현황 패널 펼침/접힘 —",
  "       원본은 패널(1840x330)이 bottom:-269px 로 내려가 머리글만 보이는 '접힌' 상태다.",
  "       펼치면 단계별 차량현황 위로 올라오므로, 서랍처럼 읽히도록 그때만 위로 올리고 뒤를 흐린다",
  "       (접힌 상태의 그림은 Figma 원본 그대로 두기 위해 .hn-open 에만 건다). */",
  "    '.hn-root .hn-eventlog{transition:transform .42s cubic-bezier(.22,.9,.24,1);will-change:transform;}',",
  "    '.hn-root .hn-eventlog.hn-open{transform:translate(-50%,-269px);z-index:40;'",
  "    + '-webkit-backdrop-filter:blur(14px) saturate(1.1);backdrop-filter:blur(14px) saturate(1.1);'",
  "    + 'box-shadow:0 -18px 40px rgba(0,0,0,.45);}',",
  '    \'.hn-root[data-theme="light"] .hn-eventlog.hn-open{box-shadow:0 -18px 40px rgba(30,45,80,.18);}\',',
].join('\n');

if (s.indexOf(OLD) < 0) { console.error('old eventlog block not found'); process.exit(1); }
s = s.replace(OLD, () => "    /* 이벤트 현황 패널 — 규칙은 아래 '이 시안' 묶음에 있다(재서 정한 --hn-lift). */");
fs.writeFileSync(F, CRLF ? s.split(NL).join(CR + NL) : s);
console.log('patched: removed inherited eventlog rule');
