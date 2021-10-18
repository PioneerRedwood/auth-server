# Authentication server / Account server

2021-10-18  ~ 

로그인/계정 웹 인증을 위한 서버를 만든다. 어떠한 아키텍처를 사용하는 것이 좋을지 확인해보기 위해 사용할 서버 프레임워크(아키텍처)에 대해 구현 가능하고 간단한 프로토타입들을 만들고 소개한다.

인증/계정 서버에 필요한 기능을 먼저 정의하는 게 전체적인 아키텍처를 고르는데 도움이 될 것 같다.

1. OAuth2.0을 지원해야한다. Google, Apple, Kakao, Nexon 이 네개의 계정으로 인증 토큰을 주고 받는 기능을 지원해야 한다.
2. SSL을 지원하며 HTTP 1.1 이상의 기능을 지원해야 한다.
3. MySQL DB에 사용자 계정의 데이터를 저장하기 때문에 이에 대한 모든 트랜잭션이 가능해야 한다.
4. redis를 지원해야 한다.
5. 로그인/아웃 비동기 처리가 가능해야 한다. 상세한 속도에 관해서는 구체적으로 아는 게 없으니 정의하지 않는다.
6. RESTful API 기능을 지원해야 한다.



## C++ boost-beast

[boostorg/beast](boostorg/beast)

간단한 웹 통신 서버이다. http-server-sync.exe [주소] [포트] [루트 경로] 로 실행한다.

<img src="https://user-images.githubusercontent.com/45554623/137684027-edac7196-ca0e-4e31-be71-20b432fad665.png">

간단한 웹 통신 클라이언트이다. http-client-sync.exe [도메인 주소(혹은 IP주소)] [포트] [파일 경로]로 실행한다.

<img src="https://user-images.githubusercontent.com/45554623/137684658-d9df98ae-0843-45bb-ab46-8b37f5cf94ff.png">

이를 RESTful로 변경하기 위해서.. 기존에 다른 사람이 만들어놓은 프레임워크 [BeastHttp](https://github.com/0xdead4ead/BeastHttp), [Foxy](https://github.com/LeonineKing1199/foxy)을 사용하거나 내가 직접 만들어야 한다. 물론 개발을 배울 수 있는 좋은 기회가 되겠지만 쉽지 않을 것 같으니 생각을 해봐야겠다.. 

<img src="https://user-images.githubusercontent.com/45554623/137689617-2a8e2e2d-1f15-49b8-816e-8fd431d0b2af.png">

코드를 조금 손 봐서 text 형태로 요청하고 응답받는 GET명령까지 만들어봤다.

<img src="https://user-images.githubusercontent.com/45554623/137694106-0a53b8e8-9c2d-488f-9f33-cde057f7afcc.png">

클라이언트

<img src="https://user-images.githubusercontent.com/45554623/137694110-6eba5076-f570-43aa-b838-fb3e3f6dc2b6.png">

서버

비동기 클래스로 만들어서 각 요청에 대한 답을 만들어 낸 다음에 MySQL Connection for C++을 연동하고 CRUD까지만 하는 작업만 수행하면 될 듯하다. 말은 간단하지만 끝까지 하려면 생각지 못한 장애물들이 있을 것이다. 
