// 2021-10-21
// https://gist.github.com/repkam09/03d4b84d7dc9f530800d

var restify = require('restify');
var server = restify.createServer({
    name: 'RED auth/account RESTful API server',
    version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
// server.use(restify.plugins.CORS());
server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser({mapParams: true}));

server.get('/account', function(req, res, next) {
    if(req.params.id && req.params.server) {
        res.send(200, {response: 'exsists'});
    } else {
        res.send(400, {response: 'not exsists'});
    }
    return next();
});

server.post('/login', function(req, res, next) {
    if(req.body.user && req.body.message) {
        var text = req.body.message;
        var user = req.body.user;
        console.log(user + ": " + text);

        res.send(200, {response: '[GET] hello ' + user});
    } else {
        res.send(400, {response: '[GET] incorrect params'});
    }
    return next();
});

server.post('/signup/id/pwd', function (req, res, next) {
    if(req.body.user && req.body.message) {
        var text = req.body.message;
        var user = req.body.user;
        console.log(user + ": " + text);

        res.send(200, {response: '[POST] hello ' + user});
    } else {
        res.send(400, {response: '[POST] incorrect params'});
    }
    return next();
});

server.listen(8081, function() {
    console.log('%s RED auth/account RESTful API server listening %s', server.name, server.url);
});