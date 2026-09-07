/* ════════════════════════════════════════════════════════════════════════════
   이벤트 로그·이벤트 리스트의 발생시각을 '열 때마다' 최근으로 다시 찍는다.

   왜 — 시안에 박힌 발생시각은 만든 날에 멈춰 있다. 며칠만 지나도 표가 지난 날짜
   (때로는 오지 않은 날짜)를 가리켜, 살아 움직이는 관제 화면이 아니라 오래된
   스크린샷처럼 보인다. 화면을 열 때 맨 윗줄이 '방금'이 되도록 표를 옮겨 온다.

   무엇을 지키나
   · **줄 사이 간격은 원본 그대로 둔다.** 표 전체를 통째로 밀 뿐이라, 시안이 설계한
     리듬(같은 분 안에 몰린 두 줄, 며칠 건너뛴 줄)이 그대로 살아 있다.
   · **글자 모양도 원본을 따른다.** 'YYYY-MM-DD HH:mm:ss' 든 'YY-MM-DD HH:mm:ss' 든
     'HH:mm:ss' 든, 읽은 모양 그대로 다시 쓴다(구분자·연도 자릿수·초 유무까지).
   · 줄이 **전부 같은 시각**이면 그건 자리표시자다. 그때만 위에서부터 조금씩 벌려
     흐르는 표처럼 만든다.
   · 맨 윗줄은 '지금'이 아니라 **몇십 초 전**에 둔다 — 초 단위까지 현재와 똑같으면
     오히려 만들어 넣은 티가 난다.

   언제 부르나 — 화면을 그린 직후, '패널편집'이 글자 기본값을 다시 캡처하기(
   __dtRecaptureDefaults) **전에**. 그래야 새로 찍은 시각이 기본값이 되고, 사용자가
   손으로 고쳐 둔 시각은 캡처가 다시 덮어 준다(사용자 편집이 이긴다).

   쓰는 곳 — 기본 디지털트윈 시안(#dtTable) · SK하이닉스 이천 1level(SVG 이벤트
   리스트) · 이천 FMS Hub / 항온항습기 상세(Td/Time). 한진 통합관제는 이벤트 현황이
   원래 자리표시자('txt')라 hanjin-live.js 의 피드가 열 때 현재 시각으로 채운다.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DAY = 86400000;
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };

  /* 읽을 수 있는 시각 모양. 한 표는 한 형식이라는 전제 — 섞여 있어도 칸마다 제 모양으로 되쓴다. */
  var PATTERNS = [
    /* 2026-01-12 09:33:00 · 2026.01.12 09:33 */
    {
      re: /^(\d{4})([-./])(\d{1,2})\2(\d{1,2})([ T])(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
      read: function (m) {
        return {
          t: new Date(+m[1], +m[3] - 1, +m[4], +m[6], +m[7], m[8] ? +m[8] : 0).getTime(),
          fmt: { kind: 'date', y4: true, sep: m[2], gap: m[5], sec: m[8] != null },
        };
      },
    },
    /* 26-12-12 09:00:29 — 두 자리 연도 */
    {
      re: /^(\d{2})([-./])(\d{1,2})\2(\d{1,2})([ T])(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
      read: function (m) {
        return {
          t: new Date(2000 + +m[1], +m[3] - 1, +m[4], +m[6], +m[7], m[8] ? +m[8] : 0).getTime(),
          fmt: { kind: 'date', y4: false, sep: m[2], gap: m[5], sec: m[8] != null },
        };
      },
    },
    /* 14:32:57 · 16:45 — 날짜가 없다. 같은 날로 읽고, 아래로 내려가다 시각이 되돌아가면 전날로 넘긴다 */
    {
      re: /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
      read: function (m) {
        return {
          sod: (+m[1]) * 3600 + (+m[2]) * 60 + (m[3] ? +m[3] : 0),
          fmt: { kind: 'clock', sec: m[3] != null },
        };
      },
    },
  ];

  function write(d, f) {
    var hm = p2(d.getHours()) + ':' + p2(d.getMinutes()) + (f.sec ? ':' + p2(d.getSeconds()) : '');
    if (f.kind === 'clock') return hm;
    var y = f.y4 ? String(d.getFullYear()) : p2(d.getFullYear() % 100);
    return y + f.sep + p2(d.getMonth() + 1) + f.sep + p2(d.getDate()) + f.gap + hm;
  }

  function parse(s) {
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = PATTERNS[i].re.exec(s);
      if (m) return PATTERNS[i].read(m);
    }
    return null;
  }

  /* 시각 칸들을 '위에서 아래로(최신 → 과거)' 순서대로 넘긴다.
     opt.lead  — 맨 윗줄을 몇 초 전에 둘지(기본 25~110초 사이에서 고른다)
     opt.step  — 전부 같은 시각일 때 줄마다 벌릴 간격 [최소, 최대] 초(기본 45~210)
     opt.now   — 기준 시각(테스트용)
     돌려주는 값은 실제로 고쳐 쓴 칸 수. */
  function restamp(cells, opt) {
    opt = opt || {};
    var rows = [];
    [].slice.call(cells || []).forEach(function (el) {
      if (!el || el === document.activeElement) return;   /* 지금 고쳐 쓰는 중인 칸은 건드리지 않는다 */
      var s = String(el.textContent == null ? '' : el.textContent).trim();
      if (!s) return;
      var r = parse(s);
      if (r) rows.push({ el: el, t: r.t, sod: r.sod, fmt: r.fmt });
    });
    if (!rows.length) return 0;

    /* 날짜 없는 시각은 오늘 자정 기준으로 놓고, 내려가다 시각이 커지면 하루씩 앞당긴다 */
    var mid = new Date(); mid.setHours(0, 0, 0, 0);
    var prev = null;
    rows.forEach(function (r) {
      if (r.t == null) {
        r.t = mid.getTime() + r.sod * 1000;
        while (prev != null && r.t > prev) r.t -= DAY;
      }
      prev = r.t;
    });

    var now = (opt.now ? new Date(opt.now) : new Date()).getTime();
    var lead = (opt.lead != null ? opt.lead : 25 + Math.random() * 85) * 1000;
    var top = now - lead;
    var newest = rows[0].t, oldest = rows[0].t;
    rows.forEach(function (r) { if (r.t > newest) newest = r.t; if (r.t < oldest) oldest = r.t; });

    if (newest === oldest) {
      /* 전부 같은 시각 = 자리표시자다. 이때만 위에서부터 벌려 흐르는 표처럼 만든다 */
      var lo = (opt.step && opt.step[0]) || 45, hi = (opt.step && opt.step[1]) || 210;
      var t = top;
      rows.forEach(function (r, i) {
        if (i) t -= (lo + Math.random() * (hi - lo)) * 1000;
        r.t = t;
      });
    } else {
      /* 간격은 원본 그대로 — 표를 통째로 민다 */
      var shift = top - newest;
      rows.forEach(function (r) { r.t += shift; });
    }

    var n = 0;
    rows.forEach(function (r) {
      var s = write(new Date(r.t), r.fmt);
      if (r.el.textContent !== s) { r.el.textContent = s; n++; }
    });
    return n;
  }

  /* 흔한 형태 — 뿌리 안에서 선택자로 시각 칸을 찾아 그대로 넘긴다 */
  function restampIn(root, selector, opt) {
    if (!root || !root.querySelectorAll) return 0;
    return restamp(root.querySelectorAll(selector), opt);
  }

  window.wembRestampTimes = restamp;
  window.wembRestampTimesIn = restampIn;
})();
