/* ── SK하이닉스 시안 편집 텍스트 ── */

(function skxTextLayer() {
  const dt = document.getElementById('dtStage');
  if (!dt) return;
  const NW = 1920, NH = 1081, CK = 'wemb-skx-text';
  const WMAP = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };

  /* Figma에서 추출한 텍스트(문자열·스타일) + 실제 SVG 글리프의 캔버스 좌표(1920×1081). id는 주입 SVG의 안정적 요소 id. */
  const SKX_TEXTS = [{"id":"skx-Text","x":630,"y":973,"w":264,"h":17,"t":"CCTV #1에 장애가 발생했습니다.","fs":20,"col":"#ffffff","al":"left","wt":"Regular"},{"id":"skx-Text_2","x":108,"y":976,"w":122,"h":15,"t":"0000-00-00","fs":20,"col":"#b8b8b8","al":"left","wt":"Regular"},{"id":"skx-Text_3","x":254,"y":976,"w":86,"h":15,"t":"00:00:00","fs":20,"col":"#f8f8f8","al":"left","wt":"Regular"},{"id":"skx-Text_4","x":178,"y":117,"w":25,"h":15,"t":"TC","fs":20,"col":"#ffffff","al":"center","wt":"Bold"},{"id":"skx-Label_3","x":477,"y":103,"w":19,"h":12,"t":"6F","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Label_4","x":476,"y":136,"w":18,"h":12,"t":"5F","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Label_5","x":476,"y":169,"w":18,"h":12,"t":"3F","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Label_6","x":477,"y":202,"w":18,"h":12,"t":"2F","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-WEMB Studio","x":85,"y":23,"w":111,"h":14,"t":"WEMB Studio","fs":17.8,"col":"rgba(255,255,255,0.9)","al":"left","wt":"Bold"},{"id":"skx-Text_5","x":244,"y":21,"w":40,"h":14,"t":"FMS","fs":20,"col":"#ebebeb","al":"left","wt":"Medium"},{"id":"skx-Text_6","x":294,"y":21,"w":105,"h":15,"t":"Dashboard","fs":20,"col":"#bbbbbb","al":"left","wt":"Regular"},{"id":"skx-Text_7","x":456,"y":23,"w":26,"h":14,"t":"이천","fs":16,"col":"#ffffff","al":"center","wt":"SemiBold"},{"id":"skx-Text_10","x":64,"y":159,"w":30,"h":18,"t":"화재","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_11","x":64,"y":254,"w":30,"h":17,"t":"누수","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_12","x":43,"y":349,"w":71,"h":18,"t":"항온항습기","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_13","x":43,"y":444,"w":71,"h":18,"t":"온습도센서","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_14","x":43,"y":539,"w":71,"h":18,"t":"토출온도계","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_15","x":44,"y":634,"w":70,"h":17,"t":"RACK온도","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_16","x":57,"y":729,"w":44,"h":18,"t":"풍속계","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_17","x":63,"y":825,"w":33,"h":16,"t":"UPS","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_18","x":44,"y":919,"w":69,"h":18,"t":"RACK전력","fs":16,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Title","x":68,"y":1045,"w":89,"h":15,"t":"Event List","fs":20,"col":"#d3d3d3","al":"left","wt":"SemiBold"},{"id":"skx-Label","x":418,"y":1052,"w":25,"h":9,"t":"Auto","fs":12,"col":"#98a6c0","al":"left","wt":"Medium"},{"id":"skx-Text_23","x":1304,"y":122,"w":133,"h":18,"t":"이천 UPS 전력량","fs":20,"col":"#ffffff","al":"left","wt":"Medium"},{"id":"skx-Text_19","x":1553,"y":143,"w":35,"h":12,"t":"Total","fs":16,"col":"#ffffff","al":"left","wt":"Medium"},{"id":"skx-Text_20","x":1624,"y":143,"w":50,"h":14,"t":"12,345","fs":16,"col":"#ffffff","al":"left","wt":"Medium"},{"id":"skx-Text_21","x":1766,"y":141,"w":26,"h":14,"t":"금일","fs":16,"col":"#cccccc","al":"left","wt":"Regular"},{"id":"skx-Text_22","x":1836,"y":141,"w":26,"h":14,"t":"전일","fs":16,"col":"#cccccc","al":"left","wt":"Regular"},{"id":"skx-Tick_8","x":1278,"y":187,"w":33,"h":10,"t":"3,000","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_9","x":1279,"y":209,"w":32,"h":10,"t":"2,500","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_10","x":1278,"y":231,"w":33,"h":10,"t":"2,000","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_11","x":1281,"y":253,"w":30,"h":10,"t":"1,500","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_12","x":1281,"y":275,"w":30,"h":10,"t":"1,000","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_13","x":1289,"y":297,"w":22,"h":9,"t":"500","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_14","x":1305,"y":319,"w":6,"h":9,"t":"0","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Period","x":1344,"y":337,"w":17,"h":9,"t":"AM","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Time_3","x":1338,"y":352,"w":30,"h":9,"t":"12:00","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Time_4","x":1423,"y":352,"w":25,"h":9,"t":"4:00","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Time_5","x":1504,"y":352,"w":25,"h":9,"t":"8:00","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Period_2","x":1592,"y":337,"w":16,"h":9,"t":"PM","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Time_6","x":1585,"y":352,"w":30,"h":9,"t":"12:00","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Time_7","x":1670,"y":352,"w":25,"h":9,"t":"4:00","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Time_8","x":1751,"y":352,"w":25,"h":9,"t":"8:00","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Period_3","x":1845,"y":337,"w":17,"h":9,"t":"AM","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Time_9","x":1832,"y":352,"w":30,"h":9,"t":"12:00","fs":10,"col":"#c9d1e0","al":"left","wt":"Regular"},{"id":"skx-Text_41","x":1304,"y":433,"w":112,"h":18,"t":"이천 센터 온도","fs":20,"col":"#ffffff","al":"left","wt":"Medium"},{"id":"skx-Text_24","x":1739,"y":445,"w":123,"h":14,"t":"정상 온도 20°~25°","fs":16,"col":"#cccccc","al":"left","wt":"Regular"},{"id":"skx-Text_26","x":1285,"y":509,"w":37,"h":18,"t":"22°","fs":21,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_28","x":1386,"y":509,"w":29,"h":18,"t":"21°","fs":21,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_30","x":1434,"y":487,"w":33,"h":18,"t":"18°","fs":24,"col":"#fce380","al":"center","wt":"Regular"},{"id":"skx-Text_32","x":1532,"y":487,"w":37,"h":18,"t":"22°","fs":21,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_34","x":1585,"y":509,"w":30,"h":18,"t":"31°","fs":24,"col":"#fc9126","al":"center","wt":"Regular"},{"id":"skx-Text_36","x":1682,"y":509,"w":35,"h":18,"t":"24°","fs":21,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_38","x":1730,"y":487,"w":38,"h":18,"t":"20°","fs":21,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Text_40","x":1828,"y":487,"w":37,"h":18,"t":"23°","fs":21,"col":"#ffffff","al":"center","wt":"Regular"},{"id":"skx-Name","x":1343,"y":637,"w":19,"h":12,"t":"TC","fs":16,"col":"#ffffff","al":"center","wt":"Medium"},{"id":"skx-Name_2","x":1486,"y":615,"w":29,"h":11,"t":"M14","fs":16,"col":"#ffffff","al":"center","wt":"Medium"},{"id":"skx-Name_3","x":1634,"y":637,"w":29,"h":12,"t":"M16","fs":16,"col":"#ffffff","al":"center","wt":"Medium"},{"id":"skx-Name_4","x":1778,"y":615,"w":35,"h":12,"t":"P&T4","fs":16,"col":"#ffffff","al":"center","wt":"Medium"},{"id":"skx-Text_25","x":1294,"y":656,"w":19,"h":10,"t":"금일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_27","x":1391,"y":656,"w":19,"h":10,"t":"전일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_29","x":1442,"y":634,"w":19,"h":10,"t":"금일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_31","x":1539,"y":634,"w":19,"h":10,"t":"전일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_33","x":1590,"y":656,"w":19,"h":10,"t":"금일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_35","x":1687,"y":656,"w":19,"h":10,"t":"전일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_37","x":1738,"y":634,"w":19,"h":10,"t":"금일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_39","x":1835,"y":634,"w":19,"h":10,"t":"전일","fs":12,"col":"#cccccc","al":"center","wt":"Medium"},{"id":"skx-Text_46","x":1304,"y":744,"w":129,"h":18,"t":"이천 상면 포화도","fs":20,"col":"#ffffff","al":"left","wt":"Medium"},{"id":"skx-Text_45","x":1325,"y":804,"w":117,"h":14,"t":"이천 상면 사용현황","fs":16,"col":"#ffffff","al":"left","wt":"Regular"},{"id":"skx-Text_42","x":1559,"y":756,"w":120,"h":14,"t":"이천 상면 사용 추이","fs":16,"col":"#ffffff","al":"left","wt":"Regular"},{"id":"skx-Text_43","x":1751,"y":756,"w":27,"h":14,"t":"사용","fs":16,"col":"#cccccc","al":"left","wt":"Regular"},{"id":"skx-Text_44","x":1822,"y":756,"w":40,"h":14,"t":"미사용","fs":16,"col":"#cccccc","al":"left","wt":"Regular"},{"id":"skx-Period_5","x":1475,"y":848,"w":19,"h":10,"t":"금일","fs":12,"col":"#cccccc","al":"left","wt":"Regular"},{"id":"skx-Number_2","x":1475,"y":868,"w":41,"h":15,"t":"50.0","fs":20,"col":"#c2db56","al":"left","wt":"Regular"},{"id":"skx-Unit_2","x":1523,"y":871,"w":9,"h":9,"t":"%","fs":12,"col":"#b4b4b4","al":"left","wt":"Regular"},{"id":"skx-Period_4","x":1475,"y":897,"w":19,"h":10,"t":"전일","fs":12,"col":"#cccccc","al":"left","wt":"Regular"},{"id":"skx-Number","x":1475,"y":915,"w":41,"h":15,"t":"40.0","fs":20,"col":"#57a6dc","al":"left","wt":"Regular"},{"id":"skx-Unit","x":1523,"y":918,"w":9,"h":9,"t":"%","fs":12,"col":"#b4b4b4","al":"left","wt":"Regular"},{"id":"skx-Tick_15","x":1574,"y":817,"w":32,"h":10,"t":"2,500","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_16","x":1574,"y":843,"w":33,"h":10,"t":"2,000","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_17","x":1576,"y":869,"w":30,"h":10,"t":"1,500","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_18","x":1576,"y":895,"w":30,"h":10,"t":"1,000","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_19","x":1584,"y":921,"w":22,"h":9,"t":"500","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Tick_20","x":1600,"y":947,"w":6,"h":9,"t":"0","fs":11,"col":"#c9d1e0","al":"right","wt":"Regular"},{"id":"skx-Value_14","x":1650,"y":792,"w":34,"h":15,"t":"870","fs":20,"col":"#b199ff","al":"center","wt":"Regular"},{"id":"skx-Value_13","x":1730,"y":792,"w":34,"h":15,"t":"870","fs":20,"col":"#b199ff","al":"center","wt":"Regular"},{"id":"skx-Value_12","x":1802,"y":792,"w":37,"h":15,"t":"682","fs":20,"col":"#b199ff","al":"center","wt":"Regular"},{"id":"skx-Label_31","x":1634,"y":968,"w":65,"h":14,"t":"25년 12월","fs":16,"col":"#cccccc","al":"center","wt":"Regular"},{"id":"skx-Label_30","x":1718,"y":968,"w":55,"h":14,"t":"26년 1월","fs":16,"col":"#cccccc","al":"center","wt":"Regular"},{"id":"skx-Label_29","x":1790,"y":968,"w":58,"h":14,"t":"26년 2월","fs":16,"col":"#cccccc","al":"center","wt":"Regular"}];

  /* 폰트는 문서 최상단에서 이미 한 번 로드된다(Pretendard Variable).
     예전에는 여기서 static Pretendard(v1.3.9)를 한 번 더 받아 같은 서체를 두 벌 내려받았다 —
     가변 폰트가 Regular·Medium·SemiBold·Bold(400/500/600/700)를 모두 덮으므로 필요 없다.
     이 시안의 텍스트 스택도 'Pretendard Variable' 을 먼저 부르도록 맞춰 두었다. */

  const SVGNS = 'http://www.w3.org/2000/svg', XHTML = 'http://www.w3.org/1999/xhtml';
  let svg = null, fos = [], building = false;
  let edits = {};
  try { edits = JSON.parse(localStorage.getItem(CK) || '{}') || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(CK, JSON.stringify(edits)); } catch (e) {} };
  const cssId = (id) => '[id="' + id.replace(/"/g, '\\"') + '"]';

  /* ── 글자색도 화면 테마를 따라가게 ────────────────────────────────────────
     이 화면의 **보이는 글자는 전부 여기서 만드는 foreignObject** 다(구워진 SVG 글리프는
     visibility:hidden 으로 숨긴다). 그래서 색을 e.col 그대로 인라인으로 박으면
     skhynix-theme.css 의 색맵도, .skx-lighttext 태깅도 닿지 않는다 — 라이트로 바꿔도
     흰 글자가 흰 배경에 그대로 남아 91개 글자가 통째로 안 보였다.
     → 색맵에 있는 색이면 그 변수로 넘겨 라이트/다크 전환과 시드 색 재적용을 CSS 가 처리하게 하고,
       흰색과 색맵에 없는 색은 전용 변수로 뺀다(값은 src/skhynix-light.css).
     폴백을 항상 원래 색으로 달아 두므로, 변수가 없으면 지금까지와 똑같이 그려진다. */
  const tbColor = (col) => {
    const v = String(col == null ? '' : col).trim();
    if (!v) return v;
    const hex = /^#([0-9a-fA-F]{6})$/.exec(v);
    const white = (hex && hex[1].toUpperCase() === 'FFFFFF') || /^rgba?\(\s*255\s*,\s*255\s*,\s*255\b/i.test(v);
    if (white) return 'var(--skx-tb-fg, ' + v + ')';
    if (!hex) return v;
    const H = hex[1].toUpperCase();
    /* 색맵 변수 → 손보정 변수 → 원래 색 순으로 물러난다. 어느 변수가 정의돼 있는지
       빌드 시점에 물어보지 않으므로(CSS 가 아직 안 붙었을 수도 있다) 순서만 맞으면 항상 옳다. */
    return 'var(--skx-c' + H + ', var(--skx-tb-' + H + ', ' + v + '))';
  };

  /* 주입한 foreignObject 제거 + 숨겼던 원본 글리프 복원 */
  function teardown() {
    fos.forEach((o) => { try { o.fo.remove(); } catch (e) {} try { o.g.style.visibility = ''; } catch (e) {} });
    fos = []; svg = null;
  }

  /* 각 텍스트를 대응하는 SVG 글리프의 '형제'로 foreignObject를 주입한다.
     - 위치는 glyph.getBBox()(부모 좌표계) 기준 → 조상 그룹의 transform(이벤트 리스트 슬라이드업)과
       viewBox 스케일이 SVG와 함께 자동 적용됨. 별도 스케일/리사이즈 계산 불필요.
     - 이벤트 리스트 텍스트는 #skx-Event List 그룹 '안'에 들어가므로 펼칠 때 같이 올라간다. */
  function build() {
    const s = dt.querySelector('.skx-svg');
    if (!s) { teardown(); return; }
    building = true;
    teardown();
    svg = s;
    /* #skx-Event List 를 항상 맨 위(마지막 형제)로 → 펼치면 다른 패널 위를 덮는다 */
    const evt = svg.querySelector('[id="skx-Event List"]');
    if (evt && evt.parentNode) evt.parentNode.appendChild(evt);

    SKX_TEXTS.forEach((e) => {
      const g = svg.querySelector(cssId(e.id));
      if (!g) return;
      let bb; try { bb = g.getBBox(); } catch (_) { return; }
      if (!bb.width && !bb.height) return;                 /* 화면 밖/미표시 글리프는 건너뜀 */
      g.style.visibility = 'hidden';                       /* 구워진 벡터 텍스트 숨김 */

      const foH = Math.max(e.fs * 1.6, bb.height + 8);
      let x, w;
      if (e.al === 'right') { x = bb.x - 240; w = bb.width + 240; }
      else if (e.al === 'center') { x = bb.x - 140; w = bb.width + 280; }
      else { x = bb.x; w = bb.width + 320; }
      const y = bb.y + bb.height / 2 - foH / 2;

      const fo = document.createElementNS(SVGNS, 'foreignObject');
      fo.setAttribute('class', 'skx-fo');
      fo.setAttribute('x', x); fo.setAttribute('y', y);
      fo.setAttribute('width', w); fo.setAttribute('height', foH);
      fo.style.overflow = 'visible'; fo.style.pointerEvents = 'none';

      /* 바깥 wrap = 정렬만 담당(테두리 없음), 안쪽 div = 실제 글자 = 편집 테두리 대상.
         예전엔 div가 foreignObject 전체 폭(글자폭+240~320px)을 채워, 편집 점선 영역이 내용보다 훨씬 크게 보였다.
         이제 글자에 딱 맞게 줄어들고, 타이핑으로 길어질 여유 폭은 wrap(=fo)이 그대로 제공한다. */
      const wrap = document.createElementNS(XHTML, 'div');
      const ws = wrap.style;
      ws.width = '100%'; ws.height = '100%'; ws.display = 'flex'; ws.alignItems = 'center';
      ws.justifyContent = e.al === 'center' ? 'center' : (e.al === 'right' ? 'flex-end' : 'flex-start');
      ws.pointerEvents = 'none';

      const div = document.createElementNS(XHTML, 'div');
      div.setAttribute('class', 'skx-tb'); div.dataset.id = e.id;
      const st = div.style;
      /* 글자 폭에 정확히 맞추고( max-content ), flex 축소로 잘리지 않게 고정( 0 0 auto ).
         길게 입력하면 fo(글자폭+여유)의 남은 폭으로 자연스럽게 늘어난다. */
      st.flex = '0 0 auto'; st.width = 'max-content';
      st.fontFamily = '"Pretendard","Pretendard GOV",-apple-system,system-ui,sans-serif';
      st.fontSize = e.fs + 'px'; st.lineHeight = '1'; st.letterSpacing = '-0.01em'; st.whiteSpace = 'nowrap';
      st.color = tbColor(e.col); st.fontWeight = WMAP[e.wt] || 400; st.pointerEvents = 'none';
      div.textContent = (e.id in edits) ? edits[e.id] : e.t;
      div.addEventListener('input', () => { edits[e.id] = div.textContent; clearTimeout(div.__t); div.__t = setTimeout(save, 300); });
      div.addEventListener('blur', () => { edits[e.id] = div.textContent; save(); });
      div.addEventListener('pointerdown', (ev) => { if (div.getAttribute('contenteditable') === 'true') ev.stopPropagation(); });
      wrap.appendChild(div);
      fo.appendChild(wrap);
      g.parentNode.insertBefore(fo, g.nextSibling);
      fos.push({ fo, div, g, e });
    });
    building = false;
    applyEditing();
  }

  /* '내용 수정' 모드일 때만 편집 가능(+포인터 수신). 평소엔 pointer-events:none 이라
     SVG 인터랙션(층 선택·이벤트 펼침 등)이 그대로 동작한다. */
  function applyEditing() {
    const on = dt.classList.contains('dt-content-editing');
    fos.forEach((o) => {
      o.fo.style.pointerEvents = on ? 'auto' : 'none';
      o.div.style.pointerEvents = on ? 'auto' : 'none';
      if (on) { o.div.setAttribute('contenteditable', 'true'); o.div.classList.add('skx-edit'); }
      else { o.div.removeAttribute('contenteditable'); o.div.classList.remove('skx-edit'); }
    });
  }

  function sync() {
    if (building) return;
    const s = dt.querySelector('.skx-svg');
    if (!s) { if (svg) teardown(); return; }
    if (s !== svg || !fos.length || !fos[0].fo.isConnected) build();
    else applyEditing();
  }

  const mo = new MutationObserver((muts) => {
    if (building) return;
    if (muts.every((m) => m.target.closest && m.target.closest('.skx-fo'))) return;
    sync();
  });
  mo.observe(dt, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  sync();
  window.__skxTextSync = sync;
})();
