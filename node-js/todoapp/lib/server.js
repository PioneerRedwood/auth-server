// 2021-10-20
// Copyright (c) 2012 Mark Cavage. All rights reserved.
// https://github.com/restify/node-restify/blob/master/examples/todoapp/lib/
// 학습하기 위해 영어로 된 주석을 맥락에 대한 주관적인 이해를 바탕으로 하여 번역했습니다.
// 오류가 있을 수 있습니다.. 🙏
// 해당 파일의 모든 저작권은 Mark Cavage에게 있음을 알립니다.

var fs = require('fs');
var path = require('path');
var util = require('util');

var assert = require('assert-plus');
var pino = require('pino');
var restify = require('restify');
var errors = require('restify-errors');
const { equal } = require('assert');

// errors.makeConstructor('MissingTaskError', {
//     statusCode: 409,
//     restCode: 'MissingTask',
//     message: '"task" is a required parameter'
// });

// errors.makeConstructor('TodoExistsError', {
//     statusCode: 409,
//     restCode: 'TodoExists',
//     message: 'Todo already exists'
// });

// errors.makeConstructor('TodoNotFoundError', {
//     statusCode: 404,
//     restCode: 'TodoNotFound',
//     message: 'Todo was not found'
// });

/**
 * 이는 무의미한 커스텀 content-type 'application/todo'
 * 추가적인 content-type을 지원함을 보여주기 위한 것
 * text/plain content-type과 동일
 */
function formatTodo(req, res, body, cb) {
    if (body instanceof Error) {
        res.statusCode = body.statusCode || 500;
        body = body.message;
    } else if (typeof body === 'object') {
        body = body.task || JSON.stringify(body);
    } else {
        body = body.toString();
    }

    res.setHeader('Content-Length', Buffer.byteLength(body));
    return cb(null, body);
}

/**
 * HTTP 기본 인증 확인
 * 일부 핸들러는 허용된 user/pass 설정해야함
 */
function authenticate(req, res, next) {
    if (!req.allow) {
        req.log.debug('skipping authentication');
        next();
        return;
    }

    var authz = req.authorization.basic;

    if (!authz) {
        res.setHeader('WWW-Authenticate', 'Basic realm="todoapp"');
        next(new errors.UnauthorizedError('authentication required'));
        return;
    }

    if (
        authz.username !== req.allow.user ||
        authz.password !== req.allow.pass
    ) {
        next(new errors.ForbiddenError('invalid credentials'));
        return;
    }

    next();
}

/**
 * 이 핸들러는 'req.params' 요청에 대한 파라미터를 로드
 * 
 * POST /todo?name=foo HTTP/1.1
 * Host: localhost
 * Content-Type: application/json
 * Content-Length: ...
 *
 * {"task": "get milk"}
 * 
 * 'name', 'task' 두 개의 파라미터 값이 유효
 */
function createTodo(req, res, next) {
    // 왜 이쪽에 와서 req 파라미터 값이 없는걸까??
    // console.log("@@DEBUG@@ " + req.params.name + " : " + req.params.task);
    // task가 없으면 에러
    // 이 부분 디버깅해야함
    if (!req.params.task) {
        req.log.warn({ params: p }, 'createTodo: missing task');
        next(new errors.BadRequestError("There is no params recv: [" + req.params.name + "]["+ req.params.task + "]"));
        return;
    }

    // TODO에 대한 데이터 생성
    var todo = {
        name: req.params.name || req.params.task.replace(/\W+/g, '_'),
        task: req.params.task
    };

    // console.log("@@DEBUG@@ " + todo.name + " " + todo.task);
    // 만약 기존에 존재하면 에러
    if (req.todos.indexOf(todo.name) !== -1) {
        req.log.warn('%s already exists', todo.name);
        next(new errors.TodoExistsError(todo.name));
        return;
    }

    // 경로 정규화하고 JSON 파일로 저장
    var p = path.normalize(req.dir + '/' + todo.name);
    fs.writeFile(p, JSON.stringify(todo), function (err) {
        if (err) {
            req.log.warn(err, 'createTodo: unable to save');
            next(err);
        } else {
            req.log.debug({ todo: todo }, 'createTodo: done');
            res.send(201, todo);
            next();
        }
    });
}

