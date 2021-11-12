/**
 * 2021-11-12
 * auth_server
 * MySQL(local) -- RESTful API server 2차 프로토타입
 * localhost:3306
 * 
 */

const mysql = require('mysql2');
const restify = require('restify');
const errors = require('restify-errors');

var server = restify.createServer({
    name: '2nd_red_auth_server',
    version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.fullResponse());
server.use(restify.plugins.bodyParser());

// DB 연결
{
    var dbHost = 'localhost';
    var dbUser = 'root';
    var dbPwd = '';
    var dbName = 'red_db';
    
    var dbConn = mysql.createConnection({
        host: dbHost,
        port: 3306,
        user: dbUser,
        password: dbPwd,
        database: dbName
    });
    
    dbConn.connect();
}

function log(contents) {
    console.log('[DEBUG] CONTENTS: ', contents);
}

// signup handle
// account_id, pwd, username, mail, 
server.post('/signup/:id/:pwd/:name', function (req, res, next) {
    if (req.params.id && req.params.pwd && req.params.name) {
        console.log(JSON.stringify({ id: req.params.id, pwd: req.params.pwd, name: req.params.name }));
        
        // 먼저 계정에 넣을 수 있는지
        var sql = 'SELECT ACCOUNT_ID FROM RED_USER WHERE ACCOUNT_ID = ?';
        var params = [req.params.id];

        dbConn.query(
            sql,
            params,
            function (error, result, fields) {
                if (error) {
                    log(error);
                    next(new errors.InternalError());
                }

                if (result.length > 0) {
                    log('That ID already exsists');
                    res.send({error : 'Already exsists ID'});
                    return;
                }
                else {
                    // 여기서 새로운 계정 생성
                    // USER_ID는 자동 증가, 패스워드 암호화 없음, 유저 이름 중복 체크 없음, 마지막 로그인 날짜는 1970/1/1로 디폴트로 설정, 회원가입일 SYSDATE()
                    sql = 
                        'INSERT INTO RED_USER \
                        (USER_PWD, ACCOUNT_ID, ACCOUNT_MAIL, USER_NAME, LAST_LOGIN_DATE, SIGNUP_DATE) \
                        VALUES (?, ?, ?, ?, ?, SYSDATE())';
                    params = [req.params.pwd, req.params.id, 'whosmail@mail.com', req.params.name, '1970/1/1'];
                    dbConn.query(
                        sql,
                        params,
                        function(error, result, fields) {
                            if (error) {
                                log(error);
                                next(new errors.InternalError());
                            } else {
                                console.log(result);
                                res.send({name : req.params.name});
                                next();
                            }
                        }
                    );
                }
            }
        );
        return;
    } else {
        next(new errors.MissingParameterError());
        return;
    }
});


// sign in - get
server.get('/signin/:id/:pwd', function (req, res, next) {
    if (req.params.id && req.params.pwd) {
        // DB 접근
        console.log(JSON.stringify({ id: req.params.id, pwd: req.params.pwd }));
        res.json({
            id: req.params.id
        });
        next();
    } else {
        next(new errors.MissingParameterError());
        return;
    }
});

// get account info
server.get('/account/:id', function (req, res, next) {
    if (req.params.id) {
        console.log(JSON.stringify({ id: req.params.id }));
        // DB 접근
        res.send(200, { response: 'OK' });
        next();
    } else {
        next(new errors.MissingParameterError());
        return;
    }
});

server.listen(8081, function () {
    console.log('%s started %s', server.name, server.url);
    // console.log('auth_server started %s', port);
});