/* hana-live.js — 한진 엔진에서 이식한 뒤 이 시안에만 있는 것들을 얹는다.
   · 시계 : 이 시안의 표기는 `2026-00-00(수)` + `09:00:00` (한진과 형식이 다르다)
   · 이벤트 현황 접기/펼치기 : 버튼이 btn-arrow-up / btn-arrow-down 두 개다
   · 라이브 : KPI·게이지·도넛·꺾은선·표의 수치가 실시간처럼 움직인다
   · 헤더 메뉴 : 마우스 오버/선택, 누르면 해당 화면으로 이동
   형상은 하나도 만들지 않는다 — 전부 원본 DOM 위에 얹는 동작뿐이다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');

/* ── 1. 시계 — 이 시안 표기로 갈아 끼운다 ── */
const CK_A = s.indexOf('  function installClock(root, st) {');
const CK_B = s.indexOf('  /* ══════════════════ 4. 마우스 오버 · 선택 ══════════════════ */');
if (CK_A < 0 || CK_B < 0) { console.error('clock anchors'); process.exit(1); }
const CLOCK = `  var DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];
  function installClock(root, st) {
    /* 헤더는 컴포넌트 인스턴스라 안쪽 두 줄에는 data-name 이 안 실린다 → 노드 id 로도 찾는다 */
    var date = one(root, '[data-name="Date"] p') || one(root, '[data-node-id$="1:61838"] p');
    var time = one(root, '[data-name="Time"] p') || one(root, '[data-node-id$="1:61839"] p');
    if (!date && !time) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      if (editing()) return;
      var d = new Date();
      if (date) {
        var nd = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '(' + DOW_KO[d.getDay()] + ')';
        if (date.textContent !== nd) date.textContent = nd;
      }
      if (time) {
        var nt = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        if (time.textContent !== nt) time.textContent = nt;
      }
    };
    tick();
    var id = every(1000, tick);
    st.cleanup.push(function () { clearInterval(id); });
  }

`;
s = s.slice(0, CK_A) + CLOCK + s.slice(CK_B);

/* ── 2. 이벤트 현황 접기/펼치기 ── */
const FD_A = s.indexOf('  function installFold(root, st) {');
const FD_B = s.indexOf('  /* ══════════════════ 6. 라이브 데이터 ══════════════════ */');
if (FD_A < 0 || FD_B < 0) { console.error('fold anchors'); process.exit(1); }
const FOLD = `  function installFold(root, st) {
    var panel = one(root, '[data-name="Event Log"]');
    if (!panel) return;
    var up = one(root, '[data-name="btn-arrow-up"]') || one(root, 'img[src*="btn-arrow-up"]');
    var down = one(root, '[data-name="btn-arrow-down"]') || one(root, 'img[src*="btn-arrow-down"]');
    if (up && up.tagName === 'IMG') up = up.closest('div');
    if (down && down.tagName === 'IMG') down = down.closest('div');
    if (!up && !down) return;
    panel.classList.add('hn-eventlog');
    /* 얼마나 올릴지는 재서 정한다 — 판이 화면 아래로 삐져나온 만큼만 올린다(원본 접힌 모습 유지) */
    var lift = function () {
      var pr = panel.getBoundingClientRect();
      var rr = root.getBoundingClientRect();
      var over = (pr.bottom - rr.bottom) / (rr.height / 1080);
      return Math.max(0, Math.round(over));
    };
    var open = false;
    var apply = function () {
      panel.style.setProperty('--hn-lift', '-' + (open ? lift() : 0) + 'px');
      panel.classList.toggle('hn-open', open);
      [up, down].forEach(function (b) { if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    };
    var set = function (v) { return function (e) { if (e) e.preventDefault(); if (open === v) return; open = v; apply(); }; };
    var toggle = function (e) { if (e) e.preventDefault(); open = !open; apply(); };
    [up, down].forEach(function (b, i) {
      if (!b) return;
      b.classList.add('hn-hot', 'hn-soft');
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.setAttribute('role', 'button');
      b.setAttribute('tabindex', '0');
      b.title = i === 0 ? '이벤트 현황 펼치기' : '이벤트 현황 접기';
      var fn = i === 0 ? set(true) : set(false);
      b.addEventListener('click', fn);
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
      b.addEventListener('keydown', key);
      st.cleanup.push(function () { b.removeEventListener('click', fn); b.removeEventListener('keydown', key); });
    });
    st.cleanup.push(function () { panel.classList.remove('hn-open', 'hn-eventlog'); panel.style.removeProperty('--hn-lift'); });
    st.refold = apply;
    void toggle;
  }

`;
s = s.slice(0, FD_A) + FOLD + s.slice(FD_B);

