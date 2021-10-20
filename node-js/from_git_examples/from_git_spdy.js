// 2021-10-20
// https://github.com/restify/node-restify/blob/master/examples/spdy/spdy.js

// 필요한 패키지 가져오기
var path = require('path');
var fs = require('fs');
var pino = require('pino');
var restify = require('restify');

// 서버 생성
// spdy 옵션일 때, 세 가지 키 필요.. http2와 흡사
var server = restify.createServer({
    spdy: {
        cert: fs.readFileSync(path.join(__dirname, './spdy/keys/spdy-cert.pem')),
        key: fs.readFileSync(path.join(__dirname, './spdy/keys/spdy-key.pem')),
        ca: fs.readFileSync(path.join(__dirname, './spdy/keys/spdy-csr.pem'))
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
        log: pino({name: 'audit'})
    })
);

server.listen(8080, function() {
    console.log('ready on %s', server.url);
});