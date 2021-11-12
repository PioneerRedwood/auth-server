/**
 * 2021-10-21
 * red-prototype-server
 * DB없는 RESTful API server 1차 프로토타입
 * C++ 서버에서 통신이 가능해야 함
 */

const restify = require('restify');
const errors = require('restify-errors');

var server = restify.createServer({
    name: 'red-prototype-restapi-server',
    version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());

// sign up - post
server.post('/signup/:id/:pwd/:date', function (req, res, next) {
    if (req.params.id && req.params.pwd && req.params.date) {
        // DB 접근
        console.log(JSON.stringify({id: req.params.id, pwd: req.params.pwd, date: req.params.date}));
        res.send(200, {response: 'OK'});
        next();
    } else {
        next(new errors.MissingParameterError());
        return;
    }
});

// sign in - get
server.get('/signin/:id/:pwd', function (req, res, next) {
    if (req.params.id && req.params.pwd) {
        // DB 접근
        console.log(JSON.stringify({id: req.params.id, pwd: req.params.pwd}));
        res.json({
            id: req.params.id
        });
        next();
    } else {
        next(new errors.MissingParameterError());
        return;
    }
});

server.get('/account/:id', function(req, res, next) {
    if(req.params.id) {
        console.log(JSON.stringify({id: req.params.id}));
        // DB 접근
        res.send(200, {response: 'OK'});
        next();
    } else {
        next(new errors.MissingParameterError());
        return;
    }
});

// account info - get
// account update - put
// account delete - del

server.listen(8081, function () {
    console.log('%s started %s', server.name, server.url);
});
