# Node-js를 이용한 Auth server

#### 지원 사양을 충족하는가? - 나중에 체크할 것

1. OAuth2.0을 지원해야한다. Google, Apple, Kakao, Nexon 이 네개의 계정으로 인증 토큰을 주고 받는 기능을 지원해야 한다.
2. SSL을 지원하며 HTTP 1.1 이상의 기능을 지원해야 한다.
3. MySQL DB에 사용자 계정의 데이터를 저장하기 때문에 이에 대한 모든 트랜잭션이 가능해야 한다.
4. redis를 지원해야 한다.
5. ~~로그인/아웃 비동기 처리가 가능해야 한다. 상세한 속도에 관해서는 구체적으로 아는 게 없으니 정의하지 않는다.~~
6. ~~RESTful API 기능을 지원해야 한다.~~



## restify

[공식 사이트](http://restify.com/docs/home/)

### 2021-10-20 How does restify work?

restify는 REST API server를 짧은 시간 안에 구현하는 node-js 프레임워크 중 하나이다. 내부 라이브러리는 *.d.ts 라는 확장자를 사용하고 있는데 이를 찾아보니 JS로 구현돼있는 코드들을 TypeScript에서 사용할 수 있도록 만드는 설정 파일의 일종이다. [[스택오버플로우](https://stackoverflow.com/questions/21247278/about-d-ts-in-typescript)] TypeScript는 엄격한 타입 확인을 하는 JS라고 할 수 있는데 이에 대한 메타 정보가 담긴 파일인듯 하다.

그래서 restity의 내부적으로 사용되는 모듈들의 코드를 보면 ...

```tsx
// http.d.ts ..
...
declare module 'http' {
    import * as stream from 'node:stream';
    import { URL } from 'node:url';
    import { Socket, Server as NetServer } from 'node:net';
    // incoming headers will never contain number
    interface IncomingHttpHeaders extends NodeJS.Dict<string | string[]> {
        accept?: string | undefined;
        'accept-language'?: string | undefined;
        'accept-patch'?: string | undefined;
        'accept-ranges'?: string | undefined;
        'access-control-allow-credentials'?: string | undefined;
        'access-control-allow-headers'?: string | undefined;
...
```

이런 방식으로 타입에 대한 정보가 담긴다. 대게 이러한 low-level의 API를 살펴보는 것은 개발 지식이 느는데 큰 도움이 된다. 하지만 Node-js를 후보군으로 선택한 이유는 많은 상용화 라이브러리를 지원할 뿐만 아니라 low-level의 구현을 크게 신경쓰지 않아도 되기 때문이므로 자세하게 살펴보지는 않을 것이다. 



#### [공식 Github](https://github.com/restify/node-restify/)에 있는 예제들을 클론 코딩

그중 [todoapp](https://github.com/restify/node-restify/tree/master/examples/todoapp/lib)에 관하여 .. 클론 코딩하고 코드 실행 .. 오류가 뜬다.. 

```bash
...\todoapp> node main.js -d . // 서버 실행 ...
{"level":30,"time":1634717007545,"pid":14956,"hostname":"..","name":"todoapp","msg":"listening at http://[::]:8080}
```

- 첫번째 오류

  - 커스터마이징한 오류 페이지가 제대로 작동하지 않음

    ```js
    errors.makeConstructor('MissingTaskError', {
        statusCode: 409,
        restCode: 'MissingTask',
        message: '"task" is a required parameter'
    });
    
    errors.makeConstructor('TodoExistsError', {
        statusCode: 409,
        restCode: 'TodoExists',
        message: 'Todo already exists'
    });
    
    errors.makeConstructor('TodoNotFoundError', {
        statusCode: 404,
        restCode: 'TodoNotFound',
        message: 'Todo was not found'
    });
    ```

- 두번째 오류

  - POST는 기존에 없는 것으로 만들어야하는데 createTODO - '할일' 생성하는 함수에서 기존에 있지 않으면 오류를 내는 ensureTODO 함수를 실행하면서 에러가 뜸. 순서가 잘못 된 것?

- 세번째 오류

  - 서버에 POST로 등록된 매핑 함수 createTodo는 req.params 값에 설정이 Git에 있는 POST 명령으로 제대로 작동하지 않는다. 이유는 알 수 없다.

  - ```bash
    > curl -isS http://127.0.0.1:8080/todo -X POST -d name=demo -d task="buy milk"
    ```

지금 보아하니 예제가 내가 사용하기엔 과분한 예제인 듯하다. 기존에 nodejs로 서버를 만들어봤으면 모를까.. 그래서 최대한 프로토타입을 단순화하기로 했다.



## REST API, params vs query?

POSTMAN을 이용해 서버에 GET 요청을 했더니 params으로 오길 바랐던 것이 query로 들어갔다.. req.body req.params, req.query 등등 request에 담긴 내용을 가져오는 방법이 많은데 차이가 과연 무엇일까? 

[스택오버플로우에서 답변](https://stackoverflow.com/questions/30967822/when-do-i-use-path-params-vs-query-params-in-a-restful-api)을 상당히 잘해줬다. 

```
Best practice for RESTful API design is that path params are used to identify a specific resource or resources, while query parameters are used to sort/filter those resources.

RESTful API 디자인의 모범 사례는 특정 리소스를 식별하기 위해 경로 매개변수를 사용하는 반면 쿼리 매개변수 해당 리소스를 정렬 혹은 필터링하는 것입니다.
```

로그인만 구현하는 것이 아니라 계정 서비스를 RESTful API로 구현해야하는 입장에서 필요한 지식이었다. 

[또다른 스택오버플로우 글](https://stackoverflow.com/questions/10885152/rest-shouldnt-put-create-and-post-update) 

POST는 없던 리소스를 만들어내기 위한 것. PUT은 기존에 있는 리소스에 대한 수정을 목적으로 한 접근



## Why REST API?

내가 개인적으로 auth/account 서버를 REST API로 사용하여 제작하는 이유는 다음과 같다.

1. Python의 웹 프레임워크 django를 사용한 REST API 서버를 구현 경험이 있다.
2. 빠른 프로토타입 생성 가능
3. POSTMAN 등으로 쉽게 결과 확인 가능



### 단순한 프로토타입 설계

POST, GET, PUT, DEL (CRUD) 를 지원하는 URI 매핑 함수를 만든다. DB는 JSON 파일로.

#### 로그인

- GET
- /signin/id/pwd

#### 계정 보기

- GET
- /account/id

#### 회원가입

- POST
- /signup/id/pwd/date

#### 계정 수정

- PUT
- /account/edit?id=_

#### 계정 삭제

- DEL
- /account/del?id=_

