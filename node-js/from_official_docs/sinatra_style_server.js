// 2021-10-20 DOCS study
// Sinatra 스타일 핸들러 체인

var restify = require('restify');

var server = restify.createServer();
server.get('/', function(req, res, next){
    res.send('home');
    return next();
});
server.post('/foo',
    function(req, res, next){
        req.someData = 'foo';
        return next();
    },
    function(req, res, next){
        res.send(req.someData);
        return next();
    }
);

/** 
 * restify server에는 세가지 고유한 핸들러 체인이 존재
 * pre - 라우팅 전에 실행되는 핸들러 체인
 * use - 라우팅 후에 실행되는 핸들러 체인
 * {httpVerb} - 경로에 따라 실행되는 핸들러 체인
 * 세 핸들러 체인 모두 단일, 다중 함수 또는 함수 배열을 허용
*/

// 슬래시 제거
server.pre(restify.plugins.pre.dedupeSlashes());

// restify는 핸들러를 등록된 순서대로 수행하기 때문에
// 정의한 어떠한 루트 전에 use()가 수행되도록 명시
server.use(function(req, res, next){
    console.warn('run for all routes');
    return next();
});

/**
 * 모든 처리 완료 핸들러 체인에는 next()를 수행해야하는 의무가 존재
 * next() 호출은 곧 체인의 다음으로 넘기는 역할을 수행
 * 다른 REST 프레임워크와는 다르게 res.send()는 next()를 자동으로 호출하지 않음
 * 많은 어플리케이션에서 res.send() 다음에 호출이 되도록 하는 게 있음
 * 그러니 응답을 플러시하는 것은 요청 완료와 동일한 것이 아님
 * 일반적인 경우 next()는 파라미터를 받지 않지만
 * 만약 어떠한 이유로 요청 프로세스를 멈추고 싶다면 next(false)를 호출하면 멈출 수 있다.
 *  */ 
server.use([
    function(req, res, next){
        if(someCondition){
            res.send('done!');
            return next(false);
        }
        return next();
    },
    function(req, res, next) {
        // 만약 someCondition이 true일 때, 핸들러는 절대 수행되지 않음
    }
]);






server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});