/* ── 3. 이 시안의 라이브 연출 ── */
const LIVE = `
  /* ══════════════════ 6-z. 이 시안의 라이브 연출 ══════════════════
     원본 형상은 그대로 두고 '값이 들어오는 것처럼' 보이게만 한다.
     · 수치  : KPI·게이지·도넛·측정값·요약 칩이 원본 값 언저리에서 흔들린다
     · 꺾은선: 데이터 층이 아주 조금 옆으로 흐르고, 툴팁 표시가 가로로 훑는다
     · 도넛/링: 각도만 조금 돌린다(조각 그림은 원본 그대로)
     · 미터/막대: 길이만 늘였다 줄인다 */
  var HANA_NUM = [
    '[data-name^="KPI/"] [data-name="Value"]',
    '[data-name^="Metric/"] [data-name="Value"] p',
    '[data-name^="Gauge/"] [data-name="TPS Value"]',
    '[data-name^="Gauge/"] [data-name="Response Value"]',
    '[data-name^="Gauge/"] [data-name="Count"]',
    '[data-name^="Donut/"] [data-name="Value"]',
    '[data-name="Measurement"] [data-name="Value"]',
    '[data-name="Summary"] [data-name="Value"]',
    '[data-name^="Metric/"] [data-name="Value"]',
    '[data-name="Side Panel"] [data-name="Value"] p',
    '[data-name^="Item/"] [data-name="Value"] p',
  ].join(',');

  function installHanaLive(root, st) {
    /* (1) 수치 */
    var seen = [];
    var nums = [];
    all(root, HANA_NUM).forEach(function (el) {
      var p = el.tagName === 'P' ? el : one(el, 'p');
      if (!p || seen.indexOf(p) >= 0) return;
      var v = numOf(p.textContent);
      if (v == null) return;
      seen.push(p);
      nums.push({ el: p, base: v, cur: v, src: p.textContent });
    });
    if (nums.length) {
      var numStep = function () {
        if (editing()) return;
        nums.forEach(function (c) {
          if (Math.random() > 0.3) return;
          var span = Math.max(Math.abs(c.base) * 0.035, 1);
          var target = Math.max(0, c.base + rnd(-span, span));
          var from = c.cur; c.cur = target;
          tween(950, from, target, function (v) { setNum(c.el, v, c.src); });
        });
      };
      var nid = every(3400, numStep);
      setTimeout(numStep, 1200);
      st.cleanup.push(function () { clearInterval(nid); nums.forEach(function (c) { c.el.textContent = c.src; }); });
    }

    /* (2) 꺾은선 — 데이터 층이 흐르고 툴팁이 훑는다 */
    var charts = all(root, '[data-name="Line Chart"]').map(function (ch) {
      var data = one(ch, '[data-name="Data"]');
      var tip = one(ch, '[data-name="Tooltip"]');
      var plot = one(ch, '[data-name="Plot"]') || ch;
      if (data) { data.classList.add('hn-flow'); data.style.transformOrigin = 'left bottom'; }
      if (tip) tip.classList.add('hn-sweep');
      return { data: data, tip: tip, plot: plot, x0: tip ? tip.offsetLeft : 0 };
    }).filter(function (c) { return c.data || c.tip; });
    if (charts.length) {
      var chStep = function () {
        if (editing()) return;
        charts.forEach(function (c) {
          if (c.data) c.data.style.transform = 'translateX(' + rnd(-6, 0).toFixed(1) + 'px) scaleY(' + rnd(0.97, 1.04).toFixed(3) + ')';
          if (c.tip) {
            var w = (c.plot.offsetWidth || 400);
            c.tip.style.transform = 'translateX(' + rnd(-w * 0.34, w * 0.3).toFixed(0) + 'px)';
          }
        });
      };
      var cid = every(2600, chStep);
      setTimeout(chStep, 800);
      st.cleanup.push(function () {
        clearInterval(cid);
        charts.forEach(function (c) { if (c.data) c.data.style.transform = ''; if (c.tip) c.tip.style.transform = ''; });
      });
    }

    /* (3) 도넛·링 */
    var rings = all(root, '[data-name="Donut Chart"] [data-name="Ring"], [data-name="Donut Chart"] [data-name="Plot"], [data-name^="Donut/"] [data-name="Donut"]');
    rings.forEach(function (p) { p.classList.add('hn-donut'); p.style.transformOrigin = '50% 50%'; });
    if (rings.length) {
      var rStep = function () {
        if (editing()) return;
        rings.forEach(function (p) { if (Math.random() > 0.55) return; p.style.transform = 'rotate(' + rnd(-8, 8).toFixed(2) + 'deg)'; });
      };
      var rid = every(4200, rStep);
      setTimeout(rStep, 2000);
      st.cleanup.push(function () { clearInterval(rid); rings.forEach(function (p) { p.style.transform = ''; }); });
    }

    /* (4) 미터·막대 */
    var meters = all(root, '[data-name="Meter"], [data-name="Td/Usage"] [data-name="Meter"], [data-name="Bar"]');
    meters.forEach(function (m) { m.classList.add('hn-hbar'); m.style.transformOrigin = 'left center'; });
    if (meters.length) {
      var mStep = function () {
        if (editing()) return;
        meters.forEach(function (m) { if (Math.random() > 0.5) return; m.style.transform = 'scaleX(' + rnd(0.9, 1.08).toFixed(3) + ')'; });
      };
      var mid = every(3800, mStep);
      setTimeout(mStep, 1600);
      st.cleanup.push(function () { clearInterval(mid); meters.forEach(function (m) { m.style.transform = ''; }); });
    }

    /* (5) 실린더 게이지(종합현황) — 쌓인 원판 개수로 값을 보여 준다 */
    var cyls = all(root, '[data-name^="Gauge/"] [data-name="Visual"]').map(function (v) {
      var disks = all(v, '[data-name="Disk"]');
      return disks.length ? { disks: disks, n: disks.length } : null;
    }).filter(Boolean);
    if (cyls.length) {
      cyls.forEach(function (c) { c.disks.forEach(function (d) { d.style.transition = 'opacity .5s ease'; }); });
      var gStep = function () {
        if (editing()) return;
        cyls.forEach(function (c) {
          if (Math.random() > 0.45) return;
          var keep = Math.max(1, Math.min(c.n, Math.round(c.n * rnd(0.72, 1))));
          c.disks.forEach(function (d, i) { d.style.opacity = i < keep ? '' : '0'; });
        });
      };
      var gid = every(3000, gStep);
      setTimeout(gStep, 1800);
      st.cleanup.push(function () { clearInterval(gid); cyls.forEach(function (c) { c.disks.forEach(function (d) { d.style.opacity = ''; d.style.transition = ''; }); }); });
    }
  }

  /* ══════════════════ 6-y. 헤더 메뉴 — 오버/선택/화면 이동 ══════════════════ */
  var HANA_NAV = {
    'Overview': 'overview-02', 'Cloud': 'cloud-01', 'Middleware': 'middleware',
    'Infrastructure': 'infra-main', 'Event': 'event', 'Network': 'network-01',
    'Facility': 'facility',
  };
  function installHanaMenu(root, st) {
    var items = all(root, '[data-name="Menu"] [data-name^="Menu Item/"]');
    if (!items.length) return;
    items.forEach(function (it) {
      var key = (it.dataset.name || '').replace('Menu Item/', '').replace(' (Selected)', '');
      var to = HANA_NAV[key];
      it.classList.add('hn-hot');
      if (getComputedStyle(it).position === 'static') it.style.position = 'relative';
      if (!to) { it.classList.add('hn-off'); it.title = key + ' — 시안 준비 중'; return; }
      it.setAttribute('role', 'link');
      it.setAttribute('tabindex', '0');
      it.title = key;
      var go = function (e) {
        if (e) e.preventDefault();
        if (typeof window.__openHanaScreen === 'function') { window.__openHanaScreen(to); return; }
        location.href = './' + to + '.html' + location.search;
      };
      it.addEventListener('click', go);
      var key2 = function (e) { if (e.key === 'Enter') go(e); };
      it.addEventListener('keydown', key2);
      st.cleanup.push(function () { it.removeEventListener('click', go); it.removeEventListener('keydown', key2); });
    });
  }
`;

