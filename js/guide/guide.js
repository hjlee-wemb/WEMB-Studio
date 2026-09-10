/* ── 가이드 파이프라인 — PRD · 기능명세서 · 유저플로우 · 와이어프레임 ── */

/* ============================================================
   가이드 파이프라인 — PRD(질문) → 기능명세서 → 유저플로우 → 추천 와이어프레임 → 스튜디오.
   PRD 답변(G)에서 이후 단계를 결정론적으로 파생하고, 각 탭을 열 때 최신 답변으로 다시 그린다.
   고른 추천 와이어프레임은 enterStudio(화면, 레이아웃)로 스튜디오에 그대로 반영한다.
   ============================================================ */
(function initGuide() {
  const prdPage = document.getElementById('pagePrd');
  if (!prdPage) return;
  const LS = 'wemb-prd';
  const DEFAULT = { site: '', screen: 'dash', scale: 'multi', industries: [], targets: [], ops: 'central' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── 모니터링 유형(산업군, 다중 선택) → 모니터링 대상(라이브러리 태그) 매핑 ──
     UI 라이브러리_태그항목.xlsx의 산업군·솔루션·컴포넌트 분류를 기반으로 구성. 대상은 라벨(다중 선택). */
  const INDUSTRIES = {
    finance:       { label: '금융', targets: ['계정계 (Core Banking)', '정보계', '대외채널', '인터넷 뱅킹', '모바일 뱅킹', '거래량', '거래 추이', '초당 처리건수(TPS)', '트랜잭션', '큐잉', '콜센터', '뱅킹 인프라', '종합 상황', '시스템 현황'] },
    manufacturing: { label: '제조', targets: ['공장에너지관리 (FEMS)', '설비·자산 상태', '생산라인 현황', '공조', '전력', '온습도계', '압력', '화재감지기', '가스탐지기', '동작감지센서', 'CCTV', '알람·이벤트', '작업자'] },
    distribution:  { label: '유통', targets: ['매장 현황', '재고·물류', '출입통제', '출입 카운트', '주차관제(LPR)', 'CCTV', '에너지 사용', '알람·이벤트'] },
    logistics:     { label: '물류', targets: ['물류관리 (DMS)', '입고', '출고', '도크·하역', '무인지게차', '로봇', '차량·배송', '컨테이너', '차량차단기', '바리케이드', 'CCTV'] },
    power:         { label: '발전·에너지', targets: ['발전량·발전기', 'ESS 에너지저장', '태양광', '인버터', '배터리 모듈', '리튬이온 배터리', '전력변환장치(PCS)', '변압기반', '송전탑', '풍력계', '환경 감시'] },
    electric:      { label: '전기·전력', targets: ['변압기반', '배전반·VCB', '차단기', '무정전 전원장치(UPS)', '전력 사용량', '고압반', '저압반', '초고압반', '한전패드', '발전기'] },
    public:        { label: '공공 인프라', targets: ['철도·교통', '상·하수 처리', '환경 감시 (지진·기상)', '재난 경보', '수위감지기', '화재감지기', '기상관측탑', 'CCTV', '종합 상황'] },
    datacenter:    { label: '데이터센터', targets: ['데이터센터관리 (DCIM)', '랙·서버', '스토리지', '네트워크 (NMS)', '공조 (HVAC)', '항온항습', '전력', '상면관리', 'UPS', '누수탐지기', '온습도계', 'CCTV'] },
    building:      { label: '건물·시설', targets: ['건물관리 (BMS)', '시설물관리 (FMS)', '공조', '전력', '엘리베이터', '출입통제', '조명·환경', '주차관제(LPR)', '화재감지기', 'CCTV'] },
    security:      { label: '보안·환경', targets: ['물리보안 (PSIM)', 'CCTV', 'AI CCTV', '열화상카메라', '출입통제', '지문인식기', '얼굴인식', '화재 감지', '환경 감시 (지진·기상·재난)', '누수·가스 탐지', 'X-ray 검색대'] },
  };
  const industryLabels = () => (G.industries || []).map((k) => INDUSTRIES[k] && INDUSTRIES[k].label).filter(Boolean);
  /* 선택한 산업군들의 모니터링 대상(라벨) 합집합 — 중복 제거 */
  function industryTargetOpts() {
    const seen = new Set(), out = [];
    (G.industries || []).forEach((k) => { const ind = INDUSTRIES[k]; if (ind) ind.targets.forEach((lbl) => { if (!seen.has(lbl)) { seen.add(lbl); out.push(lbl); } }); });
    return out;
  }
  const targetLabels = () => (G.targets || []).slice();

  function load() {
    try {
      const r = JSON.parse(localStorage.getItem(LS));
      if (r && typeof r === 'object') return Object.assign({}, DEFAULT, r);
    } catch (e) {}
    return Object.assign({}, DEFAULT);
  }
  let G = load();
  /* 구버전 저장값 정리 + 산업군 단일(string)→다중(array) 마이그레이션 */
  if (G.screen !== 'dash' && G.screen !== 'dt') G.screen = 'dash';
  if (G.ops !== 'central' && G.ops !== 'normal') G.ops = 'central';
  if (!Array.isArray(G.industries)) G.industries = (typeof G.industry === 'string' && INDUSTRIES[G.industry]) ? [G.industry] : [];
  G.industries = G.industries.filter((k) => INDUSTRIES[k]);
  delete G.industry;
  if (!Array.isArray(G.targets)) G.targets = [];
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(G)); } catch (e) {} };

  const SCREEN_LBL = { dash: '관제 대시보드', dt: '디지털 트윈', portal: '포탈' };
  const SCALE_LBL = { single: '단일 설비', multi: '다중 설비·구역', enterprise: '전사·다중 사이트' };
  const OPS_LBL = { central: '대형 화면 상시 관제', normal: 'PC 화면 모니터링' };
  const PRI_LBL = { hi: '높음', mid: '보통', low: '낮음' };
  const siteName = () => G.site || '이 프로젝트';

  /* ── PRD 요약(인트로 페이지) 갱신 — 스텝 위저드가 답을 채우면 여기 반영된다 ── */
  function renderPrdSummary() {
    const box = document.getElementById('prdSummary');
    if (box) box.innerHTML = summaryHTML(prdComplete() ? '모두 작성했어요. 아래에서 기능명세서를 생성할 수 있어요.' : '아직 비어 있어요. “질문 시작”을 눌러 한 단계씩 채워 주세요.');
  }
  function paintForm() {
    renderPrdSummary();
    if (typeof refreshSteps === 'function') refreshSteps();
    if (window.__paintDtFromPrd) window.__paintDtFromPrd();
  }

  /* screen·scale·ops 는 DEFAULT 에 값이 미리 들어 있고(다운스트림이 항상 유효값을 요구함)
     아래 마이그레이션이 초기화 뒤에도 되돌려 놓는다. 그래서 이 세 개만 보고 요약을 그리면
     '아무것도 안 골랐는데 답변이 적혀 있는' 상태가 된다.
     사용자가 직접 넣지 않으면 절대 채워지지 않는 항목(이름·산업군·대상)으로 착수 여부를 판정한다. */
  const prdTouched = () => !!(G.site || (G.industries || []).length || (G.targets || []).length);
  function summaryHTML(tail) {
    if (!prdTouched()) return '<span class="gs-empty">' + tail + '</span>';
    const parts = [];
    if (G.site) parts.push('<b>' + esc(G.site) + '</b>');
    if (SCREEN_LBL[G.screen]) parts.push(SCREEN_LBL[G.screen]);
    if (SCALE_LBL[G.scale]) parts.push(SCALE_LBL[G.scale]);
    if (OPS_LBL[G.ops]) parts.push(OPS_LBL[G.ops]);
    const inds = industryLabels();
    if (inds.length) parts.push(inds.join(', '));
    const tg = targetLabels().join(' · ');
    return (parts.join(' · ') || '—') + '<br>모니터링 대상: ' + esc(tg || '—') + '<br><span class="gs-empty">' + tail + '</span>';
  }

  /* ── 기능명세서 편집 저장소 ──
     행별 이름 수정·삭제·상세 메모·요구사항을 로컬에 보관해, PRD 재파생(renderSpec) 후에도 유지한다.
     키 = 원본 파생 기능명(deriveSpec가 항상 같은 이름을 만들어 내므로 안정적). */
  const SPEC_LS = 'wemb-spec';
  let SPEC_STORE = (function () { try { return JSON.parse(localStorage.getItem(SPEC_LS)) || {}; } catch (e) { return {}; } })();
  const saveSpec = () => { try { localStorage.setItem(SPEC_LS, JSON.stringify(SPEC_STORE)); } catch (e) {} };
  const specOv = (id) => (SPEC_STORE[id] || (SPEC_STORE[id] = {}));

  /* ── 1) 기능명세서 파생 — PRD 5개 문항(화면·규모·산업군·모니터링 대상·운영 + 이름)을 반영해 추출 ── */
  function deriveSpec() {
    const rows = [];
    /* type: '기능' = 구체적 화면·기능, '요구사항' = 규모·운영 등 비기능/제약 요구사항 */
    const add = (feat, pri, type) => rows.push({ feat, pri, type: type || '기능' });
    const site = (G.site && G.site.trim()) || '이 프로젝트';

    /* 1번 — 화면 유형 (기능) */
    if (G.screen === 'dt') { add('3D 디지털 트윈 씬 뷰어', 'hi', '기능'); add('씬 위 유리 패널 오버레이 배치', 'mid', '기능'); }
    else add(site + ' 관제 대시보드 종합 현황 화면', 'hi', '기능');

    /* 3번 — 모니터링 유형(산업군, 다중) (요구사항) */
    industryLabels().forEach((lbl) => add(lbl + ' 도메인 관제 구성', 'hi', '요구사항'));

    /* 4번 — 모니터링 대상(라이브러리 태그, 복수 선택) (기능) */
    targetLabels().forEach((lbl, i) => add(lbl + ' 모니터링', i === 0 ? 'hi' : 'mid', '기능'));

    /* 2번 — 관제 대상 규모 (요구사항) */
    if (G.scale === 'single') add('단일 설비 집중 모니터링 뷰', 'mid', '요구사항');
    else if (G.scale === 'multi') add('구역·설비 그룹 전환 네비게이션', 'mid', '요구사항');
    else if (G.scale === 'enterprise') add('다중 사이트 통합·전환 네비게이션', 'hi', '요구사항');

    /* 5번 — 운영 환경 (요구사항) */
    if (G.ops === 'central') add('24/7 대형 화면 고밀도 상황판 레이아웃', 'mid', '요구사항');
    else if (G.ops === 'normal') add('일반 PC 화면 표준 레이아웃', 'mid', '요구사항');

    /* '색 토큰 생성·내보내기'는 이 스튜디오 자신의 기능이다. 고객에게 전달되는
       기능명세서에 넣으면 산출물에 도구 내부 사정이 새어 들어간다 — 그래서 뺐다.
       대신 어느 관제 화면에나 실제로 필요한 요구사항으로 대체한다. */
    add('화면 배색·상태색 표기 규칙 정의', 'mid', '요구사항');
    return rows;
  }
  const SF_EDIT_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const SF_DEL_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
  /* 상태·중요도 선택지 */
  const SPEC_STATUS = [['doing', '권장'], ['wait', '예정'], ['ok', '완료']];
  const statusClass = (lbl) => (SPEC_STATUS.find((s) => s[1] === lbl) || ['wait'])[0];
  const PRI_ORDER = ['hi', 'mid', 'low'];
  /* 사용자가 표에 직접 추가한 행(라이브러리 파생과 별개로 보관) */
  function addedRows() { if (!Array.isArray(SPEC_STORE.__added)) SPEC_STORE.__added = []; return SPEC_STORE.__added; }
  function specRowHTML(o) {
    const sc = statusClass(o.statusLbl);
    const priLab = PRI_LBL[o.priKey] || o.priKey;
    return '<tr data-id="' + esc(o.id) + '"' + (o.custom ? ' data-custom="1"' : '') + ' data-type="' + esc(o.type) + '" data-status="' + esc(o.statusLbl) + '" data-pri="' + esc(priLab) + '" data-prikey="' + esc(o.priKey) + '">'
      + '<td class="spec-feat"><span class="sf-text">' + esc(o.feat) + '</span>'
      + (o.hasMemo ? '<span class="sf-note memo" title="상세 메모가 있어요">메모</span>' : '')
      + (o.hasReqs ? '<span class="sf-note req" title="요구사항 정리가 있어요">요구사항</span>' : '')
      + '<span class="sf-actions">'
      + '<button type="button" class="sf-btn sf-edit" title="이름 수정" aria-label="이름 수정">' + SF_EDIT_IC + '</button>'
      + '<button type="button" class="sf-btn sf-del" title="삭제" aria-label="삭제">' + SF_DEL_IC + '</button>'
      + '</span></td>'
      + '<td><button type="button" class="sbadge ' + sc + ' sf-status" title="상태 변경">' + esc(o.statusLbl) + '</button></td>'
      + '<td><button type="button" class="pri ' + o.priKey + ' sf-pri" title="중요도 변경">' + esc(priLab) + '</button></td></tr>';
  }
  function renderSpec() {
    const body = document.getElementById('specBody'); if (!body) return;
    const rows = [];
    deriveSpec().forEach((r) => {
      const ov = SPEC_STORE[r.feat] || {};
      if (ov.deleted) return;
      const priKey = ov.pri || r.pri;
      rows.push({
        id: r.feat, custom: false, type: r.type,
        feat: (ov.feat != null && ov.feat !== '') ? ov.feat : r.feat,
        priKey, statusLbl: ov.status || (priKey === 'hi' ? '권장' : '예정'),
        hasMemo: !!(ov.memo && ov.memo.trim()), hasReqs: !!(ov.reqs && ov.reqs.trim()),
      });
    });
    addedRows().forEach((o) => {
      rows.push({
        id: o.id, custom: true, type: o.type || '기능',
        feat: o.feat || '', priKey: o.pri || 'mid', statusLbl: o.status || '예정',
        hasMemo: !!(o.memo && o.memo.trim()), hasReqs: !!(o.reqs && o.reqs.trim()),
      });
    });
    body.innerHTML = rows.map(specRowHTML).join('');
    applySpecFilters();
  }

  /* ── 기능명세서 필터(상단 드롭다운) ──
     4개 축(요구사항+기능 / 상태 / 사용자 역할 / 중요도)으로 표 행을 걸러 준다. */
  const SPEC_FILTERS = { type: '', status: '', pri: '' };
  const SPEC_DIMS = {
    type: { def: '요구사항 + 기능', order: ['요구사항', '기능'] },
    status: { def: '상태', order: ['권장', '예정', '완료'] },
    pri: { def: '중요도', order: ['높음', '보통', '낮음'] },
  };
  function applySpecFilters() {
    const body = document.getElementById('specBody'); if (!body) return;
    let visible = 0;
    body.querySelectorAll('tr:not(.spec-empty)').forEach((tr) => {
      const ok =
        (!SPEC_FILTERS.type || tr.dataset.type === SPEC_FILTERS.type) &&
        (!SPEC_FILTERS.status || tr.dataset.status === SPEC_FILTERS.status) &&
        (!SPEC_FILTERS.pri || tr.dataset.pri === SPEC_FILTERS.pri);
      tr.hidden = !ok;
      if (ok) visible++;
    });
    let empty = body.querySelector('tr.spec-empty');
    if (!visible) {
      if (!empty) { empty = document.createElement('tr'); empty.className = 'spec-empty'; empty.innerHTML = '<td colspan="3">선택한 조건에 맞는 항목이 없어요.</td>'; body.appendChild(empty); }
      empty.hidden = false;
    } else if (empty) empty.hidden = true;
    /* 표 높이가 바뀌면(필터 등) '다음 단계' 버튼 노출 조건도 다시 판정 */
    if (window.__specScrollGate) window.__specScrollGate();
  }
  (function initSpecFilters() {
    const bar = document.getElementById('specFilters'); if (!bar) return;
    const closeAll = () => bar.querySelectorAll('.doc-menu').forEach((m) => (m.hidden = true));
    function refreshChips() {
      bar.querySelectorAll('.doc-chipwrap').forEach((wrap) => {
        const key = wrap.dataset.filter, v = SPEC_FILTERS[key];
        wrap.querySelector('.dc-lab').textContent = v ? (key === 'type' ? v : SPEC_DIMS[key].def + ': ' + v) : SPEC_DIMS[key].def;
        wrap.querySelector('.doc-chip').classList.toggle('active', !!v);
      });
    }
    function buildMenu(wrap, key) {
      const menu = wrap.querySelector('.doc-menu');
      const present = new Set([...document.querySelectorAll('#specBody tr:not(.spec-empty)')].map((tr) => tr.dataset[key]).filter(Boolean));
      const opts = [''].concat(SPEC_DIMS[key].order.filter((v) => present.has(v)));
      menu.innerHTML = opts.map((v) => {
        const on = (SPEC_FILTERS[key] || '') === v;
        return '<button type="button" class="doc-mi' + (on ? ' on' : '') + '" data-v="' + esc(v) + '">' + (v ? esc(v) : '전체') + '<span class="chk">✓</span></button>';
      }).join('');
    }
    bar.addEventListener('click', (e) => {
      const mi = e.target.closest('.doc-mi');
      if (mi) {
        const wrap = mi.closest('.doc-chipwrap');
        SPEC_FILTERS[wrap.dataset.filter] = mi.dataset.v || '';
        closeAll(); refreshChips(); applySpecFilters();
        return;
      }
      const chip = e.target.closest('.doc-chip');
      if (chip) {
        const wrap = chip.closest('.doc-chipwrap'), menu = wrap.querySelector('.doc-menu'), wasOpen = !menu.hidden;
        closeAll();
        if (!wasOpen) { buildMenu(wrap, wrap.dataset.filter); menu.hidden = false; }
      }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#specFilters')) closeAll(); });
    /* 툴바 새로고침 아이콘 → 필터 초기화 + 다시 그리기 */
    const tools = document.querySelector('#pageSpec .doc-tools .doc-ic[title="새로고침"]');
    if (tools) tools.addEventListener('click', () => {
      Object.keys(SPEC_FILTERS).forEach((k) => (SPEC_FILTERS[k] = ''));
      refreshChips(); renderSpec();
    });
    refreshChips();
  })();

  /* ── 기능명세서 행 편집 ──
     · 마우스 오버 → 기능 셀에 '이름 수정 ✎ · 삭제 🗑' 버튼 노출
     · 행 클릭     → 상세 팝업(상세 메모 · 요구사항 정리)
     표는 specBody 하나가 계속 유지되므로 이벤트 위임으로 한 번만 연결한다. */
  (function initSpecEdit() {
    const body = document.getElementById('specBody'); if (!body) return;
    const modal = document.getElementById('specModal');
    const elTitle = document.getElementById('smTitle');
    const elKind = document.getElementById('smKind');
    const elMeta = document.getElementById('smMeta');
    const elMemo = document.getElementById('smMemo');
    const elReqs = document.getElementById('smReqs');
    let curTr = null;

    /* 행이 참조하는 저장 객체 반환 (사용자 추가 행 / 파생 행 공통) */
    const rowObj = (tr) => tr.dataset.custom ? addedRows().find((x) => x.id === tr.dataset.id) : specOv(tr.dataset.id);

    /* ── 이름 인라인 수정 ── */
    function commitEdit(tr) {
      const span = tr.querySelector('.sf-text'); if (!span) return;
      tr.removeAttribute('data-editing');
      span.removeAttribute('contenteditable');
      const txt = span.textContent.trim();
      if (tr.dataset.custom) {
        const o = addedRows().find((x) => x.id === tr.dataset.id);
        if (o) { if (!txt) { SPEC_STORE.__added = addedRows().filter((x) => x.id !== o.id); tr.remove(); } else o.feat = txt; }
        saveSpec();
        return;
      }
      const id = tr.dataset.id;
      if (!txt || txt === id) {
        if (SPEC_STORE[id]) { delete SPEC_STORE[id].feat; if (!Object.keys(SPEC_STORE[id]).length) delete SPEC_STORE[id]; }
        span.textContent = txt || id;
      } else specOv(id).feat = txt;
      saveSpec();
    }
    function startEdit(tr) {
      const span = tr.querySelector('.sf-text'); if (!span) return;
      tr.setAttribute('data-editing', '1');
      span.setAttribute('contenteditable', 'true');
      span.focus();
      try { const sel = window.getSelection(), rng = document.createRange(); rng.selectNodeContents(span); sel.removeAllRanges(); sel.addRange(rng); } catch (e) {}
      const onKey = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); span.blur(); }
        else if (e.key === 'Escape') {
          e.preventDefault();
          const o = rowObj(tr);
          span.textContent = tr.dataset.custom ? ((o && o.feat) || '') : ((o && o.feat) || tr.dataset.id);
          span.blur();
        }
      };
      const done = () => { span.removeEventListener('blur', done); span.removeEventListener('keydown', onKey); commitEdit(tr); };
      span.addEventListener('blur', done);
      span.addEventListener('keydown', onKey);
    }
    function delRow(tr) {
      if (tr.dataset.custom) SPEC_STORE.__added = addedRows().filter((x) => x.id !== tr.dataset.id);
      else specOv(tr.dataset.id).deleted = true;
      saveSpec();
      tr.remove();
      applySpecFilters();
      if (typeof toast === 'function') toast('항목을 삭제했어요.', { type: 'info' });
    }
    /* ── 새 행 추가 → 즉시 이름 입력 상태로 ── */
    function addRow() {
      const o = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), feat: '', pri: 'mid', status: '예정', type: '기능' };
      addedRows().push(o); saveSpec(); renderSpec();
      const tr = body.querySelector('tr[data-id="' + (window.CSS && CSS.escape ? CSS.escape(o.id) : o.id) + '"]');
      if (tr) { const sc = document.querySelector('#pageSpec .page-scroll'); if (sc) sc.scrollTop = sc.scrollHeight; startEdit(tr); }
    }
    document.getElementById('specAddRow')?.addEventListener('click', addRow);

    /* ── 상태 · 중요도 드롭다운 ── */
    let pickEl = null;
    function closePick() { if (pickEl) { pickEl.remove(); pickEl = null; } }
    function openPick(anchor, options, current, onPick) {
      closePick();
      const m = document.createElement('div'); m.className = 'sf-pick';
      m.innerHTML = options.map((o) => '<button type="button" class="sf-pick-i' + (o.val === current ? ' on' : '') + '" data-v="' + esc(o.val) + '">' + esc(o.label) + '</button>').join('');
      document.body.appendChild(m);
      const r = anchor.getBoundingClientRect();
      let top = r.bottom + 4, left = r.left;
      if (left + m.offsetWidth > window.innerWidth - 8) left = window.innerWidth - 8 - m.offsetWidth;
      if (top + m.offsetHeight > window.innerHeight - 8) top = r.top - m.offsetHeight - 4;
      m.style.left = Math.max(8, left) + 'px'; m.style.top = Math.max(8, top) + 'px';
      m.addEventListener('click', (e) => { const b = e.target.closest('.sf-pick-i'); if (!b) return; onPick(b.dataset.v); closePick(); });
      pickEl = m;
    }
    function setStatus(tr, lbl) { const o = rowObj(tr); if (o) { o.status = lbl; saveSpec(); renderSpec(); } }
    function setPri(tr, key) { const o = rowObj(tr); if (o) { o.pri = key; saveSpec(); renderSpec(); } }
    document.addEventListener('click', (e) => { if (pickEl && !e.target.closest('.sf-pick') && !e.target.closest('.sf-status') && !e.target.closest('.sf-pri')) closePick(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePick(); });
    window.addEventListener('resize', closePick);

    /* ── 상세 팝업 ── */
    function openModal(tr) {
      curTr = tr;
      const o = rowObj(tr) || {};
      elTitle.textContent = (o.feat || tr.querySelector('.sf-text')?.textContent || '(이름 없음)');
      elKind.textContent = tr.dataset.type || '';
      elMeta.innerHTML = '<span class="sm-tag">상태 · ' + esc(tr.dataset.status || '') + '</span><span class="sm-tag">중요도 · ' + esc(tr.dataset.pri || '') + '</span>';
      elMemo.value = o.memo || '';
      elReqs.value = o.reqs || '';
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('show'));
      setTimeout(() => { try { elMemo.focus(); } catch (e) {} }, 40);
    }
    function closeModal() { modal.classList.remove('show'); curTr = null; setTimeout(() => { modal.hidden = true; }, 160); }
    function saveModal() {
      if (!curTr) return closeModal();
      const memo = elMemo.value.trim(), reqs = elReqs.value.trim();
      if (curTr.dataset.custom) {
        const o = addedRows().find((x) => x.id === curTr.dataset.id);
        if (o) { if (memo) o.memo = memo; else delete o.memo; if (reqs) o.reqs = reqs; else delete o.reqs; }
      } else {
        const o = specOv(curTr.dataset.id);
        if (memo) o.memo = memo; else delete o.memo;
        if (reqs) o.reqs = reqs; else delete o.reqs;
        if (!Object.keys(o).length) delete SPEC_STORE[curTr.dataset.id];
      }
      saveSpec();
      renderSpec(); /* 메모·요구사항 표시 갱신 */
      closeModal();
    }

    body.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-id]'); if (!tr) return;
      if (e.target.closest('.sf-edit')) { e.stopPropagation(); startEdit(tr); return; }
      if (e.target.closest('.sf-del')) { e.stopPropagation(); delRow(tr); return; }
      const stbtn = e.target.closest('.sf-status');
      if (stbtn) { e.stopPropagation(); openPick(stbtn, SPEC_STATUS.map((s) => ({ val: s[1], label: s[1] })), tr.dataset.status, (v) => setStatus(tr, v)); return; }
      const prbtn = e.target.closest('.sf-pri');
      if (prbtn) { e.stopPropagation(); openPick(prbtn, PRI_ORDER.map((k) => ({ val: k, label: PRI_LBL[k] })), tr.dataset.prikey, (v) => setPri(tr, v)); return; }
      if (tr.hasAttribute('data-editing')) return;          /* 이름 편집 중엔 팝업 안 뜸 */
      openModal(tr);
    });
    document.getElementById('smClose')?.addEventListener('click', closeModal);
    document.getElementById('smCancel')?.addEventListener('click', closeModal);
    document.getElementById('smSave')?.addEventListener('click', saveModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && !modal.hidden) closeModal(); });
  })();

  /* ── 기능명세서 스크롤 게이트 ──
     항목을 끝까지(맨 아래) 스크롤해 다 읽은 뒤에만 '유저플로우로 넘어가기' 버튼이 나타난다.
     표가 짧아 스크롤이 필요 없으면 바로 노출한다. */
  (function initSpecScrollGate() {
    const page = document.getElementById('pageSpec'); if (!page) return;
    const scroller = page.querySelector('.page-scroll');
    const btn = document.getElementById('specNext');
    const hint = page.querySelector('.step-foot .step-hint');
    if (!scroller || !btn) return;
    const MORE = '항목을 끝까지 확인하면 다음 단계로 넘어갈 수 있어요. ↓';
    const DONE = '모두 확인했어요. 유저플로우로 넘어가세요.';
    function update() {
      if (page.hidden) return;
      const noScroll = scroller.scrollHeight <= scroller.clientHeight + 4;
      const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 6;
      const done = noScroll || atBottom;
      btn.hidden = !done;
      if (hint) hint.textContent = done ? DONE : MORE;
    }
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.__specScrollGate = () => requestAnimationFrame(update);
    update();
  })();

  /* ── 2) 유저플로우 = PRD 마인드맵 트리 ──
     루트(PRD) → 색상별 브랜치(L1) → 하위 화면(L2) → 세부/플레이스홀더(L3).
     번호(1, 1.1, 1.2.1)·별 아이콘·곡선 커넥터로 마인드맵 UI를 구성한다. */
  function deriveTree() {
    const isDT = G.screen === 'dt';
    const B = [];
    B.push({ n: '진입 · 인증', color: 'green', kids: [{ n: '로그인' }, G.scale === 'enterprise' ? { n: '사이트 선택' } : { n: '권한 확인' }] });
    B.push({ n: isDT ? '3D 씬 · 종합 현황' : '종합 현황', color: 'teal', kids: [{ n: '메인 대시보드' }, { n: 'KPI 요약' }] });
    const tkids = targetLabels().map((n) => ({ n }));
    B.push({ n: '세부 모니터링', color: 'blue', kids: tkids.length ? tkids : [{ n: '모니터링 대상' }] });
    B.push({ n: '리포트 · 관리', color: 'purple', kids: [{ n: '이력·통계' }, { n: '내보내기' }] });
    return B;
  }
  const mmPos = {}; /* 드래그로 옮긴 노드 오프셋(라벨 기준, 세션 유지) */
  let mmScale = 1;  /* 현재 보드 스케일(드래그 이동량 보정용) */
  let mmZoom = 1;   /* 사용자 확대·축소 배율(화면 맞춤 위에 곱해진다) */
  let panX = 0, panY = 0;  /* 캔버스 이동(패닝) 오프셋(화면 픽셀) */
  let spaceDown = false;   /* 스페이스바를 누르고 있는 중이면 드래그가 패닝이 된다 */
  const mmFav = new Set(); /* 즐겨찾기한 노드 라벨(세션 유지) */
  let flowFavOnly = false; /* 즐겨찾기만 보기 */
  let flowQuery = '';      /* 현재 검색어 */
  let flowApi = null;      /* 현재 렌더된 마인드맵 조작 API(툴바에서 사용) */
  const mmExtra = {};      /* 각 노드에 추가한 자식(메뉴/콘텐츠): 노드 path → [이름…] */
  const mmEdit = {};       /* 인라인으로 수정한 노드 라벨: 노드 path → 새 라벨 */
  const mmDeleted = new Set(); /* 삭제한 파생 노드: '부모path::원본이름' (파생 노드만; 추가 노드는 mmExtra에서 제거) */
  /* 노드 = 메뉴. 최상위(첫 노드)는 GNB 메뉴, 그 아래는 하위 메뉴를 추천한다.
     소수점 두번째(depth 3)부터는 메뉴 안에 들어갈 '콘텐츠'(라이브러리 태그)를 추가한다. */
  const GNB_MENUS = ['관제 대시보드', '실시간 모니터링', '알람·이벤트', '설비·자산 관리', '리포트·통계', 'CCTV 통합관제', '지도·GIS', '에너지 관리', '점검·정비', '사용자·권한', '시스템 설정', '로그·감사', '대외 연동', '공지사항', '도움말'];
  const SUBMENU_ITEMS = ['현황 요약', '상세 보기', '목록·이력', '실시간 추이', '통계·분석', '알림 규칙', '검색·필터', '설정', '내보내기', '권한 관리'];
  /* 브랜치(색)별 추가 후보 기능 풀 — reco(앞 2개)는 추천, more는 그 밖의 기능 */
  const FEATURE_POOL = {
    root: {
      reco: ['관제 대시보드', '알림·이벤트 센터'],
      more: ['설비 관리', '리포트', '사용자·권한', '시스템 설정', '지도·GIS 뷰', 'CCTV 통합', '에너지 관리', '점검·정비', '재고·자산', '통계 분석', '대시보드 편집', '알람 규칙', '데이터 관리', '외부 연동', '모바일 뷰', '공지·게시판', '도움말·가이드', '감사 로그', '백업·복원', 'API 콘솔', '즐겨찾기', '테마 설정'],
    },
    green: {
      reco: ['2단계 인증(OTP)', '세션 자동 로그아웃'],
      more: ['SSO 로그인', '생체 인증', '비밀번호 재설정', '계정 잠금 정책', '로그인 이력', '접속 IP 화이트리스트', '역할 기반 접근제어(RBAC)', '다중 사이트 선택', '부서·조직 선택', '동시 접속 제한', '로그인 실패 잠금', '캡차(자동입력 방지)', '원격 로그아웃', '접속 기기 관리', '보안 공지 배너', '이용약관 동의', '언어 선택', '접근 감사 로그', '최근 접속 알림', '권한 그룹 관리', '비밀번호 만료 정책', '2차 승인 요청'],
    },
    teal: {
      reco: ['실시간 KPI 카드', '알람 요약 배지'],
      more: ['종합 상태 요약', '설비 가동률', '트렌드 미니차트', '지도 기반 현황', '히트맵', '게이지 위젯', '도넛 비율 차트', '실시간 시계·근무조', '날씨·환경 위젯', '위젯 드래그 배치', '화면 자동 순환', '풀스크린 모드', '임계값 색상 표시', '최근 이벤트 타임라인', '목표 대비 달성률', '전일·전주 비교', '데이터 새로고침 주기', '위젯 크기 조절', '알림 티커', '요약 리포트 바로가기', '즐겨찾기 위젯', '상태 신호등'],
    },
    blue: {
      reco: ['실시간 트렌드 차트', '임계값 알람 설정'],
      more: ['다중 센서 비교', '태그 검색·필터', '데이터 테이블 뷰', '상세 드릴다운', '설비 계통도', 'CCTV 연동', '이상치 하이라이트', '스냅샷 캡처', 'CSV 내보내기', '실시간·과거 전환', '확대·축소(줌)', '커서 값 표시', '다축 그래프', '알람 확인·해제', '정비 이력 표시', '예측 추세선', '태그 그룹핑', '샘플링 주기 설정', '주석·메모', '북마크', '풀스크린 차트', '상태 배지'],
    },
    purple: {
      reco: ['예약 리포트 발송', 'PDF 내보내기'],
      more: ['일간 리포트', '주간·월간 리포트', 'Excel 내보내기', '이메일 구독', '대시보드 공유 링크', '사용자 관리', '권한 설정', '알람 규칙 관리', '임계값 프로파일', '감사 로그', '데이터 보존 정책', '백업·복원', 'API 키 관리', '연동(Webhook)', '태그 관리', '설비 등록·편집', '리포트 템플릿', '통계 요약', '기간 비교 분석', '다운로드 이력', '스케줄러', '시스템 설정'],
    },
  };
  /* ── UI 라이브러리 태그(UI 라이브러리_태그항목.xlsx) → 카테고리별 추가 후보 ──
     노드 '+' 팝오버에서 카테고리별로 골라 추가한다. */
  const LIBRARY_CATS = [
    { label: '화면 · 컨셉', items: ['관제 대시보드', '디지털 트윈', '포털', '리포트', '종합 상황', '시스템 현황', '메인 개요', '활용 사례'] },
    { label: '금융 컨텐츠', items: ['로그인', '계정계', '정보계', '대외채널', '인터넷 뱅킹', '모바일 뱅킹', '거래량', '거래 추이', '초당 처리건수(TPS)', '큐잉', '콜센터', '뱅킹 인프라', '트랜잭션'] },
    { label: '차트 · 그래프', items: ['라인차트', '바차트', '파이차트', '도넛차트', '게이지차트', '영역차트', '산점도차트', '라이다차트', '방사형차트', '커스텀차트', '데이터그리드', '표', '랭킹 리스트', '리스트', '지도', '미니맵', '타임라인', '이벤트브라우저', '시스템 구성도', '서비스맵', '시점 분석'] },
    { label: '메뉴 · 내비게이션', items: ['네비게이션 메뉴', 'GNB', '트리메뉴', '사이드바', '메뉴', '검색', '티커 알람', '날짜 시간', '패널', '타이틀바', '아이콘'] },
    { label: '센서 · 계측', items: ['온도센서', '온습도계', '온습도 전송기', '공기센서', '공기질 모니터', '가스탐지기', '누수탐지기', '수위감지기', '수질감지기', '동작감지센서', '화재감지기', '냄새 감지기', '지진계', '풍력계', '풍속계', '풍량계', '와이파이 센서'] },
    { label: '공조 · 냉난방', items: ['공조기', '천정 에어컨', '에어컨', '에어컨 실외기', '항온항습기', '냉각기', '냉각탑', '환풍기', '열교환기', '열펌프', '펌프', '공조시스템(HVAC)'] },
    { label: '전력 · 에너지', items: ['발전기', '발전기 제어반', '인버터', '배터리 모듈', '리튬이온 배터리', 'ESS 에너지저장', '전력변환장치(PCS)', '태양판', '변압기반', '송전탑', '배전반', '무정전 전원장치(UPS)', '차단기', 'VCB반', '고압반', '저압반', '초고압반', '전력 사용량'] },
    { label: '보안 · 출입통제', items: ['CCTV', 'CCTV Dome', 'CCTV PTZ', 'CCTV 적외선', 'AI CCTV', '열화상카메라', '출입통제시스템', '카드 리더기', '지문인식기', '홍채인식', '얼굴인식', '손인식', '주차관제(LPR)', '스피드게이트', '자동문', '방화벽', 'X-ray 검색대', '검색대', '도난방지기', '차량차단기', '바리케이드', '펜스'] },
    { label: '소방 · 안전', items: ['소화전', '옥외 소화전', '실내 소화전', '소방호스', '소방 센서', '분말 소화기', 'CO₂ 소화기', '하론 소화기', '방화 셔터', '산소공급기', '심장제세동기(AED)', '비상 벨', '비상 버튼', '비상구', '비상샤워기', '재난 경보', '화재경보기', '경고판'] },
    { label: '데이터센터 · IT', items: ['서버', '랙', '스토리지', '네트워크', '클라우드', 'CPU', '메모리', '디스크', '상면관리', '네트워크 수신기'] },
    { label: '3D 오브젝트 · 환경', items: ['표준 부지', '표준 건물', '표준 데이터센터', '드론', '로봇', '무인지게차', '항만', '도크', '컨테이너', '엘리베이터', '에스컬레이터', '차량', '기차', '나무', '물탱크', '기상관측탑', '작업자', '지구', '불 · 화재', '연기', '안개', '파티클', '3D 화살표', '흐름선'] },
  ];
  /* ── 이전(부모) 노드에 어울리는 카테고리만 노출하기 위한 관련도 매핑 ──
     브랜치(색=역할) + 프로젝트 산업군을 함께 보고 어울리는 라이브러리 카테고리를 고른다. */
  const BRANCH_CATS = {
    root:   ['화면 · 컨셉', '메뉴 · 내비게이션'],          /* PRD 최상위 메뉴 */
    green:  ['보안 · 출입통제', '메뉴 · 내비게이션'],       /* 진입 · 인증 */
    teal:   ['화면 · 컨셉', '차트 · 그래프', '메뉴 · 내비게이션'], /* 종합 현황 */
    blue:   ['센서 · 계측', '차트 · 그래프', '3D 오브젝트 · 환경'], /* 세부 모니터링 (+산업군) */
    purple: ['차트 · 그래프', '데이터센터 · IT', '메뉴 · 내비게이션'], /* 리포트 · 관리 */
  };
  const INDUSTRY_CATS = {
    finance:       ['금융 컨텐츠', '차트 · 그래프', '메뉴 · 내비게이션'],
    manufacturing: ['센서 · 계측', '공조 · 냉난방', '전력 · 에너지', '보안 · 출입통제', '차트 · 그래프'],
    distribution:  ['보안 · 출입통제', '센서 · 계측', '차트 · 그래프', '메뉴 · 내비게이션'],
    logistics:     ['3D 오브젝트 · 환경', '보안 · 출입통제', '센서 · 계측', '차트 · 그래프'],
    power:         ['전력 · 에너지', '센서 · 계측', '3D 오브젝트 · 환경', '차트 · 그래프'],
    electric:      ['전력 · 에너지', '센서 · 계측', '차트 · 그래프'],
    public:        ['센서 · 계측', '보안 · 출입통제', '소방 · 안전', '3D 오브젝트 · 환경', '차트 · 그래프'],
    datacenter:    ['데이터센터 · IT', '공조 · 냉난방', '전력 · 에너지', '센서 · 계측', '차트 · 그래프'],
    building:      ['공조 · 냉난방', '전력 · 에너지', '보안 · 출입통제', '소방 · 안전', '센서 · 계측'],
    security:      ['보안 · 출입통제', '소방 · 안전', '센서 · 계측', '3D 오브젝트 · 환경'],
  };
  function relevantCats(color) {
    const set = new Set(BRANCH_CATS[color] || BRANCH_CATS.blue);
    /* 현황·모니터링·최상위 노드는 프로젝트 산업군에 맞는 카테고리도 포함 */
    if (color === 'blue' || color === 'teal' || color === 'root') {
      (G.industries || []).forEach((k) => { (INDUSTRY_CATS[k] || []).forEach((c) => set.add(c)); });
    }
    return set;
  }
  function closeAddMenu() { document.querySelectorAll('.mm-addpop').forEach((p) => p.remove()); }
  /* '상세 기능 추가' 노드를 누르면 라이브러리 태그를 카테고리별로 팝오버에 나열한다.
     검색으로 좁힐 수 있고, 여러 개를 이어서 추가할 수 있다(추가해도 팝오버 유지). */
  function openAddMenu(phNode) {
    closeAddMenu();
    const parentKey = phNode.dataset.parentKey || '';
    const color = phNode.dataset.color || 'blue';
    const depth = parseInt(phNode.dataset.depth || '0', 10);
    /* depth 0(첫 노드)=GNB 메뉴, depth 1=하위 메뉴, depth 2+ = 콘텐츠(라이브러리) */
    const menuMode = depth <= 1;
    const menuList = depth === 0 ? GNB_MENUS : SUBMENU_ITEMS;
    const headLabel = menuMode ? (depth === 0 ? '추가할 메뉴 (GNB)' : '추가할 하위 메뉴') : '추가할 콘텐츠';
    const searchPh = menuMode ? '메뉴 검색' : '콘텐츠 검색 — 예: 차트, CCTV, 센서';
    const pop = document.createElement('div');
    pop.className = 'mm-addpop mm-addpop-lib';
    const rel = relevantCats(color);
    let showAll = false;
    pop.innerHTML =
      '<div class="mm-addpop-h"><span>' + headLabel + ' <b class="mm-addpop-cnt"></b></span>'
      + (menuMode ? '' : '<button type="button" class="mm-addpop-all">전체 보기</button>') + '</div>'
      + '<div class="mm-addpop-search"><input type="text" placeholder="' + searchPh + '" autocomplete="off" /></div>'
      + '<div class="mm-addpop-scroll"></div>';
    document.body.appendChild(pop);
    const scroll = pop.querySelector('.mm-addpop-scroll');
    const cntEl = pop.querySelector('.mm-addpop-cnt');
    const allBtn = pop.querySelector('.mm-addpop-all');
    const input = pop.querySelector('.mm-addpop-search input');
    const sec = (label, items, reco) =>
      '<div class="mm-addpop-sec">' + esc(label) + '</div><div class="mm-addpop-grid">'
      + items.map((x) => '<button type="button" class="mm-addbtn' + (reco ? ' reco' : '') + '" data-f="' + esc(x) + '">' + esc(x) + (reco ? '<span class="rb">추천</span>' : '') + '</button>').join('')
      + '</div>';
    function draw() {
      const q = (input.value || '').trim().toLowerCase();
      const added = new Set(mmExtra[parentKey] || []);
      const match = (x) => !added.has(x) && (!q || x.toLowerCase().includes(q));
      let html = '', total = 0;
      if (menuMode) {
        /* 메뉴 추천만 (GNB / 하위 메뉴) */
        const items = menuList.filter(match);
        if (items.length) { html += sec(depth === 0 ? 'GNB 메뉴' : '하위 메뉴', items, true); total += items.length; }
      } else {
        /* 콘텐츠(라이브러리 태그) — 기본은 관련 카테고리, '전체 보기'면 전부 */
        const cats = showAll ? LIBRARY_CATS : LIBRARY_CATS.filter((c) => rel.has(c.label));
        const reco = (FEATURE_POOL[color] || FEATURE_POOL.blue).reco.filter(match);
        if (reco.length) { html += sec('추천', reco, true); total += reco.length; }
        cats.forEach((cat) => {
          const items = cat.items.filter(match);
          if (items.length) { html += sec(cat.label, items, false); total += items.length; }
        });
      }
      if (!total) html = '<div class="mm-addpop-empty">' + (q ? '검색 결과가 없어요.' : '더 추가할 항목이 없어요.') + '</div>';
      scroll.innerHTML = html;
      cntEl.textContent = total ? total + '개' : '';
      if (allBtn) { allBtn.textContent = showAll ? '관련만 보기' : '전체 보기'; allBtn.classList.toggle('on', showAll); }
    }
    if (allBtn) allBtn.addEventListener('click', (e) => { e.stopPropagation(); showAll = !showAll; draw(); });
    draw();
    const r = phNode.getBoundingClientRect();
    const pw = pop.offsetWidth, phh = pop.offsetHeight;
    let x = r.left, y = r.bottom + 8;
    if (x + pw > window.innerWidth - 12) x = window.innerWidth - pw - 12;
    if (x < 12) x = 12;
    if (y + phh > window.innerHeight - 12) y = Math.max(12, r.top - phh - 8);
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
    input.addEventListener('input', draw);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if (input.value) { input.value = ''; draw(); } else closeAddMenu(); } });
    scroll.addEventListener('click', (e) => {
      const bb = e.target.closest('.mm-addbtn'); if (!bb) return;
      /* draw()가 버튼을 교체하면 이 클릭이 바깥 클릭으로 오인돼 팝오버가 닫히므로 전파를 막는다 */
      e.stopPropagation();
      mmExtra[parentKey] = (mmExtra[parentKey] || []).concat(bb.dataset.f);
      renderFlow();       /* 트리에 반영 */
      draw();             /* 팝오버는 열어 둔 채 목록만 갱신(연속 추가) */
    });
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 30);
  }
  document.addEventListener('click', (e) => { if (!e.target.closest('.mm-addpop') && !e.target.closest('.mm-node')) closeAddMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAddMenu(); });
  function renderFlow() {
    const wrap = document.getElementById('flowWrap'); if (!wrap) return;
    const branches = deriveTree();
    let uid = 0;
    const nodes = [];
    const mk = (o) => { o.id = uid++; o.children = []; nodes.push(o); return o; };
    const labelFor = (path, def) => (mmEdit[path] != null ? mmEdit[path] : def);
    const typeOf = (d) => (d === 1 ? 'l1' : (d === 2 ? 'l2' : 'l3'));
    const root = mk({ label: labelFor('root', 'PRD'), depth: 0, type: 'root', color: 'root', path: 'root', parentKey: 'root' });
    /* 파생 자식(삭제분 제외) + 사용자가 추가한 자식을 재귀적으로 붙인다 */
    const build = (parent, kids, color, parentPath, depth) => {
      const derived = (kids || []).filter((k) => !mmDeleted.has(parentPath + '::' + k.n));
      const added = (mmExtra[parentPath] || []).map((n) => ({ n, added: true }));
      derived.concat(added).forEach((k, idx) => {
        const path = parentPath + '.' + (idx + 1);
        const node = mk({ label: labelFor(path, k.n), base: k.n, added: !!k.added, depth, type: typeOf(depth), color, num: path, path, parentKey: path });
        parent.children.push(node);
        build(node, k.kids || [], color, path, depth + 1);
      });
    };
    /* 최상위 메뉴(브랜치) = 파생(삭제분 제외) + 사용자가 루트에 추가한 메뉴 */
    const PALETTE = ['green', 'teal', 'blue', 'purple'];
    const rootDerived = branches.filter((b) => !mmDeleted.has('root::' + b.n));
    const rootAdded = (mmExtra['root'] || []).map((n) => ({ n, added: true, color: null }));
    rootDerived.concat(rootAdded).forEach((b, i) => {
      const path = String(i + 1);
      const color = b.color || PALETTE[i % PALETTE.length];
      const l1 = mk({ label: labelFor(path, b.n), base: b.n, added: !!b.added, depth: 1, type: 'l1', color, num: path, path, parentKey: path });
      root.children.push(l1);
      build(l1, b.kids || [], color, path, 2);
    });
    const ROW = 50, COLX = [0, 320, 660, 1000, 1340, 1680, 2020];
    const colOf = (d) => (COLX[d] != null ? COLX[d] : d * 340);
    const cy = {}; let leaf = 0;
    (function assign(nd) {
      if (!nd.children.length) { cy[nd.id] = (leaf++ + 0.5) * ROW; return; }
      nd.children.forEach(assign);
      cy[nd.id] = (cy[nd.children[0].id] + cy[nd.children[nd.children.length - 1].id]) / 2;
    })(root);
    const board = document.createElement('div'); board.className = 'mm-board';
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'mm-links');
    board.appendChild(svg);
    const el = {};
    nodes.forEach((nd) => {
      const d = document.createElement('div');
      d.className = 'mm-node mm-' + nd.type + (nd.color && nd.color !== 'root' ? ' c-' + nd.color : '');
      const off = mmPos[nd.path] || { ox: 0, oy: 0 };
      const bx = colOf(nd.depth), by = cy[nd.id];
      d.style.left = (bx + off.ox) + 'px';
      d.style.top = (by + off.oy) + 'px';
      d.dataset.bx = bx; d.dataset.by = by; d.dataset.label = nd.label; d.dataset.path = nd.path;
      d.dataset.color = nd.color || 'blue';
      d.dataset.parentKey = nd.parentKey || nd.path;
      d.dataset.depth = nd.depth;
      if (nd.base != null) d.dataset.base = nd.base;
      if (nd.added) d.dataset.added = '1';
      if (nd.type === 'root') {
        /* 뱃지는 프로젝트명. 제목(PRD)은 클릭해 수정 가능, +로 GNB 상위 메뉴 추가 */
        const projName = (G.site && G.site.trim()) || '새 프로젝트';
        d.innerHTML = '<span class="mm-t">' + esc(nd.label) + '</span><span class="mm-badge">✦ ' + esc(projName) + '</span><span class="mm-add" title="GNB 메뉴 추가">+</span>';
      } else {
        const fav = mmFav.has(nd.path);
        if (fav) d.classList.add('mm-fav');
        const addTitle = nd.depth <= 1 ? '하위 메뉴 추가' : '콘텐츠 추가';
        d.innerHTML = '<span class="mm-t">' + esc(nd.label) + '</span>' + (nd.num ? '<span class="mm-num">' + nd.num + '</span>' : '') + '<span class="mm-star" title="즐겨찾기">' + (fav ? '★' : '☆') + '</span><span class="mm-add" title="' + addTitle + '">+</span><span class="mm-del" title="이 노드 삭제">×</span>';
      }
      board.appendChild(d); el[nd.id] = d;
    });
    wrap.innerHTML = ''; wrap.appendChild(board);
    const s = document.getElementById('flowSummary'); if (s) s.innerHTML = summaryHTML('PRD를 뿌리로, 화면·기능이 가지치기되는 구조예요. 노드를 드래그해 위치를 바꿀 수 있어요.');
    /* top=중심값 + translateY(-50%)라 offsetTop이 곧 시각 중심 Y. 드래그 후에도 커넥터가 따라오게 매번 다시 그린다. */
    const isVis = (e) => e && e.style.display !== 'none';
    function drawLinks() {
      let W = 0, H = 0;
      nodes.forEach((nd) => { const e = el[nd.id]; if (!isVis(e)) return; W = Math.max(W, e.offsetLeft + e.offsetWidth); H = Math.max(H, e.offsetTop + e.offsetHeight / 2); });
      W += 10; H += ROW;
      board.style.width = W + 'px'; board.style.height = H + 'px';
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      let paths = '';
      nodes.forEach((p) => p.children.forEach((c) => {
        const pe = el[p.id], ce = el[c.id];
        if (!isVis(pe) || !isVis(ce)) return; /* 즐겨찾기 필터로 숨은 노드로 가는 선은 그리지 않는다 */
        const x0 = pe.offsetLeft + pe.offsetWidth, y0 = pe.offsetTop, x1 = ce.offsetLeft, y1 = ce.offsetTop;
        const dx = Math.max(26, Math.abs(x1 - x0) * 0.5);
        paths += '<path class="mm-link c-' + (c.color || 'none') + '" d="M' + x0 + ' ' + y0 + ' C' + (x0 + dx) + ' ' + y0 + ' ' + (x1 - dx) + ' ' + y1 + ' ' + x1 + ' ' + y1 + '"/>';
      }));
      svg.innerHTML = paths;
    }
    requestAnimationFrame(() => {
      drawLinks(); fitFlow();
      /* 렌더 직후, 유지 중인 즐겨찾기 필터·검색 상태를 다시 반영한다 */
      if (flowFavOnly) applyVisibility();
      if (flowQuery) doSearch(flowQuery);
    });
    /* ── 노드 드래그 — 다른 노드 위에 놓으면 그 노드와 위치를 서로 맞바꾼다(swap) ── */
    let drag = null;
    const setOffset = (elm) => {
      mmPos[elm.dataset.path] = {
        ox: (parseFloat(elm.style.left) || 0) - parseFloat(elm.dataset.bx),
        oy: (parseFloat(elm.style.top) || 0) - parseFloat(elm.dataset.by),
      };
    };
    /* 드래그 중인 노드의 중심이 박스 안에 들어오는 '다른' 노드(가장 가까운 것)를 찾는다 */
    const overlapTarget = (nd) => {
      const cx = nd.offsetLeft + nd.offsetWidth / 2;
      const cy = nd.offsetTop + nd.offsetHeight / 2;
      let best = null, bestD = Infinity;
      nodes.forEach((o) => {
        const e = el[o.id];
        if (!e || e === nd) return;
        const inside = cx >= e.offsetLeft && cx <= e.offsetLeft + e.offsetWidth && cy >= e.offsetTop && cy <= e.offsetTop + e.offsetHeight;
        if (!inside) return;
        const d = Math.hypot(cx - (e.offsetLeft + e.offsetWidth / 2), cy - (e.offsetTop + e.offsetHeight / 2));
        if (d < bestD) { bestD = d; best = e; }
      });
      return best;
    };
    const clearSwapHint = (keep) => board.querySelectorAll('.mm-swap-target').forEach((x) => { if (x !== keep) x.classList.remove('mm-swap-target'); });
    /* 별(☆/★) 클릭 → 즐겨찾기 토글 */
    function toggleFav(node) {
      const path = node.dataset.path;
      const star = node.querySelector('.mm-star');
      if (mmFav.has(path)) { mmFav.delete(path); node.classList.remove('mm-fav'); if (star) star.textContent = '☆'; }
      else { mmFav.add(path); node.classList.add('mm-fav'); if (star) star.textContent = '★'; }
      if (flowFavOnly) applyVisibility();
    }
    /* 노드 삭제 — 추가 노드는 mmExtra에서 제거, 파생 노드는 mmDeleted에 표시(자식도 함께 사라짐) */
    function deleteNode(node) {
      const P = node.dataset.path;
      if (!P || P === 'root') return;
      const base = node.dataset.base != null ? node.dataset.base : node.dataset.label;
      const parts = P.split('.');
      const PP = parts.length === 1 ? 'root' : parts.slice(0, -1).join('.');
      if (node.dataset.added) mmExtra[PP] = (mmExtra[PP] || []).filter((x) => x !== base);
      else mmDeleted.add(PP + '::' + base);
      closeAddMenu();
      renderFlow();
    }
    /* 텍스트 클릭 → 그 자리에서 라벨 수정 */
    function startEdit(node) {
      const t = node.querySelector('.mm-t'); if (!t) return;
      node.classList.add('mm-editing');
      t.setAttribute('contenteditable', 'true');
      t.focus();
      try { const rng = document.createRange(); rng.selectNodeContents(t); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(rng); } catch (err) {}
      let done = false;
      const finish = (commit) => {
        if (done) return; done = true;
        t.removeAttribute('contenteditable');
        node.classList.remove('mm-editing');
        t.removeEventListener('blur', onBlur);
        t.removeEventListener('keydown', onKey);
        if (commit) { const v = t.textContent.trim(); if (v) mmEdit[node.dataset.path] = v; }
        renderFlow();
      };
      const onBlur = () => finish(true);
      const onKey = (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
        else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
      };
      t.addEventListener('blur', onBlur);
      t.addEventListener('keydown', onKey);
    }
    board.addEventListener('pointerdown', (e) => {
      if (spaceDown) return; /* 스페이스바 패닝 중엔 노드 조작하지 않음(스테이지가 이동 처리) */
      /* 별 클릭 → 즐겨찾기 토글 */
      const star = e.target.closest('.mm-star');
      if (star) { e.preventDefault(); const node = star.closest('.mm-node'); if (node) toggleFav(node); return; }
      /* × 클릭 → 노드 삭제 */
      const del = e.target.closest('.mm-del');
      if (del) { e.preventDefault(); const node = del.closest('.mm-node'); if (node) deleteNode(node); return; }
      /* + 클릭 → 그 노드에 맞는 후보(메뉴/콘텐츠) 팝오버 */
      const add = e.target.closest('.mm-add');
      if (add) { e.preventDefault(); const node = add.closest('.mm-node'); if (node) openAddMenu(node); return; }
      const nd = e.target.closest('.mm-node'); if (!nd) return;
      if (nd.classList.contains('mm-editing')) return; /* 수정 중엔 드래그하지 않음 */
      e.preventDefault();
      const onText = !!e.target.closest('.mm-t');
      drag = { nd, sx: e.clientX, sy: e.clientY, l: parseFloat(nd.style.left) || 0, t: parseFloat(nd.style.top) || 0, onText, moved: false, pid: e.pointerId };
    });
    board.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dxp = e.clientX - drag.sx, dyp = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dxp, dyp) < 5) return; /* 임계값 넘어야 드래그 시작 */
      if (!drag.moved) { drag.moved = true; drag.nd.classList.add('mm-dragging'); try { drag.nd.setPointerCapture(drag.pid); } catch (err) {} }
      const k = mmScale || 1;
      drag.nd.style.left = (drag.l + dxp / k) + 'px';
      drag.nd.style.top = (drag.t + dyp / k) + 'px';
      const t = overlapTarget(drag.nd);
      clearSwapHint(t);
      if (t) t.classList.add('mm-swap-target');
      drawLinks();
    });
    const endDrag = () => {
      if (!drag) return;
      const nd = drag.nd, onText = drag.onText, moved = drag.moved;
      if (!moved) {
        /* 이동 없이 클릭 — 텍스트면 수정, 그 외 영역이면 추가 메뉴 */
        drag = null;
        if (onText) startEdit(nd); else openAddMenu(nd);
        return;
      }
      nd.classList.remove('mm-dragging');
      const target = overlapTarget(nd);
      clearSwapHint(null);
      if (target) {
        /* 색 슬롯(색상·위치)은 그대로 두고 내용(라벨·번호)만 맞바꾼다 */
        const tmp = nd.innerHTML;
        nd.innerHTML = target.innerHTML;
        target.innerHTML = tmp;
        nd.style.left = drag.l + 'px';
        nd.style.top = drag.t + 'px';
      } else {
        setOffset(nd);
      }
      drag = null;
      drawLinks();
    };
    board.addEventListener('pointerup', endDrag);
    board.addEventListener('pointercancel', endDrag);

    /* ── 즐겨찾기 필터 · 검색 포커스 ── */
    function applyVisibility() {
      nodes.forEach((nd) => {
        const e = el[nd.id]; if (!e) return;
        e.style.display = (flowFavOnly && !mmFav.has(nd.path)) ? 'none' : '';
      });
      board.classList.remove('mm-anim');
      drawLinks();
      requestAnimationFrame(fitFlow);
    }
    /* 노드를 화면 중앙으로 확대(포커스) — 스테이지 중앙에 노드 중심이 오도록 이동+확대 */
    function focusNode(e2) {
      const stage = document.querySelector('#pageFlow .flow-stage');
      if (!stage || !e2) return;
      const cs = getComputedStyle(stage);
      const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const s = 1.5; /* 포커스 확대 배율(자연 크기 기준) */
      const nx = e2.offsetLeft + e2.offsetWidth / 2;
      const ny = e2.offsetTop + e2.offsetHeight / 2;
      wrap.style.width = aw + 'px';
      wrap.style.height = ah + 'px';
      board.style.transformOrigin = '0 0';
      board.classList.add('mm-anim');
      board.style.transform = 'translate(' + (aw / 2 - nx * s) + 'px,' + (ah / 2 - ny * s) + 'px) scale(' + s.toFixed(4) + ')';
      mmScale = s;
    }
    function doSearch(q) {
      flowQuery = q || '';
      const qq = flowQuery.trim().toLowerCase();
      let first = null;
      nodes.forEach((nd) => {
        const e = el[nd.id]; if (!e) return;
        const hit = !!qq && String(nd.label).toLowerCase().indexOf(qq) >= 0 && isVis(e);
        e.classList.toggle('mm-match', hit);
        if (hit && !first) first = e;
      });
      if (first) focusNode(first);
      else if (!qq) { board.classList.remove('mm-anim'); fitFlow(); } /* 검색어 비면 전체 보기로 복귀 */
      return !!first;
    }
    flowApi = { search: doSearch, applyVisibility: applyVisibility, hasFav: () => mmFav.size > 0 };
  }
  /* 마인드맵을 스테이지에 맞춰 스케일(스크롤 없이 화면 비율에 맞춤).
     보드를 top-left 기준 scale하고 래퍼를 축소 크기로 지정해야 grid 가운데 정렬이 맞는다. */
  function fitFlow() {
    const stage = document.querySelector('#pageFlow .flow-stage');
    const wrap = document.getElementById('flowWrap');
    if (!stage || !wrap) return;
    const branch = wrap.firstElementChild; if (!branch) return;
    branch.classList.remove('mm-anim'); /* 포커스 확대 애니메이션 해제 — 맞춤은 즉시 반영 */
    branch.style.transform = 'none';
    wrap.style.width = ''; wrap.style.height = '';
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const bw = branch.offsetWidth, bh = branch.offsetHeight;
    if (!bw || !bh || availW <= 0 || availH <= 0) return;
    /* 화면 맞춤 배율(최대 1.0)에 사용자 확대·축소(mmZoom)를 곱한다.
       mmZoom>1이면 보드가 스테이지보다 커져 가운데 정렬 기준으로 확대(넘치는 부분은 overflow:hidden으로 잘림). */
    const fit = Math.min(availW / bw, availH / bh, 1.0);
    mmScale = fit * mmZoom;
    branch.style.transformOrigin = 'top left';
    branch.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + mmScale.toFixed(4) + ')';
    wrap.style.width = Math.round(bw * mmScale) + 'px';
    wrap.style.height = Math.round(bh * mmScale) + 'px';
  }
  /* 스케일은 그대로 두고 이동(패닝)만 빠르게 반영 */
  function applyPan() {
    const wrap = document.getElementById('flowWrap');
    const branch = wrap && wrap.firstElementChild;
    if (branch) branch.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + mmScale.toFixed(4) + ')';
  }
  window.addEventListener('resize', () => { const pf = document.getElementById('pageFlow'); if (pf && !pf.hidden) fitFlow(); });
  /* ── 캔버스 확대·축소(버튼 + Ctrl+휠) ── */
  function updateZoomLabel() { const lv = document.getElementById('fzLevel'); if (lv) lv.textContent = Math.round(mmZoom * 100) + '%'; }
  function zoomBy(factor) { mmZoom = Math.min(4, Math.max(0.5, mmZoom * factor)); fitFlow(); updateZoomLabel(); }
  function zoomReset() { mmZoom = 1; panX = 0; panY = 0; fitFlow(); updateZoomLabel(); }
  /* ── 캔버스 이동(패닝) — 빈 곳 드래그 또는 스페이스바+드래그 ── */
  (function initFlowPan() {
    const stage = document.querySelector('#pageFlow .flow-stage');
    if (!stage) return;
    let panning = null;
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.flow-zoom')) return;
      /* 노드 위에서 시작하면(스페이스바 아닐 때) 노드 조작이 우선 — 패닝은 빈 곳/스페이스바일 때만 */
      if (e.target.closest('.mm-node') && !spaceDown) return;
      e.preventDefault();
      panning = { sx: e.clientX, sy: e.clientY, px: panX, py: panY };
      stage.classList.add('flow-panning');
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', (e) => {
      if (!panning) return;
      panX = panning.px + (e.clientX - panning.sx);
      panY = panning.py + (e.clientY - panning.sy);
      applyPan();
    });
    const endPan = () => { if (panning) { panning = null; stage.classList.remove('flow-panning'); } };
    stage.addEventListener('pointerup', endPan);
    stage.addEventListener('pointercancel', endPan);
    /* 스페이스바 — 누르는 동안 패닝 모드(입력/수정 중이 아닐 때만) */
    document.addEventListener('keydown', (e) => {
      if (e.code !== 'Space') return;
      const pf = document.getElementById('pageFlow'); if (!pf || pf.hidden) return;
      const ae = document.activeElement;
      if (ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'BUTTON')) return;
      e.preventDefault();
      spaceDown = true;
      stage.classList.add('flow-space');
    });
    document.addEventListener('keyup', (e) => {
      if (e.code !== 'Space') return;
      spaceDown = false;
      stage.classList.remove('flow-space');
    });
  })();
  (function initFlowZoom() {
    const zc = document.getElementById('flowZoom');
    const stage = document.querySelector('#pageFlow .flow-stage');
    if (zc) zc.addEventListener('click', (e) => {
      const b = e.target.closest('.fz-btn'); if (!b) return;
      if (b.id === 'fzLevel') { zoomReset(); return; }
      zoomBy(b.dataset.z === 'in' ? 1.2 : 1 / 1.2);
    });
    /* Ctrl(또는 ⌘) + 마우스 휠 → 캔버스 확대·축소 */
    if (stage) stage.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });
    updateZoomLabel();
  })();

  /* ── 유저플로우 툴바(검색 · 즐겨찾기만 보기) 배선 — 한 번만 연결하고 flowApi로 현재 렌더를 조작 ── */
  (function initFlowTools() {
    const box = document.getElementById('flowSearchBox');
    const searchBtn = document.getElementById('flowSearchBtn');
    const input = document.getElementById('flowSearch');
    const favBtn = document.getElementById('flowFavOnly');
    const run = () => { if (flowApi) flowApi.search(input ? input.value : ''); };
    if (searchBtn && box && input) {
      searchBtn.addEventListener('click', () => {
        const open = box.classList.toggle('open');
        if (open) setTimeout(() => input.focus(), 40);
        else { input.value = ''; run(); } /* 접으면 검색 해제 */
      });
    }
    if (input) {
      input.addEventListener('input', run);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    }
    /* 바깥을 클릭하면 입력이 비어 있을 때 접는다 */
    document.addEventListener('click', (e) => {
      if (box && box.classList.contains('open') && !e.target.closest('#flowSearchBox') && input && !input.value.trim()) box.classList.remove('open');
    });
    if (favBtn) favBtn.addEventListener('click', () => {
      if (!flowFavOnly && (!flowApi || !flowApi.hasFav())) {
        if (typeof toast === 'function') toast('노드의 별(☆)을 눌러 즐겨찾기한 뒤 사용하세요.', { type: 'warn' });
        return;
      }
      flowFavOnly = !flowFavOnly;
      favBtn.classList.toggle('on', flowFavOnly);
      if (flowApi) flowApi.applyVisibility();
    });
  })();

  /* ── 3) 추천 1순위 레이아웃 id 계산 — 규모→계열, 모니터링 항목 수→행(R) 강도 ──
     와이어프레임 메뉴는 카테고리별 '모든' 레이아웃을 보여주고, 여기서 고른 것만 배지로 표시한다. */
  function recoIds() {
    const L = window.__WEMBLayouts; const out = {};
    if (!L) return out;
    const nf = (G.targets || []).length;
    const rIdx = nf <= 2 ? 0 : (nf <= 4 ? 1 : 2);
    const pick = (sets, fam) => { const a = sets[fam]; return a && a.length ? a[Math.min(rIdx, a.length - 1)].id : null; };
    const dashFamily = G.scale === 'single' ? 'g2' : (G.scale === 'enterprise' ? 'mod' : 'g3');
    const dtFamily = G.scale === 'single' ? 'dt2' : (G.scale === 'enterprise' ? 'dt4' : 'dt3');
    if (G.screen === 'dash') out.dash = pick(L.LAYOUTS, dashFamily);
    if (G.screen === 'dt') out.dt = pick(L.DT_LAYOUTS, dtFamily);
    return out;
  }
  let selected = null;
  function renderWire() {
    const wrap = document.getElementById('wireReco'); const L = window.__WEMBLayouts;
    const startBtn = document.getElementById('wireStart'), pickLbl = document.getElementById('wirePick');
    if (!wrap || !L) return;
    wrap.innerHTML = ''; selected = null;
    if (startBtn) startBtn.disabled = true;
    const recos = recoIds();
    const both = false; /* '둘 다' 옵션 제거 — 단일 화면 종류만 */
    /* 화면 종류에 맞는 카테고리 세트: 대시보드=2단/3단/모듈, 디지털 트윈=2·3·4레벨 */
    const sections = [];
    if (G.screen === 'dash') sections.push({ screen: 'dash', groups: L.GROUPS, sets: L.LAYOUTS, recoId: recos.dash });
    if (G.screen === 'dt') sections.push({ screen: 'dt', groups: L.DT_GROUPS, sets: L.DT_LAYOUTS, recoId: recos.dt });

    const pickCard = (card, screen, lay, announce) => {
      wrap.querySelectorAll('.wreco').forEach((x) => x.classList.remove('on'));
      card.classList.add('on');
      selected = { screen, layoutId: lay.id, name: lay.name };
      if (startBtn) startBtn.disabled = false;
      if (pickLbl) pickLbl.textContent = SCREEN_LBL[screen] + ' · ' + lay.name + announce;
    };

    sections.forEach((sec) => {
      sec.groups.forEach((grp) => {
        const cat = document.createElement('div');
        cat.className = 'wcat';
        const h = document.createElement('div');
        h.className = 'wcat-h';
        const b = document.createElement('b');
        b.textContent = (both ? SCREEN_LBL[sec.screen] + ' · ' : '') + grp.label;
        const hint = document.createElement('span');
        hint.textContent = grp.hint;
        h.appendChild(b); h.appendChild(hint);
        cat.appendChild(h);
        const row = document.createElement('div');
        row.className = 'wreco-grid';
        (sec.sets[grp.key] || []).forEach((lay) => {
          const isReco = lay.id === sec.recoId;
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'wreco';
          card.appendChild(L.wfEl(lay));
          if (both) { const scr = document.createElement('span'); scr.className = 'wreco-screen'; scr.textContent = SCREEN_LBL[sec.screen]; card.appendChild(scr); }
          const nm = document.createElement('div'); nm.className = 'wreco-name'; nm.textContent = lay.name;
          const dd = document.createElement('div'); dd.className = 'wreco-desc'; dd.textContent = lay.desc;
          card.appendChild(nm); card.appendChild(dd);
          if (isReco) { const bd = document.createElement('span'); bd.className = 'wreco-badge'; bd.textContent = '추천'; card.appendChild(bd); }
          card.onclick = () => pickCard(card, sec.screen, lay, ' 선택됨');
          row.appendChild(card);
          /* 첫 번째 추천을 기본 선택 */
          if (isReco && !selected) pickCard(card, sec.screen, lay, ' (추천)');
        });
        cat.appendChild(row);
        wrap.appendChild(cat);
      });
    });
  }

  /* ── 단계별 진행(스텝) ──
     PRD → 기능명세서 → 유저플로우 → 와이어프레임 → 스튜디오 순으로만 열린다.
     각 단계의 '다음 단계로' 버튼을 눌러야 그 다음 탭이 잠금 해제된다.
     (maxStep = 지금까지 도달한 가장 먼 단계. 새로고침해도 그 화면으로 복원되도록 localStorage에 유지) */
  const STEP_PAGES = ['prd', 'spec', 'flow', 'wireframe', 'wire'];
  const STEP_LS = 'wemb-step';
  let maxStep = (() => { try { return Math.max(0, parseInt(localStorage.getItem(STEP_LS), 10) || 0); } catch (e) { return 0; } })();
  const saveStep = () => { try { localStorage.setItem(STEP_LS, String(maxStep)); } catch (e) {} };
  /* PRD '전체 완료' = 이름 + 모든 문항(화면·규모·산업군·모니터링 대상 1개 이상·운영)을 다 골랐을 때 */
  const prdComplete = () =>
    !!(G.site && G.site.trim()) &&
    !!G.screen && !!G.scale &&
    Array.isArray(G.industries) && G.industries.length > 0 &&
    Array.isArray(G.targets) && G.targets.length > 0 &&
    !!G.ops;
  /* 탭 잠금 해제는 오직 '다음 단계로' 버튼을 눌러 advanceStep 했을 때만.
     PRD를 다 채워도(=prdComplete) 기능명세서 탭은 열리지 않고, '기능명세서 자동 생성' 버튼만 활성화된다. */
  const unlocked = () => maxStep;
  /* 잠긴 탭의 라벨 — '이전 단계'가 어느 단계인지 말해 준다.
     네 탭에 같은 문구를 심으면 접근성 트리에서 서로 구분되지 않는다. */
  const STEP_LABELS = { prd: 'PRD', spec: '기능명세서', flow: '유저플로우', wireframe: '와이어프레임', wire: '스튜디오' };
  /* 목적격 조사 — 받침이 있으면 '을', 없으면 '를'.
     한글이 아니면(예: PRD) 읽는 소리의 끝음절로 판단한다. */
  const OBJ_PARTICLE = { PRD: '를' };
  function withObj(word) {
    if (OBJ_PARTICLE[word]) return word + OBJ_PARTICLE[word];
    const c = word.charCodeAt(word.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return word + '를';
    return word + ((c - 0xac00) % 28 === 0 ? '를' : '을');
  }
  function lockReason(idx) {
    const need = STEP_PAGES[Math.max(0, idx - 1)];
    return `${withObj(STEP_LABELS[need] || '이전 단계')} 완료하면 열려요`;
  }
  function refreshSteps() {
    const lvl = unlocked();
    document.querySelectorAll('.tb-tab').forEach((t) => {
      const idx = STEP_PAGES.indexOf(t.dataset.page);
      const locked = idx > lvl;
      t.classList.toggle('locked', locked);
      /* disabled 를 걸면 탭 순서에서 통째로 빠져, 키보드 사용자는 '다음 단계가
         잠겨 있다'는 사실 자체를 알 수 없다. 초점은 받게 두고 활성화만 막는다.
         (실제 차단은 아래 tb-tabs click/keydown 핸들러의 aria-disabled 검사) */
      t.disabled = false;
      t.setAttribute('aria-disabled', locked ? 'true' : 'false');
      if (locked) t.title = lockReason(idx); else t.removeAttribute('title');
    });
    const gen = document.getElementById('prdGen');
    if (gen) { gen.disabled = !prdComplete(); gen.title = prdComplete() ? '' : 'PRD를 모두 작성하면 열려요'; }
    const note = document.getElementById('prdNote');
    if (note) note.textContent = prdComplete() ? '모두 작성했어요. 다음 단계(기능명세서)로 넘어갈 수 있어요.' : '모든 문항에 답하면 기능명세서 단계가 열려요.';
  }
  function advanceStep(i) { if (i > maxStep) { maxStep = i; saveStep(); } refreshSteps(); }
  /* 새 프로젝트 시작 시 PRD를 '아무것도 선택 안 된' 빈 상태로 초기화한다 */
  const EMPTY_PRD = { site: '', screen: '', scale: '', industries: [], targets: [], ops: '' };
  window.__wembPrdReset = () => { G = Object.assign({}, EMPTY_PRD, { industries: [], targets: [] }); save(); try { localStorage.removeItem('wemb-current-proj'); } catch (e) {} paintForm(); };
  window.__wembStep = {
    advance: advanceStep,
    reset: () => { maxStep = 0; saveStep(); refreshSteps(); },
    refresh: refreshSteps,
    allowed: (page) => STEP_PAGES.indexOf(page) <= unlocked(),
    /* 현재 열려 있는 마지막 단계 index — 부팅 복원이 잠긴 탭을 가리키지 않게 쓴다 */
    level: unlocked,
  };
  /* 유저플로우의 상위 메뉴(브랜치) 이름 — 스튜디오 상단 내비게이션에 반영 */
  window.__WEMBFlowMenu = () => deriveTree().map((b) => b.n);
  /* PRD 답변 기반 패널 콘텐츠 제목 목록 — 디지털 트윈/대시보드 레이아웃 패널을 이걸로 채운다.
     (종합 현황 + 모니터링 대상들 + 알람·KPI·리포트) */
  window.__prdContentItems = () => {
    const items = ['종합 현황'];
    targetLabels().forEach((t) => items.push(t));
    items.push('알람 · 이벤트', '실시간 KPI', '리포트 · 통계');
    return items;
  };

  /* ===== PRD 답변 → 디지털 트윈 패널 콘텐츠 =====
     위저드 답변(프로젝트명·산업군·모니터링 대상)으로 트윈 화면의 브랜드명·레이어 심볼·
     지역 트리·자산 리스트·이벤트 현황을 다시 그린다. 대상이 하나도 없으면(빈 PRD) 기본
     데모(한국서부발전) 화면을 그대로 둔다. 커스텀 템플릿(한진/SK하이닉스)·편집 중일 땐 건너뛴다. */
  (function initDtPrd() {
    let DEMO = null; /* 원본 트윈 데모 스냅샷(빈 PRD 복원용) */
    const ICO = {
      all:   '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
      quake: '<polyline points="2 12 6 12 9 5 13 19 16 12 22 12"/>',
      cctv:  '<path d="M2 8.5A1.5 1.5 0 0 1 3.5 7h9A1.5 1.5 0 0 1 14 8.5V16H3.5A1.5 1.5 0 0 1 2 14.5z"/><polygon points="14 11 21 7.5 21 15.5 14 12"/>',
      fire:  '<path d="M12 2s5 5.5 5 10a5 5 0 0 1-10 0c0-4.5 5-10 5-10z"/>',
      power: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
      bolt:  '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
      sensor:'<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.25a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>',
      alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      box:   '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
      drop:  '<path d="M12 2.7s5.5 6.8 5.5 10.8a5.5 5.5 0 0 1-11 0C6.5 9.5 12 2.7 12 2.7z"/>',
      thermo:'<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
      server:'<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
      user:  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    };
    const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    const svg = (inner, sw) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';

    /* 모니터링 대상 라벨 → 분류(아이콘·이벤트·자산 유형 공유) */
    function catOf(lbl) {
      const s = String(lbl);
      if (/CCTV|카메라|영상|열화상|녹화/i.test(s)) return 'cctv';
      if (/화재|소방|소화|제연|화염|연기/.test(s)) return 'fire';
      if (/지진|기상|재난|관측|경보/.test(s)) return 'quake';
      if (/누수|가스|수위|상.?하수|배관/.test(s)) return 'drop';
      if (/온습도|항온|공조|HVAC|압력|환경/i.test(s)) return 'thermo';
      if (/출입|지문|얼굴|작업자|카운트|보안|PSIM/i.test(s)) return 'user';
      if (/랙|서버|스토리지|네트워크|데이터센터|상면|DCIM|NMS/i.test(s)) return 'server';
      if (/발전|터빈|보일러|ESS|태양광|인버터|배터리|풍력|송전|PCS|리튬/i.test(s)) return 'bolt';
      if (/변압|배전|차단|고압|저압|초고압|수전|UPS|한전|VCB|전력|전기/i.test(s)) return 'power';
      if (/방재|물품|대피/.test(s)) return 'shield';
      if (/알람|이벤트/.test(s)) return 'alert';
      return 'box';
    }
    const SYM_LBL = { cctv: 'CCTV', fire: '소방', quake: '지진감지', drop: '누수·가스', thermo: '환경감시', user: '출입통제', server: '전산실', bolt: '발전설비', power: '전력계통', shield: '방재물품', alert: '경보', box: '설비' };
    /* 산업군별 화면 텍스트 팩 — 브랜드(제목)·상단 내비를 도메인에 맞게 갈아끼운다(임시).
       자산이 쌓이면 더 구체적으로 확장. */
    const DOMAIN = {
      security:      { title: '통합 보안관제', region: '관제 구역', nav: ['보안관제', '출입통제', '영상감시', '대응절차', '이력관리'] },
      public:        { title: '재난안전 통합관제', region: '관할 구역', nav: ['재난관제', '환경감시', '대응절차', '모의훈련', '이력관리'] },
      power:         { title: '발전 통합관제', region: '발전 설비', nav: ['발전현황', '설비감시', '전력계통', '대응절차', '이력관리'] },
      electric:      { title: '전력 통합관제', region: '수배전 계통', nav: ['전력감시', '수배전', '계통현황', '대응절차', '이력관리'] },
      datacenter:    { title: '데이터센터 통합관제', region: '전산 구역', nav: ['통합현황', '전산실', '항온항습', '네트워크', '이력관리'] },
      logistics:     { title: '물류 통합관제', region: '물류 구역', nav: ['물류현황', '입출고', '도크관제', '차량관제', '이력관리'] },
      manufacturing: { title: '스마트팩토리 관제', region: '생산 구역', nav: ['생산현황', '설비감시', '에너지', '품질', '이력관리'] },
      finance:       { title: '금융 IT 통합관제', region: '시스템 구역', nav: ['종합상황', '거래현황', '채널', '인프라', '이력관리'] },
      building:      { title: '시설 통합관제', region: '건물 구역', nav: ['시설현황', '설비감시', '에너지', '출입·주차', '이력관리'] },
      distribution:  { title: '유통 통합관제', region: '매장 구역', nav: ['매장현황', '재고·물류', '출입관제', '에너지', '이력관리'] },
    };
    const EV = {
      power:  '전압 불균형 감지 (Phase A 210V / Phase B 230V) — 즉시 점검 요망',
      bolt:   '출력 급감 감지 — 정격 대비 62% 하락, 원인 확인 필요',
      fire:   '열·연기 복합 감지 신호 수신 — 현장 확인 필요',
      cctv:   '영상 신호 단절 — 카메라 연결 상태 점검 요망',
      quake:  '지진 계측값 임계 초과 — 진도 3.2 감지, 경보 발령',
      drop:   '누수 감지 신호 발생 — 배관·집수정 점검 요망',
      thermo: '항온항습 이상 — 온도 28.5℃ / 습도 71%RH 초과',
      server: '랙 흡기 온도 상승 — 42℃ 초과, 냉방 부하 확인',
      user:   '비인가 출입 시도 감지 — 카드 미인증, 확인 필요',
      shield: '방재물품 재고 부족 — 보충 필요',
      alert:  '임계 알람 다수 발생 — 상황 확인 요망',
      box:    '설비 상태 이상 신호 감지 — 점검 요망'
    };
    function assetItems(cat, name) {
      if (cat === 'cctv') return ['정문 CCTV #1', '옥외 CCTV #2', '기계실 CCTV #3', '제어동 CCTV #4'];
      if (cat === 'fire') return ['옥내 소화전 #1', '스프링클러 A동', '화재감지기 B동', '제연설비 #3'];
      if (cat === 'user') return ['정문 출입게이트', '제어동 출입문', '통합 보안실'];
      if (cat === 'server') return ['A랙 #01', 'B랙 #02', '스토리지 #1'];
      return [name + ' #1', name + ' #2', name + ' #3'];
    }

    /* ══════════════════ PRD → 패널 한 장의 '내용' 사양 ══════════════════
       와이어프레임 보드(renderDtGrid · renderInto)가 패널을 채울 때 부른다.
       예전엔 오버뷰 데모(은행 TPS·CPU Top 5·국민은행 …)를 그대로 복제해 넣어서, 어떤 PRD로
       만들어도 모든 패널이 같은 글자였다. 여기서 i 번째 패널의 제목(__prdContentItems)과
       그 대상의 분류(catOf)를 묶어, **그 도메인에서 실제로 읽히는** 계측 항목·자산 이름·
       이벤트 문구를 돌려준다. 값은 시드 난수라 다시 그려도 같은 자리에 같은 값이 온다.

       metric = [라벨, 단위, 최소, 최대, 소수자리] — 최소~최대는 라이브 틱이 걸어 다닐 폭이다. */
    const METRIC = {
      bolt:   [['발전량', 'kW', 820, 1180, 0], ['출력', '%', 72, 99, 0], ['가동률', '%', 88, 99.5, 1], ['금일 누적', 'MWh', 12, 34, 1], ['계통 주파수', 'Hz', 59.92, 60.06, 2], ['축계 진동', 'mm/s', 0.4, 4.8, 2]],
      power:  [['수전 전력', 'kW', 1180, 1860, 0], ['부하율', '%', 48, 86, 0], ['역률', '%', 92, 99, 1], ['선간 전압', 'V', 376, 384, 0], ['전류', 'A', 210, 340, 0], ['금일 사용량', 'kWh', 4200, 9800, 0]],
      thermo: [['온도', '℃', 20.5, 27.4, 1], ['습도', '%RH', 41, 63, 0], ['급기 온도', '℃', 15.8, 22.4, 1], ['차압', 'Pa', 8, 26, 0], ['가동률', '%', 86, 99, 1]],
      server: [['랙 전력', 'kW', 3.2, 7.8, 1], ['흡기 온도', '℃', 21.5, 31.2, 1], ['CPU 사용률', '%', 18, 86, 0], ['상면 사용률', '%', 54, 92, 0], ['가용률', '%', 99.2, 99.99, 2]],
      cctv:   [['정상 채널', 'ch', 112, 128, 0], ['녹화율', '%', 96, 100, 1], ['영상 지연', 'ms', 40, 220, 0], ['저장 잔여', '%', 22, 78, 0], ['AI 검지', '건', 0, 14, 0]],
      fire:   [['감지기 정상', '대', 240, 268, 0], ['경보', '건', 0, 3, 0], ['소화설비 압력', 'MPa', 0.72, 0.94, 2], ['점검 경과', '일', 3, 88, 0]],
      quake:  [['진도', '', 0, 1.8, 1], ['지반 가속도', 'gal', 0.4, 6.2, 1], ['풍속', 'm/s', 0.8, 9.4, 1], ['강수', 'mm', 0, 12, 1], ['기온', '℃', -2, 33, 1]],
      drop:   [['누수 감지', '건', 0, 2, 0], ['유량', '㎥/h', 12, 68, 1], ['수위', 'm', 0.4, 3.2, 2], ['배관 압력', 'bar', 2.4, 5.8, 2]],
      user:   [['재실 인원', '명', 34, 186, 0], ['금일 출입', '건', 220, 1480, 0], ['미인증 시도', '건', 0, 6, 0], ['게이트 정상', '대', 10, 12, 0]],
      shield: [['가용 재고', '개', 48, 220, 0], ['가용률', '%', 82, 100, 1], ['점검 경과', '일', 2, 64, 0]],
      alert:  [['미처리', '건', 0, 18, 0], ['금일 발생', '건', 24, 210, 0], ['평균 대응', '분', 2.4, 18.6, 1], ['처리율', '%', 82, 99.6, 1]],
      box:    [['가동률', '%', 86, 99.4, 1], ['부하', '%', 32, 88, 0], ['온도', '℃', 22, 44, 1], ['경보', '건', 0, 5, 0], ['금일 처리', '건', 180, 1420, 0]],
    };
    /* 표의 '구분' 칸·자산 앞 꼬리표 — 화면에서 한눈에 무엇을 보는 판인지 알려 준다 */
    const CAT_TAG = { cctv: '영상', fire: '소방', quake: '계측', drop: '배관', thermo: '환경', user: '출입', server: '전산', bolt: '발전', power: '전력', shield: '방재', alert: '경보', box: '설비' };

    /* 같은 분류라도 대상마다 실제로 읽는 값이 다르다 — 라벨로 한 번 더 갈라 준다.
       (발전량·ESS·태양광이 모두 'bolt' 라 세 판이 똑같은 계측을 달고 나오던 문제) */
    const SUB = [
      [/ESS|에너지\s*저장|배터리|리튬/, [['충전율(SOC)', '%', 18, 96, 0], ['충·방전 출력', 'kW', 40, 680, 0], ['셀 온도', '℃', 21, 41, 1], ['셀 전압 편차', 'mV', 4, 38, 0], ['건전성(SOH)', '%', 92, 99.8, 1]]],
      [/태양광|PV|모듈/, [['발전량', 'kW', 0, 940, 0], ['일사량', 'W/㎡', 0, 1020, 0], ['모듈 온도', '℃', 12, 58, 1], ['금일 누적', 'kWh', 180, 4200, 0], ['효율', '%', 72, 96, 1]]],
      [/인버터|PCS|전력변환/, [['출력', 'kW', 120, 880, 0], ['변환 효율', '%', 94, 98.6, 1], ['내부 온도', '℃', 28, 62, 1], ['DC 입력 전압', 'V', 540, 820, 0]]],
      [/풍력|풍속/, [['풍속', 'm/s', 1.2, 14.6, 1], ['발전량', 'kW', 0, 2100, 0], ['블레이드 각', '°', 2, 32, 0], ['나셀 온도', '℃', 8, 46, 1]]],
      [/변압|수전|배전|VCB|차단|고압|저압|초고압|한전/, [['수전 전력', 'kW', 1180, 1860, 0], ['부하율', '%', 48, 86, 0], ['권선 온도', '℃', 42, 88, 1], ['역률', '%', 92, 99, 1], ['선간 전압', 'V', 376, 384, 0]]],
      [/UPS|무정전/, [['부하율', '%', 22, 74, 0], ['배터리 잔량', '%', 76, 100, 0], ['출력 전압', 'V', 218, 224, 0], ['예상 백업', '분', 12, 48, 0]]],
      [/송전|철탑/, [['송전 전력', 'MW', 24, 96, 1], ['선로 온도', '℃', 6, 62, 1], ['이도(弛度)', 'mm', 120, 640, 0], ['경보', '건', 0, 3, 0]]],
      [/공조|HVAC|항온|항습/, [['급기 온도', '℃', 15.8, 22.4, 1], ['환기 온도', '℃', 21, 28, 1], ['습도', '%RH', 41, 63, 0], ['차압', 'Pa', 8, 26, 0], ['가동률', '%', 86, 99, 1]]],
      [/랙|서버|스토리지|상면/, [['랙 전력', 'kW', 3.2, 7.8, 1], ['흡기 온도', '℃', 21.5, 31.2, 1], ['상면 사용률', '%', 54, 92, 0], ['가용률', '%', 99.2, 99.99, 2]]],
      [/네트워크|NMS|회선/, [['대역폭 사용', '%', 22, 88, 0], ['지연', 'ms', 2, 46, 1], ['패킷 손실', '%', 0, 1.4, 2], ['가용률', '%', 99.2, 99.99, 2]]],
      [/입고|출고|도크|하역|지게차|로봇|컨테이너|배송|차량/, [['처리 물량', '건', 120, 1840, 0], ['도크 가동', '%', 38, 94, 0], ['평균 체류', '분', 8, 64, 1], ['대기 차량', '대', 0, 26, 0]]],
      [/엘리베이터|승강/, [['운행', '회', 60, 940, 0], ['대기 시간', '초', 4, 46, 0], ['도어 개폐', '회', 80, 1200, 0], ['가동률', '%', 92, 100, 1]]],
      [/주차|LPR/, [['입차', '대', 20, 640, 0], ['출차', '대', 18, 620, 0], ['만차율', '%', 22, 98, 0], ['인식률', '%', 94, 99.8, 1]]],
      [/재고|물류|매장/, [['재고 수량', '개', 240, 4800, 0], ['회전율', '회', 1.2, 8.6, 1], ['결품', '건', 0, 12, 0], ['입출고', '건', 40, 620, 0]]],
      [/거래|TPS|트랜잭션|뱅킹|계정계|정보계|채널|큐잉|콜센터|시스템 현황|종합 상황/, [['거래건수', '건', 820000, 1420000, 0], ['초당 처리(TPS)', '', 180, 640, 0], ['평균 응답', 'ms', 24, 180, 0], ['동시 사용자', '명', 4200, 18400, 0], ['오류율', '%', 0, 0.8, 2]]],
      [/생산|라인|품질/, [['생산 수량', 'EA', 320, 2800, 0], ['설비종합효율', '%', 68, 96, 1], ['불량률', '%', 0.1, 3.4, 2], ['가동률', '%', 74, 98, 1]]],
      [/철도|교통/, [['운행 편수', '편', 40, 320, 0], ['정시율', '%', 88, 99.6, 1], ['혼잡도', '%', 22, 128, 0], ['지연', '분', 0, 14, 1]]],
      [/상\s*·?\s*하수|수위|배수/, [['수위', 'm', 0.4, 3.2, 2], ['유량', '㎥/h', 12, 68, 1], ['탁도', 'NTU', 0.2, 8.4, 1], ['펌프 가동', '대', 0, 6, 0]]],
    ];
    const metricsFor = (label) => {
      for (let k = 0; k < SUB.length; k++) if (SUB[k][0].test(String(label))) return SUB[k][1];
      return METRIC[catOf(label)] || METRIC.box;
    };
    /* 시드 난수 — 같은 패널은 다시 그려도 같은 값에서 시작한다(배치처럼 내용도 결정적으로) */
    function seededRnd(seed) {
      let s = ((seed + 1) * 2654435761) >>> 0;
      return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }

    /* i 번째 패널이 무엇을 보여줄지 — 제목·분류·계측 항목·자산·이벤트를 한 묶음으로 */
    window.__prdPanelSpec = function (i) {
      const items = window.__prdContentItems();
      if (!items.length) return null;
      const idx = ((i | 0) % items.length + items.length) % items.length;
      const title = items[idx];
      const tg = targetLabels();
      const rnd = seededRnd(idx * 37 + tg.length);

      /* '종합 현황'·'실시간 KPI'·'리포트 · 통계'는 한 대상의 판이 아니라 **여러 대상을 모은 판**이다.
         고른 대상들의 대표 계측을 한 줄씩 뽑아 섞이지 않게 담는다. */
      const roundup = /종합|실시간 KPI|리포트/.test(title);
      let cat, metrics, assets;
      if (roundup && tg.length) {
        cat = 'box';
        metrics = tg.slice(0, 6).map(function (t) {
          const pool = metricsFor(t);
          /* 종합·KPI 는 대상의 대표 계측을, 리포트는 쌓아서 읽는 계측(누적·효율·가동률 …)을 본다 */
          const roll = pool.find(function (x) { return /누적|효율|가동률|처리율|가용률|회전율|정시율|건전성/.test(x[0]); });
          const m = /리포트/.test(title) ? (roll || pool[pool.length - 1]) : pool[0];
          return { label: /종합|리포트/.test(title) ? t : m[0], unit: m[1], lo: m[2], hi: m[3], dec: m[4], of: t };
        });
        assets = tg.slice(0, 8).map(function (t) { return t; });
      } else {
        cat = catOf(title);
        const pool = metricsFor(title);
        metrics = pool.map(function (m) { return { label: m[0], unit: m[1], lo: m[2], hi: m[3], dec: m[4], of: title }; });
        /* 경보 판의 줄은 '알람 #1' 이 아니라 실제 감시 대상이어야 읽힌다 */
        assets = (cat === 'alert' && tg.length) ? tg.slice() : assetItems(cat, title);
      }
      /* 자산이 표를 채우기에 모자라면 번호를 붙여 늘린다(같은 이름이 반복되지 않게) */
      const base = assets.slice();
      for (let k = base.length; k < 8; k++) assets.push(base[k % base.length].replace(/\s*#\d+$/, '') + ' #' + (k + 1));

      /* 이벤트 문구 — 같은 줄이 다섯 번 반복되지 않게 등급별로 결을 달리한다.
         Critical 은 분류별 대표 사고 문구, Warning 은 계측이 임계에 닿은 상황,
         Info 는 정상 복귀. 대상은 여러 개면 돌려 가며 쓴다. */
      const evTargets = tg.length ? tg : [title];
      const LV = ['crit', 'warn', 'info', 'warn', 'info'];
      const events = LV.map(function (lv, k) {
        const t = roundup ? evTargets[k % evTargets.length] : title;
        const c = catOf(t);
        const pool = metricsFor(t);
        const m = pool[(k + 1) % pool.length];
        const near = (m[3] - (m[3] - m[2]) * 0.08).toFixed(m[4]);
        const msg = lv === 'crit' ? (EV[c] || EV.box)
          : lv === 'warn' ? (m[0] + ' 임계 근접 — ' + near + (m[1] ? ' ' + m[1] : '') + ', 확인 필요')
          : (m[0] + ' 정상 범위 복귀 — 자동 해제됨');
        return { lv: lv, tag: CAT_TAG[c] || '설비', msg: msg, of: t };
      });

      return {
        title: title,
        cat: cat,
        roundup: !!roundup,
        tag: CAT_TAG[cat] || '설비',
        region: (DOMAIN[(G.industries || [])[0]] || {}).region || '관제 구역',
        metrics: metrics,
        assets: assets,
        events: events,
        site: siteName(),
        rnd: rnd,
      };
    };

    const pad = (n) => String(n).padStart(2, '0');
    /* 발생시각은 '지금'에서 거꾸로 센다 — 기준일을 박아 두면 그날에 멈춘 표가 된다 */
    const tAt = (k) => { const d = new Date(); d.setSeconds(d.getSeconds() - 41 - k * 137); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); };

    /* 선택 산업군별로 모니터링 대상을 묶는다(각 대상은 첫 매칭 산업군에 귀속) */
    function buildGroups() {
      const inds = (G.industries || []).filter((k) => INDUSTRIES[k]);
      const tg = targetLabels();
      const groups = [], used = new Set();
      inds.forEach((k) => {
        const ind = INDUSTRIES[k];
        const mine = tg.filter((t) => ind.targets.includes(t) && !used.has(t));
        mine.forEach((t) => used.add(t));
        if (mine.length) groups.push({ label: ind.label, targets: mine });
      });
      const rest = tg.filter((t) => !used.has(t));
      if (rest.length) groups.push({ label: inds.length ? '기타 감시 대상' : (siteName() || '감시 대상'), targets: rest });
      return groups;
    }

    window.__paintDtFromPrd = function () {
      const stage = document.getElementById('dtStage');
      if (!stage) return;
      /* 커스텀 시안 화면이거나 편집 중이면 손대지 않는다 */
      if (stage.dataset.tpl || stage.querySelector('.skx-screen') || stage.querySelector('.skh-root') || stage.querySelector('.hj-repro')) return;
      if (stage.classList.contains('dt-editing') || stage.classList.contains('dt-content-editing')) return;
      const ui = stage.querySelector('.dt-ui');
      if (!ui) return;

      /* 원본 데모(한국서부발전) 스냅샷 — 첫 실행(아직 손대기 전 = 원본) 때 한 번만 저장해 둔다.
         빈 PRD로 돌아가면 이 스냅샷으로 되돌린다. */
      const table0 = document.getElementById('dtTable');
      const empty0 = document.getElementById('dtEmpty');
      if (!DEMO) {
        const bn0 = stage.querySelector('.dt-bname');
        const nv0 = stage.querySelector('.dt-nav');
        const rtab0 = stage.querySelector('.dt-region .dt-tabs b');
        const sw0 = stage.querySelector('.dt-symbols');
        const tr0 = stage.querySelector('.dt-region .dt-tree');
        const dr0 = stage.querySelector('.dt-assets .dt-drops');
        DEMO = {
          bname: bn0 ? bn0.textContent : '',
          nav: nv0 ? nv0.innerHTML : null,
          regionTab: rtab0 ? rtab0.textContent : null,
          symbols: sw0 ? sw0.innerHTML : null,
          tree: tr0 ? tr0.innerHTML : null,
          drops: dr0 ? dr0.innerHTML : null,
          rows: table0 ? [...table0.querySelectorAll('.dt-tr:not(.dt-th)')].map((r) => r.outerHTML).join('') : '',
          counts: stage ? [...stage.querySelectorAll('.dt-counts .dt-cnt')].map((b) => b.innerHTML) : []
        };
      }

      const tg = targetLabels();
      if (!tg.length) {
        /* 빈 PRD — 원본 데모로 복원 */
        const bn0 = stage.querySelector('.dt-bname'); if (bn0) bn0.textContent = DEMO.bname;
        const nv0 = stage.querySelector('.dt-nav'); if (nv0 && DEMO.nav != null) nv0.innerHTML = DEMO.nav;
        const rt0 = stage.querySelector('.dt-region .dt-tabs b'); if (rt0 && DEMO.regionTab != null) rt0.textContent = DEMO.regionTab;
        const sw0 = stage.querySelector('.dt-symbols'); if (sw0 && DEMO.symbols != null) sw0.innerHTML = DEMO.symbols;
        const tr0 = stage.querySelector('.dt-region .dt-tree'); if (tr0 && DEMO.tree != null) tr0.innerHTML = DEMO.tree;
        const dr0 = stage.querySelector('.dt-assets .dt-drops'); if (dr0 && DEMO.drops != null) dr0.innerHTML = DEMO.drops;
        if (table0 && empty0) {
          table0.querySelectorAll('.dt-tr:not(.dt-th)').forEach((r) => r.remove());
          empty0.insertAdjacentHTML('beforebegin', DEMO.rows);
          stage.querySelectorAll('.dt-counts .dt-cnt').forEach((b, i) => { if (DEMO.counts[i] != null) b.innerHTML = DEMO.counts[i]; });
        }
        try { localStorage.removeItem('wemb-dt-prdsig'); } catch (e) {}
        if (window.__dtRecaptureDefaults) window.__dtRecaptureDefaults(true);
        return;
      }

      const groups = buildGroups();
      const cats = [];
      tg.forEach((t) => { const c = catOf(t); if (!cats.includes(c)) cats.push(c); });

      /* 콘텐츠가 실제로 바뀌었는지 판단(바뀌었을 때만 기존 글자 편집을 버린다) */
      const sig = JSON.stringify({ s: G.site, i: G.industries, t: G.targets, sc: G.scale });
      let prev = ''; try { prev = localStorage.getItem('wemb-dt-prdsig') || ''; } catch (e) {}
      const changed = sig !== prev;

      /* 주도 산업군 → 도메인 텍스트 팩(브랜드·내비·구역 라벨) */
      const primaryInd = (G.industries || []).filter((k) => INDUSTRIES[k])[0] || null;
      const dom = (primaryInd && DOMAIN[primaryInd]) || null;

      /* 1) 브랜드명 — 프로젝트명이 있으면 우선, 없으면 도메인 제목으로 갈아끼운다 */
      const bn = stage.querySelector('.dt-bname');
      if (bn) bn.textContent = G.site || (dom && dom.title) || '한국서부발전(주)';

      /* 1-b) 상단 내비 — 도메인 섹션 이름으로 교체(첫 항목 활성) */
      if (dom) {
        const nav = stage.querySelector('.dt-nav');
        if (nav) nav.innerHTML = dom.nav.map((n, i) => '<a' + (i === 0 ? ' class="on"' : '') + '>' + esc(n) + '</a>').join('');
      }

      /* 2) 레이어 심볼 — 전체보기 + 대상 분류별 버튼(최대 6) */
      const symWrap = stage.querySelector('.dt-symbols');
      if (symWrap) {
        let html = '<button type="button" class="dt-sym on"><span class="dt-symb">' + svg(ICO.all) + '</span><span>전체보기</span></button>';
        cats.slice(0, 6).forEach((c) => {
          html += '<button type="button" class="dt-sym"><span class="dt-symb">' + svg(ICO[c] || ICO.box) + '</span><span>' + esc(SYM_LBL[c] || '설비') + '</span></button>';
        });
        symWrap.innerHTML = html;
      }

      /* 3) 지역 트리 — 산업군 노드 > 모니터링 대상(잎) */
      const tree = stage.querySelector('.dt-region .dt-tree');
      if (tree) {
        let html = '';
        groups.forEach((g, gi) => {
          const tico = svg(ICO[catOf(g.targets[0])] || ICO.box);
          const leaves = g.targets.map((t, li) => '<div class="dt-ti dt-l3 dt-leaf' + (gi === 0 && li === 0 ? ' on' : '') + '"><span class="dt-tnm">' + esc(t) + '</span></div>').join('');
          html += '<div class="dt-node' + (gi === 0 ? ' open' : '') + '">' +
            '<div class="dt-ti dt-l1"><span class="dt-chev">' + CHEV + '</span><span class="dt-tico">' + tico + '</span><span class="dt-tnm">' + esc(g.label) + '</span></div>' +
            '<div class="dt-kids"><div class="dt-kidsin">' + leaves + '</div></div></div>';
          if (gi < groups.length - 1) html += '<div class="dt-tgap"></div>';
        });
        tree.innerHTML = html;
        const tab = stage.querySelector('.dt-region .dt-tabs b'); if (tab) tab.textContent = G.site || (dom && dom.region) || '전체 사이트';
      }

      /* 4) 자산 리스트 — 대상별 그룹(최대 6) + 샘플 항목 */
      const drops = stage.querySelector('.dt-assets .dt-drops');
      if (drops) {
        let html = '';
        tg.slice(0, 6).forEach((t, ti) => {
          const items = assetItems(catOf(t), t).map((x) => '<div class="dt-di' + (ti === 0 ? ' on' : '') + '">' + esc(x) + '</div>').join('');
          html += '<div class="dt-node' + (ti === 0 ? ' open' : '') + '">' +
            '<div class="dt-drop"><span class="dt-chev">' + CHEV + '</span><span class="dt-tnm">' + esc(t) + '</span></div>' +
            '<div class="dt-kids"><div class="dt-kidsin">' + items + '</div></div></div>';
          if (ti < Math.min(tg.length, 6) - 1) html += '<div class="dt-tgap"></div>';
        });
        drops.innerHTML = html;
      }

      /* 5) 이벤트 현황 — 대상별 이벤트 행(최대 8) + 등급 카운트 */
      const table = document.getElementById('dtTable');
      const emptyEl = document.getElementById('dtEmpty');
      if (table && emptyEl) {
        const SEV = [3, 3, 1, 5, 4, 2, 2, 3];
        const rows = tg.slice(0, 8);
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const vid = '<button type="button" class="dt-abtn">' + svg('<path d="M2 8.5A1.5 1.5 0 0 1 3.5 7h9A1.5 1.5 0 0 1 14 8.5V16H3.5A1.5 1.5 0 0 1 2 14.5z"/><polygon points="14 11 21 7.5 21 15.5 14 12"/>') + '영상</button>';
        let html = '';
        rows.forEach((t, i) => {
          const cat = catOf(t);
          const sev = SEV[i % SEV.length];
          counts[sev]++;
          const crit = sev <= 2;
          const isNew = (sev === 1) || (i === rows.length - 1 && sev === 2);
          const equip = esc(t) + ' #' + (301 + i);
          const acts = (isNew ? '<b class="dt-new">신규</b>' : '') + vid;
          html += '<div class="dt-tr' + (sev === 1 ? ' on' : '') + '" data-lv="' + sev + '"' + (isNew ? ' data-new="1"' : '') + '>' +
            '<span><i class="dt-dot lv' + sev + '"></i></span>' +
            '<span>' + equip + '</span>' +
            '<span class="num">' + tAt(i) + '</span>' +
            '<span><b class="dt-tag' + (crit ? ' crit' : '') + '">' + (crit ? 'CRITICAL' : 'SYSTEM') + '</b></span>' +
            '<span>' + esc(EV[cat] || EV.box) + '</span>' +
            '<span class="dt-acts">' + acts + '</span></div>';
        });
        table.querySelectorAll('.dt-tr:not(.dt-th)').forEach((r) => r.remove());
        emptyEl.insertAdjacentHTML('beforebegin', html);
        stage.querySelectorAll('.dt-counts .dt-cnt').forEach((btn) => {
          const lv = btn.dataset.lv;
          btn.innerHTML = '<i class="lv' + lv + '"></i>' + (counts[lv] || 0);
        });
      }

      /* 편집 모듈이 새 콘텐츠를 추적하도록 기본값 다시 캡처 */
      if (window.__dtRecaptureDefaults) window.__dtRecaptureDefaults(changed);
      if (changed) { try { localStorage.setItem('wemb-dt-prdsig', sig); } catch (e) {} }
    };
  })();

  /* ===== 자연어 → 시안 자동 생성 (오프라인 v1) =====
     "cctv 관제 디지털트윈 대시보드" 같은 문장을 받아, 갖고 있는 라이브러리(INDUSTRIES 태그)에
     키워드로 매칭해 PRD 상태(G)를 채우고, 기존 생성 파이프라인(applyScreen + __paintDtFromPrd)을
     그대로 태워 시안을 즉시 만든다. 백엔드/LLM 없이 결정적으로 동작한다.
     나중에 실제 AI로 바꿀 땐 parseIntent만 교체하면 된다. */
  (function initNlGen() {
    /* 동의어 규칙 — 각 규칙의 targets는 반드시 해당 산업군 INDUSTRIES[ind].targets 라벨과 정확히 일치해야
       __paintDtFromPrd의 그룹핑에 실린다. (키워드가 걸리면 산업군+대상을 함께 넣어 항상 정합) */
    const SYN = [
      { re: /cctv|카메라|영상|감시\s*카메라|열화상/, ind: ['security'], targets: ['CCTV', 'AI CCTV', '열화상카메라', '출입통제', '화재 감지', '환경 감시 (지진·기상·재난)'] },
      { re: /소방|화재|연기|화염/, ind: ['building'], targets: ['화재감지기', 'CCTV', '공조', '전력'] },
      { re: /출입|게이트|얼굴\s*인식|지문|보안|psim/i, ind: ['security'], targets: ['물리보안 (PSIM)', 'CCTV', '출입통제', '얼굴인식', '지문인식기'] },
      { re: /지진|기상|재난|방재|환경\s*감시|공공|철도|상하수|상·하수/, ind: ['public'], targets: ['환경 감시 (지진·기상)', '재난 경보', '수위감지기', '화재감지기', 'CCTV', '종합 상황'] },
      { re: /전력|변압|배전|수전|차단기|고압|저압|ups|전기/i, ind: ['electric'], targets: ['변압기반', '배전반·VCB', '차단기', '무정전 전원장치(UPS)', '전력 사용량'] },
      { re: /발전|태양광|ess|배터리|풍력|송전|재생\s*에너지|에너지/i, ind: ['power'], targets: ['발전량·발전기', '태양광', 'ESS 에너지저장', '인버터', '변압기반', '환경 감시'] },
      { re: /데이터\s*센터|데이터센터|dcim|서버|랙|스토리지|전산|항온|항습|nms/i, ind: ['datacenter'], targets: ['데이터센터관리 (DCIM)', '랙·서버', '항온항습', 'UPS', '온습도계', 'CCTV'] },
      { re: /물류|입고|출고|지게차|컨테이너|택배|하역|배송|dms/i, ind: ['logistics'], targets: ['물류관리 (DMS)', '입고', '출고', '도크·하역', '차량·배송', 'CCTV'] },
      { re: /제조|공장|생산|설비|fems|스마트\s*팩토리/i, ind: ['manufacturing'], targets: ['공장에너지관리 (FEMS)', '생산라인 현황', '설비·자산 상태', '전력', '온습도계', 'CCTV'] },
      { re: /금융|은행|뱅킹|계정계|거래|tps|트랜잭션|카드/i, ind: ['finance'], targets: ['계정계 (Core Banking)', '거래량', '거래 추이', '트랜잭션', '초당 처리건수(TPS)', '시스템 현황'] },
      { re: /건물|시설|bms|fms|엘리베이터|주차|공조/i, ind: ['building'], targets: ['건물관리 (BMS)', '시설물관리 (FMS)', '엘리베이터', '주차관제(LPR)', '전력', 'CCTV'] },
      { re: /유통|매장|리테일|재고/, ind: ['distribution'], targets: ['매장 현황', '재고·물류', '출입 카운트', '주차관제(LPR)', 'CCTV'] },
    ];

    function parseIntent(text) {
      const s = String(text || '').toLowerCase();
      /* 화면 종류 — '트윈/3D/현장'은 디지털 트윈으로, 그 외 대시보드. (둘 다 있으면 트윈이 더 구체적이라 우선) */
      let screen = /트윈|3d|digital\s*twin|현장|플로어|floor|3차원/.test(s) ? 'dt'
        : (/대시보드|상황판|dashboard|보드|현황판/.test(s) ? 'dash' : null);
      const inds = [], targets = [];
      let ops = null, scale = null;
      SYN.forEach((rule) => {
        if (!rule.re.test(s)) return;
        (rule.ind || []).forEach((k) => { if (!inds.includes(k)) inds.push(k); });
        (rule.targets || []).forEach((t) => { if (!targets.includes(t)) targets.push(t); });
      });
      if (/관제|모니터링|통합|상시|대형\s*화면/.test(s)) ops = 'central';
      if (/전사|다중\s*사이트|여러\s*사이트|통합\s*관제|본사/.test(s)) scale = 'enterprise';
      else if (/다중|여러|구역|복수/.test(s)) scale = 'multi';
      else if (/단일|한\s*대|하나|개별/.test(s)) scale = 'single';
      return { screen, industries: inds, targets, ops, scale, matched: !!(inds.length || screen) };
    }

    function applyIntent(intent) {
      /* 인식된 값만 반영(없으면 기존 유지) */
      if (intent.screen) G.screen = intent.screen;
      if (intent.industries.length) G.industries = intent.industries.filter((k) => INDUSTRIES[k]);
      if (intent.targets.length) G.targets = intent.targets.slice();
      if (intent.scale) G.scale = intent.scale;
      if (intent.ops) G.ops = intent.ops;
      save();
      /* 새 시안이므로 이전 임시 이미지 오버레이는 걷어낸다 */
      try { if (window.__clearImageTemplate) window.__clearImageTemplate(); localStorage.removeItem('wemb-tpl-img'); localStorage.removeItem('wemb-tpl-dt'); } catch (e) {}
      paintForm(); /* 요약 갱신 + __paintDtFromPrd 트리거 */
      /* 스튜디오에 보이는 화면을 전환 */
      const scr = intent.screen || G.screen || 'dash';
      try {
        if (typeof state !== 'undefined') state.screen = scr;
        document.querySelectorAll('#screen button').forEach((x) => x.classList.toggle('on', x.dataset.s === scr));
        if (typeof applyScreen === 'function') applyScreen();
        if (scr === 'dt' && window.__paintDtFromPrd) window.__paintDtFromPrd();
        if (scr === 'dash' && window.__applyDashLayout) window.__applyDashLayout('g3-2r');
      } catch (e) {}
    }

    window.__wembGenerateFromText = function (text) {
      const intent = parseIntent(text);
      if (!intent.matched) return intent; /* 인식 실패 — 호출부에서 안내 */
      applyIntent(intent);
      return intent;
    };
    /* 상시 하단 오미박스는 제거됨 — 콘텐츠는 '콘텐츠 추가 → ＋ 패널'의 컨텍스트 창에서 채운다.
       전체 화면 생성이 필요하면 window.__wembGenerateFromText(text)로 그대로 호출 가능. */
  })();

  /* ── PRD 스텝 위저드(모달 팝업) ──
     프로젝트명 → 화면 → 관제 대상 → 모니터링 유형(산업군) → 모니터링 대상(연동) → 운영 환경.
     한 스텝씩 진행하며 마지막에 기능명세서를 생성한다. */
  const WIZ_STEPS = [
    { key: 'site', kind: 'text', title: '프로젝트 이름을 알려주세요', hint: '기능명세서·화면 제목에 사용돼요.', placeholder: '예: 당진화력 통합관제' },
    { key: 'screen', kind: 'single', title: '어떤 화면을 만드나요?', hint: '', opts: [
      ['dash', '관제 대시보드', '패널·차트 중심의 상황판'],
      ['dt', '디지털 트윈', '3D 씬 위 유리 패널'],
      ['portal', '포탈', '현재 준비 중', true],
    ] },
    { key: 'scale', kind: 'single', title: '관제 대상 규모는 어느 정도인가요?', hint: '', opts: [
      ['single', '단일 설비', '한 대상에 집중'],
      ['multi', '다중 설비·구역', '여러 설비를 한눈에'],
      ['enterprise', '전사·다중 사이트', '통합 관제'],
    ] },
    { key: 'industries', kind: 'multi', title: '어떤 산업군을 관제하나요?', hint: '모니터링 유형 (여러 개 선택 가능)', opts: Object.keys(INDUSTRIES).map((k) => [k, INDUSTRIES[k].label]) },
    { key: 'targets', kind: 'multi', title: '무엇을 모니터링하나요?', hint: '여러 개 선택', dynamic: true },
    { key: 'ops', kind: 'single', title: '어떤 환경에서 운영하나요?', hint: '', opts: [
      ['central', '대형 화면 상시 관제'],
      ['normal', 'PC 화면 모니터링'],
    ] },
  ];
  (function initPrdWiz() {
    const modal = document.getElementById('prdWiz'); if (!modal) return;
    const elDots = document.getElementById('pwDots');
    const elStepNo = document.getElementById('pwStepNo');
    const elTitle = document.getElementById('pwTitle');
    const elHint = document.getElementById('pwHint');
    const elField = document.getElementById('pwField');
    const elCount = document.getElementById('pwCount');
    const btnPrev = document.getElementById('pwPrev');
    const btnNext = document.getElementById('pwNext');
    let idx = 0, open = false;

    const stepOpts = (st) => st.dynamic ? industryTargetOpts().map((lbl) => [lbl, lbl]) : (st.opts || []);
    function stepAnswered(i) {
      const st = WIZ_STEPS[i];
      if (st.kind === 'text') return !!(G.site && G.site.trim());
      if (st.kind === 'multi') return Array.isArray(G[st.key]) && G[st.key].length > 0;
      return !!G[st.key];
    }
    function renderDots() {
      elDots.innerHTML = WIZ_STEPS.map((s, i) => '<i class="' + (i === idx ? 'on' : (stepAnswered(i) ? 'done' : '')) + '"></i>').join('');
    }
    function renderField() {
      const st = WIZ_STEPS[idx];
      elField.innerHTML = '';
      if (st.kind === 'text') {
        const inp = document.createElement('input');
        inp.className = 'pq-text'; inp.type = 'text'; inp.maxLength = 40;
        inp.placeholder = st.placeholder || ''; inp.value = G.site || '';
        inp.addEventListener('input', () => { G.site = inp.value.trim(); save(); syncFoot(); renderDots(); });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (stepAnswered(idx)) goNext(); } });
        elField.appendChild(inp);
        setTimeout(() => { try { inp.focus(); } catch (e) {} }, 40);
        return;
      }
      const opts = stepOpts(st);
      const wrap = document.createElement('div');
      wrap.className = 'pq-opts' + (st.kind === 'multi' ? ' pq-multi' : '');
      if (!opts.length) { wrap.innerHTML = '<small style="color:var(--text-weak)">먼저 산업군을 골라 주세요.</small>'; }
      opts.forEach(([v, label, desc, locked]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pq-opt';
        const on = st.kind === 'multi' ? (G[st.key] || []).includes(v) : G[st.key] === v;
        if (on) b.classList.add('on');
        if (locked) b.classList.add('locked');
        b.innerHTML = '<b>' + esc(label) + '</b>' + (desc ? '<small>' + esc(desc) + '</small>' : '') + (locked ? '<span class="pq-lock">잠금</span>' : '');
        b.addEventListener('click', () => {
          if (locked) { if (typeof toast === 'function') toast('포탈은 현재 준비 중이에요.', { type: 'info' }); return; }
          if (st.kind === 'multi') {
            const arr = G[st.key] = Array.isArray(G[st.key]) ? G[st.key] : [];
            const p = arr.indexOf(v); if (p >= 0) arr.splice(p, 1); else arr.push(v);
            /* 산업군 선택이 바뀌면, 더 이상 유효하지 않은 모니터링 대상은 걸러낸다 */
            if (st.key === 'industries') { const valid = new Set(industryTargetOpts()); G.targets = (G.targets || []).filter((t) => valid.has(t)); }
          } else {
            G[st.key] = v;
          }
          save(); renderField(); renderDots(); syncFoot(); paintForm();
        });
        wrap.appendChild(b);
      });
      elField.appendChild(wrap);
    }
    function syncFoot() {
      const last = idx === WIZ_STEPS.length - 1;
      btnPrev.disabled = idx === 0;
      btnNext.textContent = last ? '기능명세서 생성 →' : '다음';
      btnNext.disabled = !stepAnswered(idx);
      elCount.textContent = (idx + 1) + ' / ' + WIZ_STEPS.length;
    }
    function paintStep() {
      const st = WIZ_STEPS[idx];
      elStepNo.textContent = 'STEP ' + (idx + 1);
      elTitle.textContent = st.title;
      elHint.textContent = st.hint || '';
      renderField(); renderDots(); syncFoot();
    }
    function firstUnanswered() { for (let i = 0; i < WIZ_STEPS.length; i++) if (!stepAnswered(i)) return i; return 0; }
    function openWiz(start) {
      idx = typeof start === 'number' ? start : firstUnanswered();
      open = true; modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('show'));
      paintStep();
    }
    function closeWiz() { open = false; modal.classList.remove('show'); setTimeout(() => { modal.hidden = true; }, 180); }
    function goNext() {
      if (!stepAnswered(idx)) return;
      if (idx < WIZ_STEPS.length - 1) { idx++; paintStep(); return; }
      /* 마지막 스텝 → 기능명세서 생성 */
      closeWiz();
      if (prdComplete()) { advanceStep(1); if (window.__setPage) window.__setPage('spec'); }
    }
    function goPrev() { if (idx > 0) { idx--; paintStep(); } }
    btnNext.addEventListener('click', goNext);
    btnPrev.addEventListener('click', goPrev);
    document.getElementById('pwClose')?.addEventListener('click', closeWiz);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeWiz(); });
    document.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') closeWiz(); });
    window.__prdWizOpen = openWiz;
    window.__prdWizIsOpen = () => open;
  })();
  document.getElementById('prdEdit')?.addEventListener('click', () => { if (window.__prdWizOpen) window.__prdWizOpen(); });
  document.getElementById('prdSummary')?.addEventListener('click', () => { if (window.__prdWizOpen) window.__prdWizOpen(); });

  /* ── 버튼 · 페이지 전환 배선 ── */
  document.getElementById('prdGen')?.addEventListener('click', () => {
    if (!prdComplete()) return;
    advanceStep(1);
    if (window.__setPage) window.__setPage('spec');
  });
  document.getElementById('specNext')?.addEventListener('click', () => {
    advanceStep(2);
    if (window.__setPage) window.__setPage('flow');
  });
  document.getElementById('flowNext')?.addEventListener('click', () => {
    advanceStep(3);
    if (window.__setPage) window.__setPage('wireframe');
  });
  document.getElementById('wireStart')?.addEventListener('click', () => {
    const L = window.__WEMBLayouts; if (!selected || !L) return;
    if (L.setProjectName) L.setProjectName(G.site || '새 프로젝트');
    const tbProj = document.getElementById('tbProj'); if (tbProj) tbProj.textContent = G.site ? '· ' + G.site : '';
    advanceStep(4);
    /* 만든 프로젝트를 스튜디오 홈(런처) 목록에 쌓아 둔다(캐시를 지우지 않는 한 유지) */
    try { if (L.saveGuideProject) L.saveGuideProject({ name: G.site || '새 프로젝트', screen: selected.screen, layout: selected.layoutId }); } catch (e) {}
    L.enterStudio(selected.screen, selected.layoutId);
    if (window.__setPage) window.__setPage('wire');
    if (typeof toast === 'function') toast('추천 구성(' + SCREEN_LBL[selected.screen] + ' · ' + selected.name + ')을 스튜디오에 반영했어요.', { type: 'info' });
  });

  /* 각 탭을 열 때 최신 답변으로 다시 그린다 (setPage에서 호출) */
  window.__guideOnPage = (page) => {
    if (page === 'prd') {
      paintForm();
      /* PRD 진입 시 아직 미완성이고 런처가 덮여 있지 않으면 스텝 위저드를 자동으로 연다 */
      const homeShown = !!document.getElementById('flowHome')?.classList.contains('show');
      if (!prdComplete() && !homeShown && window.__prdWizOpen && !(window.__prdWizIsOpen && window.__prdWizIsOpen())) window.__prdWizOpen();
    }
    else if (page === 'spec') renderSpec();
    else if (page === 'flow') renderFlow();
    else if (page === 'wireframe') renderWire();
  };
  paintForm();
  /* 기존 프로젝트를 열어 이미 스튜디오로 바로 들어온 상태(새로고침 복원 포함)라면
     initFlow의 enterStudio가 __wembStep·__WEMBFlowMenu보다 먼저 실행됐을 수 있으므로 여기서 보정한다. */
  (function syncIfInStudio() {
    const homeEl = document.getElementById('flowHome');
    const anyPageOpen = [...document.querySelectorAll('.page')].some((p) => !p.hidden);
    if ((!homeEl || !homeEl.classList.contains('show')) && !anyPageOpen) {
      advanceStep(4);
      if (window.__setStudioNav) window.__setStudioNav(window.__WEMBFlowMenu());
    }
  })();
})();
