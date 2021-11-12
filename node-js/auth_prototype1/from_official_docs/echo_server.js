// http://restify.com/docs/home/
var restify = require('restify');

function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

// 에이전트가 curl인지 확인,
// 맞을경우 Connection 헤더를 닫고 Connect-Length 헤더를 제거
server.pre(restify.plugins.pre.userAgentConnection());
server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});