// 이름에 맞는 TODO를 삭제
function deleteTodo(req, res, next) {
    fs.unlink(req.todo, function (err) {
        if (err) {
            req.log.warn(err, 'deleteTodo: unable to unlink %s', req.todo);
            next(err);
        } else {
            res.send(204);
            next();
        }
    });
}

// 병렬로 모든 TODO 삭제
function deleteAll(req, res, next) {
    var done = 0;

    // 안전하게 하기 위해 next가 한번에 하나씩 호출하도록 보장
    function cb(err) {
        if (err) {
            req.log.warn(err, 'unable to delete a TODO');
            next(err);
        } else if (++done === req.todos.length) {
            next();
        }
    }

    if (req.todos.length === 0) {
        next();
        return;
    }

    req.todos.foreach(function () {
        var p = req.dir + '/' + this;
        fs.unlink(p, cb);
    });
}

// /todo/:name 이 로드돼있는지 단순하게 확인
// loadTodos가 호출된 적이 있어야 함 Requires loadTodos to have run
function ensureTodo(req, res, next) {
    assert.arrayOfString(req.todos, 'req.todos');

    if (req.params.name && req.todos.indexOf(req.params.name) === -1) {
        req.log.warn('%s not found', req.params.name);
        next(new errors.TodoNotFoundError(req.params.name));
    } else {
        next();
    }
}

/**
 * 이름에 맞는 TODO 로드
 * 
 * loadTodos가 호출된 적이 있어야 함
 * 
 * 이 함수는 스트리밍처럼, 메일링 리스트 혹은 이슈 보드와 같은 많은 방식으로 사용
 * restify는 HTTP 인스턴스를 raw 노드처럼 사용하게 함
 * 
 * raw 노드 API를 사용하는 것은 
 * content 타협을 다룰 필요가 있음
 */
function getTodo(req, res, next) {
    if (req.accepts('json')) {
        var fstream = fs.createReadStream(req.todo);

        fstream.once('open', function onOpen() {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            fstream.pipe(res);
            fstream.once('end', next);
        });

        // 403, 404 등등 어떤 에러를 접할지 모호하지만
        // 이 데모에선 500을 호출하게 될 것
        fstream.once('error', next);
        return;
    }

    fs.readFile(req.todo, 'utf8', function (err, data) {
        if (err) {
            req.log.warn(err, 'get: unable to read %s', res.todo);
            next(err);
            return;
        }

        res.send(200, JSON.parse(data));
        next();
    });
}

/**
 * "DB"에 저장된 TODOs 로드
 * 대부분의 downstream 핸들러는 이들을 찾고 어느정도 수행하게 됨
 */
function loadTodos(req, res, next) {
    fs.readdir(req.dir, function (err, files) {
        if (err) {
            req.log.warn(err, 'loadTodos: unable to read %s', req.dir);
            next(err);
        } else {
            req.todos = files;

            if (req.params.name) {
                req.todo = req.dir + '/' + req.params.name;
            }

            req.log.debug(
                {
                    todo: req.todo,
                    todos: req.todos
                },
                'loadTODO: done'
            );

            next();
        }
    });
}

/**
 * 로드된 TODOs 리스트를 반환
 * 이미 loadTodo가 수행되어야 함
 */
function listTodos(req, res, next) {
    assert.arrayOfString(req.todos, 'req.todos');

    res.send(200, req.todos);
    next();
}

/**
 * TODO를 완전히 대체
 */
