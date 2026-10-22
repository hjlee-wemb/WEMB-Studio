/* ── 분자 라이브러리 검색 ──
   작업자는 한글로 찾는다('알람', '차트', '표'). 라이브러리 이름 · 분류는 표준 영어 어휘(Alarm · Chart · Table)라
   같은 뜻 묶음(GROUPS)으로 서로 이어 준다. 묶음은 검색에만 쓰고 화면에 이름으로 보이지 않는다.

   찾는 곳마다 무게가 다르다 — 이름 · 분류가 맞으면 맨 앞, 화면 문구에만 있으면 뒤.
   맞는 정도: 낱말 그대로 1 · 낱말 앞부분 0.8 · 낱말 중간 0.5. 한 글자 한글('표' · '비')과 세 글자 이하 영문은
   낱말 그대로일 때만 맞는다 — '표'가 '지표'에, 'tab'이 'table'에 걸리지 않게.
   여러 낱말을 띄어 쓰면 모두 맞아야 한다. */

const GROUPS = [
  ['알람', '경보', '알림', 'alarm', 'alert'],
  ['경고', 'warning'],
  ['이벤트', 'event'],
  ['차트', '그래프', 'chart', 'graph', 'plot', 'trend', 'series'],
  ['막대', 'bar'],
  ['도넛', '원형', 'donut', 'pie'],
  ['게이지', '계기', 'gauge', 'meter', 'dial'],
  ['표', '테이블', 'table', 'grid'],
  ['행', '줄', 'row'],
  ['열', 'column', 'cell'],
  ['머리글', '헤더', 'header', 'head'],
  ['탭', 'tab'],
  ['제목', '타이틀', 'title', 'heading'],
  ['배지', '뱃지', 'badge', 'chip', 'tag'],
  ['카드', 'card'],
  ['패널', 'panel'],
  ['위젯', 'widget'],
  ['날짜', '일자', '달력', 'date', 'calendar'],
  ['시간', '시각', '시계', 'time', 'timestamp', 'clock'],
  ['버튼', 'button', 'action'],
  ['메뉴', '내비게이션', '네비게이션', 'menu', 'nav', 'navigation', 'navigator'],
  ['아이콘', '심볼', 'icon', 'symbol'],
  ['범례', 'legend'],
  ['검색', '찾기', 'search', 'find'],
  ['상태', 'status', 'state'],
  ['목록', '리스트', 'list'],
  ['지도', '맵', 'map'],
  ['토글', '스위치', 'toggle', 'switch'],
  ['필터', 'filter'],
  ['팝업', '대화상자', '다이얼로그', '모달', 'popup', 'dialog', 'modal'],
  ['로그', '기록', '이력', 'log', 'history'],
  ['카메라', 'cctv', 'camera'],
  ['온도', 'temperature', 'temp'],
  ['습도', 'humidity'],
  ['전력', '전원', 'power'],
  ['전압', 'voltage'],
  ['전류', 'current'],
  ['층', 'floor'],
  ['도크', 'dock'],
  ['지표', 'kpi', 'metric', 'measurement', 'indicator'],
  ['값', '수치', 'value'],
  ['라벨', '레이블', 'label'],
  ['브랜드', '로고', 'brand', 'logo'],
  ['진행', '단계', 'progress', 'step', 'stage'],
  ['툴바', '도구 모음', 'toolbar'],
  ['이동 경로', '브레드크럼', 'breadcrumb'],
  ['구성도', '토폴로지', 'topology'],
  ['건수', '개수', '카운트', 'count', 'total'],
  ['사용률', 'usage', 'utilization'],
  ['요약', 'summary'],
  ['닫기', 'close'],
  ['설정', 'setting', 'settings', 'gear'],
  ['사용자', '사람', 'user', 'person'],
  ['홈', 'home'],
  ['잠금', '비밀번호', 'lock', 'password'],
  ['로그아웃', 'logout'],
  ['확대', 'zoom in', 'zoom-in'],
  ['축소', 'zoom out', 'zoom-out'],
  ['화재', '불', 'fire'],
  ['날씨', 'weather'],
  ['비', 'rain'],
  ['바람', 'wind'],
  ['센서', 'sensor'],
  ['출입', '게이트', 'gate', 'door'],
  ['위치', '부지', 'site', 'location', 'marker', 'pin'],
  ['배경', 'background'],
  ['화살표', 'arrow'],
  ['서버', '랙', 'server', 'rack'],
  ['네트워크', 'network'],
  ['보안', 'security'],
  ['설비', '장비', '기기', 'device', 'equipment', 'facility'],
  ['콜아웃', '말풍선', 'callout', 'bubble'],
].map((g) => g.map((w) => w.toLowerCase()));

