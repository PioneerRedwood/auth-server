// 2021-10-20
// https://github.com/restify/node-restify/blob/master/examples/http2/http2.js

// 필요한 패키지 가져오기
var path = require('path');
var fs = require('fs');
var pino = require('pino');
var restify = require('restify');

// 서버 생성
// http2 옵션일 때, https 서버에는 필수적.
// 세 가지 PEM(Privacy Enhanced Mail) 파일이 요구된다.
// cert: CERTIFICATE 키, 도메인 인증서
// key: RSA Private 키, 도메인 비밀키
// ca: CERTIFICATE REQUEST, 상위 인증서
var server = restify.createServer({
    http2: {
        cert: fs.readFileSync(path.join(__dirname, './http2/keys/http2-cert.pem')),
        key: fs.readFileSync(path.join(__dirname, './http2/keys/http2-key.pem')),
        ca: fs.readFileSync(path.join(__dirname, './http2keys/http2-csr.pem'))
    }
});

// GET 
server.get('/', function(req, res, next) {
    res.send({hello: 'world'});
    next();
});

// on..?
server.on(
    'after',
    restify.plugins.auditLogger({
        event: 'after',
        body: true,
        log: pino(
            {name: 'audit'},
            process.stdout
        )
    })
);

server.listen(8080, function() {
    console.log('ready on %s', server.url);
});

// https://localhost:8080/ 으로 접속하면 결과가 나온다.
// 접속 후 응답에 대한 로그가 콘솔에 출력되는데 json형태로 크기가 크게 나온다..
// https://nodejs.org/api/http2.html