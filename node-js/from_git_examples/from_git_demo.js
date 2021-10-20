// 2021-10-20 node-REST-server
// https://github.com/restify/node-restify/blob/master/examples/dtrace/demo.js
'use strict';

// npm install pino 필요
var restify = require('restify');
var Logger = require('pino');

var NAME = 'exampleapp';

var log = new Logger({
    name: NAME,
    level: 'trace',
    base: {server:NAME}
});

var server = restify.createServer({
    name: NAME,
    Logger: log,
    dtrace: true,
    formatters: {
        'application/foo': function(req, res, body){
            if(body instanceof Error){
                body = body.stack;
            } else if(Buffer.isBuffer(body)){
                body = body.toString('base64');
            } else {
                switch(typeof body){
                    case 'boolean':
                    case 'number':
                    case 'string':
                        body = body.toString();
                        break;
                    case 'undefined':
                        body = '';
                        break;
                    default:
                        body = 
                            body === null
                                ? ''
                                : 'Demoing application/foo formatters; ' + 
                                    JSON.stringify(body);
                        break;
                }
            }
            return body;
        }
    }
});

// restify에 내장된 플러그인들을 사용하는 듯 하다
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.authorizationParser());
server.use(restify.plugins.dateParser());
server.use(restify.plugins.queryParser());
server.use(restify.plugins.urlEncodedBodyParser());

server.use(function slowhandler(req, res, next){
    setTimeout(function() {
        next();
    }, 250);
});

server.get(
    {url:'/foo/:id', name: 'GetFoo'},
    function(req, res, next) {
        next();
    },
    function sendResult(req, res, next) {
        res.contentType = 'application/foo';
        res.send({
            hello: req.params.id
        });
        next();
    }
);

server.head('/foo/:id', function(req, res, next){
    res.send({
        hello: req.params.id
    });
    next();
});

server.put('/foo/:id', function(req, res, next){
    res.send({
        hello: req.params.id
    });
    next();
});

server.post('/foo/:id', function(req, res, next) {
    res.json(201, req.params);
    next();
});

server.del('/foo/:id', function(req, res, next) {
    res.json(204);
    next();
});

server.on('after', function(req, res, next){
    req.log.info('%s just finished: %d', NAME, res.code);
});

server.on('NotFound', function(req, res){
    res.send(404, req.url + ' was not found');
});

server.listen(9000, function(){
    log.info('listening: %s', server.url);
});
