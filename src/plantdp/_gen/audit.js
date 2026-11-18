/* 라이트 테마 세밀 점검 — 미리보기 페이지에 심어 쓰는 검사 도구(브라우저용).
   window.__shAudit(shotBase64) → { text: [...], effects: [...] }
   · text    — 화면의 모든 글자(<p>)를 캡처 픽셀로 바탕색을 재서 WCAG 대비. 큰 글자(24px · 굵은 18.66px 이상)는 3:1, 나머지는 4.5:1 기준.
   · effects — 그림자 · 빛(box-shadow · text-shadow · filter drop-shadow)을 이름별로 모은다(다크 전제의 짙은 그림자 · 네온 빛 찾기).
   Playwright: page.addScriptTag({ url: '/src/shinhan/_gen/audit.js' }) 뒤 page.evaluate(s => __shAudit(s), shot). */
(function () {
  'use strict';
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function L(r, g, b) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
  function ratio(a, b) { return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
  function path(el) {
    var out = [], e = el;
    while (e && out.length < 3) { var n = e.getAttribute && e.getAttribute('data-name'); if (n) out.unshift(n); e = e.parentElement; }
    return out.join(' > ');
  }
  window.__shAudit = async function (shot) {
    var img = new Image(); img.src = 'data:image/png;base64,' + shot; await img.decode();
    var cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    var g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    var D = g.getImageData(0, 0, cv.width, cv.height).data;
    var dimmed = !!document.querySelector('.sh-dim');
    var text = [];
    document.querySelectorAll('p').forEach(function (p) {
      if (!p.textContent.trim() || !p.offsetParent || p.closest('.sh-chart')) return;
      if (dimmed && !p.closest('.sha-root')) return;
      var cs = getComputedStyle(p);
      if (cs.visibility === 'hidden') return;
      var r = p.getBoundingClientRect();
      if (r.width < 2 || r.right < 0 || r.left > cv.width) return;
      var grad = cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text';
      var m = cs.color.match(/[\d.]+/g).map(Number);
      var fs = parseFloat(cs.fontSize), fw = +cs.fontWeight;
      var large = fs >= 24 || (fs >= 18.66 && fw >= 700);
      /* 글자색 — 그라디언트 글자는 그라디언트 정지색 중 가장 밝은 것 */
      var tc = m.slice(0, 3);
      if (grad) {
        var cols = (cs.backgroundImage.match(/rgba?\([^)]*\)/g) || []).map(function (c) { return c.match(/[\d.]+/g).map(Number); });
        if (!cols.length) return;
        cols.sort(function (a, b) { return L(b[0], b[1], b[2]) - L(a[0], a[1], a[2]); });
        tc = cols[0];
      }
      var Lt = L(tc[0], tc[1], tc[2]);
      var px = [];
      for (var y = Math.max(0, r.top | 0); y < Math.min(cv.height, Math.ceil(r.bottom)); y++)
        for (var x = Math.max(0, r.left | 0); x < Math.min(cv.width, Math.ceil(r.right)); x++) {
          var i = (y * cv.width + x) * 4; var l = L(D[i], D[i + 1], D[i + 2]); px.push([Math.abs(l - Lt), l]);
        }
      if (!px.length) return;
      px.sort(function (a, b) { return b[0] - a[0]; });
      var far = px.slice(0, Math.max(1, px.length >> 1)).map(function (q) { return q[1]; }).sort(function (a, b) { return a - b; });
      var cr = ratio(Lt, far[far.length >> 1]);
      var need = large ? 3 : 4.5;
      if (cr < need) text.push({ t: p.textContent.trim().slice(0, 18), where: path(p), cr: +cr.toFixed(2), need: need, color: cs.color, fs: fs, fw: fw });
    });
    var eff = {};
    document.querySelectorAll('.sh-root *').forEach(function (e) {
      if (e.closest('.sh-chart')) return;
      var cs = getComputedStyle(e);
      [['box-shadow', cs.boxShadow], ['text-shadow', cs.textShadow], ['filter', cs.filter]].forEach(function (kv) {
        if (!kv[1] || kv[1] === 'none') return;
        if (kv[0] === 'filter' && !/drop-shadow|brightness|invert/.test(kv[1])) return;
        var key = kv[0] + ' :: ' + kv[1].slice(0, 110);
        (eff[key] = eff[key] || []).push(path(e));
      });
    });
    var effects = Object.keys(eff).map(function (k) { return { k: k, n: eff[k].length, ex: eff[k].slice(0, 2) }; });
    return { text: text, effects: effects };
  };
})();
