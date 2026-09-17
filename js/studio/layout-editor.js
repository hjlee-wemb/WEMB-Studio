/* ── 화면 구성 — 열 · 패널 · 에셋 라이브러리 ── */

/* ── 화면 구성 — 열 수 조절 · 패널 추가/삭제 (세션 내 실시간, 내보내기에 그대로 반영) ── */
function initLayoutEditor() {
  const main = document.querySelector('.main');
  if (!main) return;
  /* 템플릿 시안(SK하이닉스 SVG·한진 JPG·미연결 이미지)이 떠 있으면, 패널은 반드시 그
     시안 레이어 '안'에 넣는다. 시안이 스테이지 맨 위에 깔리므로 바깥(.dt-body·.dashpage)에
     넣으면 시안 뒤로 숨거나(트윈) 통째로 display:none 처리돼(대시보드) 보이지도 눌리지도
     않았다 — '추가한 패널의 글자가 편집되지 않던' 원인. */
  const tplAddedCols = (root) => {
    const layer = root && (root.querySelector('.skx-screen') || root.querySelector('.hj-repro') || root.querySelector('.tplimg-repro'));
    if (!layer) return null;
    let host = layer.querySelector(':scope > .dt-added > .cols');
    if (!host) {
      const wrap = document.createElement('div');
      wrap.className = 'dt-added';
      host = document.createElement('div');
      host.className = 'cols gridmode';
      wrap.appendChild(host);
      layer.appendChild(wrap);
    }
    return host;
  };
  const activeCols = () => {
    /* 디지털 트윈 화면이 켜져 있으면 그 화면 전용 콘텐츠 영역(.cols)에 넣는다.
       (예전엔 숨겨진 대시보드의 .cols로 들어가 트윈 화면엔 반영이 안 됐음) */
    const dt = document.getElementById('dtStage');
    if (dt && !dt.hidden) {
      const tplHost = tplAddedCols(dt);
      if (tplHost) return tplHost;
      /* .dt-added를 .dt-body에 둔다 — 레이아웃(와이어프레임) 모드에서 .dt-ui가 숨겨져도
         콘텐츠 추가 영역은 계속 보이도록. (예전엔 .dt-ui 안이라 같이 숨어 반영이 안 됐음) */
      const body = dt.querySelector('.dt-body') || dt;
      let host = dt.querySelector('.dt-added > .cols');
      if (!host && body) {
        const wrap = document.createElement('div');
        wrap.className = 'dt-added';
        host = document.createElement('div');
        host.className = 'cols gridmode';
        wrap.appendChild(host);
        body.appendChild(wrap);
      }
      return host || null;
    }
    /* 대시보드 화면: 반드시 '보이는'(숨김 조상이 없는) .cols만 고른다 */
    const stage = document.querySelector('.stage');
    /* 대시보드에 이미지 템플릿이 얹혀 있으면 .dashpage가 통째로 숨겨지므로 시안 레이어 안에 넣는다 */
    if (stage && !stage.hidden && stage.getAttribute('data-tpl')) {
      const tplHost = tplAddedCols(stage);
      if (tplHost) return tplHost;
    }
    const scope = stage && !stage.hidden ? stage : main;
    const page = [...scope.querySelectorAll('.dashpage')].find((p) => !p.hasAttribute('hidden'));
    return (page && page.querySelector('.cols')) || scope.querySelector('.dashpage .cols') || scope.querySelector('.cols');
  };
  const ensureDelBtns = () => {
    main.querySelectorAll('.cols .panel').forEach((p) => {
      if (p.querySelector(':scope > .pdel')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pdel';
      b.title = '이 패널 삭제';
      b.setAttribute('aria-label', '패널 삭제');
      b.textContent = '×';
      p.appendChild(b);
    });
  };
  ensureDelBtns();
  main.addEventListener('click', (e) => {
    const del = e.target.closest('.pdel');
    if (!del) return;
    e.preventDefault();
    e.stopPropagation();
    const panel = del.closest('.panel');
    if (!panel) return;
    /* 확인도 되돌리기도 없이 바로 사라지던 동작 — 상단 되돌리기는 색 테마만 기록하므로 여기서 직접 되살릴 길을 준다.
       같은 노드를 원래 자리(다음 형제 앞)에 다시 끼우므로 차트 · 편집 내용이 그대로 돌아온다. */
    const parent = panel.parentElement;
    const next = panel.nextSibling;
    const name = panel.querySelector('.ph h3')?.textContent.trim();
    panel.remove();
    if (typeof toast === 'function')
      toast((name ? '“' + escHTML(name) + '” ' : '') + '패널을 삭제했어요.', {
        type: 'ok',
        dur: 6000,
        undo: () => {
          if (!parent || !parent.isConnected) return;
          parent.insertBefore(panel, next && next.parentNode === parent ? next : null);
        },
      });
  });
  const setColumns = (n) => {
    const cols = activeCols();
    if (!cols) return;
    /* 레이아웃 grid 모드(패널이 .cols 직속)에서도 패널을 잃지 않도록 둘 다 수집하고,
       grid 흔적(class/인라인 스타일)을 걷어낸 뒤 기둥으로 재구성한다. */
    const panels = [...cols.querySelectorAll(':scope > .col > .panel'), ...cols.querySelectorAll(':scope > .panel')];
    cols.classList.remove('gridmode');
    cols.style.gridTemplateColumns = '';
    cols.style.gridTemplateRows = '';
    panels.forEach((p) => {
      p.style.gridColumn = '';
      p.style.gridRow = '';
      p.style.display = '';
    });
    cols.__panels = panels;
    cols.innerHTML = '';
    const newCols = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'col';
      cols.appendChild(c);
      newCols.push(c);
    }
    panels.forEach((p, i) => newCols[i % n].appendChild(p));
    ensureDelBtns();
  };
  document.getElementById('colCount')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-c]');
    if (!b) return;
    document.querySelectorAll('#colCount button').forEach((x) => x.classList.toggle('on', x === b));
    setColumns(+b.dataset.c);
  });
  const build = {
    empty: () => `<div class="ph"><h3>새 패널</h3></div><div class="addedbody emptybody"><span class="emptyhint">에셋을 끌어 넣어 채우세요</span></div>`,
    kpi: () => `<div class="ph"><h3>새 지표</h3></div><div class="addedbody"><div class="kpinum num">1,234</div><div class="kpisub">단위 · 전일 대비 +3.2%</div></div>`,
    chart: () => {
      const bars = [42, 68, 55, 80, 63, 74, 90, 58].map((h) => `<i style="height:${h}%"></i>`).join('');
      return `<div class="ph"><h3>새 차트</h3></div><div class="addedbody"><div class="minibars">${bars}</div></div>`;
    },
    table: () =>
      `<div class="ph"><h3>새 표</h3></div><div class="addedbody"><table><thead><tr><th>항목</th><th>값</th><th>상태</th></tr></thead><tbody><tr><td>항목 A</td><td class="num">128</td><td>정상</td></tr><tr><td>항목 B</td><td class="num">64</td><td>주의</td></tr><tr><td>항목 C</td><td class="num">301</td><td>정상</td></tr></tbody></table></div>`,
    gauge: () => {
      const r = 40,
        c = 2 * Math.PI * r,
        v = 0.72;
      return `<div class="ph"><h3>새 게이지</h3></div><div class="addedbody" style="align-items:center"><svg viewBox="0 0 100 100" width="110" height="110"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--point-main)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="56" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text-strong)">72%</text></svg></div>`;
    },
  };
  const addPanel = (type, customHTML) => {
    const cols = activeCols();
    if (!cols) {
      if (typeof toast === 'function') toast('이 화면에서는 패널 추가를 지원하지 않아요.', { type: 'err' });
      return null;
    }
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = customHTML || (build[type] || build.kpi)();
    if (cols.classList.contains('gridmode')) {
      /* 레이아웃(그리드) 모드: 패널은 .cols의 '직속 그리드 아이템'이라 .col로 감싸면
         자동배치 셀에 갇혀 높이가 1px로 찌부러진다(반응형으로 안 나오던 원인).
         → 감싸지 말고 직접 추가하고, 새로 생기는 암시 행 높이를 콘텐츠 기준으로 잡는다. */
      if (!cols.style.gridAutoRows) cols.style.gridAutoRows = 'minmax(140px, auto)';
      cols.appendChild(panel);
    } else {
      /* 기둥(컬럼) 모드: 패널이 가장 적은 .col에 넣는다 */
      let colEls = [...cols.querySelectorAll(':scope > .col')];
      if (!colEls.length) {
        const c = document.createElement('div');
        c.className = 'col';
        cols.appendChild(c);
        colEls = [c];
      }
      const target = colEls.reduce((a, b) => (b.querySelectorAll(':scope > .panel').length < a.querySelectorAll(':scope > .panel').length ? b : a));
      target.appendChild(panel);
    }
    ensureDelBtns();
    if (sizingOn) ensureSzHandles();
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return panel;
  };

  /* ===== 콘텐츠 추가 컨텍스트 창 — 문장 → 그에 맞는 패널 콘텐츠 자동 생성 =====
     '＋ 패널'을 누르면 입력창이 열리고, 문장을 넣으면 시각화 종류(차트/표/게이지/지표/CCTV)와
     제목·데이터를 추정해 패널을 채운다. 백엔드 없이 키워드로 결정적으로 동작(임시). */
  const PANEL = {
    esc: (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    titleFrom(raw) {
      let t = String(raw || '').trim()
        .replace(/(라인\s*차트|막대\s*차트|바\s*차트|꺾은선|line\s*chart|bar\s*chart)/gi, ' ')
        .replace(/(차트|그래프|테이블|게이지|그리드|패널|화면|영상그리드|심볼|아이콘|기호)/g, ' ')
        .replace(/(관련|및|와|과|의|을|를|으로|로)\s*$/g, ' ')
        .replace(/(보여줘|만들어줘|만들어|생성해줘|생성|추가해줘|추가|넣어줘|넣어)/g, ' ')
        .replace(/\s+/g, ' ').trim();
      return t || '새 패널';
    },
    /* 아이콘 세트(24x24 stroke) — 심볼 패널용 */
    ICO: {
      fire:   '<path d="M12 2s5 5.5 5 10a5 5 0 0 1-10 0c0-4.5 5-10 5-10z"/>',
      drop:   '<path d="M12 2.7s5.5 6.8 5.5 10.8a5.5 5.5 0 0 1-11 0C6.5 9.5 12 2.7 12 2.7z"/>',
      gas:    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      quake:  '<polyline points="2 12 6 12 9 5 13 19 16 12 22 12"/>',
      cctv:   '<path d="M2 8.5A1.5 1.5 0 0 1 3.5 7h9A1.5 1.5 0 0 1 14 8.5V16H3.5A1.5 1.5 0 0 1 2 14.5z"/><polygon points="14 11 21 7.5 21 15.5 14 12"/>',
      thermo: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
      bolt:   '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
      user:   '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    },
    icon(name, size) {
      const sz = size || 26;
      return '<svg viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (this.ICO[name] || this.ICO.bolt) + '</svg>';
    },
    /* 문장에서 관련 심볼 추출(화재·누수·가스 등) */
    symList(s) {
      const out = [], seen = new Set();
      /* q = 라이브러리 에셋 조회용 단어(등록된 화재·누수 등과 매칭) */
      const add = (re, icon, label, q) => { if (re.test(s) && !seen.has(icon)) { seen.add(icon); out.push({ icon, label, q }); } };
      add(/화재|소방|불|화염|연기/, 'fire', '화재 감지', '화재');
      add(/누수|침수|물\b|배관|수위/, 'drop', '누수 감지', '누수');
      add(/가스|유독|메탄|누출/, 'gas', '가스 감지', '가스');
      add(/지진|진동|기상|재난/, 'quake', '지진·기상', '지진');
      add(/cctv|영상|카메라/, 'cctv', 'CCTV', 'CCTV');
      add(/온도|온습도|열\b|항온/, 'thermo', '온습도', '온습도');
      add(/전력|전기|전압|전류/, 'bolt', '전력', '전력');
      add(/출입|보안|카드|얼굴|지문/, 'user', '출입 통제', '출입');
      if (!out.length) { out.push({ icon: 'fire', label: '화재 감지', q: '화재' }, { icon: 'drop', label: '누수 감지', q: '누수' }, { icon: 'thermo', label: '온습도', q: '온습도' }); }
      return out;
    },
    /* 심볼 글리프 — 등록된 라이브러리 에셋이 있으면 그걸, 없으면 내장 아이콘. 항상 '.swap-asset'
       박스로 감싸 패널 편집 중 라이브러리에서 교체할 수 있게 한다. */
    glyph(item, size) {
      let svg = null, tint = false;
      try {
        const a = (typeof window.__wembFindAsset === 'function') ? window.__wembFindAsset(item.q, ['symbol', 'icon']) : null;
        if (a && a.svg) svg = a.svg;
      } catch (e) {}
      if (!svg) { svg = this.icon(item.icon, size); tint = true; }
      const style = `width:${size}px;height:${size}px;` + (tint ? 'color:var(--point-main);' : '');
      return `<span class="swap-asset apc-lib" data-swap="symbol" style="${style}">${svg}</span>`;
    },
    swapChart(frag) {
      return `<div class="swap-asset" data-swap="chart" style="width:100%">${frag}</div>`;
    },
    /* ── 콘텐츠 조각(fragment) ── */
    barsFrag() {
      const bars = [42, 68, 55, 80, 63, 74, 90, 58, 66, 79].map((h) => `<i style="height:${h}%"></i>`).join('');
      return `<div class="minibars">${bars}</div>`;
    },
    lineFrag() {
      const vals = [34, 52, 45, 61, 50, 72, 63, 80, 70, 88];
      const n = vals.length, W = 300, H = 120, pad = 10;
      const xs = (i) => (pad + i * (W - 2 * pad) / (n - 1)).toFixed(1);
      const ys = (v) => (H - pad - (v / 100) * (H - 2 * pad)).toFixed(1);
      const line = vals.map((v, i) => xs(i) + ',' + ys(v)).join(' ');
      const area = pad + ',' + (H - pad) + ' ' + line + ' ' + (W - pad) + ',' + (H - pad);
      const dots = vals.map((v, i) => `<circle cx="${xs(i)}" cy="${ys(v)}" r="2.6" fill="var(--point-main)" vector-effect="non-scaling-stroke"/>`).join('');
      return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:130px;overflow:visible"><polygon points="${area}" fill="var(--point-main)" opacity="0.12"/><polyline points="${line}" fill="none" stroke="var(--point-main)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>`;
    },
    symbolsFrag(s, compact) {
      const items = this.symList(s);
      if (compact) {
        return '<div style="display:flex;gap:8px;flex-wrap:wrap">' + items.slice(0, 5).map((it) =>
          `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid var(--line);border-radius:999px;font-size:11.5px;color:var(--text-strong)">${this.glyph(it, 16)}${this.esc(it.label)}</span>`
        ).join('') + '</div>';
      }
      const cols = Math.min(items.length, 4);
      return '<div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:8px;width:100%">' + items.map((it) =>
        `<div style="display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 6px;border:1px solid var(--line);border-radius:10px;background:var(--bg-surface)">${this.glyph(it, 28)}<span style="font-size:11.5px;color:var(--text-weak);text-align:center">${this.esc(it.label)}</span></div>`
      ).join('') + '</div>';
    },
    /* ── 종류 결정 ── */
    resolve(s) {
      const hasSym = /심볼|아이콘|기호/.test(s);
      const isLine = /라인|꺾은선|선\s*그래프|선\s*차트|line/.test(s);
      const isBar = /막대|바\s*차트|bar/.test(s);
      const wantsChart = /차트|그래프|추이|트렌드|추세|분포|통계|막대|라인|line|bar/.test(s) ||
        /전력|전압|전류|온도|습도|압력|트래픽|처리량|거래|발전|사용량|소비/.test(s);
      if (hasSym && wantsChart) return { kind: 'symchart', line: isLine };
      if (hasSym) return { kind: 'symbol' };
      if (/cctv|영상|카메라|감시화면/.test(s)) return { kind: 'cctv' };
      if (/게이지|비율|퍼센트|%|가동률|사용률|점유율|달성률|부하율/.test(s)) return { kind: 'gauge' };
      if (/표|목록|리스트|테이블|현황표|이벤트|알람|경보|로그|이력|랭킹|순위/.test(s)) return { kind: 'table' };
      if (isLine) return { kind: 'line' };
      if (wantsChart) return { kind: isBar ? 'bar' : (isLine ? 'line' : 'bar') };
      if (/지표|kpi|수치|건수|카운트|개수|합계|총|누적|현재값/.test(s)) return { kind: 'kpi' };
      return { kind: 'kpi' };
    },
    build(kind, title, s, opt) {
      const T = this.esc(title);
      const wrap = (body, style) => `<div class="ph"><h3>${T}</h3></div><div class="addedbody"${style ? ' style="' + style + '"' : ''}>${body}</div>`;
      if (kind === 'line') return wrap(this.swapChart(this.lineFrag()));
      if (kind === 'bar') return wrap(this.swapChart(this.barsFrag()));
      if (kind === 'symbol') return wrap(this.symbolsFrag(s, false));
      if (kind === 'symchart') return wrap(this.symbolsFrag(s, true) + this.swapChart((opt && opt.line) ? this.lineFrag() : this.barsFrag()), 'gap:12px');
      if (kind === 'gauge') {
        const r = 40, c = 2 * Math.PI * r, v = 0.72;
        return wrap(`<svg viewBox="0 0 100 100" width="110" height="110"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--point-main)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="56" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text-strong)">72%</text></svg>`, 'align-items:center');
      }
      if (kind === 'kpi') return wrap(`<div class="kpinum num">1,284</div><div class="kpisub">현재값 · 전일 대비 <b style="color:var(--point-main)">+3.2%</b></div>`);
      if (kind === 'cctv') {
        const isFire = /소방|화재/.test(s);
        const names = isFire ? ['소화전 A동', '스프링클러 B동', '감지기 C동', '펌프실'] : ['정문 CCTV #1', '옥외 CCTV #2', '기계실 CCTV #3', '제어동 CCTV #4'];
        const tiles = names.map((n) => `<div style="position:relative;aspect-ratio:16/9;background:#0d0f14;border:1px solid var(--line);border-radius:6px;display:flex;align-items:flex-end;padding:5px;font-size:10px;color:var(--text-weak);overflow:hidden"><span style="position:absolute;top:5px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--danger,#e5484d)"></span>${this.esc(n)}</div>`).join('');
        return wrap(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%">${tiles}</div>`);
      }
      /* table */
      const evt = /이벤트|알람|경보|로그|이력/.test(s);
      if (evt) return wrap(`<table><thead><tr><th>시간</th><th>대상</th><th>등급</th></tr></thead><tbody><tr><td class="num">09:41:12</td><td>변압기 #302</td><td>위험</td></tr><tr><td class="num">09:38:05</td><td>CCTV #04</td><td>주의</td></tr><tr><td class="num">09:33:47</td><td>펌프실 #1</td><td>정상</td></tr></tbody></table>`);
      return wrap(`<table><thead><tr><th>항목</th><th>값</th><th>상태</th></tr></thead><tbody><tr><td>항목 A</td><td class="num">128</td><td>정상</td></tr><tr><td>항목 B</td><td class="num">64</td><td>주의</td></tr><tr><td>항목 C</td><td class="num">301</td><td>정상</td></tr></tbody></table>`);
    },
    fromText(raw) {
      const s = String(raw || '').toLowerCase();
      const r = this.resolve(s);
      const title = this.titleFrom(raw);
      return { type: r.kind, line: !!r.line, title, html: this.build(r.kind, title, s, r) };
    },
  };
  const VIZ_LBL = { bar: '막대 차트', line: '라인 차트', gauge: '게이지', kpi: '지표', table: '표', cctv: 'CCTV 영상', symbol: '심볼', symchart: '심볼+차트' };
  function addPanelFromText(raw) {
    const spec = PANEL.fromText(raw);
    const panel = addPanel(spec.type, spec.html);
    return panel ? spec : null;
  }

  /* ── 컨텍스트 창 UI — '＋ 패널' 아래에 인라인으로 열린다 ── */
  const addpanelBar = document.querySelector('.addpanel');
  if (addpanelBar) {
    const ctx = document.createElement('div');
    ctx.className = 'addpanel-ctx';
    ctx.innerHTML =
      '<div class="apc-hint">문장을 넣으면 그에 맞는 콘텐츠가 패널에 채워져요.</div>' +
      '<div class="apc-row">' +
        '<input type="text" class="apc-input" maxlength="60" placeholder="예: 전력 사용량 추이 차트 / CCTV 영상 / 알람 이벤트 표" />' +
        '<button type="button" class="apc-go">생성</button>' +
      '</div>' +
      '<div class="apc-foot"><button type="button" class="apc-empty">빈 패널로 추가</button></div>';
    addpanelBar.insertAdjacentElement('afterend', ctx);
    const ctxInput = ctx.querySelector('.apc-input');
    const ctxHint = ctx.querySelector('.apc-hint');
    const openCtx = () => { ctx.classList.add('open'); setTimeout(() => { try { ctxInput.focus(); } catch (e) {} }, 30); };
    const closeCtx = () => { ctx.classList.remove('open'); };
    const runCtx = () => {
      const v = ctxInput.value.trim();
      if (!v) { ctxInput.focus(); return; }
      const spec = addPanelFromText(v);
      if (!spec) return; /* 해당 화면 미지원 — addPanel이 토스트 */
      ctxHint.innerHTML = '<b>' + PANEL.esc(spec.title) + '</b> — ' + (VIZ_LBL[spec.type] || '패널') + ' 패널을 추가했어요.';
      ctxInput.value = '';
      ctxInput.focus();
      if (typeof toast === 'function') toast('“' + escHTML(spec.title) + '” ' + (VIZ_LBL[spec.type] || '패널') + ' 패널을 추가했어요.', { type: 'ok' });
    };
    ctx.querySelector('.apc-go').onclick = runCtx;
    ctxInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runCtx(); } else if (e.key === 'Escape') { closeCtx(); } });
    ctx.querySelector('.apc-empty').onclick = () => { addPanel('empty'); closeCtx(); };
    /* '＋ 패널' 클릭 = 컨텍스트 창 토글, 나머지 data-add 버튼은 그대로 즉시 추가 */
    addpanelBar.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-add]');
      if (!b) return;
      if (b.dataset.add === 'empty') { ctx.classList.contains('open') ? closeCtx() : openCtx(); }
      else addPanel(b.dataset.add);
    });
    window.__addPanelFromText = addPanelFromText; /* 외부/테스트용 */
  } else {
    document.querySelector('.addpanel')?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-add]');
      if (b) addPanel(b.dataset.add);
    });
  }

  /* ── '패널편집' 마스터 버튼 — 패널 조정·배치 수정·내용 수정을 한 번에 켜고 끈다.
     숨겨둔 개별 토글(sizeToggle·editToggle·contentToggle)을 필요한 것만 클릭해 상태를 맞춘다.
     (editToggle·contentToggle 는 화면(dash/dt)에 맞는 핸들러가 이미 붙어 있어 그대로 동작) */
  (function initEditAll() {
    const master = document.getElementById('editAll');
    if (!master) return;
    const sizeBtn = document.getElementById('sizeToggle');
    const editBtn = document.getElementById('editToggle');
    const contentBtn = document.getElementById('contentToggle');
    let on = false;
    const ensure = (btn, want) => { if (btn && btn.classList.contains('on') !== want) btn.click(); };
    master.addEventListener('click', () => {
      on = !on;
      master.classList.toggle('on', on);
      master.textContent = on ? '✓ 편집 끝내기' : '✎ 패널편집';
      ensure(sizeBtn, on);
      ensure(editBtn, on);
      ensure(contentBtn, on);
    });
  })();

  /* ── 패널 조정 — 각 패널을 개별적으로 자유롭게 크기 조절 ──
     '패널 조정'을 켜면 현재 화면(대시보드/디지털 트윈)의 모든 패널 오른쪽 아래에
     손잡이가 생기고, 끌면 그 패널만 고정 크기로 바뀐다(나머지는 남은 공간을 채움).
     손잡이를 더블클릭하면 그 패널만 원래(자동) 크기로 되돌린다. */
  let sizingOn = false;
  const szBtn = document.getElementById('sizeToggle');
  const szLbl = szBtn?.querySelector('.lbl');
  const ensureSzHandles = () => {
    main.querySelectorAll('.cols .panel').forEach((p) => {
      if (p.querySelector(':scope > .psz')) return;
      const h = document.createElement('span');
      h.className = 'psz';
      h.title = '드래그: 크기 조절 · 더블클릭: 이 패널 크기 초기화';
      h.setAttribute('aria-hidden', 'true');
      p.appendChild(h);
    });
  };
  const setSizing = (on) => {
    sizingOn = on;
    if (on) ensureSzHandles();
    main.querySelectorAll('.cols').forEach((c) => c.classList.toggle('sizing', on));
    szBtn?.classList.toggle('on', on);
    if (szLbl) szLbl.textContent = on ? '끝내기' : '패널 조정';
  };
  szBtn?.addEventListener('click', () => setSizing(!sizingOn));

  /* 손잡이 드래그(포인터) — 그 패널만 고정 크기로 전환 후 크기 갱신 */
  let szEl = null, szGrabX = 0, szGrabY = 0, szSW = 0, szSH = 0, szMinW = 80, szMinH = 64, szScale = 1;
  main.addEventListener('pointerdown', (e) => {
    if (!sizingOn) return;
    const h = e.target.closest('.psz');
    if (!h) return;
    const p = h.closest('.panel');
    if (!p) return;
    e.preventDefault();
    e.stopPropagation();
    const r = p.getBoundingClientRect();
    szEl = p;
    /* 패널이 배율이 걸린 컨테이너(예: SK하이닉스 1920×1080 화면) 안에 있으면
       그 배율만큼 나눠야 손잡이가 커서를 '정확히' 따라온다.
       rect(=화면상 크기) ÷ offset(=레이아웃 크기) 가 누적 배율. 배율이 없으면 1.
       offset 정수 반올림 오차(≈1px 미만)는 배율 1로 스냅한다. */
    szScale = (p.offsetWidth ? r.width / p.offsetWidth : 1) || 1;
    if (Math.abs(szScale - 1) < 0.02) szScale = 1;
    /* 잡은 지점과 패널 오른쪽·아래 모서리의 간격(화면 px). 매 프레임 이 간격을 유지해
       모서리를 커서에 붙여 둔다 → 시작 순간 튐 없음 + 드래그한 만큼만 정확히 커짐. */
    szGrabX = r.right - e.clientX;
    szGrabY = r.bottom - e.clientY;
    szSW = r.width / szScale;
    szSH = r.height / szScale;
    /* 에셋이 든 패널은, 에셋 영역(+상하좌우 패딩)보다 작게 줄지 않도록 최소 크기를 잡는다.
       → 패널을 줄여도 에셋 영역이 침범(클립)되지 않고 패딩 프레임이 유지된다. */
    szMinW = 80; szMinH = 64;
    const aw = p.querySelector('.assetwrap');
    const arow = aw && aw.querySelector('.assetrow');
    if (aw && arow) {
      /* 세로로 쌓인 에셋은 높이가 고정이라 패널을 줄이면 잘린다 → 세로 최소치를 콘텐츠에 맞춘다.
         (가로 폭은 에셋이 100%로 줄어드니 폭 최소치는 넉넉히 작게 둔다) */
      const ph = p.querySelector(':scope > .ph, :scope > .addedbody > .ph');
      const phH = ph ? ph.getBoundingClientRect().height : 0;
      const rrect = arow.getBoundingClientRect();
      const padV = 28, brd = 2; /* .assetwrap 상하 패딩(14+14) + 테두리 */
      /* phH·rrect 는 화면상 크기 → 배율로 나눠 레이아웃 px 최소치로 맞춘다 */
      szMinH = Math.ceil((phH + rrect.height) / szScale + padV + brd);
    }
    /* 왼쪽 상단(코너)을 고정하고 오른쪽·아래로만 크기가 자라도록 앵커링.
       place-self:start 는 기둥(flex)·격자(grid) 양쪽에서 stretch 를 눌러
       ① 드래그로 지정한 크기가 실제로 적용되게 하고(손잡이가 마우스를 따라 움직임)
       ② 패널을 항상 좌상단에 붙여 위치가 밀리지 않게 한다. */
    /* ★ 기둥(flex column) 모드 핵심 —
       기본 패널은 flex:1 1 0 이라, 이 패널을 키우면 '다른' 패널들이 같이 줄었다
       늘었다 한다(= 원치 않는 크기 변화 + 위 형제가 줄어 이 패널 top 이 밀림).
       → 드래그 시작 시 '같은 열의 다른 패널 전부'를 현재 높이로 고정(flex:0 0 h).
       그러면 드래그하는 패널만 크기가 바뀌고, 나머지는 크기 그대로 아래로 밀릴 뿐.
       위 형제가 고정이므로 이 패널의 '왼쪽 상단'은 고정점이 된다. */
    const col = p.parentElement;
    if (col && col.classList.contains('col')) {
      /* 2-패스: 먼저 다른 패널들의 '현재 높이'를 전부 측정한 뒤 한꺼번에 고정한다.
         (측정하며 바로 고정하면 그 사이 레이아웃이 다시 흘러 형제 높이가 살짝 튄다) */
      const others = [...col.querySelectorAll(':scope > .panel')].filter((s) => s !== p);
      /* 형제 높이도 반올림 없는 정확한 레이아웃 px 로 고정 → 위 형제 높이 합이
         그대로 유지돼, 드래그하는 패널의 '상단'이 조금도 밀리지 않는다. */
      const hs = others.map((s) => s.getBoundingClientRect().height / szScale);
      others.forEach((s, i) => { s.style.flex = '0 0 ' + hs[i] + 'px'; });
    }
    p.style.flex = '0 0 auto';
    p.style.placeSelf = 'start';
    p.style.alignSelf = 'flex-start';
    p.style.width = szSW + 'px';
    p.style.height = szSH + 'px';
    p.classList.add('sizing-active', 'psized');
    try { h.setPointerCapture(e.pointerId); } catch (err) {}
  });
  main.addEventListener('pointermove', (e) => {
    if (!szEl) return;
    /* 매 프레임 패널의 실제 위치(고정된 상단·왼쪽)를 다시 읽어, 오른쪽·아래 모서리가
       '커서 + 처음 잡은 간격'에 정확히 오도록 크기를 역산한다. grid·flex·배율 등
       레이아웃이 어떻든 손잡이가 커서를 그대로 따라오므로 딱 드래그한 만큼만 커진다. */
    const rect = szEl.getBoundingClientRect();
    const w = (e.clientX + szGrabX - rect.left) / szScale;
    const h = (e.clientY + szGrabY - rect.top) / szScale;
    szEl.style.width = Math.max(szMinW, w) + 'px';
    szEl.style.height = Math.max(szMinH, h) + 'px';
  });
  const endSz = () => {
    if (!szEl) return;
    szEl.classList.remove('sizing-active');
    szEl = null;
  };
  main.addEventListener('pointerup', endSz);
  main.addEventListener('pointercancel', endSz);

  /* 손잡이 더블클릭 → 그 패널만 자동 크기로 초기화 */
  main.addEventListener('dblclick', (e) => {
    if (!sizingOn) return;
    const h = e.target.closest('.psz');
    if (!h) return;
    const p = h.closest('.panel');
    if (!p) return;
    e.preventDefault();
    p.style.flex = '';
    p.style.placeSelf = '';
    p.style.alignSelf = '';
    p.style.width = '';
    p.style.height = '';
    p.classList.remove('psized', 'sizing-active');
  });
  /* 열별 너비 비중 설정 (예: [2,1] = 메인+사이드). 값 없으면 균등 */
  function setColWeights(weights) {
    const cols = activeCols();
    if (!cols) return;
    [...cols.querySelectorAll(':scope > .col')].forEach((c, i) => {
      c.style.flex = weights && weights[i] != null ? String(weights[i]) : '1';
    });
  }
  /* 와이어프레임 선택 등 외부에서 레이아웃을 적용할 수 있도록 노출 */
  window.__wembLayout = {
    apply(nCols, weights) {
      setColumns(nCols);
      setColWeights(weights || null);
      document.querySelectorAll('#colCount button').forEach((x) => x.classList.toggle('on', +x.dataset.c === nCols));
    },
  };

  /* 현재 열 수에 맞춰 세그먼트 표시 */
  const cur = activeCols();
  const n = cur ? cur.querySelectorAll(':scope > .col').length : 3;
  document.querySelectorAll('#colCount button').forEach((x) => x.classList.toggle('on', +x.dataset.c === n));

  /* ── 에셋 라이브러리: 차트·심볼·아이콘을 끌어다(또는 클릭) 화면(.cols)에 패널로 삽입 ── */
  (function initAssetLibrary() {
    const grid = document.getElementById('libGrid');
    const tabs = document.getElementById('libTabs');
    if (!grid || !tabs) return;

    /* 접기/펼치기 — 처음엔 접혀 있다(studio.html 의 .libbody[hidden]).
       새 화면으로 들어오면 '콘텐츠 추가' 섹션이 먼저 열리는데, 샘플 수십 개가 한꺼번에 펼쳐져 사이드바가 화면의 1.7배로 늘었다.
       한 번 펼치면 이 화면의 상태로 기억한다(wemb-* 키라 화면마다 따로 저장된다). */
    (function initLibFold() {
      const btn = document.getElementById('libFold');
      const body = document.getElementById('libBody');
      if (!btn || !body) return;
      const KEY = 'wemb-lib-open';
      const set = (open, remember) => {
        body.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.textContent = open ? '접기' : '펼치기';
        if (remember) {
          try { open ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch (e) {}
        }
      };
      let saved = false;
      try { saved = localStorage.getItem(KEY) === '1'; } catch (e) {}
      set(saved, false);
      btn.addEventListener('click', () => set(body.hidden, true));
      window.__openAssetLibrary = () => set(true, true);
    })();

    /* 라인 아이콘 세트 (stroke=currentColor, 24x24) */
    const ICONS = {
      home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
      chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
      activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
      alert: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
      check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
      db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6a8 3 0 0 0 16 0V5"/><path d="M4 11v6a8 3 0 0 0 16 0v-6"/>',
      cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
      layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
      wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M2 9a15 15 0 0 1 20 0"/>',
      shield: '<path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3z"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    };
    const iconSvg = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';

    /* 차트 미리보기/본문 SVG (썸네일과 삽입 본문 공용) */
    function chartArt(i) {
      const P = 'var(--point-main)',
        L = 'var(--line)',
        T = 'var(--text-strong)',
        W = 'var(--text-weak)';
      switch (i) {
        case 'chart':
          return `<svg class="cart" viewBox="0 0 100 72" preserveAspectRatio="none">${[30, 52, 40, 64, 48, 58, 70].map((h, k) => `<rect x="${k * 14 + 5}" y="${72 - h}" width="9" height="${h}" rx="2" fill="${P}" opacity=".9"/>`).join('')}</svg>`;
        case 'line':
          return `<svg class="cart" viewBox="0 0 100 72" preserveAspectRatio="none"><polyline points="2,50 16,36 30,44 44,22 58,32 72,14 86,26 98,8" fill="none" stroke="${P}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        case 'area':
          return `<svg class="cart" viewBox="0 0 100 72" preserveAspectRatio="none"><polygon points="2,50 16,36 30,44 44,22 58,32 72,14 86,26 98,8 98,72 2,72" fill="${P}" opacity=".22"/><polyline points="2,50 16,36 30,44 44,22 58,32 72,14 86,26 98,8" fill="none" stroke="${P}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        case 'donut':
          return `<svg class="cart" viewBox="0 0 100 72"><g transform="translate(50,36)"><circle r="22" fill="none" stroke="${L}" stroke-width="10"/><circle r="22" fill="none" stroke="${P}" stroke-width="10" stroke-linecap="round" stroke-dasharray="97 138" transform="rotate(-90)"/></g></svg>`;
        case 'gauge':
          return `<svg class="cart" viewBox="0 0 100 72"><g transform="translate(50,52)"><path d="M-34 0 A34 34 0 0 1 34 0" fill="none" stroke="${L}" stroke-width="9" stroke-linecap="round"/><path d="M-34 0 A34 34 0 0 1 18 -29" fill="none" stroke="${P}" stroke-width="9" stroke-linecap="round"/></g></svg>`;
        case 'bullet':
          return `<svg class="cart" viewBox="0 0 100 72" preserveAspectRatio="none"><rect x="6" y="30" width="88" height="14" rx="3" fill="${L}"/><rect x="6" y="30" width="58" height="14" rx="3" fill="${P}"/><rect x="72" y="24" width="3" height="26" fill="${T}"/></svg>`;
        case 'kpi':
          return `<svg class="cart" viewBox="0 0 100 72"><text x="50" y="38" text-anchor="middle" font-size="24" font-weight="800" fill="${P}">1,234</text><text x="50" y="55" text-anchor="middle" font-size="10" fill="${W}">+3.2%</text></svg>`;
        case 'table':
          return `<svg class="cart" viewBox="0 0 100 72"><rect x="8" y="14" width="84" height="15" fill="${P}" opacity=".16"/><g stroke="${L}" stroke-width="2" fill="none"><rect x="8" y="14" width="84" height="46" rx="4"/><line x1="8" y1="29" x2="92" y2="29"/><line x1="8" y1="44" x2="92" y2="44"/><line x1="40" y1="14" x2="40" y2="60"/><line x1="66" y1="14" x2="66" y2="60"/></g></svg>`;
        default:
          return '';
      }
    }

    /* 카테고리별 에셋 목록. 차트는 화면(대시보드)에 실제로 그려진 것을 캡처해 채우므로
       render('chart') 시점에 buildChartItems()로 동적으로 채운다. */
    /* SK하이닉스 이천 FMS(Figma 16:1775) named 레이어 — 인라인 SVG(코드)로 변환된 에셋.
       Figma 네이밍대로 각 탭에 편입: Symbol-menu→심볼, Icon→아이콘, Chart→차트.
       (window.__SKX_ASSETS = {symbols, icons, charts}, src/skhynix-assets.js) */
    const SKX = window.__SKX_ASSETS || { symbols: [], icons: [], charts: [], panels: [] };
    /* 스튜디오 표기용 에셋 이름 — Figma 'group/name' 에서 앞 그룹(접두)은 빼고 뒤 이름만, 한글로 표기.
       (SK하이닉스 화면 좌측 라벨과 동일한 한글) */
    const SKX_NAME_KO = {
      'ups-power': 'UPS 전력량', 'center-temp': '센터 온도', 'saturation': '상면 포화도',
      'fire': '화재', 'leak': '누수', 'hvac': '항온항습기', 'th-sensor': '온습도센서',
      'discharge-temp': '토출온도계', 'rack-temp': 'RACK온도', 'anemometer': '풍속계',
      'ups': 'UPS', 'rack-power': 'RACK전력',
      'card': '카드', 'board': '보드', 'bar': '바',
    };
    const skxDispName = (name) => {
      const suffix = String(name == null ? '' : name).split('/').pop().trim(); /* 앞 그룹 제거, 뒤 글자만 */
      return SKX_NAME_KO[suffix] || suffix;
    };
    /* ── 에셋을 '모션까지 포함해' 등록한다 ──
       원본 시안에서 이 에셋이 하던 움직임을 그대로 얹는다. 클래스를 에셋 SVG 자체에 심어 두면
       라이브러리 썸네일·패널 삽입·패널 안 덧붙이기 등 모든 경로에서 같은 애니메이션이 돈다.
       (모션 정의는 <style id="skx-lib-motion-style">, reduce-motion이면 자동 정지) */
    const SKX_ANIM = {
      chart_ups: 'fx-ups',              /* 데이터 선 그려지기 + 포커스 마커 맥동 */
      chart_centertemp: 'fx-temp',      /* 기포 상승 · 경보 큐브 깜빡임 · 게이지 레벨 스텝 */
      chart_saturation: 'fx-sat',       /* 실린더 디스크 쌓기 · 도넛 링 호흡 */
      sym_fire: 'fx-alarm',             /* 화재 — 상시 호흡 글로우 */
      ico_fire: 'fx-alarm',
    };
    const skxAnimClass = (id) => {
      const cls = [SKX_ANIM[id] || ''];
      if (/^(sym|ico)_/.test(id)) cls.push('fx-live'); /* 심볼·아이콘 공통 호버 활성 */
      return cls.filter(Boolean).join(' ');
    };
    const skxWithAnim = (id, html) => {
      const cls = skxAnimClass(id);
      if (!cls || !html) return html;
      return html.replace('class="fig-svg"', 'class="fig-svg ' + cls + '"');
    };
    const skxItems = (arr, cat) => (arr || []).map((a) => ({ cat: cat, id: a.id, name: skxDispName(a.name), fig: a.fig, html: skxWithAnim(a.id, a.html) }));

    /* ── 이천 FMS 두 화면(Figma 64:3367 · 64:4059)에서 실제로 쓰인 에셋 ──
       Figma 가 내보낸 원본 파일을 그대로 참조한다(그림을 다시 그리지 않는다).
       분류·이름은 레이어명에서 뽑아 뒀다 — window.__ICHEON_ASSETS, src/icheon-assets.js
       (생성기: src/icheon-assets/_gen/mk-assets.js) */
    const ICH = window.__ICHEON_ASSETS || { charts: [], symbols: [], icons: [], panels: [] };
    const ichItems = (arr, cat) => (arr || []).map((a) => ({ cat: cat, id: a.id, name: a.name, fig: a.fig, src: a.src, light: a.light }));
    /* 이벤트 패널 탭 등록 기준 — 이름에 '이벤트'가 들어간 등록물(이벤트 목록·이벤트 로그 …) */
    const isEventNamed = (it) => /이벤트/.test(String(it && it.name));
    /* 아이콘 탭 등록 기준 — 이름이 '…아이콘'인 것만 아이콘으로 본다 */
    const isIconNamed = (it) => /아이콘/.test(String(it.name));
    /* 라벨에서 '아이콘' 꼬리표는 뺀다 — 아이콘 탭 안에서는 군더더기다.
       (툴팁·검색은 원래 이름을 그대로 쓰므로 '아이콘'으로도 찾을 수 있다) */
    const lname = (s) => String(s).replace(/아이콘/g, '').replace(/\s+/g, ' ').trim() || String(s);

    /* ── 한진 SMART 통합관제 3화면의 컴포넌트 에셋 ──
       그림 파일이 아니라 **화면 DOM 을 그대로 잘라 쓴다**(src/hanjin-assets.js = 등록 목록).
       · 이 시안의 이벤트 현황 판은 화면 밖으로 269px 나가 있어 Figma 내보내기가 61px 만 준다.
         재구축한 화면에는 온전한 DOM 이 있으니 거기서 노드 id 로 잘라 오는 편이 정확하다.
       · 글자가 실제 텍스트 그대로라 '패널편집'으로 고칠 수 있고, 화면 테마(다크/라이트)와
         '색 정하기'가 라이브러리 썸네일에도 똑같이 먹는다.
       · 시트는 스튜디오가 시안을 얹을 때 쓰는 것과 같은 style#hjX-style 로 한 번만 붙인다
         (`.hjX-root` 안으로 스코프돼 있어 라이브러리 밖으로 새지 않는다). */
    const HJ = window.__HANJIN_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };
    /* ── HANA Bank H.I.T 14화면의 컴포넌트 에셋 ──
       한진과 같은 장치를 쓴다(화면 DOM 에서 노드 id 로 잘라 쓰기) — 등록 목록만 다르다.
       화면 registry 를 합쳐 두면 hjScreenHtml/hjDom 이 접두어만 보고 그대로 처리한다. */
    const HN = window.__HANA_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };
    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {});
    const hjHtmlCache = {};
    function hjScreenHtml(px) {
      if (hjHtmlCache[px]) return hjHtmlCache[px];
      const S = DOM_SCREENS[px];
      const build = S && window[S.build];
      if (typeof build !== 'function') return (hjHtmlCache[px] = '');
      /* 시트도 이때 한 번만 — 다크가 먼저, 라이트가 뒤(오버라이드 순서) */
      [[px + '-style', window[S.css]], [px + '-light-style', window[S.light]]].forEach((p) => {
        if (!p[1] || document.getElementById(p[0])) return;
        const st = document.createElement('style');
        st.id = p[0];
        st.textContent = p[1];
        document.head.appendChild(st);
      });
      return (hjHtmlCache[px] = build(S.base || HJ.base || 'src/hanjin/'));
    }
    /* 노드 하나의 서브트리를 잘라 낸다(여는/닫는 태그 짝 세기) */
    const hjSubCache = {};
    function hjSub(px, nid) {
      const key = px + '|' + nid;
      if (hjSubCache[key] != null) return hjSubCache[key];
      const html = hjScreenHtml(px);
      const at = html.indexOf('data-node-id="' + nid + '"');
      if (at < 0) return (hjSubCache[key] = '');
      const start = html.lastIndexOf('<', at);
      const tag = (/^<([a-zA-Z0-9]+)/.exec(html.slice(start, start + 20)) || [])[1];
      if (!tag) return (hjSubCache[key] = '');
      const open = new RegExp('<' + tag + '(?=[\\s>])', 'g');
      const close = new RegExp('</' + tag + '>', 'g');
      let depth = 0, i = start;
      while (i < html.length) {
        open.lastIndex = i; close.lastIndex = i;
        const o = open.exec(html), c = close.exec(html);
        if (!c) break;
        if (o && o.index < c.index) { depth++; i = o.index + 1; continue; }
        depth--; i = c.index + 1;
        if (depth === 0) return (hjSubCache[key] = html.slice(start, c.index + c[0].length));
      }
      return (hjSubCache[key] = '');
    }
    /* 에셋 하나를 감싸 그린다 — 크기는 Figma 값 그대로, 자리는 .hj-asset 이 잡는다 */
    function hjDom(it, theme) {
      const inner = hjSub(it.px, it.nid);
      if (!inner) return '';
      const th = theme || (grid.dataset.theme === 'light' ? 'light' : 'dark');
      return '<div class="' + it.px + '-root hj-asset" data-theme="' + th + '" data-hjw="' + it.w + '" data-hjh="' + it.h + '"'
        + ' style="width:' + it.w + 'px;height:' + it.h + 'px">' + inner + '</div>';
    }
    const hjItems = (arr, cat) => (arr || []).map((a) => ({
      cat: cat, id: a.id, name: a.name, fig: a.fig, px: a.px, nid: a.nid, w: a.w, h: a.h, dom: true,
    }));
    const hjIcons = (arr, cat) => (arr || []).map((a) => ({ cat: cat, id: a.id, name: a.name, fig: a.fig, src: a.src }));
    /* 담는 상자에 맞춰 배율을 잡는다(썸네일·삽입 공통). 원본 비율 그대로 줄이기만 한다. */
    function hjFit(root) {
      (root || document).querySelectorAll('.hj-asset').forEach((el) => {
        const box = el.parentElement;
        if (!box) return;
        const bw = box.clientWidth, bh = box.clientHeight;
        const w = +el.dataset.hjw || el.offsetWidth || 1;
        const h = +el.dataset.hjh || el.offsetHeight || 1;
        if (!bw || !w || !h) return;
        if (box.classList.contains('hj-embed')) return;   /* 삽입 자리는 hjEmbedFit 이 맡는다 */
        const pad = 12;
        const kw = (bw - pad) / w, kh = (bh - pad) / h;
        let k, origin = 'center center';
        {
          /* 썸네일: 보통은 통째로 보이게 맞추고(fit), 이벤트 헤더(1800x28)처럼 상자와 비율이
             크게 어긋나는 것만 채워서 자른다(cover) — 안 그러면 실오라기 한 줄로 보인다.
             자를 때는 왼쪽부터 — 판의 제목·머리글이 그쪽에 있어 알아보기 쉽다. */
          /* 칩·배지처럼 작은 것은 조금 키워도 된다(벡터·실제 글자라 흐려지지 않는다) */
          const cap = 1.8;
          const fit = Math.min(kw, kh), cover = Math.min(Math.max(kw, kh), cap);
          k = Math.min(cover / fit > 2.6 ? cover : fit, cap);
          if (w * k > bw - pad + 1) origin = 'left center';
        }
        k = Math.max(0.02, k);
        el.style.setProperty('--k', k.toFixed(4));
        el.style.transformOrigin = origin;
        /* 잘라서 보여줄 때는 상자 왼쪽에 붙여야 한다 — 가운데 정렬로 두면 원본 폭(1840px)의
           절반이 상자 왼쪽 밖으로 나가 있어, 왼쪽 기준으로 줄여도 빈 곳만 보인다. */
        box.style.justifyContent = origin === 'left center' ? 'flex-start' : 'center';
      });
    }
    /* 패널·화면에 넣은 에셋은 **폭**부터 맞춘다. transform 은 레이아웃 상자를 그대로 둬서
       1840px 짜리 판을 넣으면 슬롯이 그만큼 넓어져 패널 밖으로 삐져나간다 → zoom 으로 줄인다
       (zoom 은 레이아웃까지 줄어든다). 높이는 그 뒤 스튜디오의 기존 맞춤(FIT_H)이 이어받는다. */
    function hjEmbedFit(root) {
      (root || document).querySelectorAll('.hj-embed .hj-asset').forEach((el) => {
        const w = +el.dataset.hjw || el.offsetWidth || 1;
        const host = el.closest('.assetrow') || el.closest('.addedbody') || el.closest('.panel');
        const bw = host ? host.clientWidth : 0;
        if (!bw || !w) return;
        el.style.zoom = Math.min(1, (bw - 8) / w).toFixed(4);
      });
    }
    window.__hjFitEmbeds = hjEmbedFit;
    window.__hjFitAssets = hjFit;
    window.addEventListener('resize', () => { hjFit(); hjEmbedFit(); });
    /* 라이브러리가 접혀 있을 때 그린 썸네일은 상자 크기가 0이라 배율을 못 잡는다 —
       펼쳐져 크기가 잡히는 순간 다시 맞춘다(사이드바 폭이 바뀔 때도 같이). */
    if (window.ResizeObserver) {
      let pending = 0;
      new ResizeObserver(() => {
        if (pending) return;
        pending = requestAnimationFrame(() => { pending = 0; hjFit(grid); });
      }).observe(grid);
    }

    const CATS = {
      chart: [],
      /* SK하이닉스 패널(콘텐츠를 감싸는 카드/섹션) — 인라인 SVG 에셋 */
      /* 패널 탭은 '카드'만 노출 (보드·바 제외) */
      panel: skxItems((SKX.panels || []).filter((a) => String(a.name).split('/').pop().trim() === 'card'), 'panel')
        .concat(ichItems((ICH.panels || []).filter((a) => !isEventNamed(a)), 'panel'))
        .concat(hjItems(HJ.panels, 'panel'))
        .concat(hjItems(HN.panels, 'panel')),
      /* 이벤트 패널 탭 — 이벤트 현황 판과 그 안에서 따로 꺼내 쓸 수 있는 덩어리들.
         한진 시안의 이벤트 현황(판·머리글·카운트·표·행·등급 배지)과 이천 FMS 의 이벤트 목록이 함께 산다. */
      event: hjItems(HJ.events, 'event')
        .concat(hjItems(HN.events, 'event'))
        .concat(ichItems((ICH.panels || []).filter(isEventNamed), 'event')),
      symbol: (window.__WEMB_SYMBOLS || [])
        .map((s, i) => ({ cat: 'symbol', id: s.i, name: '심볼 ' + String(i + 1).padStart(2, '0'), src: s.s }))
        .concat(skxItems(SKX.symbols, 'symbol'))
        .concat(ichItems(ICH.symbols, 'symbol'))
        .concat(hjItems(HJ.symbols, 'symbol'))
        .concat(hjItems(HN.symbols, 'symbol')),
      /* 아이콘 탭에는 '…아이콘'으로 이름 붙은 등록물만 올린다 — 칩·토글·상태 점·화살표·
         로고처럼 아이콘이 아닌 부품이 섞이지 않게. 이름이 기준이라 내장 라인 아이콘
         세트(홈·차트·알림 …)도 더는 올리지 않는다 — 이름에 '아이콘'이 없다.
         (예전에 화면에 얹어 둔 내장 아이콘은 ICONS 표로 그대로 그려진다 — 표는 남겨 둔다) */
      icon: []
        .concat(skxItems(SKX.icons, 'icon').filter(isIconNamed))
        .concat(ichItems(ICH.icons, 'icon').filter(isIconNamed))
        .concat(hjIcons(HJ.icons, 'icon').filter(isIconNamed))
        .concat(hjIcons(HN.icons, 'icon').filter(isIconNamed)),
      /* 검색 결과 임시 버킷 — data-cat="__search" 로 클릭/드래그가 여기서 항목을 찾는다 */
      __search: [],
    };

    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /* ── 라이트 시안 에셋(figimg-light)의 다크 테마 썸네일 만들기 ──
       에셋 파일은 라이트 한 벌뿐이고 <img>로 그리는 외부 SVG라 CSS가 안쪽에 닿지 않는다.
       그래서 파일을 읽어 색만 다시 칠한 뒤 data: URI 로 끼워 넣는다(원본 파일은 그대로).
         · 무채색(흰 판·회색 선·어두운 글자) → 명도를 뒤집어 다크 판/밝은 글자로
         · 강조색(채도가 있는 색) → 색상·채도는 그대로 두고 너무 어두운 것만 끌어올림
       = 팔레트 정체성은 지키면서 밝기만 다크로 뒤집는 리매핑. */
    const NAMED = { white: '#ffffff', black: '#000000' };
    function hexToRgb(h) {
      h = h.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.slice(6, 8)];
    }
    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      if (mx === mn) return [0, 0, l];
      const d = mx - mn;
      const sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      let h;
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (mx === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
      return [h, sat, l];
    }
    function hslToHex(h, sat, l, alpha) {
      const f = (p2, q2, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2) return q2;
        if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      };
      let r, g, b;
      if (sat === 0) r = g = b = l;
      else {
        const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
        const p2 = 2 * l - q;
        r = f(p2, q, h + 1 / 3); g = f(p2, q, h); b = f(p2, q, h - 1 / 3);
      }
      const hx = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
      return '#' + hx(r) + hx(g) + hx(b) + (alpha || '');
    }
    function darkColor(hex) {
      const rgba = hexToRgb(hex);
      const hsl = rgbToHsl(rgba[0], rgba[1], rgba[2]);
      const h = hsl[0], sat = hsl[1], l = hsl[2], a = rgba[3];
      /* 무채색 판별은 HSL 채도가 아니라 채도폭(chroma)으로 — 흰색에 가까운 회색은
         HSL 채도가 크게 잡혀(#F2F4F7 → S 24%) 강조색으로 오인되고, 그러면 위젯 안쪽
         패널 배경이 라이트 그대로 남는다. */
      const chroma = (Math.max(rgba[0], rgba[1], rgba[2]) - Math.min(rgba[0], rgba[1], rgba[2])) / 255;
      /* 무채색(판·글자·선) — 명도를 뒤집되 카드 바탕(#131318)보다 한 단 밝게 눌러
         흰 판이 다크 카드로 읽히게 한다 */
      if (chroma < 0.12) return hslToHex(h, sat, 0.12 + (1 - l) * 0.74, a);
      /* 강조색 — 색상·채도는 그대로, 어두운 색만 다크 판에서 보이도록 끌어올린다 */
      return hslToHex(h, sat, l < 0.5 ? Math.min(0.68, l + 0.2) : l, a);
    }
    /* 패널 컨테이너 SVG는 화면 CSS 값 그대로라 rgba()로 적힌다 — 알파는 두고 색만 바꾼다 */
    function darkCss(v) {
      const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.%]+))?\s*\)$/i.exec(v);
      if (!m) return darkColor(NAMED[v.toLowerCase()] || v);
      const hx = darkColor('#' + [m[1], m[2], m[3]].map((x) => Math.round(+x).toString(16).padStart(2, '0')).join(''));
      if (m[4] == null) return hx;
      const c = [1, 3, 5].map((i) => parseInt(hx.slice(i, i + 2), 16));
      return 'rgba(' + c.join(',') + ',' + m[4] + ')';
    }
    /* 색이 들어가는 자리(fill·stroke·stop-color·flood-color)만 바꾼다 — none/url(#…)은 건드리지 않음 */
    const VAL = '#[0-9a-fA-F]{3,8}|white|black|rgba?\\([^)"]*\\)';
    const COLOR_ATTR = new RegExp('(fill|stroke|stop-color|flood-color)="(' + VAL + ')"', 'g');
    const COLOR_STYLE = new RegExp('(fill|stroke|stop-color|flood-color)\\s*:\\s*(' + VAL + ')', 'g');
    function darkenSvg(txt) {
      return txt
        .replace(COLOR_ATTR, (m, k, v) => k + '="' + darkCss(v) + '"')
        .replace(COLOR_STYLE, (m, k, v) => k + ':' + darkCss(v));
    }
    /* 원본 경로 → 다크 버전 data: URI (한 번만 만들어 캐시) */
    const darkSrcCache = new Map();
    function darkSrc(src) {
      if (!darkSrcCache.has(src)) {
        darkSrcCache.set(
          src,
          fetch(src)
            .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
            .then((t) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(darkenSvg(t)))
            .catch(() => null)
        );
      }
      return darkSrcCache.get(src);
    }
    /* 현재 화면 테마에 맞춰 라이트 에셋 썸네일의 이미지를 갈아 끼운다 */
    function themeThumbs() {
      /* 차트 에셋(.cht)은 화면 테마와 무관하게 늘 다크 — .libitem.cht 의 다크 고정 규칙과 짝 */
      const wantsDark = (img) => grid.dataset.theme !== 'light' || !!img.closest('.libitem.cht');
      grid.querySelectorAll('.thumb.figimg-light img').forEach((img) => {
        const orig = img.dataset.osrc || img.getAttribute('src');
        img.dataset.osrc = orig;
        if (!wantsDark(img)) {
          if (img.getAttribute('src') !== orig) img.src = orig;
          return;
        }
        darkSrc(orig).then((d) => {
          if (!d) { grid.dataset.imgfallback = '1'; return; } /* fetch 가 막힌 환경 — CSS 필터로 대체 */
          if (img.dataset.osrc === orig && wantsDark(img)) img.src = d;
        });
      });
    }
    window.__wembThemeThumbs = themeThumbs;

    /* ── 화면(대시보드)에 '실제로 구현된' 차트를 그대로 캡처해 라이브러리 자산으로 쓴다.
       각 차트 종류의 첫 인스턴스를 찾아 렌더된 마크업을 복제하고, id·툴바 등만 정리한다.
       (%·인라인 스타일 기반이라 복제해도 실제 CSS로 동일하게 렌더된다) */
    function captureScreenCharts() {
      const SRC = [
        { id: 'stbar', name: '누적 막대 차트', sel: '.stbar' },
        { id: 'hbar', name: '가로 막대 차트', sel: '.hbtrack' },
        { id: 'bullet', name: '불릿 차트', sel: '.bltrack' },
        { id: 'gantt', name: '간트 차트', sel: '.gttrack' },
        { id: 'line', name: '라인 차트', sel: '.cx-line' },
        { id: 'donut', name: '도넛 차트', sel: '.donut-wrap' },
        { id: 'heat', name: '히트맵', sel: '.heat' },
        { id: 'spark', name: '스파크라인', sel: '.spark' },
      ];
      const out = {};
      SRC.forEach((s) => {
        const el = document.querySelector('.cols .panel ' + s.sel);
        if (!el) return;
        const host = s.id === 'spark' ? el : el.closest('.pbody') || el.closest('.addedbody') || el;
        const clone = host.cloneNode(true);
        clone.querySelectorAll('.charttype, .tabs, .hint, .pdel, .ct-btn').forEach((n) => n.remove());
        clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        clone.removeAttribute('id');
        out[s.id] = { name: s.name, html: s.id === 'spark' ? clone.outerHTML : clone.innerHTML };
      });
      return out;
    }

    /* 라이브러리 '차트' 목록 = 기본 옵션(KPI·표·게이지) + 화면에 구현된 실제 차트들 */
    function buildChartItems() {
      const cap = captureScreenCharts();
      const items = [];
      const add = (id, name, html) => items.push({ cat: 'chart', id, name, html });
      add('kpi', 'KPI 지표');
      if (cap.stbar) add('stbar', cap.stbar.name, cap.stbar.html);
      add('table', '표');
      add('gauge', '게이지');
      ['line', 'hbar', 'bullet', 'gantt', 'donut', 'heat', 'spark'].forEach((k) => {
        if (cap[k]) add(k, cap[k].name, cap[k].html);
      });
      /* SK하이닉스 Figma 차트(Chart-line·Chart Canvas) — 인라인 SVG로 편입 */
      (SKX.charts || []).forEach((a) => add(a.id, skxDispName(a.name), skxWithAnim(a.id, a.html)));
      /* 이천 FMS 두 화면의 차트 그래픽 — Figma 원본 파일 그대로 */
      (ICH.charts || []).forEach((a) => items.push({ cat: 'chart', id: a.id, name: a.name, fig: a.fig, src: a.src, light: a.light }));
      /* 한진 통합관제 3화면의 차트 — 화면 DOM 그대로 */
      hjItems(HJ.charts, 'chart').forEach((a) => items.push(a));
      /* HANA H.I.T 14화면의 차트 — 같은 방식 */
      hjItems(HN.charts, 'chart').forEach((a) => items.push(a));
      return items;
    }

    /* 팔레트 썸네일 마크업 */
    function thumbHtml(it, idx, catKey) {
      catKey = catKey || it.cat; /* 검색 렌더 시 '__search' 로 넘겨 클릭/드래그 조회를 맞춘다 */
      let inner = '';
      let cls = '';
      if (it.dom) {
        /* 한진 화면 컴포넌트 — 살아 있는 DOM 을 그대로(배율만 hjFit 이 잡는다) */
        cls = it.cat === 'icon' ? 'ico' : it.cat === 'symbol' ? 'sym' : 'pnl';
        inner = `<div class="thumb domhost">${hjDom(it)}</div>`;
      } else if (it.html && (it.cat === 'symbol' || it.cat === 'icon' || it.cat === 'panel')) {
        /* Figma에서 변환된 인라인 SVG(코드) 에셋 — 심볼/아이콘/패널 탭 */
        cls = it.cat === 'icon' ? 'ico' : it.cat === 'panel' ? 'pnl' : 'sym';
        inner = `<div class="thumb fighost fighost-${it.cat}">${it.html}</div>`;
      } else if (it.cat === 'symbol') {
        cls = 'sym';
        /* 배경을 걷어낸 라이트 시안 컴포넌트(콜아웃 등)는 밝은 판 위에 — 심볼 기본 썸네일은 어둡다 */
        inner = it.light
          ? `<div class="thumb figimg figimg-symbol figimg-light"><img src="${it.src}" draggable="false" alt=""></div>`
          : `<div class="thumb"><img src="${it.src}" draggable="false" alt=""></div>`;
      } else if (it.src) {
        /* 이천 FMS 화면의 원본 에셋 — Figma 가 내보낸 파일을 그대로 그린다(차트·아이콘·패널 공통) */
        cls = it.cat === 'icon' ? 'ico' : it.cat === 'panel' ? 'pnl' : 'cht';
        inner = `<div class="thumb figimg figimg-${it.cat}${it.light ? ' figimg-light' : ''}"><img src="${it.src}" draggable="false" alt=""></div>`;
      } else if (it.cat === 'icon') {
        cls = 'ico';
        inner = `<div class="thumb">${iconSvg(ICONS[it.id] || '')}</div>`;
      } else {
        cls = 'cht';
        inner = it.html ? `<div class="thumb chost">${it.html}</div>` : `<div class="thumb">${chartArt(it.id)}</div>`;
      }
      return `<div class="libitem ${cls}" draggable="true" data-cat="${catKey}" data-idx="${idx}" title="${esc(it.name)}">${inner}<div class="lname">${esc(lname(it.name))}</div></div>`;
    }

    /* 화면에 삽입될 패널 본문 */
    function panelHtml(it) {
      if (it.dom) {
        return `<div class="ph"><h3>${esc(it.name)}</h3></div><div class="addedbody symbody"><div class="hj-embed">${hjDom(it, state.mode === 'light' ? 'light' : 'dark')}</div></div>`;
      }
      if (it.html && (it.cat === 'symbol' || it.cat === 'icon' || it.cat === 'panel')) {
        return `<div class="ph"><h3>${esc(it.name)}</h3></div><div class="addedbody symbody"><div class="symwrap fighost fighost-${it.cat} fig-embed">${it.html}</div></div>`;
      }
      if (it.cat === 'symbol') {
        return `<div class="ph"><h3>${esc(it.name)}</h3></div><div class="addedbody symbody"><div class="symwrap"><img src="${it.src}" alt="${esc(it.name)}" draggable="false"></div></div>`;
      }
      if (it.src) {
        return `<div class="ph"><h3>${esc(it.name)}</h3></div><div class="addedbody symbody"><div class="symwrap figimg-embed"><img src="${it.src}" alt="${esc(it.name)}" draggable="false"></div></div>`;
      }
      if (it.cat === 'icon') {
        return `<div class="ph"><h3>${esc(it.name)}</h3></div><div class="addedbody iconbody"><div class="iconwrap">${iconSvg(ICONS[it.id] || '')}</div></div>`;
      }
      if (typeof build === 'object' && build[it.id]) return build[it.id]();
      return `<div class="ph"><h3>새 ${esc(it.name)}</h3></div><div class="addedbody"><div class="cbox">${chartArt(it.id)}</div></div>`;
    }

    /* 에셋의 시각 요소만 (기존 패널 '안'에 덧붙일 때 사용) */
    function assetVisual(it) {
      if (it.dom) return `<div class="hj-embed">${hjDom(it, state.mode === 'light' ? 'light' : 'dark')}</div>`;
      if (it.html && (it.cat === 'symbol' || it.cat === 'icon' || it.cat === 'panel')) return `<div class="fighost fighost-${it.cat} fig-embed">${it.html}</div>`;
      if (it.cat === 'symbol') return `<div class="symwrap"><img src="${it.src}" alt="${esc(it.name)}" draggable="false"></div>`;
      if (it.src) return `<div class="figimg-embed"><img src="${it.src}" alt="${esc(it.name)}" draggable="false"></div>`;
      if (it.cat === 'icon') return `<div class="iconwrap">${iconSvg(ICONS[it.id] || '')}</div>`;
      if (it.html) return `<div class="chost fig-embed">${it.html}</div>`;
      return `<div class="cbox">${chartArt(it.id)}</div>`;
    }

    /* 에셋의 '원본 시각 요소'만 (래퍼 없이 SVG/IMG 코드) — 외부에서 크기를 직접 잡을 때 사용 */
    function rawVisual(it) {
      if (it.dom) return hjDom(it, state.mode === 'light' ? 'light' : 'dark');
      if (it.html && (it.cat === 'symbol' || it.cat === 'icon' || it.cat === 'panel')) return it.html;
      if (it.src) return `<img src="${it.src}" alt="" draggable="false">`;
      if (it.cat === 'icon') return iconSvg(ICONS[it.id] || '');
      if (it.html) return it.html;
      return chartArt(it.id);
    }
    /* ── 라이브러리 에셋 조회 API — 단어로 등록된 에셋/아이콘을 찾아 그 원본 시각을 돌려준다 ──
       콘텐츠 자동 생성(패널 컨텍스트 창)이 '똑같은 단어의 에셋'을 재사용하도록 노출. */
    window.__wembFindAsset = function (query, prefCats) {
      const q = String(query == null ? '' : query).trim();
      if (!q) return null;
      const nq = q.toLowerCase().replace(/\s+/g, '');
      if (!nq) return null;
      const cats = prefCats && prefCats.length ? prefCats : ['symbol', 'icon'];
      const pool = [];
      cats.forEach((cat) => {
        let arr = [];
        if (cat === 'chart') { try { arr = buildChartItems(); } catch (e) { arr = []; } }
        else arr = CATS[cat] || [];
        arr.forEach((it) => { if (it && it.name) pool.push(it); });
      });
      const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
      let best = null, bestScore = 0;
      pool.forEach((it) => {
        const nm = norm(it.name);
        if (!nm) return;
        /* '심볼 01' 같은 번호만 있는 일반명은 단어 매칭에서 제외 */
        if (/^심볼\d*$/.test(nm) || /^아이콘\d*$/.test(nm)) return;
        let score = 0;
        if (nm === nq) score = 100;
        else if (nm.startsWith(nq) || nq.startsWith(nm)) score = 82;
        else if (nm.includes(nq) || nq.includes(nm)) score = 64;
        if (score > bestScore) { bestScore = score; best = it; }
      });
      if (!best || bestScore < 60) return null;
      return { name: best.name, cat: best.cat, svg: rawVisual(best) };
    };

    /* 활성 화면에 새 호스트 패널을 하나 만들어 반환 (패널이 전혀 없을 때만) */
    function createHostPanel(cols) {
      const panel = document.createElement('div');
      panel.className = 'panel';
      panel.innerHTML = `<div class="ph"><h3>새 패널</h3></div><div class="addedbody emptybody"></div>`;
      if (cols.classList.contains('gridmode')) {
        if (!cols.style.gridAutoRows) cols.style.gridAutoRows = 'minmax(140px, auto)';
        cols.appendChild(panel);
      } else {
        let col = cols.querySelector(':scope > .col');
        if (!col) {
          col = document.createElement('div');
          col.className = 'col';
          cols.appendChild(col);
        }
        col.appendChild(panel);
      }
      return panel;
    }

    /* '패널' 카테고리 에셋 처리.
       - 기본 카드 배경/헤더 없이 '에셋 원본'만 보이도록(.assetpanel + assetVisual).
       - 붕괴 방지: 에셋 패널은 전체 폭으로 펼쳐(CSS grid-column) 원래 비율로 제대로 보이게 한다.
       - 드롭 대상 패널이 있으면 그 패널의 디자인을 드래그한 패널로 '교체'한다.
       - 대상이 없으면 활성 화면에 새 .panel 로 추가한다. */
    function addPanelItem(it, targetPanel) {
      const cols = activeCols();
      if (!cols) {
        if (typeof toast === 'function') toast('이 화면에서는 패널 추가를 지원하지 않아요.', { type: 'err' });
        return;
      }
      const tp = targetPanel && cols.contains(targetPanel) ? targetPanel : null;
      /* 카드 에셋 = 콘텐츠를 담는 컨테이너.
         프레임(SVG)을 배경으로 깔고(.cardframe, 절대배치), 그 위 .cardbody 에 다른 에셋(차트·심볼·아이콘)을 드롭해 넣는다. */
      /* 프레임은 인라인 SVG(it.html) 또는 원본 파일(it.src) 둘 다 올 수 있다 */
      const frame = it.html || (it.src ? '<img src="' + it.src + '" alt="" draggable="false">' : '');
      const body =
        '<div class="fighost fighost-panel fig-embed cardframe' + (it.src && !it.html ? ' figimg-frame' : '') + '">' + frame + '</div>' +
        '<div class="addedbody cardbody emptybody"><span class="emptyhint">에셋을 끌어 넣어 채우세요</span></div>';
      /* 카드 프레임 SVG는 패널 박스(가로·세로)에 꽉 차게(종횡비 고정 해제) → 리사이즈하면 프레임도 함께 커진다.
         기본 크기는 카드 비율(viewBox)로 잡아 준다(리사이즈하면 그 크기가 기준이 된다). */
      const setFrame = (el) => {
        const svg = el.querySelector('.cardframe svg');
        if (svg) {
          svg.setAttribute('preserveAspectRatio', 'none');
          const vb = svg.viewBox && svg.viewBox.baseVal;
          if (vb && vb.width && vb.height) el.style.aspectRatio = vb.width + ' / ' + vb.height;
          return;
        }
        /* 원본 파일로 온 프레임 — 그림이 로드된 뒤 원본 비율을 패널 기본 비율로 잡는다 */
        const img = el.querySelector('.cardframe img');
        if (!img) return;
        const set = () => { if (img.naturalWidth && img.naturalHeight) el.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight; };
        if (img.complete) set(); else img.addEventListener('load', set, { once: true });
      };
      /* 드롭 대상 패널이 있으면 → 그 패널의 디자인을 드래그한 카드로 교체 */
      if (tp) {
        tp.classList.add('assetpanel', 'cardhost');
        tp.innerHTML = body;
        setFrame(tp);
        ensureDelBtns(); /* 삭제 버튼(.pdel) 다시 부여 */
        tp.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return tp;
      }
      /* 대상이 없으면 새 카드 컨테이너 패널을 만든다 */
      const panel = document.createElement('div');
      panel.className = 'panel assetpanel cardhost';
      panel.innerHTML = body;
      setFrame(panel);
      if (cols.classList.contains('gridmode')) {
        if (!cols.style.gridAutoRows) cols.style.gridAutoRows = 'minmax(140px, auto)';
        cols.appendChild(panel);
      } else {
        let colEls = [...cols.querySelectorAll(':scope > .col')];
        if (!colEls.length) {
          const c = document.createElement('div');
          c.className = 'col';
          cols.appendChild(c);
          colEls = [c];
        }
        const target = colEls.reduce((a, b) => (b.querySelectorAll(':scope > .panel').length < a.querySelectorAll(':scope > .panel').length ? b : a));
        target.appendChild(panel);
      }
      ensureDelBtns();
      if (typeof sizingOn !== 'undefined' && sizingOn && typeof ensureSzHandles === 'function') ensureSzHandles();
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return panel;
    }

    /* 에셋을 '패널 안'에 삽입한다 (에셋 자체가 새 패널로 쌓이지 않는다).
       - 드래그로 특정 패널 위에 놓으면 그 패널 안에,
       - 클릭/빈 곳에 놓으면 활성 화면의 마지막 패널 안에,
       - 패널이 하나도 없을 때만 새 패널을 만들어 그 안에 넣는다.
       단, '패널' 카테고리는 새 .panel 로 추가한다(addPanelItem). */
    /* 패널 하나에 넣을 에셋 수 상한 — 넘으면 다음 패널로 넘겨 아래로만 길어지는 걸 막는다 */
    const MAX_SLOTS = 3;
    function place(it, targetPanel) {
      /* '패널' 카테고리 중에서도 카드 컨테이너(빈 프레임)만 새 .panel 로 세운다.
         한진 위젯처럼 그 자체가 완성된 판인 DOM 에셋은 다른 에셋과 같이 패널 '안'에 넣는다 —
         빈 카드 프레임으로 세우면 그릴 프레임이 없어 빈 판만 생긴다. */
      if (it && it.cat === 'panel' && !it.dom) return addPanelItem(it, targetPanel);
      const cols = activeCols();
      if (!cols) {
        if (typeof toast === 'function') toast('이 화면에서는 에셋 삽입을 지원하지 않아요.', { type: 'err' });
        return;
      }
      let panel = targetPanel && cols.contains(targetPanel) ? targetPanel : null;
      if (!panel) {
        const panels = [...cols.querySelectorAll('.panel')];
        panel = panels[panels.length - 1] || null;
        /* 마지막 패널이 이미 찼으면 새 패널로 넘긴다 — 한 패널이 아래로만 길어지지 않고
           그리드의 다음 칸(옆자리)에 놓인다. 드롭 대상을 직접 지정한 경우는 그대로 넣는다. */
        if (panel && panel.querySelectorAll('.assetslot').length >= MAX_SLOTS) panel = null;
      }
      if (!panel) panel = createHostPanel(cols);

      const slot = document.createElement('div');
      slot.className = 'assetslot';
      /* .avis = 스케일 대상, .aszr = 크기 슬라이더(에셋 아래 흐름 배치, 겹치지 않게 marginBottom로 여백 예약) */
      slot.innerHTML = `<div class="avis">${assetVisual(it)}</div><input type="range" class="aszr" min="40" max="300" value="100" title="크기 조절" aria-label="에셋 크기">`;

      /* 패널 안 에셋 컨테이너(.assetwrap > .assetrow) 확보 — 없으면 만든다.
         .assetwrap엔 가로/세로 배치 토글(.assettools)이 붙는다. */
      let wrap = panel.querySelector('.assetwrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'assetwrap';
        wrap.dataset.dir = 'col';
        wrap.innerHTML =
          '<div class="assettools" aria-label="에셋 배치">' +
          '<button type="button" data-dir="col" class="on" title="세로로 배치">세로</button>' +
          '<button type="button" data-dir="row" title="가로로 배치">가로</button>' +
          '</div><div class="assetrow"></div>';
        /* 슬라이더·토글 조작이 패널 이동 드래그로 번지지 않게 (트윈 pointerdown 등) */
        wrap.addEventListener('pointerdown', (e) => {
          if (e.target.closest('.aszr') || e.target.closest('.assettools')) {
            e.stopPropagation();
            window.__aszResizing = true;
          }
        });
        const emptyBody = panel.querySelector('.emptybody');
        if (emptyBody) {
          emptyBody.querySelector('.emptyhint')?.remove();
          emptyBody.classList.remove('emptybody');
          emptyBody.appendChild(wrap);
        } else {
          panel.appendChild(wrap);
        }
      }
      wrap.querySelector('.assetrow').appendChild(slot);
      /* 원본 그대로면 화면에 비해 너무 크다 — 넣는 순간 기준 높이에 맞춰 줄여 둔다.
         (그림이 늦게 로드되면 높이를 다시 재야 하므로 load 뒤에도 한 번 더 맞춘다) */
      const fitOnce = () => {
        hjEmbedFit(slot);                       /* 한진 DOM 에셋은 폭부터(zoom) — 슬롯이 넓어지지 않게 */
        if (window.__wembFitAsset) window.__wembFitAsset(slot);
      };
      requestAnimationFrame(fitOnce);
      slot.querySelectorAll('img').forEach((im) => { if (!im.complete) im.addEventListener('load', fitOnce, { once: true }); });
      ensureDelBtns();
      slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* 렌더 */
    let curCat = 'chart';
    function render(cat) {
      curCat = cat;
      if (cat === 'chart') CATS.chart = buildChartItems();
      grid.innerHTML = CATS[cat].map((it, i) => thumbHtml(it, i)).join('');
      themeThumbs();
      hjFit(grid);
    }

    /* ── 검색 — 라이브러리 맨 위 검색창. 입력하면 전체 카테고리에서 이름으로 필터 ── */
    const searchWrap = document.getElementById('libSearchWrap');
    const searchInput = document.getElementById('libSearch');
    const searchClear = document.getElementById('libSearchClear');

    /* 모든 카테고리의 항목을 하나로 모은다(차트는 화면 캡처라 매번 새로 구성) */
    function allItems() {
      CATS.chart = buildChartItems();
      return [].concat(CATS.chart, CATS.symbol, CATS.icon, CATS.panel, CATS.event);
    }
    function renderSearch(q) {
      const items = allItems().filter((it) => String(it.name).toLowerCase().includes(q));
      CATS.__search = items;
      grid.innerHTML = items.length
        ? items.map((it, i) => thumbHtml(it, i, '__search')).join('')
        : `<div class="libempty">'${esc(searchInput.value.trim())}'에 해당하는 에셋이 없어요.</div>`;
      themeThumbs();
      hjFit(grid);
    }
    /* 검색어가 있으면 검색 결과, 없으면 현재 탭을 렌더 */
    function applyView() {
      const q = (searchInput.value || '').trim().toLowerCase();
      searchWrap.classList.toggle('has-q', !!q);
      if (q) renderSearch(q);
      else render(curCat);
    }
    if (searchInput) searchInput.addEventListener('input', applyView);
    if (searchClear)
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyView();
        searchInput.focus();
      });

    /* 탭 전환 — 탭을 누르면 검색을 초기화하고 해당 카테고리를 보여준다 */
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-lib]');
      if (!b) return;
      tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      if (searchInput) searchInput.value = '';
      if (searchWrap) searchWrap.classList.remove('has-q');
      render(b.dataset.lib);
    });

    /* ── 패널 편집 중 '에셋 교체' ──
       패널 편집(크기/배치/내용 중 하나라도)이 켜진 상태에서 패널 안 에셋(.swap-asset 또는 .assetslot)을
       클릭해 선택하고, 라이브러리 항목을 클릭/드롭하면 '그 자리만' 교체한다. */
    function editActive() {
      return !!document.querySelector('.cols.editing, .cols.sizing, .stage.content-editing, .dtstage.dt-editing, .dtstage.dt-content-editing');
    }
    /* 삭제 단위 — 심볼 글리프는 라벨까지 포함한 타일/칩째로, 그 외(차트·에셋 슬롯)는 자기 자신 */
    function deleteUnitOf(sw) {
      if (!sw) return null;
      if (sw.classList.contains('assetslot')) return sw;
      if (sw.dataset.swap === 'symbol' && sw.parentElement) return sw.parentElement;
      return sw;
    }
    function clearSwapSel() {
      document.querySelectorAll('.swap-sel').forEach((el) => el.classList.remove('swap-sel'));
      document.querySelectorAll('.swap-del').forEach((b) => b.remove());
      document.querySelectorAll('.has-swapdel').forEach((el) => el.classList.remove('has-swapdel'));
      window.__swapTarget = null;
    }
    function deleteSwap(sw) {
      const unit = deleteUnitOf(sw);
      clearSwapSel();
      if (unit && unit.parentElement) unit.remove();
      if (typeof toast === 'function') toast('에셋을 삭제했어요.', { type: 'ok' });
    }
    window.__wembDeleteSwap = deleteSwap;
    function swapInto(el, it) {
      if (!el || !it) return;
      const vis = rawVisual(it);
      const host = el.classList.contains('assetslot') ? (el.querySelector('.avis') || el) : el;
      if (host.classList.contains('apc-lib')) host.innerHTML = vis;
      else host.innerHTML = '<span class="apc-lib" style="width:100%;height:100%;display:inline-flex">' + vis + '</span>';
      hjEmbedFit(el);
      el.classList.add('swap-just');
      setTimeout(() => el.classList.remove('swap-just'), 600);
    }
    window.__wembSwapInto = swapInto;
    /* 에셋 클릭 = 교체 대상 선택 + 삭제(×) 버튼 노출 (편집 중에만) — 캡처 단계에서 먼저 처리 */
    document.addEventListener('click', (e) => {
      if (!editActive()) { if (window.__swapTarget) clearSwapSel(); return; }
      /* 삭제 버튼(×) 먼저 처리 */
      const delBtn = e.target.closest('.swap-del');
      if (delBtn) { e.preventDefault(); e.stopPropagation(); deleteSwap(window.__swapTarget); return; }
      if (e.target.closest('.aszr, .assettools, .pdel, .psz, .szh, .libitem')) return; /* 컨트롤은 제외 */
      const sw = e.target.closest('.swap-asset, .assetslot');
      if (!sw || !sw.closest('.panel')) return;
      e.preventDefault();
      e.stopPropagation();
      if (window.__swapTarget === sw) { clearSwapSel(); return; }
      clearSwapSel();
      sw.classList.add('swap-sel');
      window.__swapTarget = sw;
      /* 선택한 에셋(삭제 단위)에 × 삭제 버튼을 붙인다 */
      const unit = deleteUnitOf(sw);
      if (unit) {
        unit.classList.add('has-swapdel');
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'swap-del';
        del.title = '에셋 삭제';
        del.setAttribute('aria-label', '에셋 삭제');
        del.textContent = '×';
        unit.appendChild(del);
      }
      if (typeof toast === 'function') toast('교체는 라이브러리에서 고르고, 삭제는 × 또는 Delete 키를 눌러요.', { type: 'info' });
    }, true);
    /* Delete/Backspace 로도 선택 에셋 삭제 (입력창 포커스 중엔 무시) */
    document.addEventListener('keydown', (e) => {
      if (!window.__swapTarget || !editActive()) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSwap(window.__swapTarget); }
    });

    /* 클릭 삽입 — 교체 대상이 선택돼 있으면 그 에셋을 교체, 아니면 선택 패널에 삽입 */
    grid.addEventListener('click', (e) => {
      const el = e.target.closest('.libitem');
      if (!el) return;
      const it = CATS[el.dataset.cat][+el.dataset.idx];
      if (!it) return;
      if (window.__swapTarget && document.contains(window.__swapTarget) && editActive()) {
        swapInto(window.__swapTarget, it);
        clearSwapSel();
        if (typeof toast === 'function') toast('에셋을 교체했어요.', { type: 'ok' });
        return;
      }
      const selp = (typeof state !== 'undefined' && state.screen === 'dt') ? window.__selDtPanel : window.__selPanel;
      place(it, selp || null);
    });

    /* 드래그 삽입 */
    grid.addEventListener('dragstart', (e) => {
      const el = e.target.closest('.libitem');
      if (!el) return;
      const it = CATS[el.dataset.cat][+el.dataset.idx];
      window.__libDrag = it || null;
      el.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy';
        try {
          e.dataTransfer.setData('text/plain', el.dataset.cat + ':' + el.dataset.idx);
        } catch (_) {}
      }
    });
    grid.addEventListener('dragend', (e) => {
      const el = e.target.closest('.libitem');
      if (el) el.classList.remove('dragging');
      window.__libDrag = null;
      main.classList.remove('libdrag');
    });
    main.addEventListener('dragover', (e) => {
      if (!window.__libDrag) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      main.classList.add('libdrag');
    });
    main.addEventListener('dragleave', (e) => {
      if (!main.contains(e.relatedTarget)) main.classList.remove('libdrag');
    });
    main.addEventListener('drop', (e) => {
      const it = window.__libDrag;
      if (!it) return;
      e.preventDefault();
      /* 특정 에셋(.swap-asset/.assetslot) 위에 떨어뜨리면 그 자리만 교체 */
      const swapEl = e.target && e.target.closest ? e.target.closest('.swap-asset, .assetslot') : null;
      if (swapEl && swapEl.closest('.panel')) {
        swapInto(swapEl, it);
        clearSwapSel();
        window.__libDrag = null;
        main.classList.remove('libdrag');
        if (typeof toast === 'function') toast('에셋을 교체했어요.', { type: 'ok' });
        return;
      }
      const targetPanel = e.target && e.target.closest ? e.target.closest('.panel') : null;
      place(it, targetPanel);
      window.__libDrag = null;
      main.classList.remove('libdrag');
    });

    render('chart');
  })();

  /* ── 삽입된 에셋(차트·심볼·아이콘) 크기 조절 + 가로/세로 배치 ──
     크기 슬라이더(.aszr)는 에셋을 넣으면 바로 노출되어 언제든 크기를 조절할 수 있고,
     '배치 수정하기'(대시보드 .cols.editing / 트윈 .dtstage.dt-editing) 중에는 감춰진다.
     가로/세로 배치 토글(.assettools)은 배치 수정 중에만 노출된다. */
  (function initAssetControls() {
    /* 화면에 얹는 에셋의 기본 높이 — 원본 그대로면 시안에 비해 너무 커서 이 값에 맞춰 줄여 넣는다 */
    const FIT_H = 104;
    /* 슬라이더 값(%) → .avis 스케일 + '실제 차지 높이' 반영. 패널이 에셋 크기를 따라 줄고 늘게 한다 */
    function applyAsz(slot) {
      const sl = slot && slot.querySelector('.aszr');
      const vis = slot && slot.querySelector('.avis');
      if (!sl || !vis) return 0;
      /* 스케일 전 원본 높이(레이아웃 높이는 transform 영향을 안 받음) */
      vis.style.transform = '';
      vis.style.marginBottom = '';
      const natH = vis.offsetHeight || 120;
      const s = (parseFloat(sl.value) || 100) / 100;
      slot.dataset.as = s.toFixed(3);
      vis.style.transformOrigin = 'top center';
      vis.style.transform = 'scale(' + s + ')';
      /* transform 은 레이아웃 박스를 그대로 두므로, marginBottom 으로 '실제 차지 높이'를 natH*s 로 맞춘다.
         → 음수(축소)면 아래 공간이 줄어 패널이 같이 작아지고, 양수(확대)면 자리를 예약한다. */
      vis.style.marginBottom = (natH * (s - 1)) + 'px';
      /* 패널은 콘텐츠(에셋 + 사방 패딩)에 맞춰 자동 높이가 되게 인라인 높이를 비운다.
         → 에셋을 줄이면 패널도 같이 줄고, 14px 사방 패딩은 .assetwrap 이 그대로 유지한다. */
      const panel = slot.closest('.panel');
      if (panel) { panel.style.height = ''; panel.style.flex = ''; }
      return natH;
    }
    /* 삽입 직후 1회 — 원본 높이를 재서 FIT_H 이하가 되게 슬라이더 값을 정한다(키우지는 않는다) */
    window.__wembFitAsset = function (slot) {
      const sl = slot && slot.querySelector('.aszr');
      const vis = slot && slot.querySelector('.avis');
      if (!sl || !vis) return;
      vis.style.transform = '';
      vis.style.marginBottom = '';
      const natH = vis.offsetHeight;
      if (!natH) return;
      sl.value = String(Math.max(+sl.min || 40, Math.min(100, Math.round((FIT_H / natH) * 100))));
      applyAsz(slot);
    };
    document.addEventListener('input', (e) => {
      const sl = e.target.closest && e.target.closest('.aszr');
      if (!sl) return;
      applyAsz(sl.closest('.assetslot'));
    });
    /* 가로/세로 배치 토글 — 트윈 편집모드의 클릭 차단(capture)보다 먼저 처리하려 capture로 듣는다 */
    document.addEventListener(
      'click',
      (e) => {
        const b = e.target.closest && e.target.closest('.assettools button[data-dir]');
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        const wrap = b.closest('.assetwrap');
        if (!wrap) return;
        wrap.dataset.dir = b.dataset.dir;
        wrap.querySelectorAll('.assettools button').forEach((x) => x.classList.toggle('on', x === b));
      },
      true
    );
    /* 조작 후 플래그 해제 + 슬라이더/토글에서 시작된 패널 HTML 드래그(대시보드 draggable) 취소 */
    const clear = () => { if (window.__aszResizing) setTimeout(() => (window.__aszResizing = false), 0); };
    document.addEventListener('pointerup', clear);
    document.addEventListener('pointercancel', clear);
    document.addEventListener('dragstart', (e) => {
      if (window.__aszResizing || (e.target.closest && e.target.closest('.aszr, .assettools'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  })();
}
