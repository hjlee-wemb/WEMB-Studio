/* 이벤트 로그·이벤트 리스트의 발생시각을 '열 때마다' 최근으로 다시 찍는다.
   ─────────────────────────────────────────────────────────────────────────────
   시안에 박힌 발생시각은 `2025-00-00 00:00:00` 자리표시자다. 그대로 두면 표가
   오지 않은 날짜를 가리켜, 살아 움직이는 관제 화면이 아니라 오래된 시안처럼 보인다.
   → 화면을 그릴 때 맨 윗줄이 '방금'이 되도록 표를 옮겨 온다(src/recent-time.js 가 계산).

   어디를 만지나 — 이 시안의 시각 글자는 딱 네 곳뿐이다(14화면 전수 확인).
     · `[data-name="Event Log"]`        하단 이벤트 현황 바 (9화면 × 5줄)      → 다시 찍는다
     · `[data-name^="Widget/Event Log"]` 이벤트 로그 위젯 (이벤트·상면·보안)     → 다시 찍는다
     · `[data-name="X Axis"] … Tick`    꺾은선 x축 눈금(08:00 …)               → **건드리지 않는다**
     · `[data-name="Timestamp"]`        머리글 시계                            → **건드리지 않는다**
   앞의 둘만 골라 넘기므로 뒤의 둘은 애초에 걸리지 않는다.

   보안시스템은 한 칸에 `2025-00-00 00:00:00  [Warning] SERVICE ALERT: …` 처럼
   시각과 내용이 같이 있다 → `prefix: true` 로 **앞머리 시각만** 갈아 끼운다.

   숨은 줄(변형으로 펼쳐 둔 status=hover/active 행)은 건너뛴다 — 세어 두면 보이는 줄의
   시간 간격이 그만큼 벌어져 어색해진다.

   언제 부르나 — initHana 안, 즉 '패널편집'이 글자 기본값을 잡기(__dtRecaptureDefaults) 전이다.
   그래야 새로 찍은 시각이 기본값이 되고, 손으로 고쳐 둔 시각은 그 캡처가 덮어 준다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
s = s.split(CR + NL).join(NL);
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('installRestamp') >= 0) { console.log('already patched'); process.exit(0); }

const INS = '  /* ══════════════════ 7. 설치 ══════════════════ */';
if (s.indexOf(INS) < 0) { console.error('install anchor not found'); process.exit(1); }

put(INS, [
  '  /* ══════════════════ 6-v. 발생시각 — 열 때마다 최근으로 다시 찍는다 ══════════════════ */',
  '  function installRestamp(root) {',
  '    if (typeof window.wembRestampTimes !== \'function\') return;',
  '    /* 변형으로 펼쳐 둔 숨은 행은 건너뛴다 — 세어 두면 보이는 줄의 간격이 그만큼 벌어진다.',
  '       **자리로 재면 안 된다**(offsetParent). 스튜디오는 런처가 덮고 있는 동안 화면을 그려서,',
  '       그때는 멀쩡한 줄까지 전부 \'안 보임\'으로 잡혀 한 줄도 안 고쳐진다.',
  '       그래서 칸에서 판까지만 거슬러 올라가며 hidden 인지 본다(자리와 무관하다). */',
  '    var skip = function (el, box) {',
  '      for (var e = el; e && e !== box; e = e.parentElement) {',
  "        if (e.hasAttribute && e.hasAttribute('hidden')) return true;",
  "        if (e.style && e.style.display === 'none') return true;",
  '      }',
  '      return false;',
  '    };',
  '    all(root, \'[data-name="Event Log"],[data-name^="Widget/Event Log"]\').forEach(function (box) {',
  "      var cells = all(box, 'p').filter(function (p) { return !skip(p, box); });",
  '      if (!cells.length) return;',
  '      try { window.wembRestampTimes(cells, { prefix: true }); } catch (e) { }',
  '    });',
  '  }',
  '',
  INS,
].join('\n'));

/* 설치 목록 맨 앞쪽에 — 다른 연출이 글자를 만지기 전에 시각부터 바로잡는다.
   `markHot(root)` 은 installVariants 안에도 같은 모양으로 있으니(상태를 바꿀 때마다 다시 건다)
   **두 줄로 묶어** initHana 쪽만 집는다. 한 줄만 보면 엉뚱한 자리에 들어가
   변형을 바꿀 때마다 표가 다시 찍힌다. */
const CALL = [
  '    try { markHot(root); } catch (e) { }',
  '    try { installClock(root, st); } catch (e) { }',
].join('\n');
if (s.indexOf(CALL) < 0) { console.error('install call anchor not found'); process.exit(1); }
put(CALL, [
  '    try { markHot(root); } catch (e) { }',
  '    try { installRestamp(root); } catch (e) { }',
  '    try { installClock(root, st); } catch (e) { }',
].join('\n'));

fs.writeFileSync(F, s.split(NL).join(CR + NL));
console.log('patched: event log timestamps restamped on every open');
