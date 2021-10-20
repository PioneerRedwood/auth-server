# Node-js를 이용한 Auth server

## 1. restify

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



#### 공식 Github에 있는 예제들을 클론 코딩

그중 todoapp에 관하여 .. 클론 코딩하고 코드 분석한 결과

```bash
...\todoapp> node main.js -d . // 서버 실행 ...
{"level":30,"time":1634717007545,"pid":14956,"hostname":"..","name":"todoapp","msg":"listening at http://[::]:8080"}
```



lib/server.js

- 

lib/client.js

- 



#### 지원 사양을 충족하는가? - 나중에 체크할 것

1. OAuth2.0을 지원해야한다. Google, Apple, Kakao, Nexon 이 네개의 계정으로 인증 토큰을 주고 받는 기능을 지원해야 한다.
2. SSL을 지원하며 HTTP 1.1 이상의 기능을 지원해야 한다.
3. MySQL DB에 사용자 계정의 데이터를 저장하기 때문에 이에 대한 모든 트랜잭션이 가능해야 한다.
4. redis를 지원해야 한다.
5. 로그인/아웃 비동기 처리가 가능해야 한다. 상세한 속도에 관해서는 구체적으로 아는 게 없으니 정의하지 않는다.
6. RESTful API 기능을 지원해야 한다.
