# Authentication server / Account server

## 목표

로그인/계정 웹 인증을 위한 서버를 만든다. 어떠한 아키텍처를 사용하는 것이 좋을지 확인해보기 위해 사용할 서버 프레임워크(아키텍처)에 대해 구현 가능하고 간단한 프로토타입들을 만들고 소개한다.

인증/계정 서버에 필요한 기능을 먼저 정의하는 게 전체적인 아키텍처를 고르는데 도움이 될 것 같다.



## 지원 사양

1. OAuth2.0을 지원해야한다. Google, Apple, Kakao, Nexon 이 네개의 계정으로 인증 토큰을 주고 받는 기능을 지원해야 한다.
2. SSL을 지원하며 HTTP 1.1 이상의 기능을 지원해야 한다.
3. MySQL DB에 사용자 계정의 데이터를 저장하기 때문에 이에 대한 모든 트랜잭션이 가능해야 한다.
4. redis를 지원해야 한다.
5. 로그인/아웃 비동기 처리가 가능해야 한다. 상세한 속도에 관해서는 구체적으로 아는 게 없으니 정의하지 않는다.
6. RESTful API 기능을 지원해야 한다.



## 아키텍처 후보군

- C++기반의 boost-beast
- Python 기반의 django
- Java 기반의 spring framework
- Node-js 기반의 Express.JS / Socket.io / Restify.JS



## Node-js Restify가 선택됨

#### auth_prototype1

- 공식 문서나 깃에 있는 여러 예시들을 따라하며 익숙해지며 1차 프로토타입 개발

#### auth_prototype2

- MySQL 적용한 2차 프로토타입 개발
- sql 파일 적용



##### MySQL 기록

MySQL Server 8.0 install..

- C:\Program Files\MySQL\MySQL Server 8.0\data 서버 데이터 경로
- C:\Program Files\MySQL\MySQL Server 8.0\bin 서버 실행 파일 경로

```bash
C:\Program Files\MySQL\MySQL Server 8.0\bin> mysqld --initialize-insecure
C:\Program Files\MySQL\MySQL Server 8.0\bin> mysqld --standalone

.. in other cmd window .. 

C: ...> color 02
C: ...> mysql -u root -p
Enter password: _

mysql> ...
```



NetService 이름: 211115_MySQL

```bash
C:\Program Files\MySQL\MySQL Server 8.0\bin> net start 211115_MySQL
C:\Program Files\MySQL\MySQL Server 8.0\bin> net stop 211115_MySQL
```



