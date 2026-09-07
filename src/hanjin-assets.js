/* 자동 생성물 — 한진 SMART 통합관제 3화면(Figma A11hAZefK5FSuEE9MagOgj)의 에셋 라이브러리 등록 목록.
   등록 단위는 컴포넌트다(부품은 넣지 않는다).
   마크업도 CSS 도 복사해 두지 않는다 — 화면 빌더(build_hjc/hjg/hju)의 DOM 에서 노드 id 로 그때그때
   잘라 쓰고, 시트는 window.HJC_CSS 등 이미 로드된 것을 붙인다. 그래서 글자는 실제 텍스트 그대로고
   ('패널편집'으로 고칠 수 있다) 라이트 테마·'색 정하기'도 화면과 똑같이 따라온다.
   생성기: src/hanjin-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */
window.__HANJIN_ASSETS = {
 "base": "src/hanjin/",
 "screens": {
  "hjc": {
   "build": "build_hjc",
   "css": "HJC_CSS",
   "light": "HJC_LIGHT_CSS",
   "title": "통합관제"
  },
  "hjg": {
   "build": "build_hjg",
   "css": "HJG_CSS",
   "light": "HJG_LIGHT_CSS",
   "title": "입/출문현황"
  },
  "hju": {
   "build": "build_hju",
   "css": "HJU_CSS",
   "light": "HJU_LIGHT_CSS",
   "title": "하차현황"
  }
 },
 "charts": [
  {
   "id": "hj_65_948",
   "name": "작업현황 도넛",
   "fig": "Donut Chart < Widget/Unload Work (65:948)",
   "px": "hjg",
   "nid": "65:948",
   "w": 212,
   "h": 212
  },
  {
   "id": "hj_65_2662",
   "name": "진척률 게이지",
   "fig": "Gauge < Widget/Unload Progress (65:2662)",
   "px": "hju",
   "nid": "65:2662",
   "w": 268,
   "h": 169
  },
  {
   "id": "hj_65_2665",
   "name": "진척률 미터",
   "fig": "Meter < Gauge (65:2665)",
   "px": "hju",
   "nid": "65:2665",
   "w": 218,
   "h": 218
  },
  {
   "id": "hj_65_2728",
   "name": "요일별 막대차트",
   "fig": "Bar Chart < Widget/Daily Unload Volume (65:2728)",
   "px": "hju",
   "nid": "65:2728",
   "w": 443,
   "h": 212
  },
  {
   "id": "hj_65_2766",
   "name": "층별 가로막대",
   "fig": "Bars < Widget/Vehicles by Floor (65:2766)",
   "px": "hju",
   "nid": "65:2766",
   "w": 321,
   "h": 146
  },
  {
   "id": "hj_65_533",
   "name": "방위 나침반",
   "fig": "Compass < Screen/Control Main (65:533)",
   "px": "hjc",
   "nid": "65:533",
   "w": 118,
   "h": 160
  }
 ],
 "symbols": [
  {
   "id": "hj_65_515",
   "name": "기본위치 액션",
   "fig": "Map Action/Default View (65:515)",
   "px": "hjc",
   "nid": "65:515",
   "w": 64,
   "h": 73
  },
  {
   "id": "hj_65_524",
   "name": "RAMP숨김 액션",
   "fig": "Map Action/Hide Ramp (65:524)",
   "px": "hjc",
   "nid": "65:524",
   "w": 78,
   "h": 73
  },
  {
   "id": "hj_65_478",
   "name": "차량 필터",
   "fig": "Vehicle Filter (65:478)",
   "px": "hjc",
   "nid": "65:478",
   "w": 498,
   "h": 37
  },
  {
   "id": "hj_65_644",
   "name": "시점 프리셋",
   "fig": "View Presets(층 선택기+카메라 프리셋) (65:644)",
   "px": "hjc",
   "nid": "65:644",
   "w": 271,
   "h": 278
  },
  {
   "id": "hj_65_646",
   "name": "카메라 프리셋",
   "fig": "Camera Presets < View Presets (65:646)",
   "px": "hjc",
   "nid": "65:646",
   "w": 270,
   "h": 120
  },
  {
   "id": "hj_65_650",
   "name": "미니맵",
   "fig": "Minimap < Camera Presets (65:650)",
   "px": "hjc",
   "nid": "65:650",
   "w": 78,
   "h": 86
  },
  {
   "id": "hj_65_2917",
   "name": "대기 도크 그룹",
   "fig": "Dock Group/Waiting (65:2917)",
   "px": "hju",
   "nid": "65:2917",
   "w": 352,
   "h": 90
  },
  {
   "id": "hj_65_2947",
   "name": "하차 도크 그룹",
   "fig": "Dock Group/Unload (65:2947)",
   "px": "hju",
   "nid": "65:2947",
   "w": 352,
   "h": 76
  },
  {
   "id": "hj_65_2970",
   "name": "상차 도크 그룹",
   "fig": "Dock Group/Load (65:2970)",
   "px": "hju",
   "nid": "65:2970",
   "w": 352,
   "h": 90
  },
  {
   "id": "hj_65_727",
   "name": "단계 SUB미출발",
   "fig": "Stage/SUB Not Departed (65:727)",
   "px": "hjc",
   "nid": "65:727",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_737",
   "name": "단계 간선",
   "fig": "Stage/Linehaul (65:737)",
   "px": "hjc",
   "nid": "65:737",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_747",
   "name": "단계 허브인근",
   "fig": "Stage/Near Hub (65:747)",
   "px": "hjc",
   "nid": "65:747",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_757",
   "name": "단계 입문",
   "fig": "Stage/Gate In (65:757)",
   "px": "hjc",
   "nid": "65:757",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_767",
   "name": "단계 대기",
   "fig": "Stage/Waiting (65:767)",
   "px": "hjc",
   "nid": "65:767",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_777",
   "name": "단계 접안",
   "fig": "Stage/Docking (65:777)",
   "px": "hjc",
   "nid": "65:777",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_787",
   "name": "단계 하차중",
   "fig": "Stage/Unloading (65:787)",
   "px": "hjc",
   "nid": "65:787",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_797",
   "name": "단계 하차예정",
   "fig": "Stage/Unload Due (65:797)",
   "px": "hjc",
   "nid": "65:797",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_807",
   "name": "단계 하차완료",
   "fig": "Stage/Unload Done (65:807)",
   "px": "hjc",
   "nid": "65:807",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_2140",
   "name": "단계 상차예정",
   "fig": "Stage/Load Due (65:2140)",
   "px": "hjg",
   "nid": "65:2140",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_2150",
   "name": "단계 상차완료",
   "fig": "Stage/Load Done (65:2150)",
   "px": "hjg",
   "nid": "65:2150",
   "w": 145,
   "h": 67
  },
  {
   "id": "hj_65_2181",
   "name": "단계 출문완료",
   "fig": "Stage/Gate Out Done (65:2181)",
   "px": "hjg",
   "nid": "65:2181",
   "w": 145,
   "h": 67
  }
 ],
 "icons": [
  {
   "id": "hj_icon",
   "name": "위치 아이콘",
   "fig": "Icon/Map/Location",
   "src": "src/hanjin/icon.svg"
  },
  {
   "id": "hj_icon_map_ramp",
   "name": "RAMP 아이콘",
   "fig": "Icon/Map/Ramp",
   "src": "src/hanjin/icon-map-ramp.svg"
  },
  {
   "id": "hj_icon_action_view_off",
   "name": "숨김 아이콘",
   "fig": "Icon/Action/View Off",
   "src": "src/hanjin/icon-action-view-off.svg"
  },
  {
   "id": "hj_icon_action_collapse",
   "name": "접기 아이콘",
   "fig": "Icon/Action/Collapse",
   "src": "src/hanjin/icon-action-collapse.svg"
  },
  {
   "id": "hj_icon_action_search",
   "name": "검색 아이콘",
   "fig": "Icon/Action/Search",
   "src": "src/hanjin/icon-action-search.svg"
  },
  {
   "id": "hj_icon_action_calendar",
   "name": "달력 아이콘",
   "fig": "Icon/Action/Calendar",
   "src": "src/hanjin/icon-action-calendar.svg"
  },
  {
   "id": "hj_icon_action_close",
   "name": "닫기 아이콘",
   "fig": "Icon/Action/Close",
   "src": "src/hanjin/icon-action-close.svg"
  },
  {
   "id": "hj_icon_system_clock",
   "name": "시계 아이콘",
   "fig": "Icon/System/Clock",
   "src": "src/hanjin/icon-system-clock.svg"
  },
  {
   "id": "hj_icon_dock_waiting",
   "name": "도크 대기 아이콘",
   "fig": "Icon/Dock/Waiting",
   "src": "src/hanjin/icon-dock-waiting.svg"
  },
  {
   "id": "hj_icon_dock_unload",
   "name": "도크 하차 아이콘",
   "fig": "Icon/Dock/Unload",
   "src": "src/hanjin/icon-dock-unload.svg"
  },
  {
   "id": "hj_icon_dock_load",
   "name": "도크 상차 아이콘",
   "fig": "Icon/Dock/Load",
   "src": "src/hanjin/icon-dock-load.svg"
  },
  {
   "id": "hj_icon_stage_sub_not_departed",
   "name": "SUB미출발 아이콘",
   "fig": "Icon/Stage/SUB Not Departed",
   "src": "src/hanjin/icon-stage-sub-not-departed.svg"
  },
  {
   "id": "hj_icon_stage_linehaul",
   "name": "간선 아이콘",
   "fig": "Icon/Stage/Linehaul",
   "src": "src/hanjin/icon-stage-linehaul.svg"
  },
  {
   "id": "hj_icon_stage_near_hub",
   "name": "허브인근 아이콘",
   "fig": "Icon/Stage/Near Hub",
   "src": "src/hanjin/icon-stage-near-hub.svg"
  },
  {
   "id": "hj_icon_stage_gate_in",
   "name": "입문 아이콘",
   "fig": "Icon/Stage/Gate In",
   "src": "src/hanjin/icon-stage-gate-in.svg"
  },
  {
   "id": "hj_icon_stage_waiting",
   "name": "대기 아이콘",
   "fig": "Icon/Stage/Waiting",
   "src": "src/hanjin/icon-stage-waiting.svg"
  },
  {
   "id": "hj_icon_stage_unloading",
   "name": "하차중 아이콘",
   "fig": "Icon/Stage/Unloading",
   "src": "src/hanjin/icon-stage-unloading.svg"
  },
  {
   "id": "hj_icon_stage_unload_due",
   "name": "하차예정 아이콘",
   "fig": "Icon/Stage/Unload Due",
   "src": "src/hanjin/icon-stage-unload-due.svg"
  },
  {
   "id": "hj_icon_stage_unload_done",
   "name": "하차완료 아이콘",
   "fig": "Icon/Stage/Unload Done",
   "src": "src/hanjin/icon-stage-unload-done.svg"
  },
  {
   "id": "hj_icon_stage_load_due",
   "name": "상차예정 아이콘",
   "fig": "Icon/Stage/Load Due",
   "src": "src/hanjin/icon-stage-load-due.svg"
  },
  {
   "id": "hj_icon_stage_load_done",
   "name": "상차완료 아이콘",
   "fig": "Icon/Stage/Load Done",
   "src": "src/hanjin/icon-stage-load-done.svg"
  },
  {
   "id": "hj_icon_stage_gate_out_done",
   "name": "출문완료 아이콘",
   "fig": "Icon/Stage/Gate Out Done",
   "src": "src/hanjin/icon-stage-gate-out-done.svg"
  }
 ],
 "panels": [
  {
   "id": "hj_65_555",
   "name": "허브 인접 차량 목록",
   "fig": "Widget/Nearby Vehicles (65:555)",
   "px": "hjc",
   "nid": "65:555",
   "w": 577,
   "h": 326
  },
  {
   "id": "hj_65_706",
   "name": "단계별 차량현황",
   "fig": "Widget/Stage Status (65:706)",
   "px": "hjc",
   "nid": "65:706",
   "w": 1840,
   "h": 182
  },
  {
   "id": "hj_65_946",
   "name": "하차작업 현황",
   "fig": "Widget/Unload Work (65:946)",
   "px": "hjg",
   "nid": "65:946",
   "w": 445,
   "h": 280
  },
  {
   "id": "hj_65_999",
   "name": "상차작업 현황",
   "fig": "Widget/Load Work (65:999)",
   "px": "hjg",
   "nid": "65:999",
   "w": 445,
   "h": 280
  },
  {
   "id": "hj_65_1052",
   "name": "입문 화물구성",
   "fig": "Widget/Gate In Cargo Mix (65:1052)",
   "px": "hjg",
   "nid": "65:1052",
   "w": 445,
   "h": 280
  },
  {
   "id": "hj_65_1089",
   "name": "입문 차량구성",
   "fig": "Widget/Gate In Mix (65:1089)",
   "px": "hjg",
   "nid": "65:1089",
   "w": 445,
   "h": 280
  },
  {
   "id": "hj_65_1135",
   "name": "입문 현황",
   "fig": "Widget/Gate In (65:1135)",
   "px": "hjg",
   "nid": "65:1135",
   "w": 1113,
   "h": 460
  },
  {
   "id": "hj_65_1680",
   "name": "출문 현황",
   "fig": "Widget/Gate Out (65:1680)",
   "px": "hjg",
   "nid": "65:1680",
   "w": 709,
   "h": 460
  },
  {
   "id": "hj_65_2064",
   "name": "차량 단계현황",
   "fig": "Widget/Vehicle Stage (65:2064)",
   "px": "hjg",
   "nid": "65:2064",
   "w": 845,
   "h": 121
  },
  {
   "id": "hj_65_2121",
   "name": "단계별 작업현황",
   "fig": "Widget/Work Stage (65:2121)",
   "px": "hjg",
   "nid": "65:2121",
   "w": 945,
   "h": 118
  },
  {
   "id": "hj_65_2354",
   "name": "도크 상세현황",
   "fig": "Dock Board (65:2354)",
   "px": "hju",
   "nid": "65:2354",
   "w": 1838,
   "h": 365
  },
  {
   "id": "hj_65_2649",
   "name": "하차진척률 증감현황",
   "fig": "Widget/Unload Progress (65:2649)",
   "px": "hju",
   "nid": "65:2649",
   "w": 342,
   "h": 320
  },
  {
   "id": "hj_65_2710",
   "name": "요일별 하차물량",
   "fig": "Widget/Daily Unload Volume (65:2710)",
   "px": "hju",
   "nid": "65:2710",
   "w": 503,
   "h": 320
  },
  {
   "id": "hj_65_2832",
   "name": "층별 차량현황",
   "fig": "Widget/Vehicles by Floor (65:2832)",
   "px": "hju",
   "nid": "65:2832",
   "w": 502,
   "h": 320
  },
  {
   "id": "hj_65_2911",
   "name": "층별 도크 운영현황",
   "fig": "Widget/Dock Operation (65:2911)",
   "px": "hju",
   "nid": "65:2911",
   "w": 412,
   "h": 320
  }
 ],
 "events": [
  {
   "id": "hj_65_818",
   "name": "이벤트 현황 패널",
   "fig": "Event Log (65:818)",
   "px": "hjc",
   "nid": "65:818",
   "w": 1840,
   "h": 330
  },
  {
   "id": "hj_65_819",
   "name": "이벤트 헤더",
   "fig": "Header < Event Log (65:819)",
   "px": "hjc",
   "nid": "65:819",
   "w": 1800,
   "h": 28
  },
  {
   "id": "hj_65_831",
   "name": "이벤트 카운트",
   "fig": "Count Group < Event Log (65:831)",
   "px": "hjc",
   "nid": "65:831",
   "w": 542,
   "h": 22
  },
  {
   "id": "hj_65_838",
   "name": "이벤트 표",
   "fig": "Table < Event Log (65:838)",
   "px": "hjc",
   "nid": "65:838",
   "w": 1800,
   "h": 246
  },
  {
   "id": "hj_65_859",
   "name": "이벤트 행",
   "fig": "Row < Body < Table (65:859)",
   "px": "hjc",
   "nid": "65:859",
   "w": 1800,
   "h": 35
  },
  {
   "id": "hj_65_832",
   "name": "이벤트 카운트 전체",
   "fig": "Count/All (65:832)",
   "px": "hjc",
   "nid": "65:832",
   "w": 87,
   "h": 22
  },
  {
   "id": "hj_65_833",
   "name": "이벤트 카운트 위험",
   "fig": "Count/Critical (65:833)",
   "px": "hjc",
   "nid": "65:833",
   "w": 87,
   "h": 22
  },
  {
   "id": "hj_65_861",
   "name": "이벤트 등급 위험",
   "fig": "Badge(Critical) < Row (65:861)",
   "px": "hjc",
   "nid": "65:861",
   "w": 67,
   "h": 20
  },
  {
   "id": "hj_65_875",
   "name": "이벤트 등급 중대",
   "fig": "Badge(Major) < Row (65:875)",
   "px": "hjc",
   "nid": "65:875",
   "w": 67,
   "h": 20
  },
  {
   "id": "hj_65_889",
   "name": "이벤트 등급 경미",
   "fig": "Badge(Minor) < Row (65:889)",
   "px": "hjc",
   "nid": "65:889",
   "w": 67,
   "h": 20
  },
  {
   "id": "hj_65_903",
   "name": "이벤트 등급 주의",
   "fig": "Badge(Warning) < Row (65:903)",
   "px": "hjc",
   "nid": "65:903",
   "w": 67,
   "h": 20
  },
  {
   "id": "hj_65_917",
   "name": "이벤트 등급 정상",
   "fig": "Badge(Normal) < Row (65:917)",
   "px": "hjc",
   "nid": "65:917",
   "w": 67,
   "h": 20
  },
  {
   "id": "hj_65_827",
   "name": "이벤트 Auto 토글",
   "fig": "Auto Toggle < Header (65:827)",
   "px": "hjc",
   "nid": "65:827",
   "w": 66,
   "h": 14
  },
  {
   "id": "hj_65_3129",
   "name": "이벤트 접기 버튼",
   "fig": "Fold Button < Header (변형 펼친 노드) (65:3129)",
   "px": "hjc",
   "nid": "65:3129",
   "w": 39,
   "h": 28
  }
 ]
};
