/* ── 회의 모드 — 고객사 앞에서 다른 고객사 정보가 보이지 않게 ──
   홈 · 작업공간 · 발표 화면이 함께 쓴다. 설정은 이 브라우저 전체에 하나(localStorage 'wemb-meeting')이고,
   프로젝트별 상태 묶음에는 들어가지 않는다(js/core/projects.js 의 PROJ_GLOBAL).

   { on: 회의 모드, picks: [템플릿 slug…] }
   - on 이면 화면의 글자 · 대체 텍스트에서 고객사 이름을 '고객사'로 바꿔 보여 준다(원래 글자는 그대로 두고 보이는 것만).
     템플릿 갤러리는 고른 템플릿(picks)만, 제목 대신 '화면 유형 · 업무 영역'으로 보인다(js/launcher/home.js).
   - 글자를 고치는 중(내용 수정 · 패널 편집)에는 가리지 않는다 — 가린 글자가 시안에 저장되지 않게.
   - 그림(사진 · 렌더 이미지) 안에 박힌 로고 · 글자는 가리지 못한다. 회의에서 보여 줄 템플릿만 고르는 것이 1차 방어다.

   WEMB.meeting
     get() / set(patch)       설정 읽기 · 바꾸기(다른 탭 · 발표 화면의 iframe 도 storage 이벤트로 따라 바뀐다)
     on()                     회의 모드인지
     text(s)                  글자 한 줄 가리기(회의 모드가 아니면 그대로)
     watch(root, isEditing)   root 아래 글자를 가리고, 바뀌는 글자도 따라 가린다
     onChange(fn)             설정이 바뀌면 */
