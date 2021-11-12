// 2021-10-20
// Copyright (c) 2012 Mark Cavage. All rights reserved.
// https://github.com/restify/node-restify/blob/master/examples/todoapp/lib/
// 해당 파일의 모든 저작권은 Mark Cavage에게 있음을 알립니다.

module.exports = {
    createClient: require('./client').createClient,
    createServer: require('./server').createServer
};