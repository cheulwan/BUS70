# BUS70 V2.7

GitHub Pages용 PWA 시험판입니다.

## 파일
- index.html
- sw.js
- manifest.json
- icon-192.png
- icon-512.png

## GitHub Pages
저장소 `cheulwan/BUS70`의 main 브랜치 루트에 위 파일을 올립니다.
GitHub 저장소 > Settings > Pages > Build and deployment > Deploy from a branch
Branch: main / root 로 설정합니다.

예상 주소:
https://cheulwan.github.io/BUS70/

## 모바일 테스트
1. 위 GitHub Pages 주소를 Chrome에서 엽니다.
2. 박철완 / 626023 으로 기사 로그인합니다.
3. 개발 현황 > GitHub Pages / PWA 모바일 테스트에서 `상태 확인`.
4. `알림 사용 시작`을 눌러 권한을 허용합니다.
5. `테스트 알림`을 눌러 휴대폰 알림창에 BUS70 알림이 뜨는지 확인합니다.
6. `홈 화면에 BUS70 설치` 또는 브라우저 메뉴의 `홈 화면에 추가`를 사용합니다.
7. 기사 운행일을 선택하고 `이 운행일 스케줄 저장 · 자동알림 준비`를 누릅니다.

## 현재 알림 범위
- 웹앱/PWA가 실행 중이거나 OS가 해당 웹앱 프로세스를 유지하는 동안:
  - 첫탕 60분 전 출근준비
  - 각 탕 시작 10분/5분/1분 전
  - Service Worker 시스템 알림 + 페이지 음성
- 앱/브라우저를 완전히 종료한 상태에서 정확한 시각의 알림은 Web Push 서버 단계가 추가로 필요합니다.
- `sw.js`에는 향후 Web Push 수신부가 이미 포함되어 있습니다.

## Google DB
V2.6.1에서 사용한 Google Apps Script / BUS70 DB 연결을 그대로 사용합니다.
