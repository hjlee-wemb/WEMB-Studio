# 변경 이력 (Changelog)

WEMB Studio의 버전별 변경 사항을 기록합니다.
버전 체계는 [유의적 버전(SemVer)](https://semver.org/lang/ko/)의 개발 단계(`0.y.z`)를 따르며, 각 버전에 릴리스 날짜를 병기합니다.

- `0.MINOR` : 의미 있는 기능 묶음 추가
- `0.0.PATCH` : 버그 수정·소규모 개선
- `1.0.0` : 첫 안정(정식) 릴리스 예정

---

## [Unreleased]
- 버전 기록 체계 도입: git 주석 태그(`v0.1.0`~`v0.6.0`), CHANGELOG, HTML 버전 표기(`data-version`)

## [0.6.0] — 2026-07-03
### 개선
- 미세조정(H/S/L)이 우측 콘텐츠에만 반영되고 좌측 메뉴는 기준 팔레트 유지(Flat/Enterprise 공통)
- 라이트 모드 배경 명도 상향(칙칙함 완화), 팝업·모달 라이트 모드 디자인 전환
- 컴포넌트 시트: 히트맵 축소·대시보드 방식 동일화, 색면 글자 대비(on-color) 검증, 3열 dense 레이아웃, 라인차트 축소, HTML 내보내기 버튼 라이트 가시성 수정

## [0.5.0] — 2026-07-03
### 추가
- Enterprise 버전(≤50색 토큰) 생성기(`genEnterprise`) + Flat/Enterprise 토글
- Enterprise 시각 체계: 서피스 단계·그라데이션 텍스트·세그먼트 진행률·은은한 배경 애니메이션
### 개선
- 시드/이미지·컬러셋 프리셋/배색방식/미세조정을 Enterprise에 반영
- 콘텐츠 차트 그림자/글로우 제거(가독성), 라이트모드 과대비 완화, 사이드바 글자색 모드 연동

## [0.4.0] — 2026-07-02
### 추가
- 사이드바 테마(light/dark) 동기화
- 콘텐츠 차트/데이터 종류 전환 + 제목 기반 추천(데이터/차트 카테고리 구분)
### 수정
- 위치 권한 반복 요청 문제 수정(최초 1회만 요청, 서울 좌표 폴백)

## [0.3.0] — 2026-07-01
### 개선
- WCAG 대비비 검증표를 비차단(non-blocking) 팝업으로 전환
- 자동 보정 시 변경 내용을 실시간 피드백

## [0.2.0] — 2026-06-29
### 추가
- 라이트/다크 모드, 팔레트 편집기(피커/텍스트 지정/복사/초기화)
- WCAG AAA 자동 대비 필터링, 실시간 KPI(카운트업)·상태 표현
- GitHub 저장소 등록 및 공개 배포(GitHub Pages)

## [0.1.0] — 2026-06-29
### 추가
- WEMB Studio 최초 버전 — 컬러 테마 생성기 대시보드
- 기준 색·배색 방식·이미지 추출 기반 팔레트 생성, 관제 대시보드 실시간 반영

---

[Unreleased]: https://github.com/hjlee-wemb/WEMB-Studio/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/hjlee-wemb/WEMB-Studio/releases/tag/v0.6.0
[0.5.0]: https://github.com/hjlee-wemb/WEMB-Studio/releases/tag/v0.5.0
[0.4.0]: https://github.com/hjlee-wemb/WEMB-Studio/releases/tag/v0.4.0
[0.3.0]: https://github.com/hjlee-wemb/WEMB-Studio/releases/tag/v0.3.0
[0.2.0]: https://github.com/hjlee-wemb/WEMB-Studio/releases/tag/v0.2.0
[0.1.0]: https://github.com/hjlee-wemb/WEMB-Studio/releases/tag/v0.1.0
