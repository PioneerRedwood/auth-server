# REST API 서버 3번째 프로토타입
플레이어(실제 게임 월드에 존재)와 유저(계정 소유자)는 다른 개념

만약 유저가 게임에 접속하면 플레이어 테이블에 생성됨, 게임에서 나가면 플레이어 테이블에서 삭제


## URI 설명
localhost:8081... 로 시작


### 계정 관련 /auth
- 회원가입 POST
    - /signup/:account_id/:pwd/:name
- 로그인 GET
    - /signin/:account_id/:pwd
- 로그아웃 PUT
    - /signout/:user_id
- 계정정보 조회 GET
    - /account/:user_name


### 게임 관련 /game
- 게임 입장 PUT
    - /enter/:game_id/:user_id
- 아이디로 게임 조회 GET
    - /search/id/:game_id
- 이름으로 게임 조회 GET
    - /search/name/:game_name
- 게임 퇴장 PUT
    - /exit/:player_id
- 게임에 접속한 모든 플레이어 조회 GET
    - /player


### 로비 정보 /lobby
- 로비 생성 POST
    - /create/:game_id/:lobby_name/:host_id
- 모든 로비 정보 조회 GET
    - /search/all

---
~로 조회에 해당하는 요청은 URI에 &를 붙이는 방식으로 구현할 것
- 게임 아이디로 로비 조회
- 로비 이름으로 로비 조회
- 생성일로 로비 조회
---
- 입장 가능한 모든 로비 조회 GET
    - /search/joinable
- 로비 입장 PUT
    - /join/:player_id/:lobby_id
- 로비 삭제 POST
    - /delete/:host_name/:lobby_id
- 로비 수정 PUT
    - /update/:lobby_id/host_id/:lobby_name

