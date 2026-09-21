/* 자동 생성물 — POSCO KDB CCTV 관제 화면(Figma dj0SONcO5BySCm7yDdZrNc)의 에셋 라이브러리 등록 목록.
   등록 단위는 컴포넌트다(부품은 넣지 않는다). 같은 그림이 여러 화면에 겹치면 한 번만 올린다.
   마크업도 CSS 도 복사해 두지 않는다 — 화면 빌더(build_pkXX)의 DOM 에서 노드 id 로 그때그때
   잘라 쓰고, 시트는 window.PKM_CSS 등 이미 로드된 것을 붙인다. 그래서 글자는 실제 텍스트 그대로고
   ('패널편집'으로 고칠 수 있다) 라이트 테마·'색 정하기'도 화면과 똑같이 따라온다.
   생성기: src/posco-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */
window.__POSCO_ASSETS = {
 "base": "src/posco/",
 "screens": {
  "pkm": {
   "build": "build_pkm",
   "css": "PKM_CSS",
   "light": "PKM_LIGHT_CSS",
   "title": "메인",
   "base": "src/posco/"
  },
  "pka": {
   "build": "build_pka",
   "css": "PKA_CSS",
   "light": "PKA_LIGHT_CSS",
   "title": "메인(Ack 알림)",
   "base": "src/posco/"
  },
  "pko": {
   "build": "build_pko",
   "css": "PKO_CSS",
   "light": "PKO_LIGHT_CSS",
   "title": "종합현황",
   "base": "src/posco/"
  },
  "pkr": {
   "build": "build_pkr",
   "css": "PKR_CSS",
   "light": "PKR_LIGHT_CSS",
   "title": "출입동선",
   "base": "src/posco/"
  },
  "pkf": {
   "build": "build_pkf",
   "css": "PKF_CSS",
   "light": "PKF_LIGHT_CSS",
   "title": "전체층",
   "base": "src/posco/"
  },
  "pkd": {
   "build": "build_pkd",
   "css": "PKD_CSS",
   "light": "PKD_LIGHT_CSS",
   "title": "단층",
   "base": "src/posco/"
  },
  "pks1": {
   "build": "build_pks1",
   "css": "PKS1_CSS",
   "light": "PKS1_LIGHT_CSS",
   "title": "SOP 상황인지",
   "base": "src/posco/"
  },
  "pks4": {
   "build": "build_pks4",
   "css": "PKS4_CSS",
   "light": "PKS4_LIGHT_CSS",
   "title": "SOP 체계도",
   "base": "src/posco/"
  }
 },
 "charts": [],
 "symbols": [
  {
   "id": "pk_pkm_1_1950",
   "name": "이벤트 표 머리글",
   "fig": "Header Row < Table (1:1950)",
   "px": "pkm",
   "nid": "1:1950",
   "w": 1758,
   "h": 24
  },
  {
   "id": "pk_pkm_1_1974",
   "name": "이벤트 표 행",
   "fig": "Row < Rows < Table (1:1974)",
   "px": "pkm",
   "nid": "1:1974",
   "w": 1760,
   "h": 32
  },
  {
   "id": "pk_pkm_1_737",
   "name": "Critical 등급 배지",
   "fig": "status-critical < Td/Severity (1:737)",
   "px": "pkm",
   "nid": "1:737",
   "w": 78,
   "h": 22
  },
  {
   "id": "pk_pkm_1_747",
   "name": "Major 등급 배지",
   "fig": "status-major < Td/Severity (1:747)",
   "px": "pkm",
   "nid": "1:747",
   "w": 78,
   "h": 22
  },
  {
   "id": "pk_pkm_1_757",
   "name": "Minor 등급 배지",
   "fig": "status-minor < Td/Severity (1:757)",
   "px": "pkm",
   "nid": "1:757",
   "w": 78,
   "h": 22
  },
  {
   "id": "pk_pkm_1_767",
   "name": "Warning 등급 배지",
   "fig": "status-warning < Td/Severity (1:767)",
   "px": "pkm",
   "nid": "1:767",
   "w": 78,
   "h": 22
  },
  {
   "id": "pk_pkm_1_777",
   "name": "Normal 등급 배지",
   "fig": "status-normal < Td/Severity (1:777)",
   "px": "pkm",
   "nid": "1:777",
   "w": 78,
   "h": 22
  },
  {
   "id": "pk_pkm_1_1943",
   "name": "Ack 단추",
   "fig": "Button/Ack (1:1943)",
   "px": "pkm",
   "nid": "1:1943",
   "w": 57,
   "h": 24
  },
  {
   "id": "pk_pkm_1_1944",
   "name": "Critical 건수 칩",
   "fig": "Count/Critical (1:1944)",
   "px": "pkm",
   "nid": "1:1944",
   "w": 100,
   "h": 25
  },
  {
   "id": "pk_pkm_1_1945",
   "name": "Major 건수 칩",
   "fig": "Count/Major (1:1945)",
   "px": "pkm",
   "nid": "1:1945",
   "w": 100,
   "h": 25
  },
  {
   "id": "pk_pkm_1_1946",
   "name": "Minor 건수 칩",
   "fig": "Count/Minor (1:1946)",
   "px": "pkm",
   "nid": "1:1946",
   "w": 100,
   "h": 25
  },
  {
   "id": "pk_pkm_1_1947",
   "name": "Warning 건수 칩",
   "fig": "Count/Warning (1:1947)",
   "px": "pkm",
   "nid": "1:1947",
   "w": 100,
   "h": 25
  },
  {
   "id": "pk_pkm_1_1948",
   "name": "Normal 건수 칩",
   "fig": "Count/Normal (1:1948)",
   "px": "pkm",
   "nid": "1:1948",
   "w": 100,
   "h": 25
  },
  {
   "id": "pk_pkm_15_8971",
   "name": "Auto 토글",
   "fig": "Button/Auto < Auto Toggle (15:8971)",
   "px": "pkm",
   "nid": "15:8971",
   "w": 68,
   "h": 22
  },
  {
   "id": "pk_pkm_31_10086",
   "name": "내비게이션 바",
   "fig": "Nav Bar (31:10086)",
   "px": "pkm",
   "nid": "31:10086",
   "w": 94,
   "h": 56
  },
  {
   "id": "pk_pkm_31_10074",
   "name": "내비 타일 (선택)",
   "fig": "Nav Item/Overview (Selected) (31:10074)",
   "px": "pkm",
   "nid": "31:10074",
   "w": 40,
   "h": 56
  },
  {
   "id": "pk_pkm_31_10033",
   "name": "내비 타일",
   "fig": "Nav Item < Nav Bar (31:10033)",
   "px": "pkm",
   "nid": "31:10033",
   "w": 40,
   "h": 56
  },
  {
   "id": "pk_pkm_17_13934",
   "name": "브레드크럼",
   "fig": "Breadcrumb (17:13934)",
   "px": "pkm",
   "nid": "17:13934",
   "w": 1920,
   "h": 33
  },
  {
   "id": "pk_pkm_1_3070",
   "name": "헤더 툴바",
   "fig": "Toolbar < Header (1:3070)",
   "px": "pkm",
   "nid": "1:3070",
   "w": 799,
   "h": 34
  },
  {
   "id": "pk_pkm_10_9487",
   "name": "헤더 메뉴",
   "fig": "Menu < Toolbar (10:9487)",
   "px": "pkm",
   "nid": "10:9487",
   "w": 512,
   "h": 34
  },
  {
   "id": "pk_pkm_10_9492",
   "name": "메뉴 항목",
   "fig": "Menu Item/Operations (10:9492)",
   "px": "pkm",
   "nid": "10:9492",
   "w": 109,
   "h": 34
  },
  {
   "id": "pk_pkm_2_16766",
   "name": "로고",
   "fig": "Logo < Header (2:16766)",
   "px": "pkm",
   "nid": "2:16766",
   "w": 119,
   "h": 23
  },
  {
   "id": "pk_pkm_1_1748",
   "name": "건물 라벨",
   "fig": "Building Label (1:1748)",
   "px": "pkm",
   "nid": "1:1748",
   "w": 92,
   "h": 19
  },
  {
   "id": "pk_pkm_17_9461",
   "name": "층 항목",
   "fig": "Floor Item < Group/Main Building (17:9461)",
   "px": "pkm",
   "nid": "17:9461",
   "w": 93,
   "h": 21
  },
  {
   "id": "pk_pko_I40_11526_17_13500",
   "name": "종합현황 표 행",
   "fig": "Row < Rows < Popup/Overview (I40:11526;17:13500)",
   "px": "pko",
   "nid": "I40:11526;17:13500",
   "w": 499,
   "h": 44
  },
  {
   "id": "pk_pko_I40_11526_17_13502",
   "name": "설비 상태 묶음",
   "fig": "Status Group < Row (I40:11526;17:13502)",
   "px": "pko",
   "nid": "I40:11526;17:13502",
   "w": 326,
   "h": 32
  },
  {
   "id": "pk_pko_I40_11526_17_13503",
   "name": "CCTV 상태 칸",
   "fig": "Status/CCTV < Status Group (I40:11526;17:13503)",
   "px": "pko",
   "nid": "I40:11526;17:13503",
   "w": 32,
   "h": 32
  },
  {
   "id": "pk_pko_I40_11526_17_13504",
   "name": "출입 상태 칸",
   "fig": "Status/Access < Status Group (I40:11526;17:13504)",
   "px": "pko",
   "nid": "I40:11526;17:13504",
   "w": 32,
   "h": 32
  },
  {
   "id": "pk_pko_I40_11526_17_13505",
   "name": "소방 상태 칸",
   "fig": "Status/Fire < Status Group (I40:11526;17:13505)",
   "px": "pko",
   "nid": "I40:11526;17:13505",
   "w": 32,
   "h": 32
  },
  {
   "id": "pk_pko_I40_11526_17_13506",
   "name": "도청 상태 칸",
   "fig": "Status/Wiretap < Status Group (I40:11526;17:13506)",
   "px": "pko",
   "nid": "I40:11526;17:13506",
   "w": 32,
   "h": 32
  },
  {
   "id": "pk_pko_I40_11526_17_13609",
   "name": "건물 선택",
   "fig": "Building Selector < Popup/Overview (I40:11526;17:13609)",
   "px": "pko",
   "nid": "I40:11526;17:13609",
   "w": 113,
   "h": 34
  },
  {
   "id": "pk_pko_40_11541",
   "name": "이벤트 리스트 항목",
   "fig": "Item < List < Popup/Event List (40:11541)",
   "px": "pko",
   "nid": "40:11541",
   "w": 385,
   "h": 31
  },
  {
   "id": "pk_pkr_1_2628",
   "name": "출입동선 필터",
   "fig": "Filters < Toolbar (1:2628)",
   "px": "pkr",
   "nid": "1:2628",
   "w": 233,
   "h": 26
  },
  {
   "id": "pk_pkr_1_2629",
   "name": "날짜 칸",
   "fig": "Date Field < Filters (1:2629)",
   "px": "pkr",
   "nid": "1:2629",
   "w": 93,
   "h": 19
  },
  {
   "id": "pk_pkr_1_2644",
   "name": "출입동선 범례",
   "fig": "Legend < Filters (1:2644)",
   "px": "pkr",
   "nid": "1:2644",
   "w": 120,
   "h": 26
  },
  {
   "id": "pk_pkr_1_2649",
   "name": "비인가 범례 항목",
   "fig": "Item/Unauthorized < Legend (1:2649)",
   "px": "pkr",
   "nid": "1:2649",
   "w": 44,
   "h": 13
  },
  {
   "id": "pk_pkr_1_2652",
   "name": "일반 범례 항목",
   "fig": "Item/General < Legend (1:2652)",
   "px": "pkr",
   "nid": "1:2652",
   "w": 35,
   "h": 13
  },
  {
   "id": "pk_pkr_1_2656",
   "name": "검색 단추",
   "fig": "Button/Search < Actions (1:2656)",
   "px": "pkr",
   "nid": "1:2656",
   "w": 30,
   "h": 18
  },
  {
   "id": "pk_pkr_1_2663",
   "name": "인물 단추",
   "fig": "Button/Person < Actions (1:2663)",
   "px": "pkr",
   "nid": "1:2663",
   "w": 30,
   "h": 18
  },
  {
   "id": "pk_pkr_1_2685",
   "name": "출입동선 표 행 (선택)",
   "fig": "Row (Selected) < Rows (1:2685)",
   "px": "pkr",
   "nid": "1:2685",
   "w": 521,
   "h": 28
  },
  {
   "id": "pk_pkr_1_2609",
   "name": "출입동선 도면",
   "fig": "Floor Plan < Stage (1:2609)",
   "px": "pkr",
   "nid": "1:2609",
   "w": 1410,
   "h": 330
  },
  {
   "id": "pk_pkf_1_2497",
   "name": "층 선택",
   "fig": "Floor Selector < Sidebar (1:2497)",
   "px": "pkf",
   "nid": "1:2497",
   "w": 121,
   "h": 617
  },
  {
   "id": "pk_pkf_1_2491",
   "name": "전체층 도면",
   "fig": "Floor Plan < Stage (1:2491)",
   "px": "pkf",
   "nid": "1:2491",
   "w": 1410,
   "h": 330
  },
  {
   "id": "pk_pkf_1_2513",
   "name": "자산정보현황 행",
   "fig": "Row < Body < Widget/Asset Summary (1:2513)",
   "px": "pkf",
   "nid": "1:2513",
   "w": 285,
   "h": 26
  },
  {
   "id": "pk_pkd_1_2404",
   "name": "단층 도면",
   "fig": "Floor Plan < Stage (1:2404)",
   "px": "pkd",
   "nid": "1:2404",
   "w": 1659,
   "h": 388
  },
  {
   "id": "pk_pkd_1_2417",
   "name": "자산 분류 바",
   "fig": "Category Bar (1:2417)",
   "px": "pkd",
   "nid": "1:2417",
   "w": 187,
   "h": 58
  },
  {
   "id": "pk_pkd_1_927",
   "name": "CCTV 분류 타일",
   "fig": "item-cctv_off < Category Bar (1:927)",
   "px": "pkd",
   "nid": "1:927",
   "w": 39,
   "h": 57
  },
  {
   "id": "pk_pkd_1_941",
   "name": "출입 분류 타일",
   "fig": "item-enter_off < Category Bar (1:941)",
   "px": "pkd",
   "nid": "1:941",
   "w": 39,
   "h": 57
  },
  {
   "id": "pk_pkd_1_953",
   "name": "소방 분류 타일",
   "fig": "item-fire_off < Category Bar (1:953)",
   "px": "pkd",
   "nid": "1:953",
   "w": 39,
   "h": 57
  },
  {
   "id": "pk_pkd_1_968",
   "name": "도청 분류 타일",
   "fig": "item-wiretpping_off < Category Bar (1:968)",
   "px": "pkd",
   "nid": "1:968",
   "w": 39,
   "h": 57
  },
  {
   "id": "pk_pkd_1_2426",
   "name": "자산 검색 칸",
   "fig": "Search Field < Header (1:2426)",
   "px": "pkd",
   "nid": "1:2426",
   "w": 286,
   "h": 32
  },
  {
   "id": "pk_pkd_1_2433",
   "name": "자산 분류 항목",
   "fig": "Category/CCTV < Body (1:2433)",
   "px": "pkd",
   "nid": "1:2433",
   "w": 286,
   "h": 26
  },
  {
   "id": "pk_pkd_1_2441",
   "name": "자산 분류 항목 (펼침)",
   "fig": "Category/Fire Sensor (Expanded) (1:2441)",
   "px": "pkd",
   "nid": "1:2441",
   "w": 286,
   "h": 417
  },
  {
   "id": "pk_pkd_1_2450",
   "name": "자산 항목 (선택)",
   "fig": "Item (Selected) < Category/Fire Sensor (1:2450)",
   "px": "pkd",
   "nid": "1:2450",
   "w": 286,
   "h": 21
  },
  {
   "id": "pk_pks1_1_9934",
   "name": "구역 제목",
   "fig": "Section Title < Dialog/SOP (1:9934)",
   "px": "pks1",
   "nid": "1:9934",
   "w": 794,
   "h": 43
  },
  {
   "id": "pk_pks1_1_10107",
   "name": "대응 절차 단계",
   "fig": "Step < Step List (1:10107)",
   "px": "pks1",
   "nid": "1:10107",
   "w": 789,
   "h": 127
  },
  {
   "id": "pk_pks1_1_10129",
   "name": "대응 절차 단계 카드",
   "fig": "Card < Body < Step (1:10129)",
   "px": "pks1",
   "nid": "1:10129",
   "w": 656,
   "h": 127
  },
  {
   "id": "pk_pks1_1_10446",
   "name": "조치사항 칩",
   "fig": "Chip < Card (1:10446)",
   "px": "pks1",
   "nid": "1:10446",
   "w": 100,
   "h": 26
  },
  {
   "id": "pk_pks1_1_9736",
   "name": "상황정보 필드",
   "fig": "Field/Situation Info < Info (1:9736)",
   "px": "pks1",
   "nid": "1:9736",
   "w": 719,
   "h": 33
  },
  {
   "id": "pk_pks1_1_9748",
   "name": "발생일시 필드",
   "fig": "Field/Time < Info (1:9748)",
   "px": "pks1",
   "nid": "1:9748",
   "w": 393,
   "h": 33
  },
  {
   "id": "pk_pks1_1_9759",
   "name": "경과시간 필드",
   "fig": "Field/Elapsed Time < Info (1:9759)",
   "px": "pks1",
   "nid": "1:9759",
   "w": 326,
   "h": 33
  },
  {
   "id": "pk_pks1_1_10012",
   "name": "SOP 가동중 표시",
   "fig": "SOP Status < Title Row (1:10012)",
   "px": "pks1",
   "nid": "1:10012",
   "w": 120,
   "h": 53
  },
  {
   "id": "pk_pks1_1_9715",
   "name": "SOP 탭 바",
   "fig": "Tab Bar < Dialog/SOP (1:9715)",
   "px": "pks1",
   "nid": "1:9715",
   "w": 55,
   "h": 121
  },
  {
   "id": "pk_pks1_1_9717",
   "name": "체계도 탭",
   "fig": "Tab/Diagram < Tab Bar (1:9717)",
   "px": "pks1",
   "nid": "1:9717",
   "w": 55,
   "h": 55
  },
  {
   "id": "pk_pks1_1_10440",
   "name": "상황종료 단추",
   "fig": "Button/End < Footer < Dialog/SOP (1:10440)",
   "px": "pks1",
   "nid": "1:10440",
   "w": 109,
   "h": 34
  },
  {
   "id": "pk_pks4_1_9467",
   "name": "체계도 노드",
   "fig": "Flow Node < Canvas (1:9467)",
   "px": "pks4",
   "nid": "1:9467",
   "w": 156,
   "h": 31
  },
  {
   "id": "pk_pks4_1_9516",
   "name": "체계도 범례",
   "fig": "Legend < Flow Diagram (1:9516)",
   "px": "pks4",
   "nid": "1:9516",
   "w": 134,
   "h": 15
  },
  {
   "id": "pk_pks4_1_9523",
   "name": "조치 단계 카드",
   "fig": "Process Step/5 < Process Flow (1:9523)",
   "px": "pks4",
   "nid": "1:9523",
   "w": 88,
   "h": 133
  },
  {
   "id": "pk_pks4_1_9524",
   "name": "조치 단계 노드",
   "fig": "Process Node < Process Step/5 (1:9524)",
   "px": "pks4",
   "nid": "1:9524",
   "w": 88,
   "h": 88
  }
 ],
 "icons": [
  {
   "id": "pk_icon_nav_sop",
   "name": "SOP 아이콘",
   "fig": "Icon/Nav/SOP < Menu Item/SOP",
   "src": "src/posco/icon-nav-sop.svg"
  },
  {
   "id": "pk_icon_nav_operations",
   "name": "운영현황 아이콘",
   "fig": "Icon/Nav/Operations < Menu Item/Operations",
   "src": "src/posco/icon-nav-operations.svg"
  },
  {
   "id": "pk_icon_nav_editor",
   "name": "에디터 아이콘",
   "fig": "Icon/Nav/Editor < Menu Item/Editor",
   "src": "src/posco/icon-nav-editor.svg"
  },
  {
   "id": "pk_icon_nav_admin",
   "name": "관리자 아이콘",
   "fig": "Icon/Nav/Admin < Menu Item/Admin",
   "src": "src/posco/icon-nav-admin.svg"
  },
  {
   "id": "pk_icon_nav_logout",
   "name": "로그아웃 아이콘",
   "fig": "Icon/Nav/Logout < Menu Item/Logout",
   "src": "src/posco/icon-nav-logout.svg"
  },
  {
   "id": "pk_icon_system_clock",
   "name": "시계 아이콘",
   "fig": "Icon/System/Clock < Timestamp",
   "src": "src/posco/icon-system-clock.svg"
  },
  {
   "id": "pk_icon_nav",
   "name": "종합현황 아이콘",
   "fig": "Glyph < Icon Box < Nav Item/Overview",
   "src": "src/posco/icon-nav.svg"
  },
  {
   "id": "pk_icon_action_search",
   "name": "검색 아이콘",
   "fig": "Icon/Action/Search < Button/Search",
   "src": "src/posco/icon-action-search.svg"
  },
  {
   "id": "pk_icon_action_person",
   "name": "인물 아이콘",
   "fig": "Icon/Action/Person < Button/Person",
   "src": "src/posco/icon-action-person.svg"
  },
  {
   "id": "pk_icon_action_calendar",
   "name": "달력 아이콘",
   "fig": "Icon/Action/Calendar < Date Field",
   "src": "src/posco/icon-action-calendar.svg"
  },
  {
   "id": "pk_icon_action_cctv",
   "name": "CCTV 보기 아이콘",
   "fig": "Icon/Action/CCTV < Td/CCTV",
   "src": "src/posco/icon-action-cctv.svg"
  },
  {
   "id": "pk_icon_action_chevron",
   "name": "펼침 화살표 아이콘",
   "fig": "Icon/Action/Chevron < Button/Dropdown",
   "src": "src/posco/icon-action-chevron.svg"
  },
  {
   "id": "pk_icon_cctv",
   "name": "CCTV 설비 아이콘",
   "fig": "icon-cctv < item-cctv_off",
   "src": "src/posco/icon-cctv.svg"
  },
  {
   "id": "pk_icon_gate",
   "name": "출입 설비 아이콘",
   "fig": "icon-gate < item-enter_off",
   "src": "src/posco/icon-gate.svg"
  },
  {
   "id": "pk_icon_fire",
   "name": "소방 설비 아이콘",
   "fig": "icon-fire < item-fire_off",
   "src": "src/posco/icon-fire.svg"
  },
  {
   "id": "pk_icon_5_2",
   "name": "CCTV 상태 아이콘",
   "fig": "Icon/Nav < Status/CCTV",
   "src": "src/posco/icon-5-2.svg"
  },
  {
   "id": "pk_icon_9",
   "name": "출입 상태 아이콘",
   "fig": "Icon/Nav < Status/Access",
   "src": "src/posco/icon-9.svg"
  },
  {
   "id": "pk_icon_7",
   "name": "소방 상태 아이콘",
   "fig": "Icon/Nav < Status/Fire",
   "src": "src/posco/icon-7.svg"
  },
  {
   "id": "pk_icon_10",
   "name": "도청 상태 아이콘",
   "fig": "Icon/Nav < Status/Wiretap",
   "src": "src/posco/icon-10.svg"
  },
  {
   "id": "pk_icon_13",
   "name": "팝업 닫기 아이콘",
   "fig": "Icon < popup01-title < Popup/Asset Detail",
   "src": "src/posco/icon-13.svg"
  },
  {
   "id": "pk_popup_01_icon",
   "name": "자산 상세 아이콘",
   "fig": "popup01-icon < popup01-txt < Popup/Asset Detail",
   "src": "src/posco/popup-01-icon.svg"
  },
  {
   "id": "pk_icon_1",
   "name": "대응 절차 아이콘",
   "fig": "Icon < Content < Section Title",
   "src": "src/posco/icon-1.svg"
  },
  {
   "id": "pk_icon_14",
   "name": "단계 배지 아이콘",
   "fig": "Icon < Content < Badge",
   "src": "src/posco/icon-14.svg"
  },
  {
   "id": "pk_icon_2",
   "name": "조치사항 칩 아이콘",
   "fig": "Icon < Content < Chip",
   "src": "src/posco/icon-2.svg"
  },
  {
   "id": "pk_icon_7_2",
   "name": "체계도 탭 아이콘",
   "fig": "Icon < Tab/Diagram",
   "src": "src/posco/icon-7-2.svg"
  },
  {
   "id": "pk_icon_5",
   "name": "상황전파 아이콘",
   "fig": "Icon < Icon Group < Process Step/1",
   "src": "src/posco/icon-5.svg"
  },
  {
   "id": "pk_icon_4",
   "name": "상황보고 아이콘",
   "fig": "Icon < Icon Group < Process Step/2-1",
   "src": "src/posco/icon-4.svg"
  }
 ],
 "panels": [
  {
   "id": "pk_pkm_2_18449",
   "name": "자산정보현황 (요약)",
   "fig": "Widget/Asset Summary (2:18449)",
   "px": "pkm",
   "nid": "2:18449",
   "w": 517,
   "h": 114
  },
  {
   "id": "pk_pkm_2_18454",
   "name": "경보 티커",
   "fig": "Alert Ticker (2:18454)",
   "px": "pkm",
   "nid": "2:18454",
   "w": 552,
   "h": 46
  },
  {
   "id": "pk_pkm_1_3025",
   "name": "헤더 바",
   "fig": "Header (1:3025)",
   "px": "pkm",
   "nid": "1:3025",
   "w": 1920,
   "h": 56
  },
  {
   "id": "pk_pka_1_1233",
   "name": "Ack 안내 팝업",
   "fig": "ack-popup (1:1233)",
   "px": "pka",
   "nid": "1:1233",
   "w": 336,
   "h": 128
  },
  {
   "id": "pk_pko_40_11526",
   "name": "종합현황",
   "fig": "Popup/Overview (40:11526)",
   "px": "pko",
   "nid": "40:11526",
   "w": 539,
   "h": 803
  },
  {
   "id": "pk_pkr_1_2618",
   "name": "출입동선 판",
   "fig": "Panel/Access Route (1:2618)",
   "px": "pkr",
   "nid": "1:2618",
   "w": 546,
   "h": 678
  },
  {
   "id": "pk_pkr_1_2621",
   "name": "출입동선",
   "fig": "Widget/Access Route (1:2621)",
   "px": "pkr",
   "nid": "1:2621",
   "w": 521,
   "h": 257
  },
  {
   "id": "pk_pkr_1_2732",
   "name": "출입내역",
   "fig": "Widget/Access History (1:2732)",
   "px": "pkr",
   "nid": "1:2732",
   "w": 521,
   "h": 379
  },
  {
   "id": "pk_pkf_1_2504",
   "name": "자산정보현황 (층별)",
   "fig": "Widget/Asset Summary (1:2504)",
   "px": "pkf",
   "nid": "1:2504",
   "w": 305,
   "h": 512
  },
  {
   "id": "pk_pkf_1_2493",
   "name": "사이드바",
   "fig": "Sidebar (1:2493)",
   "px": "pkf",
   "nid": "1:2493",
   "w": 122,
   "h": 695
  },
  {
   "id": "pk_pkd_1_2423",
   "name": "자산리스트",
   "fig": "Widget/Asset List (1:2423)",
   "px": "pkd",
   "nid": "1:2423",
   "w": 305,
   "h": 521
  },
  {
   "id": "pk_pkd_1_2486",
   "name": "자산 상세 팝업 (KDB)",
   "fig": "Popup/Asset Detail (1:2486)",
   "px": "pkd",
   "nid": "1:2486",
   "w": 557,
   "h": 282
  },
  {
   "id": "pk_pks1_1_9709",
   "name": "대응 절차 목록",
   "fig": "Step List < Dialog/SOP (1:9709)",
   "px": "pks1",
   "nid": "1:9709",
   "w": 789,
   "h": 537
  },
  {
   "id": "pk_pks1_1_9723",
   "name": "SOP 머리글",
   "fig": "Content < Header < Dialog/SOP (1:9723)",
   "px": "pks1",
   "nid": "1:9723",
   "w": 719,
   "h": 135
  },
  {
   "id": "pk_pks4_1_9465",
   "name": "상황인지 전파 체계도",
   "fig": "Flow Diagram (1:9465)",
   "px": "pks4",
   "nid": "1:9465",
   "w": 694,
   "h": 194
  },
  {
   "id": "pk_pks4_1_9521",
   "name": "조치 진행 단계",
   "fig": "Process Flow (1:9521)",
   "px": "pks4",
   "nid": "1:9521",
   "w": 739,
   "h": 134
  },
  {
   "id": "pk_pks4_1_9568",
   "name": "연락처 표",
   "fig": "Contact Table (1:9568)",
   "px": "pks4",
   "nid": "1:9568",
   "w": 794,
   "h": 211
  }
 ],
 "events": [
  {
   "id": "pk_pkm_1_1926",
   "name": "이벤트 현황",
   "fig": "Event Panel/Default (1:1926)",
   "px": "pkm",
   "nid": "1:1926",
   "w": 1920,
   "h": 267
  },
  {
   "id": "pk_pkm_1_1949",
   "name": "이벤트 표 (KDB)",
   "fig": "Table < Event Panel/Default (1:1949)",
   "px": "pkm",
   "nid": "1:1949",
   "w": 1760,
   "h": 186
  },
  {
   "id": "pk_pko_40_11527",
   "name": "이벤트 리스트",
   "fig": "Popup/Event List (40:11527)",
   "px": "pko",
   "nid": "40:11527",
   "w": 440,
   "h": 227
  }
 ]
};
