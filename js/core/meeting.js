/* ── 회의 모드 — 고객사 앞에서 다른 고객사 정보가 보이지 않게 ──
   홈 · 작업공간 · 발표 화면이 함께 쓴다. 설정은 이 브라우저 전체에 하나(localStorage 'wemb-meeting')이고,
   프로젝트별 상태 묶음에는 들어가지 않는다(js/core/projects.js 의 PROJ_GLOBAL).

   { on: 회의 모드, picks: [템플릿 slug…], cust: [지금 만나는 고객사 이름…] }
   - on 이면 화면의 글자 · 대체 텍스트에서 고객사 이름을 '고객사'로 바꿔 보여 준다(원래 글자는 그대로 두고 보이는 것만).
     템플릿 갤러리는 고른 템플릿(picks)만 — 고른 게 없으면 실제 화면이 붙은 템플릿만 — 제목 대신 '화면 유형 · 업무 영역'으로 보인다(js/launcher/home.js).
   - cust = 지금 열어 둔 프로젝트의 이름(PRD 프로젝트명 · 프로젝트 · 폴더 이름). 이 이름에 들어 있는 가림 단어는 가리지 않는다.
     예전엔 '한빛정밀'이 다른 고객사 템플릿의 '한빛'에 걸려 고객 앞에서 '고객사정밀'로 보였다. 작업공간이 setCustomer 로 갱신한다.
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
      const strs = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);
      return v && typeof v === 'object' ? { on: !!v.on, picks: strs(v.picks), cust: strs(v.cust) } : { on: false, picks: [], cust: [] };
    } catch (e) {
      return { on: false, picks: [], cust: [] };
    }
  };
  let cur = read();
  const subs = new Set();
  const emit = () => subs.forEach((fn) => { try { fn(cur); } catch (e) {} });
  function set(patch) {
    cur = Object.assign({}, cur, patch);
    if (patch && 'cust' in patch) { buildRE(); unmaskAll(); }
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
    emit();
    return cur;
  }
  /* 지금 만나는 고객사 이름 — 같으면 저장 · 다시 가리기를 하지 않는다 */
  function setCustomer(names) {
    const list = [...new Set((names || []).map((s) => String(s || '').trim()).filter(Boolean))];
    if (list.join('\n') === cur.cust.join('\n')) return cur;
    return set({ cust: list });
  }
  /* 다른 문서(홈 ↔ 작업공간 탭, 발표 화면 ↔ 그 안의 작업공간)에서 바꾼 것을 따라간다 */
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    cur = read();
    buildRE();
    unmaskAll();
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
  /* 지금 고객사 이름(cust)에 들어 있는 단어는 뺀다 — 다 빠지면 가릴 것이 없다(RE = null) */
  let RE = null;
  function buildRE() {
    const own = cur.cust.map((s) => s.toLowerCase());
    const list = NAMES.filter((n) => !own.some((o) => o.includes(n.toLowerCase())));
    RE = list.length ? new RegExp('(' + list.map(escRe).join('|') + ')', 'g') : null;
  }
  buildRE();
  /* 가림 단어 전체(지금 고객사 예외 없이) — 예전 버전이 가린 채 저장한 글자를 되돌릴 때 쓴다(dash-edit.js) */
  const RE_ALL = new RegExp('(' + NAMES.map(escRe).join('|') + ')', 'g');
  const isWord = (c) => !!c && /[A-Za-z0-9_]/.test(c);
  function maskString(s) {
    if (!s || typeof s !== 'string' || !RE) return s;
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
  /* name 을 예외 없이 가렸을 때의 모양 — '한빛정밀 …' → '고객사정밀 …' */
  function maskedForm(name) {
    const keep = RE;
    RE = RE_ALL;
    try { return maskString(name); } finally { RE = keep; }
  }

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
  /* 가림 단어가 바뀌면(고객사 이름 갱신) 가린 글자를 먼저 되돌린다 — 그래야 다시 맞출 때 새 기준으로 가린다 */
  function unmaskAll() {
    watchers.forEach((w) => { if (w.active) walk(w.root, unmaskNode, unmaskEl); });
  }
  /* 원래 글자로 잠깐 되돌린 채 fn 을 돌린다 — 화면 글자를 읽어 저장 · 캡처하는 코드용.
     예전엔 글자 수정 저장(350ms 뒤)이 편집을 끝낸 직후 돌면 가린 '고객사…'가 시안에 저장됐다. */
  function withOriginal(fn) {
    const act = watchers.filter((w) => w.active);
    act.forEach((w) => {
      if (w.observing) { w.mo.disconnect(); w.observing = false; }
      walk(w.root, unmaskNode, unmaskEl);
      w.active = false;
    });
    try { return fn(); } finally { act.forEach((w) => w.apply()); }
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
    get: () => Object.assign({}, cur, { picks: cur.picks.slice(), cust: cur.cust.slice() }),
    set,
    setCustomer,
    on: () => cur.on,
    text,
    mask: maskString,
    maskedForm,
    watch,
    withOriginal,
    refresh: reapply,
    onChange: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  };
})();
