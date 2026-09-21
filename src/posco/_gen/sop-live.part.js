
  /* ══════════════════ SOP 대응 절차 — STEP 1~3 자동 진행 ══════════════════
     Figma 에는 같은 SOP 화면이 세 장 있다 — 상황인지(1:9688) · 상황전파(1:9770) · 상황실 추적(1:9852).
     세 장은 **Step List 안의 카드 상태만** 다르다(나머지 헤더·이벤트 현황·배경은 같은 조각).
     그래서 화면을 통째로 갈아 끼우지 않고(시계·피드가 매번 처음으로 돌아간다) STEP 1 화면을 그대로 두고
     STEP 2·3 화면의 Step List 를 **원본 그대로** 떠 와 같은 자리에 겹쳐 얹는다 — 겹친 층도 conv.js 가 만든
     그 화면의 DOM·CSS 이므로 형상은 Figma 세 장과 같다.
       · 한 단계에 10초 머문 뒤 다음 단계로(3 다음은 1)
       · 컨트롤 바(새로 만든 것 — 원본에는 없다)로 멈춤/재생, 단계 바로 가기
       · 카드를 눌러도 그 단계로 간다
       · 글자를 고치면(패널편집) 세 층의 같은 자리 글자가 함께 바뀐다
       · 패널편집 중에는 넘기지 않는다 */
  var SOP_HOLD = 10000;                        /* 한 단계에 머무는 시간(ms) */
  var SOP_PLAY_KEY = 'wemb-posco-sop-play';    /* 멈춤 상태는 새로고침해도 남는다 */

  function sopBase() {
    /* 낱장 미리보기(src/posco/*.html)는 <base href="../../"> 로 스튜디오와 같은 경로를 쓴다 */
    return 'src/posco/';
  }
  function sopEnsureStyle(px) {
    var G = px.toUpperCase();
    [[px + '-style', window[G + '_CSS']], [px + '-light-style', window[G + '_LIGHT_CSS']]].forEach(function (p) {
      if (!p[1] || document.getElementById(p[0])) return;
      var el = document.createElement('style');
      el.id = p[0];
      el.textContent = p[1];
      document.head.appendChild(el);
    });
  }
  /* 숨은 층(STEP 2·3 · 체계도 보기)의 그림은 **첫 화면이 뜬 뒤에** 받는다.
     스튜디오의 '여는 막'은 페이지의 그림이 다 받아질 때(load) 걷히는데, 처음엔 안 보이는 층의 그림까지 기다리느라
     SOP 화면만 약 0.5초 늦게 열렸다(Ack 0.96초 · SOP 1.47초 실측). src 를 잠시 data-pk-src 로 비켜 두었다가 load 뒤에 되돌린다. */
  function sopHtml(html) {
    return document.readyState === 'complete' ? html : html.split(' src="').join(' data-pk-src="');
  }
  function sopRestoreSrc(scope) {
    var run = function () {
      all(scope, 'img[data-pk-src]').forEach(function (im) { im.setAttribute('src', im.getAttribute('data-pk-src')); im.removeAttribute('data-pk-src'); });
      /* 색 정하기가 그림에 거는 색상 회전도 다시 입힌다(비켜 둔 동안엔 src 가 없어 못 걸었다) */
      try { if (window.__refreshTpl) window.__refreshTpl(); } catch (e) {}
    };
    if (document.readyState === 'complete') setTimeout(run, 0);
    else window.addEventListener('load', function () { setTimeout(run, 0); }, { once: true });
  }
  /* ══════════════════ 상황인지 전파 체계도 — 번호 순서대로 흐르는 연출 ══════════════════
     체계도 화면(1:9443)의 번호 1~5 가 곧 순서다. 단계마다
       · 다이어그램: 그 번호의 연결(Connector/N · 2 는 Connector/Link 도)이 켜지고 오가는 노드가 빛난다.
         아직 안 온 연결은 흐리게, 지나간 연결은 반쯤 켜 둔다.
       · 처리 단계(Process Step/N): 그 단계 원이 **원본의 active 모습**으로 바뀐다 — 색·그림을 새로 짓지 않고
         이미 active 로 그려져 있는 1번 원의 그림(바깥 링 · 안쪽 링 · 하이라이트)과 번호 배지 색을 옮겨 입힌다.
         들어오는 화살표도 원본 active 화살표 그림으로.
       · 2단계(보고·전파)에서는 연락처 표의 줄이 위에서부터 차례로 통보되는 것처럼 강조된다.
     마지막 단계 뒤 잠깐 머물렀다 처음부터 다시. 체계도 보기일 때만 돌고, 패널편집 중에는 원본 모습으로 멈춘다. */
  var DG_STEP = 1700, DG_HOLD = 1900;
  var DG_FLOW = [
    { links: ['Connector/1'], nodes: ['상황인지자', '상황실(경비본부)', '경비관리팀'] },
    { links: ['Connector/2', 'Connector/Link'], nodes: ['상황실(경비본부)', '안전관리부장', '관련부서 및 기관'] },
    { links: ['Connector/3'], nodes: ['경비관리팀', '관련부서 및 기관'] },
    { links: ['Connector/4'], nodes: ['상황실(경비본부)', '경비관리팀'] },
    { links: ['Connector/5'], nodes: ['경비관리팀', '상황실(경비본부)'] },
  ];
  function installSopDiagram(scope) {
    var canvas = one(scope, '[data-name="Canvas"]');
    var flow = one(scope, '[data-name="Process Flow"]');
    if (!canvas || !flow) return null;
    var links = all(canvas, '[data-name^="Connector/"]');
    var nodes = all(canvas, '[data-name="Flow Node"]');
    var nodeOf = function (label) { for (var i = 0; i < nodes.length; i++) if ((nodes[i].textContent || '').trim() === label) return nodes[i]; return null; };
    var steps = {};
    all(flow, '[data-name^="Process Step/"]').forEach(function (el) {
      var n = (el.getAttribute('data-name') || '').split('/')[1] || '';
      if (n.indexOf('-') < 0) steps[n] = el;
    });
    /* 원본 active 모습 — 1번 원과 1↔2 사이 화살표에서 읽는다 */
    var refNode = steps['1'] && one(steps['1'], '[data-name="Process Node"]');
    if (!refNode) return null;
    var refImgs = function (node) {
      var kids = Array.prototype.filter.call(node.children, function (c) { return c.nodeType === 1; });
      var ring = one(node, '[data-name="Inner Ring"]');
      var hl = one(node, '[data-name="Highlight"]');
      return {
        outer: kids[0] && kids[0].tagName === 'IMG' ? kids[0] : null,
        ring: ring, ringImg: ring && one(ring, 'img'),
        hlBox: hl ? kids.filter(function (c) { return c.contains(hl) && c !== hl; })[0] : null, hlImg: hl && one(hl, 'img'),
        num: one(node, '[data-name="Number"]'),
        label: all(node, '[data-name="Text"] p').filter(function (p) { return !p.closest('[data-name="Number"]'); }),
      };
    };
    var REF = refImgs(refNode);
    var arrows = {};                       /* 단계 k 로 들어오는 화살표 = DOM 에서 Process Step/k 바로 뒤 */
    var refArrow = null;
    Object.keys(steps).forEach(function (k) {
      var nx = steps[k].nextElementSibling;
      if (nx && !nx.getAttribute('data-name') && one(nx, 'img')) {
        arrows[k] = nx;
        if (k === '2') refArrow = one(nx, 'img');   /* 원본에서 1→2 화살표만 active 다 */
      }
    });
    /* 그림 주소는 켜는 순간에 읽는다 — 스튜디오에서는 숨은 층 그림을 load 뒤에 받으므로(sopRestoreSrc) 설치 때엔 비어 있다 */
    var activeArrow = function () { return refArrow ? (refArrow.getAttribute('src') || refArrow.getAttribute('data-pk-src')) : null; };
    var numBadges = all(canvas, '[data-name="Step Number"]');
    var activeNumBg = null;
    all(canvas, '[data-name="Connector/1"] [data-name="Step Number"]').some(function (b) { activeNumBg = getComputedStyle(b).backgroundColor; return true; });
    var rows = all(scope, '[data-name="Contact Table"] [data-name="Body"] > *');

    /* 되돌리기 위한 원래 값 */
    var saved = [];
    var remember = function (el, prop, attr) {
      if (!el) return;
      for (var i = 0; i < saved.length; i++) if (saved[i].el === el && saved[i].prop === prop) return;
      saved.push({ el: el, prop: prop, attr: attr, v: attr ? el.getAttribute(prop) : el.style[prop] });
    };
    var restoreAll = function () {
      saved.forEach(function (s) { if (s.attr) { if (s.v == null) s.el.removeAttribute(s.prop); else s.el.setAttribute(s.prop, s.v); } else s.el.style[s.prop] = s.v; });
      saved = [];
    };
    var activateStep = function (k) {
      var targets = [steps[k]];
      if (k === 2) targets = all(steps['2'], '[data-name="Process Node"]');
      targets.forEach(function (t) {
        /* 원을 찾는다 — 인스턴스는 이름이 Process Node 지만, 원본 글자를 그대로 쓴 3번은 마스터 뿌리째 들어와 이름이 없다 → 첫 그림이 링인 상자 */
        var node = t && (t.matches('[data-name="Process Node"]') ? t : one(t, '[data-name="Process Node"]'));
        if (!node && t) node = Array.prototype.filter.call(t.children, function (c) { return c.firstElementChild && c.firstElementChild.tagName === 'IMG' && one(c, '[data-name="Inner Ring"]'); })[0] || null;
        if (!node || node === refNode) return;
        var me = refImgs(node);
        var cs = function (el) { return getComputedStyle(el); };
        if (me.outer && REF.outer) { remember(me.outer, 'src', true); me.outer.setAttribute('src', REF.outer.getAttribute('src')); }
        if (me.ring && REF.ring) {
          var rc = cs(REF.ring);
          ['top', 'right', 'bottom', 'left'].forEach(function (p) { remember(me.ring, p); me.ring.style[p] = rc[p]; });
          if (me.ringImg && REF.ringImg) { remember(me.ringImg, 'src', true); me.ringImg.setAttribute('src', REF.ringImg.getAttribute('src')); }
        }
        if (me.hlBox && REF.hlBox) {
          var hc = cs(REF.hlBox);
          ['top', 'right', 'bottom', 'left'].forEach(function (p) { remember(me.hlBox, p); me.hlBox.style[p] = hc[p]; });
          if (me.hlImg && REF.hlImg) { remember(me.hlImg, 'src', true); me.hlImg.setAttribute('src', REF.hlImg.getAttribute('src')); }
        }
        if (me.num && REF.num) { remember(me.num, 'backgroundColor'); me.num.style.backgroundColor = cs(REF.num).backgroundColor; }
        me.label.forEach(function (p) { remember(p, 'fontWeight'); p.style.fontWeight = '600'; });
      });
      if (k === 2) {
        var b2 = one(steps['2'], '[data-name="Step Number"]') || one(steps['2'], ':scope > div:not([data-name])');
        if (b2 && REF.num) { remember(b2, 'backgroundColor'); b2.style.backgroundColor = getComputedStyle(REF.num).backgroundColor; }
      }
      var ar = arrows[String(k)];
      var arImg = ar && one(ar, 'img');
      if (arImg && activeArrow()) { remember(arImg, 'src', true); arImg.setAttribute('src', activeArrow()); }
    };

    var timers = [], running = false, cls = ['pk-dg-dim', 'pk-dg-done', 'pk-dg-on', 'pk-dg-node', 'pk-dg-cur', 'pk-dg-row', 'pk-dg-pop'];
    var clearCls = function () {
      all(scope, '.' + cls.join(',.')).forEach(function (el) { cls.forEach(function (c) { el.classList.remove(c); }); });
    };
    var manual = false;   /* show(k) — 한 단계를 고정해 보여 줄 때(검증용)는 다음 단계를 예약하지 않는다 */
    var later = function (ms, fn) { if (manual) return; timers.push(setTimeout(function () { if (!running) return; if (editing()) { stop(); return; } fn(); }, ms)); };
    var runStep = function (i) {
      var S = DG_FLOW[i];
      /* 연결 — 지금 것은 켜고, 지나간 것은 반쯤, 나머지는 흐리게 */
      links.forEach(function (l) {
        var name = l.getAttribute('data-name');
        var idx = -1;
        DG_FLOW.forEach(function (f, j) { if (f.links.indexOf(name) >= 0) idx = j; });
        l.classList.remove('pk-dg-on', 'pk-dg-done', 'pk-dg-dim');
        l.classList.add(idx === i ? 'pk-dg-on' : idx >= 0 && idx < i ? 'pk-dg-done' : 'pk-dg-dim');
      });
      all(canvas, '.pk-dg-pop').forEach(function (b) { b.classList.remove('pk-dg-pop'); });
      S.links.forEach(function (name) {
        all(canvas, '[data-name="' + name + '"] [data-name="Step Number"]').forEach(function (b) {
          remember(b, 'backgroundColor');
          if (activeNumBg) b.style.backgroundColor = activeNumBg;
          void b.offsetWidth; b.classList.add('pk-dg-pop');
        });
      });
      nodes.forEach(function (n) { n.classList.toggle('pk-dg-node', S.nodes.indexOf((n.textContent || '').trim()) >= 0); });
      /* 처리 단계 */
      activateStep(i + 1);
      Object.keys(steps).forEach(function (k) { steps[k].classList.toggle('pk-dg-cur', +k === i + 1); });
      if (i === 1) rows.forEach(function (r, j) { later(120 + j * 190, function () { r.classList.remove('pk-dg-row'); void r.offsetWidth; r.classList.add('pk-dg-row'); }); });
      if (i + 1 < DG_FLOW.length) later(DG_STEP, function () { runStep(i + 1); });
      else later(DG_STEP + DG_HOLD, function () { reset(); later(260, function () { runStep(0); }); });
    };
    var reset = function () { clearCls(); restoreAll(); };
    var start = function () {
      stop();
      running = true;
      /* 시작 — 전부 흐린 상태에서 1번부터 */
      links.forEach(function (l) { l.classList.add('pk-dg-dim'); });
      later(350, function () { runStep(0); });
    };
    var stop = function () {
      running = false;
      timers.forEach(clearTimeout); timers = [];
      reset();
    };
    var show = function (k) {
      stop(); running = true; manual = true;
      for (var j = 0; j < k; j++) runStep(j);
      manual = false;
    };
    return { start: start, stop: stop, show: show, running: function () { return running; } };
  }

  function sopStepsOf(list) {
    return Array.prototype.filter.call(list.children, function (c) {
      return c.nodeType === 1 && !c.classList.contains('pk-soplayer') && !c.classList.contains('pk-sopsweep');
    });
  }

  function installSop(root, st) {
    var dlg = one(root, '[data-name="Dialog/SOP"]');
    var host = dlg && one(dlg, '[data-name="Step List"]');
    if (!host || typeof window.build_pks2 !== 'function' || typeof window.build_pks3 !== 'function') return;

    /* ① STEP 2·3 층 — 그 화면의 Step List 를 잘라 같은 자리에 얹는다 */
    var theme = root.dataset.theme || 'dark';
    var layers = [{ k: 1, list: host, items: sopStepsOf(host) }];
    host.classList.add('pk-sophost');
    layers[0].items.forEach(function (el) { el.classList.add('pk-sopitem'); });
    [2, 3].forEach(function (k) {
      var px = 'pks' + k;
      sopEnsureStyle(px);
      var tmp = document.createElement('div');
      tmp.innerHTML = sopHtml(window['build_' + px](sopBase()));
      var list = one(tmp, '[data-name="Dialog/SOP"] [data-name="Step List"]');
      if (!list) return;
      var wrap = document.createElement('div');
      wrap.className = px + '-root pk-soplayer pk-sopoff';
      wrap.dataset.step = String(k);
      wrap.dataset.theme = theme;
      wrap.setAttribute('aria-hidden', 'true');
      wrap.appendChild(list);
      host.appendChild(wrap);
      layers.push({ k: k, list: list, items: sopStepsOf(list), wrap: wrap });
      sopRestoreSrc(wrap);
    });
    if (layers.length < 3) return;

    /* 단계 이름 — 각 층에서 '켜진' 카드의 제목(원본 글자를 그대로 읽는다. 고치면 따라온다) */
    var titleOf = function (k) {
      var L = layers[k - 1];
      var card = L.items[k - 1];
      var p = card && one(card, '[data-name="Title"] p');
      return p ? (p.textContent || '').trim() : 'STEP ' + k;
    };

    /* ② 컨트롤 바 — 대화상자 아래 줄의 빈자리(상황종료 단추 왼쪽) */
    var footer = one(dlg, '[data-name="Footer"]');
    var bar = document.createElement('div');
    bar.className = 'pk-sopbar';
    bar.setAttribute('data-name', 'SOP Player');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'SOP 단계 진행');
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'pk-sopbar-toggle';
    toggle.setAttribute('data-name', 'Player Toggle');
    bar.appendChild(toggle);
    var track = document.createElement('div');
    track.className = 'pk-sopbar-steps';
    track.setAttribute('data-name', 'Step Track');
    var segs = [];
    [1, 2, 3].forEach(function (k) {
      if (k > 1) { var sep = document.createElement('span'); sep.className = 'pk-sopbar-sep'; sep.setAttribute('aria-hidden', 'true'); track.appendChild(sep); }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pk-sopbar-step';
      b.dataset.step = String(k);
      b.setAttribute('data-name', 'Step Chip/' + k);
      b.innerHTML = '<span class="pk-sopbar-no">' + k + '</span><span class="pk-sopbar-lbl"></span><span class="pk-sopbar-fill"></span>';
      track.appendChild(b);
      segs.push({ btn: b, lbl: one(b, '.pk-sopbar-lbl'), fill: one(b, '.pk-sopbar-fill') });
    });
    bar.appendChild(track);
    var state = document.createElement('div');
    state.className = 'pk-sopbar-state';
    state.setAttribute('aria-live', 'polite');
    state.innerHTML = '<span class="pk-sopbar-dot"></span><span class="pk-sopbar-mode"></span><span class="pk-sopbar-time"></span>';
    bar.appendChild(state);
    var modeEl = one(state, '.pk-sopbar-mode'), timeEl = one(state, '.pk-sopbar-time');
    if (footer) {
      if (getComputedStyle(footer).position === 'static') footer.style.position = 'relative';
      footer.appendChild(bar);
    } else dlg.appendChild(bar);

    var syncLabels = function () {
      segs.forEach(function (s, i) {
        var t = titleOf(i + 1);
        if (s.lbl.textContent !== t) s.lbl.textContent = t;
        s.btn.title = 'STEP ' + (i + 1) + ' · ' + t + ' 로 이동';
      });
    };
    syncLabels();

    /* ③ 흐름 연출을 걸 자리 — 지금 단계 카드의 ▸▸▸ · 헤더 'SOP 가동중' 의 ▸▸▸ */
    /* 'SOP 가동중' 글자 옆의 화살표 묶음(헤더 Title Row > SOP Status > Badge 안, 원본 이름 Indicator) */
    /* SOP Status 는 01·02·03·end 네 상태가 모두 심겨 있다(conv.js VARIANT_SETS) — 각 상태의 ▸▸▸ 에 흐름을 건다 */
    var headInds = all(dlg, '[data-name="Header"] [data-name="Title Row"] [data-name="Indicator"]');
    headInds.forEach(function (el) { el.classList.add('pk-sopflow'); });
    /* 헤더 SOP Status — 지금 단계(01·02·03) 또는 상황종료(end)의 **원본 변형**만 보이게 */
    var statusVars = all(dlg, '[data-name="Header"] [data-hj-vset="sop-status"]');
    var setStatus = function (v) {
      statusVars.forEach(function (el) { if (el.getAttribute('data-hj-variant') === v) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); });
    };

    /* ④ 단계 바꾸기 */
    var cur = 1, prev = 0, elapsed = 0;
    var playing = true;
    try { playing = localStorage.getItem(SOP_PLAY_KEY) !== 'off'; } catch (e) {}
    var hideTimer = 0, sweep = null;
    var view = 'procedure', ended = false;   /* 대화상자 왼쪽 메뉴의 보기 · 상황종료 여부 */

    var layerEls = function (k) { return k === 1 ? layers[0].items : [layers[k - 1].wrap]; };
    var setVisible = function (k, on) {
      layerEls(k).forEach(function (el) {
        el.classList.toggle('pk-sopoff', !on);
        el.classList.remove('pk-sopfade');
        if (k > 1) el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    };
    var markCurrent = function (k) {
      layers.forEach(function (L) {
        L.items.forEach(function (it, i) {
          var on = L.k === k && i === k - 1;
          it.classList.toggle('pk-sopcur', on);
          var ind = one(it, '[data-name="Indicator"]');
          if (ind) ind.classList.toggle('pk-sopflow', on);
        });
      });
    };
    var sweepCard = function (k) {
      if (sweep && sweep.parentNode) sweep.parentNode.removeChild(sweep);
      var it = layers[k - 1].items[k - 1];
      var card = it && one(it, '[data-name="Card"]');
      if (!card) return;
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      sweep = document.createElement('span');
      sweep.className = 'pk-sopsweep';
      sweep.setAttribute('aria-hidden', 'true');
      card.appendChild(sweep);
    };
    var paintBar = function () {
      segs.forEach(function (s, i) {
        var k = i + 1;
        s.btn.classList.toggle('pk-sopnow', k === cur);
        s.btn.classList.toggle('pk-sopdone', k < cur);
        s.btn.setAttribute('aria-current', k === cur ? 'step' : 'false');
        if (k > cur) s.fill.style.width = '0%';
      });
      bar.classList.toggle('pk-soppaused', !playing);
      root.classList.toggle('pk-soppaused', !playing);
      toggle.setAttribute('aria-label', playing ? '단계 넘기기 멈춤' : '단계 넘기기 재생');
      toggle.title = playing ? '멈춤 — 지금 단계에 머뭅니다' : '재생 — 10초마다 다음 단계로';
      modeEl.textContent = ended ? '상황종료' : playing ? '자동 진행' : '일시정지';
    };
    var paintTime = function () {
      var p = Math.max(0, Math.min(1, elapsed / SOP_HOLD));
      segs[cur - 1].fill.style.width = (p * 100).toFixed(2) + '%';
      var left = Math.max(0, Math.ceil((SOP_HOLD - elapsed) / 1000));
      var t = playing && !ended ? left + '초' : '';
      if (timeEl.textContent !== t) timeEl.textContent = t;
    };

    var go = function (k, animate) {
      if (k === cur && prev) { elapsed = 0; paintTime(); return; }
      clearTimeout(hideTimer);
      /* 직전 전환이 아직 안 끝났으면 그 층을 먼저 정리한다 */
      [1, 2, 3].forEach(function (j) { if (j !== cur && j !== k) setVisible(j, false); });
      prev = cur; cur = k; elapsed = 0;
      if (!animate) {
        [1, 2, 3].forEach(function (j) { setVisible(j, j === k); });
      } else if (k > prev) {
        /* 새 단계가 위층 — 떠오른 뒤 아래(이전) 층을 감춘다 */
        setVisible(k, true);
        layerEls(k).forEach(function (el) { el.classList.add('pk-sopfade'); void el.offsetWidth; el.classList.remove('pk-sopfade'); });
        hideTimer = setTimeout(function () { setVisible(prev, false); }, 320);
      } else {
        /* 이전 단계가 위층 — 아래 단계를 먼저 펴 두고 위층을 걷는다 */
        setVisible(k, true);
        layerEls(prev).forEach(function (el) { el.classList.add('pk-sopfade'); });
        hideTimer = setTimeout(function () { setVisible(prev, false); }, 320);
      }
      markCurrent(k);
      if (!ended) setStatus('0' + k);
      sweepCard(k);
      paintBar();
      paintTime();
    };

    /* 처음 — STEP 1(원본 첫 장 그대로) */
    cur = 1;
    [2, 3].forEach(function (j) { setVisible(j, false); });
    markCurrent(1);
    setStatus('01');
    paintBar();
    paintTime();

    /* ⑤ 시간 — 100ms 마다 흐르고(프레임을 안 내는 창에서도 멈추지 않게 rAF 에 기대지 않는다),
       멈춤·패널편집·탭 가림 동안은 쉰다. 막대는 CSS 전환(.12s)으로 매끄럽게 찬다. */
    var last = Date.now();
    var tick = function () {
      var now = Date.now();
      var dt = Math.min(1000, now - last); last = now;
      if (!playing || ended || view !== 'procedure' || editing() || idle()) return;
      elapsed += dt;
      if (elapsed >= SOP_HOLD) { go(cur % 3 + 1, true); return; }
      paintTime();
    };
    var clock = setInterval(tick, 100);

    /* ⑥ 조작 — 재생/멈춤 · 단계 칩 · 카드 */
    var onToggle = function (e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (editing()) return;
      playing = !playing;
      try { localStorage.setItem(SOP_PLAY_KEY, playing ? 'on' : 'off'); } catch (err) {}
      paintBar();
      paintTime();
    };
    toggle.addEventListener('click', onToggle);
    var segHandlers = segs.map(function (s, i) {
      var h = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (editing()) return;
        go(i + 1, true);
      };
      s.btn.addEventListener('click', h);
      return h;
    });
    /* 카드 — 어느 층에 있든 같은 순번이면 같은 단계. 카드 안 단추(정보)는 제 할 일을 한다 */
    var cardHandlers = [];
    layers.forEach(function (L) {
      L.items.forEach(function (it, i) {
        var body = one(it, '[data-name="Card"]') || it;
        clickable(body, 'STEP ' + (i + 1) + ' 보기');
        var h = function (e) {
          if (editing()) return;
          if (e && e.target && e.target.closest && e.target.closest('[data-name^="Button/"]')) return;
          go(i + 1, true);
        };
        var key = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); h(e); } };
        body.addEventListener('click', h);
        body.addEventListener('keydown', key);
        cardHandlers.push([body, h, key]);
      });
    });
    /* 키보드 — 컨트롤 바에 초점이 있을 때 ← → 로 단계 이동 */
    var onKey = function (e) {
      if (editing()) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur % 3 + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go((cur + 1) % 3 + 1, true); }
    };
    bar.addEventListener('keydown', onKey);

    /* ⑦ 글자 고치기 — 세 층의 같은 자리 글자를 함께 바꾼다(dt-edit 가 저장하도록 input 을 다시 흘린다) */
    var mirroring = false;
    var pathOf = function (p) {
      for (var li = 0; li < layers.length; li++) {
        var its = layers[li].items;
        for (var si = 0; si < its.length; si++) {
          if (its[si].contains(p)) return { li: li, si: si, pi: all(its[si], 'p').indexOf(p) };
        }
      }
      return null;
    };
    var onInput = function (e) {
      if (mirroring) return;
      var p = e.target && e.target.closest && e.target.closest('p');
      if (!p || !host.contains(p)) return;
      var at = pathOf(p);
      if (!at || at.pi < 0) return;
      mirroring = true;
      try {
        layers.forEach(function (L, li) {
          if (li === at.li) return;
          var q = L.items[at.si] && all(L.items[at.si], 'p')[at.pi];
          if (!q || q.innerHTML === p.innerHTML) return;
          q.innerHTML = p.innerHTML;
          try { q.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
        });
      } finally { mirroring = false; }
      syncLabels();
    };
    root.addEventListener('input', onInput);
    /* 저장된 편집이 되살아난 뒤(스튜디오가 글자를 다시 입힌다) 이름도 다시 읽는다 */
    var labelTimer = every(1500, syncLabels);

    /* ⑧ 대화상자 왼쪽 메뉴 — 대응 절차(Tab/Procedure) ↔ 상황인지 전파 체계도(Tab/Diagram)
       Figma 에는 두 보기가 따로 그려져 있다: 절차 = 지금 화면(1:9688, 절차 켜짐), 체계도 = 1:9443(체계도 켜짐).
       메뉴의 켜짐/꺼짐 모습도 두 화면에 **원본 그대로** 반대로 들어 있으므로 색을 새로 짓지 않고
       체계도 화면의 본문(Body)과 메뉴(Tab Bar)를 통째로 같은 자리에 얹어 맞바꾼다. */
    var frame = root.firstElementChild;
    var hostBody = one(dlg, ':scope > [data-name="Body"]');
    var hostTabs = one(dlg, ':scope > [data-name="Tab Bar"]');
    var viewWrap = null, viewBody = null, viewTabs = null;
    if (typeof window.build_pks4 === 'function' && hostBody && hostTabs && frame) {
      sopEnsureStyle('pks4');
      var tmp4 = document.createElement('div');
      tmp4.innerHTML = sopHtml(window.build_pks4(sopBase()));
      var dlg4 = one(tmp4, '[data-name="Dialog/SOP"]');
      viewBody = dlg4 && one(dlg4, ':scope > [data-name="Body"]');
      viewTabs = dlg4 && one(dlg4, ':scope > [data-name="Tab Bar"]');
      if (viewBody && viewTabs) {
        viewWrap = document.createElement('div');
        viewWrap.className = 'pks4-root pk-sopview pk-sopoff';
        viewWrap.dataset.theme = theme;
        viewWrap.setAttribute('data-name', 'SOP Diagram View');
        viewWrap.setAttribute('aria-hidden', 'true');
        viewWrap.appendChild(viewBody);
        viewWrap.appendChild(viewTabs);
        frame.insertBefore(viewWrap, dlg.nextSibling);
        sopRestoreSrc(viewWrap);
      }
    }
    /* 반응형(translate) · 패널 이동(margin)은 원래 본문·메뉴에 걸린다 — 얹은 것도 같은 자리를 따라가게 옮겨 적는다 */
    /* 체계도 보기의 단계 연출(installSopDiagram) — 보기가 체계도일 때만 돈다 */
    var dg = viewBody ? installSopDiagram(viewBody) : null;
    var syncView = function () {
      if (!viewWrap) return;
      [[hostBody, viewBody], [hostTabs, viewTabs]].forEach(function (p) {
        ['translate', 'marginLeft', 'marginTop'].forEach(function (k) { if (p[1].style[k] !== p[0].style[k]) p[1].style[k] = p[0].style[k]; });
      });
    };
    syncView();
    var viewSync = every(250, syncView);
    var viewTimer = 0;
    var setView = function (v) {
      if (!viewWrap || v === view) return;
      clearTimeout(viewTimer);
      view = v;
      syncView();
      var showEls = v === 'diagram' ? [viewWrap] : [hostBody, hostTabs];
      var hideEls = v === 'diagram' ? [hostBody, hostTabs] : [viewWrap];
      /* 이전 보기는 바로 감춘다 — 두 보기가 겹쳐 보이는 틈을 두지 않는다 */
      hideEls.forEach(function (el) { el.classList.remove('pk-sopin', 'pk-sopfade'); el.classList.add('pk-sopoff'); });
      showEls.forEach(function (el) { el.classList.remove('pk-sopoff', 'pk-sopfade', 'pk-sopin'); void el.offsetWidth; el.classList.add('pk-sopin'); });
      viewWrap.setAttribute('aria-hidden', v === 'diagram' ? 'false' : 'true');
      viewTimer = setTimeout(function () { showEls.forEach(function (el) { el.classList.remove('pk-sopin'); }); }, 260);
      if (dg) { if (v === 'diagram') dg.start(); else dg.stop(); }
      paintTime();
    };
    var tabBinds = [];
    var bindTab = function (el, to, title) {
      if (!el) return;
      clickable(el, title, 'tab');
      var h = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } if (editing()) return; setView(to); };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      tabBinds.push([el, h, key]);
    };
    if (viewWrap) {
      /* 메뉴 순서는 원본 그대로 — [0] 대응 절차 · [1] 상황인지 전파 체계도 */
      bindTab(hostTabs.children[1], 'diagram', '상황인지 전파 체계도 보기');
      bindTab(viewTabs.children[0], 'procedure', '대응 절차 및 행동요령 보기');
      hostTabs.children[0].setAttribute('aria-selected', 'true');
      viewTabs.children[1] && viewTabs.children[1].setAttribute('aria-selected', 'true');
    }

    /* ⑨ 상황종료 단추 — 마우스를 올리면 Figma 의 hover 변형(1:10443)으로, 누르면 상황종료.
       두 변형이 같은 자리에 심겨 있어(conv.js VARIANT_SETS) 보이는 것만 바꾼다. 절차 · 체계도 두 본문에 하나씩 있다. */
    var endBinds = [];
    [hostBody, viewBody].forEach(function (body) {
      var foot = body && one(body, '[data-name="Footer"]');
      var vars = foot ? all(foot, '[data-hj-vset="btn-end"]') : [];
      if (vars.length < 2) return;
      var showHover = function (on) {
        vars.forEach(function (el) {
          var want = el.getAttribute('data-hj-variant') === (on ? 'hover' : 'default');
          if (want) el.removeAttribute('hidden'); else el.setAttribute('hidden', '');
        });
      };
      var inside = function (e) {
        var vis = vars.filter(function (el) { return !el.hasAttribute('hidden'); })[0];
        if (!vis) return false;
        var r = vis.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      };
      var move = function (e) { if (!editing()) showHover(inside(e)); };
      var leave = function () { showHover(false); };
      var click = function (e) {
        if (!e.target.closest || !e.target.closest('[data-hj-vset="btn-end"]')) return;
        e.preventDefault(); e.stopPropagation();
        if (editing()) return;
        endSituation();
      };
      vars.forEach(function (el) { clickable(el, '상황종료'); el.classList.remove('pk-lit'); });
      foot.addEventListener('pointermove', move);
      foot.addEventListener('pointerleave', leave);
      foot.addEventListener('click', click);
      endBinds.push({ foot: foot, move: move, leave: leave, click: click, vars: vars, reset: leave });
    });

    /* ⑩ 발생일시 · 경과시간 — 지금 벌어지고 있는 상황처럼.
       원본 경과시간(00:03:37)만큼 **지금보다 앞선 시각**을 발생일시로 찍고, 경과시간은 1초마다 늘어난다.
       글자 모양은 원본 그대로(YYYY-MM-DD HH:MM:SS · HH:MM:SS). 상황종료를 누르면 그 자리에서 멈춘다. */
    var occP = one(dlg, '[data-name="Field/Time"] [data-name="Value"] p');
    var elaP = one(dlg, '[data-name="Field/Elapsed Time"] [data-name="Value"] p');
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var baseSec = 217;
    (function () {
      var t = elaP ? (elaP.textContent || '').trim().split(':') : [];
      if (t.length === 3 && t.every(function (x) { return x !== '' && !isNaN(+x); })) baseSec = (+t[0]) * 3600 + (+t[1]) * 60 + (+t[2]);
    })();
    var occAt = Date.now() - baseSec * 1000, frozenAt = 0;
    var paintIncident = function () {
      if (editing()) return;
      if (occP) {
        var d = new Date(occAt);
        var s = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
        if (occP.textContent !== s) occP.textContent = s;
      }
      if (elaP) {
        var sec = Math.max(0, Math.floor(((frozenAt || Date.now()) - occAt) / 1000));
        var e2 = p2(Math.floor(sec / 3600)) + ':' + p2(Math.floor(sec / 60) % 60) + ':' + p2(sec % 60);
        if (elaP.textContent !== e2) elaP.textContent = e2;
      }
    };
    [occP, elaP].forEach(function (p) { if (p) p.classList.add('pk-num'); });
    paintIncident();
    var incidentClock = setInterval(paintIncident, 1000);

    /* ⑪ 상황종료 · 다시 열기
       누르면: SOP Status 가 원본의 '상황종료' 변형으로 바뀌고, 경과시간 · 단계 넘기기가 멈춘 뒤 대화상자가 닫힌다.
       헤더 SOP 메뉴를 다시 누르면 새 상황으로 대화상자가 열린다(STEP 1 · 경과시간 처음부터 · 절차 보기). */
    var closeTimer = 0;
    /* 상황 경보 — 헤더의 붉은 판 · 경고 배지 · 제목(스타일 SOP_CSS '상황 경보') */
    var alertBg = one(dlg, '[data-name="Header"] > [data-name="Background"] > *');
    var alertBadge = one(dlg, '[data-name="Header"] [data-name="Title Row"] > [data-name="Title"] > [data-name="Badge"]');
    var alertTitle = one(dlg, '[data-name="Header"] [data-name="Title Row"] > [data-name="Title"] > p');
    var alertFx = [];
    var setAlert = function (on) {
      if (alertBg) {
        alertBg.classList.toggle('pk-sopalert', on);
        /* 판 모양대로 번지는 붉은 막 · 스캔 빛 — 판 그림을 그대로 복사해 붉게 물들인 두 겹(CSS 마스크는 file:// 에서 막힌다) */
        if (on && !alertFx.length) {
          var im = one(alertBg, 'img');
          if (im) {
            ['pk-alertwash', 'pk-alertscan'].forEach(function (cls) {
              var box = document.createElement('span');
              box.className = cls;
              box.setAttribute('aria-hidden', 'true');
              var copy = im.cloneNode(false);
              copy.removeAttribute('id');
              copy.className = '';
              box.appendChild(copy);
              alertBg.appendChild(box);
              alertFx.push(box);
            });
          }
        }
        if (!on) { alertFx.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); }); alertFx = []; }
      }
      if (alertBadge) alertBadge.classList.toggle('pk-sopbadge', on);
      if (alertTitle) alertTitle.classList.toggle('pk-soptitle', on);
    };
    setAlert(true);
    var dlgParts = function () {
      var list = Array.prototype.filter.call(dlg.children, function (el) { return el.nodeType === 1; });
      if (viewWrap) list.push(viewWrap);
      return list;
    };
    var endSituation = function () {
      if (ended) return;
      ended = true;
      frozenAt = Date.now();
      if (dg) dg.stop();
      setAlert(false);
      setStatus('end');
      paintIncident();
      paintBar();
      paintTime();
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        dlgParts().forEach(function (el) { el.classList.add('pk-sopclosing'); });
        dlg.setAttribute('aria-hidden', 'true');
      }, 1300);
    };
    var reopen = function () {
      clearTimeout(closeTimer);
      endBinds.forEach(function (b) { b.reset(); });
      ended = false; frozenAt = 0;
      occAt = Date.now() - baseSec * 1000;
      setView('procedure');
      go(1, false);
      elapsed = 0;
      setStatus('01');
      setAlert(true);
      dlgParts().forEach(function (el) { if (el.classList.contains('pk-sopclosing')) { el.classList.remove('pk-sopclosing'); if (!el.classList.contains('pk-sopoff')) { void el.offsetWidth; el.classList.add('pk-sopin'); setTimeout(function () { el.classList.remove('pk-sopin'); }, 260); } } });
      dlg.setAttribute('aria-hidden', 'false');
      paintIncident();
      paintBar();
      paintTime();
    };
    var menuBinds = [];
    all(root, '[data-name^="Menu Item/"]').forEach(function (el) {
      if ((el.textContent || '').trim() !== 'SOP') return;
      var h = function () { if (editing()) return; if (ended) reopen(); };
      el.addEventListener('click', h);
      menuBinds.push([el, h]);
    });
    /* 패널편집을 켜면 닫힌 대화상자도 도로 펴 준다 — 안 그러면 그 안의 글자를 고칠 수 없다 */
    var editOpen = every(300, function () {
      if (editing() && ended) reopen();
      /* 패널편집을 끝내면 체계도 연출을 다시 튼다(편집 중에는 원본 모습으로 멈춰 있다) */
      if (dg && editing() && dg.running()) dg.stop();   /* 편집을 켜면 곧바로 원본 모습으로 */
      if (dg && view === 'diagram' && !ended && !editing() && !dg.running()) dg.start();
    });

    st.sop = {
      go: go, cur: function () { return cur; }, playing: function () { return playing; },
      view: function (v) { if (v) setView(v); return view; }, end: endSituation, reopen: reopen,
      ended: function () { return ended; }, status: setStatus, diagram: dg,
    };
    st.cleanup.push(function () {
      clearInterval(clock);
      clearTimeout(hideTimer);
      clearInterval(labelTimer);
      toggle.removeEventListener('click', onToggle);
      segs.forEach(function (s, i) { s.btn.removeEventListener('click', segHandlers[i]); });
      cardHandlers.forEach(function (c) { c[0].removeEventListener('click', c[1]); c[0].removeEventListener('keydown', c[2]); unclickable(c[0]); });
      bar.removeEventListener('keydown', onKey);
      root.removeEventListener('input', onInput);
      if (bar.parentNode) bar.parentNode.removeChild(bar);
      if (sweep && sweep.parentNode) sweep.parentNode.removeChild(sweep);
      layers.forEach(function (L) { if (L.wrap && L.wrap.parentNode) L.wrap.parentNode.removeChild(L.wrap); });
      layers[0].items.forEach(function (el) { el.classList.remove('pk-sopitem', 'pk-sopoff', 'pk-sopfade', 'pk-sopcur'); });
      host.classList.remove('pk-sophost');
      root.classList.remove('pk-soppaused');
      headInds.forEach(function (el) { el.classList.remove('pk-sopflow'); });
      setAlert(false);
      setStatus('01');
      if (dg) dg.stop();
      clearInterval(viewSync); clearTimeout(viewTimer); clearInterval(incidentClock); clearTimeout(closeTimer); clearInterval(editOpen);
      tabBinds.forEach(function (t) { t[0].removeEventListener('click', t[1]); t[0].removeEventListener('keydown', t[2]); unclickable(t[0]); });
      endBinds.forEach(function (b) {
        b.foot.removeEventListener('pointermove', b.move); b.foot.removeEventListener('pointerleave', b.leave); b.foot.removeEventListener('click', b.click);
        b.reset(); b.vars.forEach(function (el) { unclickable(el); });
      });
      menuBinds.forEach(function (m) { m[0].removeEventListener('click', m[1]); });
      dlgParts().forEach(function (el) { el.classList.remove('pk-sopclosing'); });
      [hostBody, hostTabs].forEach(function (el) { if (el) el.classList.remove('pk-sopoff'); });
      if (viewWrap && viewWrap.parentNode) viewWrap.parentNode.removeChild(viewWrap);
    });
  }

  /* ══════════════════ 헤더 메뉴 — 기본 / 마우스오버 · 활성 ══════════════════
     Figma btn-menu(17:13398)에는 default · active 두 상태만 있다 → 마우스오버와 활성화는 active 값, 나머지는 default 값.
     모양은 스타일(SOP_CSS '헤더 메뉴')이 정하고 여기서는 ① 켜진 메뉴 표시(pk-menu-on) ② 아이콘 마스크 주소만 건다.
     처음 켜진 메뉴는 원본 그대로(판 색이 가장 선명한 것 = SOP). 누르면 그 메뉴로 옮겨 간다. */
  function installHeaderMenu(root, st) {
    var items = all(root, '[data-name^="Menu Item/"]');
    if (items.length < 2) return;
    var onIdx = 0, best = -1;
    items.forEach(function (el, i) { var s = sat(getComputedStyle(el).backgroundColor); if (s > best) { best = s; onIdx = i; } });
    var cur = null;
    var setOn = function (el) {
      if (cur) { cur.classList.remove('pk-menu-on'); cur.setAttribute('aria-current', 'false'); }
      cur = el;
      if (cur) { cur.classList.add('pk-menu-on'); cur.setAttribute('aria-current', 'page'); }
    };
    var binds = [];
    items.forEach(function (el, i) {
      el.classList.add('pk-menu');
      var img = one(el, 'img');
      var box = img && img.parentElement;
      var src = img && (img.getAttribute('src') || img.getAttribute('data-pk-src'));
      if (box && src && box !== el) {
        /* 상태별 사본은 원본 옆 menu/ 폴더에 있다(mk-menu-icons.js) — 이름: icon-nav-<이름>-{off,on,off-lt,on-lt}.svg */
        var dot = src.lastIndexOf('.'), slash = src.lastIndexOf('/');
        var dir = src.slice(0, slash + 1), stem = src.slice(slash + 1, dot);
        ['off', 'on', 'off-lt', 'on-lt'].forEach(function (s) {
          try { box.style.setProperty('--pk-ico-' + s, 'url("' + new URL(dir + 'menu/' + stem + '-' + s + '.svg', document.baseURI).href + '")'); } catch (e) {}
        });
        box.classList.add('pk-menu-ico');
      }
      clickable(el);
      el.classList.remove('pk-lit');
      var h = function (e) { if (e) e.preventDefault(); if (editing()) return; setOn(el); };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      binds.push([el, h, key, box]);
    });
    setOn(items[onIdx]);
    st.cleanup.push(function () {
      binds.forEach(function (b) {
        b[0].removeEventListener('click', b[1]); b[0].removeEventListener('keydown', b[2]);
        b[0].classList.remove('pk-menu', 'pk-menu-on'); b[0].removeAttribute('aria-current'); unclickable(b[0]);
        if (b[3]) { b[3].classList.remove('pk-menu-ico'); ['off', 'on', 'off-lt', 'on-lt'].forEach(function (s) { b[3].style.removeProperty('--pk-ico-' + s); }); }
      });
    });
  }

  /* ══════════════════ 패널 이동(패널편집 · 배치) ══════════════════
     '패널편집'을 켜면 화면의 판(헤더 · 이벤트 현황 · 층 선택 · 자산정보현황 · SOP 대화상자 …)을 끌어 옮길 수 있다.
     덩어리 단위는 반응형 엔진과 같다(collectBlocks — Figma 그룹이면 통째로 움직인다).
     옮기는 값은 **margin** 에 싣는다 — 반응형 엔진이 translate 속성을, 원본이 transform(가운데 맞추기)을 이미
     쓰고 있어서 둘 중 어느 것을 덮어도 판이 튄다. 절대배치 판의 margin 은 다른 판을 밀지 않는다.
     화면(장면)마다 따로 저장하고, 스튜디오의 '배치 초기화'를 누르면 함께 되돌린다. */
  var MOVE_KEY = 'wemb-posco-move';
  var MOVE_SKIP = ['Background', 'Stage', 'Building Image', 'Floor Plan'];

  function installPanelMove(root, st) {
    var groups = collectBlocks(root).filter(function (g) {
      if (g.some(function (el) { return el.classList.contains('pk-sopview'); })) return false;   /* 체계도 보기는 절차 본문을 따라간다(syncView) */
      return !g.every(function (el) {
        var n = el.dataset.name || '';
        return MOVE_SKIP.indexOf(n) >= 0 || n.indexOf('(Unused)') >= 0;
      });
    });
    if (!groups.length) return;
    var scene = sceneOf(root);
    var load = function () { try { return (JSON.parse(localStorage.getItem(MOVE_KEY) || '{}') || {})[scene] || {}; } catch (e) { return {}; } };
    var save = function (m) {
      try {
        var all0 = JSON.parse(localStorage.getItem(MOVE_KEY) || '{}') || {};
        all0[scene] = m;
        localStorage.setItem(MOVE_KEY, JSON.stringify(all0));
      } catch (e) {}
    };
    var keyOf = function (g, i) { return (g[0].dataset.name || g[0].dataset.nodeId || 'block') + '#' + i; };
    var P = groups.map(function (g, i) {
      var base = g.map(function (el) { var cs = getComputedStyle(el); return [parseFloat(cs.marginLeft) || 0, parseFloat(cs.marginTop) || 0]; });
      g.forEach(function (el) { el.classList.add('pk-movable'); });
      return { els: g, base: base, key: keyOf(g, i), off: [0, 0] };
    });
    var put = function (p) {
      p.els.forEach(function (el, i) {
        if (!p.off[0] && !p.off[1]) { el.style.removeProperty('margin-left'); el.style.removeProperty('margin-top'); return; }
        el.style.marginLeft = (p.base[i][0] + p.off[0]) + 'px';
        el.style.marginTop = (p.base[i][1] + p.off[1]) + 'px';
      });
    };
    var restore = function () {
      var m = load();
      P.forEach(function (p) { var o = m[p.key]; p.off = o ? [o[0], o[1]] : [0, 0]; put(p); });
    };
    restore();

    var layoutOn = function () { return !!document.querySelector('.dtstage.dt-editing'); };
    var drag = null;
    var groupOf = function (t) {
      for (var i = 0; i < P.length; i++) for (var j = 0; j < P[i].els.length; j++) if (P[i].els[j].contains(t)) return P[i];
      return null;
    };
    var onDown = function (e) {
      if (!layoutOn() || e.button !== 0) return;
      if (e.target.closest && e.target.closest('.pk-sopbar, .dt-added')) return;
      var p = groupOf(e.target);
      if (!p) return;
      var k = root.getBoundingClientRect().width / (root.offsetWidth || 1) || 1;   /* 화면 → 배치 좌표 */
      drag = { p: p, sx: e.clientX, sy: e.clientY, ox: p.off[0], oy: p.off[1], k: k, moved: false, id: e.pointerId };
    };
    var onMove = function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.sx) / drag.k, dy = (e.clientY - drag.sy) / drag.k;
      if (!drag.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return;          /* 손떨림은 클릭(글자 고치기)으로 둔다 */
        drag.moved = true;
        drag.p.els.forEach(function (el) { el.classList.add('pk-moving'); });
        try { root.setPointerCapture(drag.id); } catch (err) {}
      }
      e.preventDefault();
      drag.p.off = [Math.round(drag.ox + dx), Math.round(drag.oy + dy)];
      put(drag.p);
    };
    var onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.p.els.forEach(function (el) { el.classList.remove('pk-moving'); });
      try { root.releasePointerCapture(d.id); } catch (err) {}
      if (!d.moved) return;
      var m = load();
      if (d.p.off[0] || d.p.off[1]) m[d.p.key] = d.p.off; else delete m[d.p.key];
      save(m);
      /* 방금 끈 자리의 클릭이 카드 이동·팝업 열기로 번지지 않게 한 번 삼킨다 */
      var swallow = function (ev) { ev.stopPropagation(); ev.preventDefault(); root.removeEventListener('click', swallow, true); };
      root.addEventListener('click', swallow, true);
      setTimeout(function () { root.removeEventListener('click', swallow, true); }, 0);
    };
    /* 판 안의 그림(img)을 누른 채 끌면 브라우저가 '그림 끌어 놓기'를 시작하고 포인터를 취소해 버린다
       (pointercancel — 5px 만 움직이고 멈췄다). 배치 모드에서는 그 기본 동작과 글자 고르기를 막는다.
       글자 고치기는 dt-edit 와 같이 두 번 눌러서 한다. */
    var onMouseDown = function (e) { if (layoutOn() && groupOf(e.target) && !(e.target.closest && e.target.closest('.pk-sopbar'))) e.preventDefault(); };
    var onDragStart = function (e) { if (layoutOn()) e.preventDefault(); };
    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    /* 스튜디오의 '배치 초기화' — 이 화면의 이동도 되돌린다 */
    var reset = document.getElementById('layoutReset');
    var onReset = function () { save({}); P.forEach(function (p) { p.off = [0, 0]; put(p); }); };
    if (reset) reset.addEventListener('click', onReset);
    st.cleanup.push(function () {
      root.removeEventListener('mousedown', onMouseDown);
      root.removeEventListener('dragstart', onDragStart);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      if (reset) reset.removeEventListener('click', onReset);
      P.forEach(function (p) { p.off = [0, 0]; put(p); p.els.forEach(function (el) { el.classList.remove('pk-movable', 'pk-moving'); }); });
    });
  }