function putTodo(req, res, next) {
    if (!req.params.task) {
        req.log.warn({ params: req.params }, 'putTodo: missing task');
        next(new errors.MissingTaskError());
        return;
    }

    fs.writeFile(req.todo, JSON.stringify(req.body), function (err) {
        if (err) {
            req.log.warn(err, 'putTodo: unable to save');
            next(err);
        } else {
            req.log.debug({ todo: req.body }, 'putTodo: done');
            res.send(204);
            next();
        }
    });
}

// API

/**
 * 모든 경로가 정의된 서버를 반환
 */
function createServer(options) {
    assert.object(options, 'options');
    assert.string(options.directory, 'options.directory');
    assert.object(options.log, 'options.log');

    // logger와 custom formatter가 있는 서버 생성
    // 'version'이 의미하는 바는 모든 경로의 기본이 1.0.0임을 말함
    var server = restify.createServer({
        formatters: {
            'application/todo; q=0.9': formatTodo
        },
        log: options.log,
        name: 'todoapp',
        verstion: '1.0.0'
    });

    // 업로드시에 모든 데이터가 삭제되지 않는 것을 보장
    server.pre(restify.pre.pause());

    // sloppy한 경로를 정리
    server.pre(restify.pre.sanitizePath());

    // curl 같은 유저들을 위한 처리
    server.pre(restify.pre.userAgentConnection());

    // 요청마다 pino logger를 지정, requestid가 채워진 상태로
    server.use(restify.plugins.requestLogger());

    // IP당 초당 5개 요청을 허용, 10개일 경우 버스트(폭발?)
    server.use(
        restify.plugins.throttle({
            burst: 10,
            rate: 5,
            ip: true
        })
    );

    // 사용하게 될 공통의 것들 명시
    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.dateParser());
    server.use(restify.plugins.authorizationParser());
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.gzipResponse());
    server.use(restify.plugins.bodyParser());

    // 인증과 권한에 대한 자체 핸들러
    // 여기선 매우 기본적인 auth를 하지만 다음 링크를 참고할 것
    // https://github.com/joyent/node-http-signature
    server.use(function setup(req, res, next) {
        req.dir = options.directory;

        if (options.user && options.password) {
            req.allow = {
                user: options.user,
                password: options.password
            };
        }

        next();
    });

    server.use(authenticate);

    // TODO에 대한 진짜 CRUD 핸들러
    server.use(loadTodos);

    server.post('/todo', createTodo);
    server.get('/todo', listTodos);
    server.head('/todo', listTodos);

    // 나머지 것들은 TODO가 존재해야 수행 가능!
    server.use(ensureTodo);

    // 이름에 맞는 TODO 반환
    server.get('/todo/:name', getTodo);
    server.head('/todo/:name', getTodo);

    // 완전한 TODO 오버라이딩 body가 반드시 JSON이어야 함
    // - 다른 타입을 요구하게 될 경우 마찬가지로 415 에러를 반환 -
    // body parser로는 req.body가 fully JSON로 파싱이 가능하기 때문에
    // 직렬화하고 저장 ->
    server.put(
        {
            path: '/todo/:name',
            contentType: 'application/json'
        },
        putTodo
    );

    // 이름에 맞는 TODO 삭제
    server.del('/todo/:name', deleteTodo);

    // 모두 파괴
    server.del('/todo', deleteAll, function respond(req, res, next) {
        res.send(204);
        next();
    });

    // 기본적으로 '/' 핸들러 등록
    server.get('/', function root(req, res, next) {
        var routes = [
            'GET    /',
            'POST   /todo',
            'GET    /todo',
            'DELETE /todo',
            'PUT    /todo/:name',
            'GET    /todo/:name',
            'DELETE /todo/:name'
        ];
        res.send(200, routes);
        next();
    });

    // 감사 로거 audit logger 설정
    if (!options.noAudit) {
        server.on(
            'after',
            restify.plugins.auditLogger({
                body: true,
                log: pino({ level: 'info', name: 'todoapp-audit' }),
                event: 'after'
            })
        );
    }

    return server;
}

// 외부에서 찾을 수 있도록 수출 exports
module.exports = {
    createServer: createServer
}