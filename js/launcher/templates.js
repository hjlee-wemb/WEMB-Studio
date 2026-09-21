/* ── 템플릿 카탈로그 — UI Library 1.0 프로젝트 묶음 ── */

(function () {
  /* ── 템플릿 갤러리 데이터 — Figma Studio(169:150)의 카드/카테고리 그대로 ──
     썸네일은 src/templates/tpl-01..18.jpg. 화면 종류는 제목 접두어로 판별. */
  /* 카테고리 — 2단 계층: 화면 유형(상위) → 업무 영역(하위, 화면 유형 종속) */
  const TPL_SCREENS = ['2D 대시보드', '3D 디지털트윈'];
  const TPL_AREAS = {
    '2D 대시보드': ['종합현황', '인프라', '서비스·거래', '비즈니스', '이벤트·장애', '안전·보안', '에너지·환경', 'AI·예측', '운영·SOP'],
    '3D 디지털트윈': ['부지·건물·층', '시설·설비', 'IT·데이터센터', '발전·에너지', '안전·소방', '물리보안', '환경·기상', '이벤트', '2D 정보패널', 'SOP·운영'],
  };
  /* ── 템플릿 원본(카탈로그) — UI Library 1.0 썸네일을 프로젝트 단위로 묶은 것 ──
     한 프로젝트에 화면이 여럿이면 slides 로 묶어 카드 한 장으로 올린다.
     (상세에서 슬라이드로 넘겨 보고, '스튜디오 열기'를 누르면 그 화면들이 한 폴더 안의 화면들로 만들어진다)
     썸네일은 src/templates/lib/<이름>.jpg(1200×675), 스튜디오에 얹히는 원본은 <이름>-hi.jpg(1920폭). */
  const TPL_LIB = 'src/templates/lib/';
  const TL = (name, label) => ({ img: TPL_LIB + name + '.jpg', label });
  /* [제목, 업무 영역, 등록일, 화면들] — 제목 접두어(Digital Twin / Dashboard)로 화면 유형이 갈린다 */
  const TPL_DEFS = [
    { title: 'Digital Twin: POSCO KDB CCTV 관제', area: '물리보안', date: 'January 20, 2025', slides: [
      { img: 'src/templates/posco-main.jpg', label: '메인' }] },
    { title: 'Digital Twin: LS Electric STATCOM', area: '발전·에너지', date: 'February 26, 2024', slides: [
      { img: 'src/templates/lselectric-statcom.jpg', label: 'STATCOM' }] },
    { title: 'Digital Twin: SKHynix Icheon 1level', area: '부지·건물·층', date: 'February 12, 2024', slides: [
      TL('skhynix-icheon-1level', '1level 전경'), TL('skhynix-icheon-2level', '2level 전경')] },
    { title: 'Digital Twin: Gammania', area: '부지·건물·층', date: 'April 3, 2024', slides: [
      TL('gammania-overviewb', '종합 전경'), TL('gammania-floorscreen', '층별 화면')] },
    { title: 'Dashboard: Icheon main', area: '종합현황', date: 'November 3, 2025', slides: [
      TL('icheon-main', '메인')] },
    { title: 'Dashboard: NH-DCIM', area: '인프라', date: 'June 18, 2025', slides: [
      TL('nh-dcim', 'DCIM 현황')] },
    { title: 'Dashboard: KB', area: '종합현황', date: 'September 27, 2026', slides: [
      TL('kb-main', '메인'), TL('kb-main02', '메인 02')] },
    { title: 'Dashboard: Hyundai Capital', area: '서비스·거래', date: 'March 9, 2025', slides: [
      TL('hyundaicapital-p01-service-map', '서비스 맵'), TL('hyundaicapital-p03-monitoring', '모니터링'),
      TL('hyundaicapital-p07-it-kpi', 'IT KPI'), TL('hyundaicapital-p08-it-status', 'IT 현황')] },
    { title: 'Dashboard: Hana Card', area: '서비스·거래', date: 'December 14, 2025', slides: [
      TL('hanacard-main', '메인'), TL('hanacard-approval-text', '승인 현황')] },
    { title: 'Dashboard: Shinhan Card Security', area: '안전·보안', date: 'July 19, 2024', slides: [
      TL('shinhan-card-security', '보안 현황')] },
    { title: 'Dashboard: PSIM', area: '안전·보안', date: 'August 30, 2024', slides: [
      TL('psim-dashboard-ic', 'PSIM 현황')] },
    { title: 'Dashboard: SHOneView', area: '종합현황', date: 'August 1, 2026', slides: [
      TL('shoneview-main01', '메인 01'), TL('shoneview-main02', '메인 02'), TL('shoneview-main03', '메인 03'),
      TL('shoneview-network', '네트워크'), TL('shoneview-p03-was', 'WAS'), TL('shoneview-p05-db', 'DB'),
      TL('shoneview-p06-01-systemstatus01', '시스템현황 P06-01 · 01'), TL('shoneview-p06-01-systemstatus02', '시스템현황 P06-01 · 02'),
      TL('shoneview-p06-02-systemstatus01', '시스템현황 P06-02 · 01'), TL('shoneview-p06-02-systemstatus02', '시스템현황 P06-02 · 02'),
      TL('shoneview-p06-02-systemstatus03', '시스템현황 P06-02 · 03'), TL('shoneview-p06-02-systemstatus04', '시스템현황 P06-02 · 04'),
      TL('shoneview-login', '로그인')] },
    { title: 'Dashboard: Hanbit', area: '에너지·환경', date: 'January 22, 2025', slides: [
      TL('hanbit', '발전소 현황')] },
    { title: 'Dashboard: HC Approval', area: '서비스·거래', date: 'March 28, 2024', slides: [
      TL('hc-approval', '승인 현황')] },
    { title: 'Dashboard: KOEN', area: '에너지·환경', date: 'May 22, 2024', slides: [
      TL('koen-dashboard01', '발전 현황')] },
    { title: 'Dashboard: DCMS', area: '에너지·환경', date: 'February 6, 2026', slides: [
      TL('dcms-energystatus', '에너지 현황'), TL('dcms-electricty', '전력 현황')] },
    { title: 'Dashboard: Figma LottieFiles', area: '종합현황', date: 'April 25, 2025', slides: [
      TL('figma-lottiefiles', '모션 컴포넌트')] },
    { title: 'Dashboard: KISED', area: '비즈니스', date: 'July 11, 2025', slides: [
      TL('kised01', '현황 01'), TL('kised02', '현황 02')] },
    { title: 'Digital Twin: Digicentre DCIM', area: 'IT·데이터센터', date: 'October 30, 2025', slides: [
      TL('digicentre-dcim', '센터 전경')] },
    { title: 'Dashboard: Global Status', area: '종합현황', date: 'January 16, 2026', slides: [
      TL('global-status-1', '글로벌 현황 01'), TL('global-status-2', '글로벌 현황 02')] },
    { title: 'Dashboard: SW Security', area: '안전·보안', date: 'July 5, 2024', slides: [
      TL('swsecurrity', '통합보안 현황')] },
    { title: 'Dashboard: Korea Status', area: '종합현황', date: 'April 11, 2026', slides: [
      TL('korea-status-1', '국내 현황')] },
    { title: 'Dashboard: KORAIL Concept', area: '인프라', date: 'February 28, 2025', slides: [
      TL('korail-concept', '노선 현황')] },
    { title: 'Dashboard: Sewerage System Concept', area: '에너지·환경', date: 'June 9, 2024', slides: [
      TL('seweragesys-concept', '하수처리 현황')] },
    { title: 'Dashboard: NRTEC Concept', area: '종합현황', date: 'September 14, 2025', slides: [
      TL('nrtec-concept-2dmap', '2D 맵'), TL('nrtec-concept-3dmap', '3D 맵')] },
    { title: 'Digital Twin: Facility Status', area: '시설·설비', date: 'November 24, 2026', slides: [
      TL('facility-status-1', '설비 현황 01'), TL('facility-status-2', '설비 현황 02')] },
    { title: 'Dashboard: Port Status', area: '종합현황', date: 'March 2, 2026', slides: [
      TL('portstatus-overalloperation', '종합 운영'), TL('portstatus-vesselinfo', '선박 정보'), TL('portstatus-login-concept', '로그인')] },
    { title: 'Digital Twin: Solar Concept (FEMS)', area: '발전·에너지', date: 'August 18, 2025', slides: [
      TL('solor-concept-fems', '발전 단지')] },
    { title: 'Digital Twin: LSE Demo', area: '시설·설비', date: 'June 2, 2026', slides: [
      TL('lse-demo-main', '메인'), TL('lse-demo-floor', '층 현황'), TL('lse-demo-electricroom', '전기실'),
      TL('lse-demo-detail-vcb', 'VCB 상세'), TL('lse-demo-pop-facilitystatus', '팝업 · 설비 현황'),
      TL('lse-demo-pop-generator', '팝업 · 발전기'), TL('lse-demo-pop-vcb-safe', '팝업 · VCB 안전')] },
    { title: 'Digital Twin: Hanjin main', area: '부지·건물·층', date: 'September 8, 2024', slides: [
      TL('hanjin-main', '메인')] },
    { title: 'Dashboard: Woori Bank', area: '서비스·거래', date: 'December 1, 2026', slides: [
      TL('wooribank-transaction', '거래 현황'), TL('wooribank-performance', '성능 현황'), TL('wooribank-event', '이벤트 현황')] },
    { title: 'Dashboard: Army Prototype', area: '안전·보안', date: 'October 17, 2024', slides: [
      TL('army-prototype01', '프로토타입 01'), TL('army-prototype02', '프로토타입 02')] },
    { title: 'Dashboard: NH Biometrics', area: '서비스·거래', date: 'May 6, 2026', slides: [
      TL('nh-biometrics', '생체인증 현황')] },
    { title: 'Dashboard: HuaNan Bank', area: '서비스·거래', date: 'July 30, 2026', slides: [
      TL('huananbank-main', '메인'), TL('huananbank-corebiz01-01', '핵심업무 01-1'), TL('huananbank-corebiz01-02', '핵심업무 01-2'),
      TL('huananbank-corebiz02', '핵심업무 02'), TL('huananbank-banking', '뱅킹'), TL('huananbank-atm', 'ATM'),
      TL('huananbank-payment-status', '결제 현황'), TL('huananbank-internet', '인터넷뱅킹'),
      TL('huananbank-domestic-branch', '국내 지점'), TL('huananbank-overseas-branch', '해외 지점'), TL('huananbank-itinfra', 'IT 인프라')] },
    { title: 'Digital Twin: Handok GridSol Cube', area: '발전·에너지', date: 'January 9, 2025', slides: [
      TL('handok-gridsol-cube', '단지 전경')] },
    { title: 'Dashboard: Incheon Monitoring', area: '인프라', date: 'March 20, 2026', slides: [
      TL('new-incheon01', '모니터링 01'), TL('new-incheon02', '모니터링 02'), TL('new02-incheon02', '모니터링 03')] },
    { title: 'Digital Twin: BioTech D-BT', area: '부지·건물·층', date: 'November 12, 2025', slides: [
      TL('biotech-d-bt-main', '메인'), TL('biotech-d-bt-overview', '전경'), TL('biotech-d-bt-2f', '2층')] },
    { title: 'Dashboard: SKH Security', area: '안전·보안', date: 'August 7, 2025', slides: [
      TL('skh-security', '보안 현황')] },
    { title: 'Dashboard: SHCard Smart Channel', area: '종합현황', date: 'May 15, 2026', slides: [
      TL('shcard-overall', '종합현황'), TL('shcard-smartchannel-general-board', '종합 보드'),
      TL('shcard-smartchannel-system-status', '시스템 현황'), TL('shcard-smartchannel-service-homepage', '서비스 · 홈페이지'),
      TL('shcard-smartchannel-iinfra-dbms', '인프라 · DBMS')] },
    { title: 'Dashboard: HANA Bank H.I.T', area: '종합현황', date: 'June 30, 2025', slides: [
      { img: 'src/templates/hana-overview-02.jpg', label: '종합현황02' }] },
  ];
  const TEMPLATES = TPL_DEFS.map((d, i) => {
    const n = i + 1;
    const dt = d.title.startsWith('Digital Twin');
    const screenType = dt ? '3D 디지털트윈' : '2D 대시보드';
    return {
      img: d.slides[0].img,
      title: d.title,
      /* 주소용 이름 — 'Digital Twin: SKHynix Icheon 1level' → digital-twin-skhynix-icheon-1level */
      slug: d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      date: d.date,
      /* 정렬용 값 — ts(최신순): 표시 날짜에서 직접 파싱, pop(인기순): 안정적 의사 조회수 */
      ts: Date.parse(d.date),
      pop: ((n * 7919) % 900) + 100,
      screen: dt ? 'dt' : 'dash',
      screenType, /* 화면 유형 필터용 */
      area: d.area, /* 업무 영역 필터용 */
      year: String(new Date(Date.parse(d.date)).getFullYear()), /* 연도 필터용 */
      badges: [[screenType, 'sol'], [d.area, 'con']],
      /* 화면이 둘 이상일 때만 슬라이드 — 한 장짜리는 상세에서 큰 그림 하나로 보여 준다 */
      slides: d.slides.length > 1 ? d.slides.slice() : null,
    };
  });
  /* SKHynix Icheon 1level — '스튜디오 열기' 시 Figma(1:139)를 HTML/CSS DOM으로 구현한 화면으로 연다
     (src/skhynix-screen.js). 갤러리·상세 미리보기 썸네일은 그 화면을 캡처한 이미지다. */
  (function () {
    const sk = TEMPLATES.find((t) => t.title === 'Digital Twin: SKHynix Icheon 1level');
    if (sk) {
      sk.tpl = 'skhynix';
      sk.img = 'src/templates/skhynix-1.jpg';
      /* 앞 두 장은 실제 화면(Figma 64:1782 메인 · 64:2658 UPS 전력 상세),
         세 번째 2level 은 아직 카탈로그 그림뿐이라 이미지 화면(imageOnly)으로 함께 만든다. */
      sk.slides = [
        { img: 'src/templates/skhynix-1.jpg', label: '메인' },
        { img: 'src/templates/skhynix-2.jpg', label: 'UPS 전력 상세' },
        { img: TPL_LIB + 'skhynix-icheon-2level.jpg', label: '2level 전경', imageOnly: true },
      ];
    }
  })();
  /* Icheon main — '스튜디오 열기' 시 Figma(64:3367 "Screen/FMS Hub")를 순수 HTML/CSS DOM 으로
     재구축한 화면으로 연다(src/skhynix-hub.js). 상세 미리보기도 그 화면을 그대로 캡처한 이미지다. */
  (function () {
    const ic = TEMPLATES.find((t) => t.title === 'Dashboard: Icheon main');
    if (ic) {
      ic.tpl = 'skhynix-hub';
      ic.img = 'src/templates/icheon-hub.jpg';
      /* 두 장 — [0] 메인(64:3367 Screen/FMS Hub), [1] 항온항습기 상세(64:4059 Screen/HVAC Detail).
         두 번째 장은 '스튜디오 열기' 시 같은 프로젝트의 두 번째 화면으로 함께 만들어진다. */
      ic.slides = [
        { img: 'src/templates/icheon-hub.jpg', label: '메인' },
        { img: 'src/templates/icheon-hvac.jpg', label: '항온항습기 상세' },
      ];
    }
  })();
  /* Hanjin main — 상세 페이지에서 3장(메인·입출문현황·하차현황)을 슬라이드로 보여준다. 메인이 첫 장. */
  (function () {
    const hj = TEMPLATES.find((t) => t.title === 'Digital Twin: Hanjin main');
    if (hj) {
      hj.tpl = 'hanjin'; /* 스튜디오 열기 시 한진 디지털 트윈 페이지로 재현 */
      hj.img = 'src/templates/hanjin-1.jpg';
      /* 앞 세 장은 실제 화면, 상차현황은 아직 카탈로그 그림뿐이라 이미지 화면(imageOnly)으로 함께 만든다 */
      hj.slides = [
        { img: 'src/templates/hanjin-1.jpg', label: '메인' },
        { img: 'src/templates/hanjin-2.jpg', label: '입출문현황' },
        { img: 'src/templates/hanjin-3.jpg', label: '하차현황' },
        { img: TPL_LIB + 'hanjin-2d-ld.jpg', label: '상차현황', imageOnly: true },
      ];
    }
  })();
  /* HANA Bank H.I.T — '스튜디오 열기' 시 Figma(H3S2M7DUCvuJgi75oBqg6W) 화면 15장을
     순수 HTML/CSS DOM 으로 재구축한 것(src/hana-*.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */
  (function () {
    const hn = TEMPLATES.find((t) => t.title === 'Dashboard: HANA Bank H.I.T');
    if (hn) {
      hn.tpl = 'hana';
      hn.img = 'src/templates/hana-overview-02.jpg';
      hn.slides = [
        { img: 'src/templates/hana-overview-02.jpg', label: '종합현황02' },
        { img: 'src/templates/hana-cloud-01.jpg', label: '클라우드현황01' },
        { img: 'src/templates/hana-cloud-02.jpg', label: '클라우드현황02' },
        { img: 'src/templates/hana-middleware.jpg', label: '미들웨어현황' },
        { img: 'src/templates/hana-infra-main.jpg', label: '인프라 메인' },
        { img: 'src/templates/hana-infra-detail.jpg', label: '인프라 상세' },
        { img: 'src/templates/hana-event.jpg', label: '이벤트현황' },
        { img: 'src/templates/hana-network-01.jpg', label: '네트워크현황01' },
        { img: 'src/templates/hana-network-02.jpg', label: '네트워크현황02' },
        { img: 'src/templates/hana-network-03.jpg', label: '네트워크현황03' },
        { img: 'src/templates/hana-facility.jpg', label: '상면관리' },
        { img: 'src/templates/hana-security-01.jpg', label: '보안시스템01' },
        { img: 'src/templates/hana-security-02.jpg', label: '보안시스템02' },
        { img: 'src/templates/hana-login.jpg', label: '로그인' },
      ];
    }
  })();
  /* POSCO KDB CCTV 관제 — '스튜디오 열기' 시 Figma(dj0SONcO5BySCm7yDdZrNc) Screen/Control Main 을
     순수 HTML/CSS DOM 으로 재구축한 것(src/posco-main.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */
  (function () {
    const pk = TEMPLATES.find((t) => t.title === 'Digital Twin: POSCO KDB CCTV 관제');
    if (pk) {
      pk.tpl = 'posco';
      pk.img = 'src/templates/posco-main.jpg';
      /* 화면 7장 — 슬라이드 순서가 곧 프로젝트 안의 화면 순서다(home.js 의 tplScene 표와 짝이 맞아야 한다) */
      pk.slides = [
        { img: 'src/templates/posco-main.jpg', label: '메인' },
        { img: 'src/templates/posco-sop.jpg', label: 'SOP 대응 절차' },
        { img: 'src/templates/posco-ack.jpg', label: '메인(Ack 알림)' },
        { img: 'src/templates/posco-overview.jpg', label: '종합현황' },
        { img: 'src/templates/posco-route.jpg', label: '출입동선' },
        { img: 'src/templates/posco-floors.jpg', label: '전체층' },
        { img: 'src/templates/posco-detail.jpg', label: '단층' },
      ];
    }
  })();
  /* LS Electric STATCOM — '스튜디오 열기' 시 Figma(KkmCQi05F7eSb3tHO7ZW0Q) 화면 2장을
     순수 HTML/CSS DOM 으로 재구축한 것(src/lselectric-*.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */
  (function () {
    const ls = TEMPLATES.find((t) => t.title === 'Digital Twin: LS Electric STATCOM');
    if (ls) {
      ls.tpl = 'lselectric';
      ls.img = 'src/templates/lselectric-statcom.jpg';
      /* 화면 2장 — 슬라이드 순서가 곧 프로젝트 안의 화면 순서다(home.js 의 tplScene 표와 짝) */
      ls.slides = [
        { img: 'src/templates/lselectric-statcom.jpg', label: 'STATCOM' },
        { img: 'src/templates/lselectric-datacenter.jpg', label: 'Data Center' },
        { img: 'src/templates/lselectric-acb.jpg', label: 'ACB 진단' },
        { img: 'src/templates/lselectric-system.jpg', label: '계통 진단' },
        { img: 'src/templates/lselectric-energy.jpg', label: '에너지 진단' },
      ];
    }
  })();
  /* 실제 화면이 붙어 있는 템플릿인지 — Figma를 HTML/CSS DOM(+SVG)으로 재구축해 두어
     '스튜디오 열기'를 누르면 그 화면이 그대로 열리는 것들이다.
     나머지는 아직 카탈로그 그림 한 장뿐이라 갤러리에서 '제작중'으로 표시한다.
     openTemplate() 도 같은 함수를 써서 표시와 실제 동작이 어긋나지 않게 한다. */
  /* 템플릿 데이터의 날짜는 영문('November 3, 2025')이다. 한국어 UI에 그대로 노출되면
     제목만 영어인 카드에서 날짜까지 영어가 되어 이질감이 커진다.
     데이터는 건드리지 않고 표시할 때만 한국어로 바꾼다(파싱 실패 시 원문 유지). */
  function tplDate(v) {
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }
  const tplIsLive = (t) => !!t && (t.tpl === 'lselectric' || t.tpl === 'posco' || t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub');

  window.WEMB = window.WEMB || {};
  WEMB.templates = { TEMPLATES, TPL_AREAS, TPL_SCREENS, tplDate, tplIsLive };
})();
