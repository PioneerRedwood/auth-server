// 2021-10-20

var restify = require('restify');

var server = restify.createServer();
server.use(restify.plugins.queryParser());
server.use(restify.plugins.jsonp());
server.get('/', function(req, res, next){
    res.send({hello: 'world'});
    next();
});

server.listen(8080, function() {
    console.log('ready on %s', server.url);
});