const SPLIT = /[\s/·,()[\]{}_\-:.|›>…"'“”‘’]+/;
const HANGUL1 = /^[ㄱ-힝]$/;
const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/** 짧은 말 — 한 글자 한글 · 세 글자 이하 영문. 낱말 그대로일 때만 맞는다 */
const isShort = (t) => HANGUL1.test(t) || (/^[a-z0-9]+$/.test(t) && t.length <= 3);
/** 낱말 하나가 같은 뜻 묶음으로 넓어진 말들. 짧은 말이 아니면 묶음 말의 앞부분도 받는다('이벤' → 이벤트) — 'tab'은 table 묶음으로 가지 않는다 */
function expand(t) {
  const out = new Set();
  for (const g of GROUPS) {
    if (g.some((w) => w === t || (!isShort(t) && w.startsWith(t)))) g.forEach((w) => w !== t && out.add(w));
  }
  return [...out];
}

/** 글 하나에 낱말이 얼마나 맞나 — 0(안 맞음) ~ 1 */
function strength(text, words, t) {
  if (!text.includes(t)) return 0;
  if (words.includes(t)) return 1;
  if (t.includes(' ')) return 0.9; // 'zoom in' 같은 여러 낱말 말
  if (isShort(t)) return 0; // 짧은 말은 낱말 그대로만 — 'tab'이 table에, 'log'가 logo에 걸리지 않게
  if (words.some((w) => w.startsWith(t))) return 0.8;
  return 0.5;
}

/**
 * 찾을 곳 목록을 미리 다듬는다. fields = [[글 또는 글 배열, 무게, 이름표]] — 이름표는 '어디서 맞았나' 표시에 쓴다.
 * @returns {{ item, fields: { text, words, weight, label }[] }}
 */
export function doc(item, fields) {
  const out = [];
  for (const [val, weight, label] of fields) {
    for (const v of [].concat(val ?? [])) {
      const text = norm(v);
      if (text) out.push({ raw: String(v), text, words: text.split(SPLIT).filter(Boolean), weight, label });
    }
  }
  return { item, fields: out };
}

/** 점수 — 낱말마다 가장 잘 맞는 곳의 (무게 × 맞는 정도)를 더한다. 하나라도 안 맞으면 null. hit = 가장 크게 맞은 곳 */
export function score(d, q) {
  const tokens = norm(q).split(' ').filter(Boolean);
  if (!tokens.length) return { score: 0, hit: null };
  let total = 0, hit = null, hitScore = 0;
  for (const t of tokens) {
    const alts = [[t, 1], ...expand(t).map((w) => [w, 0.9])];
    let best = 0, bestField = null;
    for (const f of d.fields) {
      for (const [w, k] of alts) {
        const s = strength(f.text, f.words, w) * k * f.weight;
        if (s > best) { best = s; bestField = f; }
      }
    }
    if (!best) return null;
    total += best;
    if (best > hitScore) { hitScore = best; hit = bestField; }
  }
  return { score: total, hit };
}

/** 검색 — 맞는 것만 점수 순(같으면 tie 순)으로. 검색어가 없으면 그대로 */
export function rank(docs, q, tie = () => 0) {
  if (!norm(q)) return docs.map((d) => ({ item: d.item, hit: null }));
  const out = [];
  for (const d of docs) { const r = score(d, q); if (r) out.push({ item: d.item, hit: r.hit, score: r.score }); }
  return out.sort((a, b) => b.score - a.score || tie(a.item, b.item));
}

/** 어디서 맞았는지 한 줄 — 화면 문구 · 원본 레이어 이름처럼 카드에 안 보이는 곳에서 맞았을 때만 */
export const hitNote = (hit) => (hit && hit.label ? `${hit.label} “${hit.raw.length > 40 ? hit.raw.slice(0, 40) + '…' : hit.raw}”` : '');
