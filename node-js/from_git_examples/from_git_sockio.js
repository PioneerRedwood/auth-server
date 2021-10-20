// Copyright 2012 Mark Cavage, Inc.  All rights reserved.
// 2021-10-20

// npm install socket.io 설치
var socketio = require('socket.io');
var restify = require('restify');

var HTML =
    '<script src="/socket.io/socket.io.js"></script>\n' +
    '<script>\n' +
    'var socket = io("http://localhost:8080");\n' +
    'socket.on("news", function (data) {\n' +
    'console.log(data);\n' +
    'socket.emit("my other event", { my: "data" });\n' +
    '});\n' +
    '</script>';

var server = restify.createServer();
var io = socketio(server.server);

server.get('/', function indexHTML(req, res, next){
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', Buffer.byteLength(HTML));
    res.writeHead(200);
    res.write(HTML);
    res.end();
    next();
});

io.on('connection', function(socket) {
    socket.emit('news', {hello: 'world'});
    socket.on('my other event', function(data) {
        console.log(data);
    });
});

server.listen(8080, function() {
    console.log('socket.io server listening at %s', server.url);
});