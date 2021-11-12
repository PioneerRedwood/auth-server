// 2021-10-20
// Copyright (c) 2012 Mark Cavage. All rights reserved.
// https://github.com/restify/node-restify/blob/master/examples/todoapp/lib/
// 학습하기 위해 영어로 된 주석을 맥락에 대한 주관적인 이해를 바탕으로 하여 번역했습니다.
// 오류가 있을 수 있습니다.. 🙏
// 해당 파일의 모든 저작권은 Mark Cavage에게 있음을 알립니다.

var util = require('util');

var assert = require('assert-plus');
var restify = require('restify');
const { UV_FS_O_FILEMAP } = require('constants');

var sprintf = util.format;

// API

function TodoClient(options) {
    assert.object(options, 'options');
    assert.object(options.log, 'options.log');
    assert.optionalString(options.socketPath, 'options.socketPath');
    assert.optionalString(options.url, 'options.url');
    assert.optionalString(options.version, 'options.version');

    var ver = options.verstion || '~1.0';

    this.client = restify.createClient({
        log: options.log,
        name: 'TodoClient',
        socketPath: options.socketPath,
        type: 'json',
        url: options.url,
        version: ver
    });
    this.log = options.log.child({component: 'TodoClient'}, true);
    this.url = options.url;
    this.verstion = ver;

    if(options.username && options.password) {
        this.username = options.username;
        this.client.basicAuth(options.username, options.password);
    }
}

TodoClient.prototype.create = function create(task, cb) {
    assert.string(task, 'task');
    assert.func(cb, 'callback');

    this.client.post('/todo', {task: task}, function(err, req, res, obj) {
        if(err) {
            cb(err);
        } else {
            cb(null, obj);
        }
    });
};

TodoClient.prototype.list = function list(cb) {
    assert.func(cb, 'callback');

    this.client.get('/todo', function(err, req, res, obj) {
        if(err) {
            cb(err);
        } else {
            cb(null, obj);
        }
    });
};

TodoClient.prototype.get = function get(name, cb) {
    assert.string(name, 'name');
    assert.func(cb, 'callback');

    this.client.get('/todo/' + name, function(err, req, res, obj) {
        if(err) {
            cb(err);
        } else {
            cb(null, obj);
        }
    });
};

TodoClient.prototype.update = function update(todo, cb) {
    assert.object(todo, 'todo');
    assert.func(cb, 'callback');

    this.client.put('/todo/' + todo.name, todo, function(err) {
        if(err) {
            cb(err);
        } else {
            cb(null);
        }
    });
};

TodoClient.prototype.del = function del(name, cb) {
    if(typeof name === 'function') {
        cb = name;
        name = '';
    }
    assert.string(name, 'name');
    assert.func(cb, 'callback');

    var p = '/todo' + (name.length > 0 ? '/' + name : '');
    this.client.del(p, function(err) {
        if(err) {
            cb(err);
        } else {
            cb(null);
        }
    });
};

TodoClient.prototype.toString = function toString() {
    var str = sprintf(
        '[object TodoClient<url=%s, username=%s, version=%s]',
        this.url,
        this.username || 'null',
        this.version
    );
    return str;
};

/// end of API

module.exports = {
    createClient: function createClient(options) {
        return new TodoClient(options);
    }
};