(function () {
  const KEY = 'wemb-meeting';
  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && typeof v === 'object' ? { on: !!v.on, picks: Array.isArray(v.picks) ? v.picks.filter((x) => typeof x === 'string') : [] } : { on: false, picks: [] };
    } catch (e) {
      return { on: false, picks: [] };
    }
  };
  let cur = read();
  const subs = new Set();
  const emit = () => subs.forEach((fn) => { try { fn(cur); } catch (e) {} });
  function set(patch) {
    cur = Object.assign({}, cur, patch);
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
    emit();
    return cur;
  }
  /* 다른 문서(홈 ↔ 작업공간 탭, 발표 화면 ↔ 그 안의 작업공간)에서 바꾼 것을 따라간다 */
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    cur = read();
    emit();
  });

  /* 고객사 이름 — 템플릿 시안(POSCO · LS Electric · SK하이닉스 · 한진 · HANA)에 실제로 보이는 이름과 갤러리 제목의 고객사.
     긴 것부터 맞춘다('한진택배'가 '한진'보다 먼저). 영문 약어는 앞뒤가 영문 · 숫자가 아닐 때만(단위 'KB' 같은 오탐 방지 —
     약어 KB · NH · HC 는 아예 넣지 않았다). 코드 안에 붙은 이름(KDB1_CDR_001)은 'CUST' 로 바꿔 자리 모양을 지킨다. */
  const NAMES = [
    'POSCO', '포스코', 'KDB',
    'LS Electric', 'LS ELECTRIC', 'LS일렉트릭', 'LS산전',
    'SK hynix', 'SK Hynix', 'SK HYNIX', 'SKHynix', 'SK하이닉스', '하이닉스', 'HYNIX', 'Hynix', 'Icheon', '이천',
    '한진택배', '한진', 'HANJIN', 'Hanjin', '대전 메가허브', '메가허브',
    '하나은행', '하나카드', '하나금융', 'Hana Card', 'HANA', 'Hana',
    'Gammania', 'Hyundai Capital', '현대캐피탈', 'Shinhan Card', 'Shinhan', '신한카드', '신한', 'SHOneView',
    'Hanbit', '한빛', 'KOEN', '한국남동발전', 'KISED', 'Digicentre', 'KORAIL', '코레일', 'NRTEC', 'NH-DCIM',
  ].sort((a, b) => b.length - a.length);
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE = new RegExp('(' + NAMES.map(escRe).join('|') + ')', 'g');
  const isWord = (c) => !!c && /[A-Za-z0-9_]/.test(c);
  function maskString(s) {
    if (!s || typeof s !== 'string') return s;
    RE.lastIndex = 0;
    if (!RE.test(s)) return s;
    RE.lastIndex = 0;
    return s
      .replace(RE, (m, _g, at, all) => {
        const before = all.charAt(at - 1), after = all.charAt(at + m.length);
        const latin = /^[A-Za-z]/.test(m);
        if (latin && (isWord(before) || (isWord(after) && !/^[0-9_]/.test(after)))) return m; // 다른 영단어의 일부
        if (isWord(after) || before === '_') return 'CUST'; // 코드 안에 붙은 이름
        return '고객사';
      })
      .replace(/고객사(\s+고객사)+/g, '고객사'); // 'POSCO KDB' → '고객사' (두 번 겹치지 않게)
  }
  const text = (s) => (cur.on ? maskString(s) : s);

  /* ── 화면 가리기 — 글자 노드 · 대체 텍스트 ──
     원래 값은 노드에 기억해 두고, 회의 모드를 끄거나 고치기 시작하면 되돌린다.
     앱이 글자를 새로 쓰면(실시간 값 · 화면 전환) 그 값을 새 원본으로 삼는다. */
  const ORIG = new WeakMap(); // Text 노드 → { o: 원본, m: 가린 값 }
  const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];
  const ATTR_KEY = '__wembMask';
  function maskNode(n) {
    const v = n.nodeValue;
    const rec = ORIG.get(n);
    if (rec && v === rec.m) return; // 이미 가린 그대로
    const m = maskString(v);
    if (m === v) { if (rec) ORIG.delete(n); return; }
    ORIG.set(n, { o: v, m });
    n.nodeValue = m;
  }
  function unmaskNode(n) {
    const rec = ORIG.get(n);
    if (!rec) return;
    if (n.nodeValue === rec.m) n.nodeValue = rec.o;
    ORIG.delete(n);
  }
  function maskEl(el) {
    const saved = el[ATTR_KEY] || {};
    let any = false;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v == null) continue;
      if (saved[a] && saved[a].m === v) { any = true; continue; }
      const m = maskString(v);
      if (m !== v) { saved[a] = { o: v, m }; el.setAttribute(a, m); any = true; }
    }
    if (any) el[ATTR_KEY] = saved;
  }
  function unmaskEl(el) {
    const saved = el[ATTR_KEY];
    if (!saved) return;
    for (const a in saved) if (el.getAttribute(a) === saved[a].m) el.setAttribute(a, saved[a].o);
    delete el[ATTR_KEY];
  }
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
  function walk(root, fnText, fnEl) {
    if (!root) return;
    if (root.nodeType === 3) { fnText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP.has(root.tagName)) return; fnEl(root); }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeType === 1 && SKIP.has(n.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (n.nodeType === 3) fnText(n);
      else fnEl(n);
    }
  }
  const watchers = [];
  function watch(root, isEditing) {
    if (!root) return null;
    const w = { root, isEditing: isEditing || (() => false), active: false, mo: null, observing: false };
    const want = () => cur.on && !w.isEditing();
    w.mo = new MutationObserver((list) => {
      if (!w.active) return;
      for (const r of list) {
        if (r.type === 'characterData') maskNode(r.target);
        else if (r.type === 'attributes') { if (ATTRS.includes(r.attributeName)) maskEl(r.target); }
        else r.addedNodes.forEach((n) => walk(n, maskNode, maskEl));
      }
    });
    /* 회의 모드가 꺼져 있으면 지켜보지도 않는다 — 실시간 값 · 차트가 자주 바뀌는 화면에서 헛일을 하지 않게 */
    const apply = () => {
      const on = want();
      if (on) {
        walk(root, maskNode, maskEl);
        if (!w.observing) { w.mo.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS }); w.observing = true; }
      } else {
        if (w.observing) { w.mo.disconnect(); w.observing = false; }
        if (w.active) walk(root, unmaskNode, unmaskEl);
      }
      w.active = on;
    };
    w.apply = apply;
    watchers.push(w);
    apply();
    return w;
  }
  /* 고치기 시작 · 끝(편집 모드 클래스)이나 설정이 바뀌면 다시 맞춘다 */
  const reapply = () => watchers.forEach((w) => w.apply());
  subs.add(reapply);
  const classMo = new MutationObserver(reapply);
  const observeEditing = () => document.querySelectorAll('.main, #dtStage').forEach((el) => classMo.observe(el, { attributes: true, attributeFilter: ['class'] }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observeEditing);
  else observeEditing();

  window.WEMB = window.WEMB || {};
  WEMB.meeting = {
    KEY,
    get: () => Object.assign({}, cur, { picks: cur.picks.slice() }),
    set,
    on: () => cur.on,
    text,
    mask: maskString,
    watch,
    refresh: reapply,
    onChange: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  };
})();