const INS = '  /* ══════════════════ 7. 설치 ══════════════════ */';
if (s.indexOf(INS) < 0) { console.error('install anchor'); process.exit(1); }
s = s.replace(INS, LIVE + '\n' + INS);

/* 설치 목록에 더한다 */
s = s.replace('    try { installBuildingPan(root, st); } catch (e) { }',
  '    try { installBuildingPan(root, st); } catch (e) { }\n'
  + '    try { installHanaLive(root, st); } catch (e) { }\n'
  + '    try { installHanaMenu(root, st); } catch (e) { }');

/* ── 4. 이 시안에 필요한 스타일 몇 줄 ── */
s = s.replace("    '@media (prefers-reduced-motion:reduce)",
  "    /* 이벤트 현황 서랍 — 얼마나 올릴지는 재서 --hn-lift 로 넣는다(접힌 모습은 원본 그대로) */\n"
  + "    '.hn-root .hn-eventlog{transition:translate .42s cubic-bezier(.22,.9,.24,1);will-change:translate;}',\n"
  + "    '.hn-root .hn-eventlog.hn-open{translate:0 var(--hn-lift,0);z-index:40;'\n"
  + "    + 'box-shadow:0 -18px 40px rgba(0,0,0,.45);}',\n"
  + "    '.hn-root[data-theme=\"light\"] .hn-eventlog.hn-open{box-shadow:0 -18px 40px rgba(20,60,50,.18);}',\n"
  + "    /* 꺾은선 데이터·툴팁 — 실시간처럼 부드럽게 흐른다 */\n"
  + "    '.hn-root .hn-flow{transition:transform 2.4s cubic-bezier(.4,.2,.3,1);}',\n"
  + "    '.hn-root .hn-sweep{transition:transform 2.2s cubic-bezier(.45,.1,.35,1);}',\n"
  + "    '@media (prefers-reduced-motion:reduce)");

fs.writeFileSync(F, s);
console.log('patched hana-live.js');
