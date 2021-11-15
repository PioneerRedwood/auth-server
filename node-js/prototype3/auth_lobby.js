/**
 * 2021-11-15
 * Auth + lobby RESTful API server 3차 프로토타입
 * MySQL(local)
 * localhost:3306
 * 
 */

// 라이브러리
const mysql = require('mysql2');
const restify = require('restify');
const errors = require('restify-errors');

// server 생성
{
    var server = restify.createServer({
        name: 'red rest server',
        version: '1.3.0'
    });

    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.fullResponse());
    server.use(restify.plugins.bodyParser());
}

// DB 연결
{
    var dbHost = 'localhost';
    var dbUser = 'root';
    var dbPwd = '';
    var dbName = 'open_lobby';

    var conn = mysql.createConnection({
        host: dbHost,
        port: 3306,
        user: dbUser,
        password: dbPwd,
        database: dbName
    });

    conn.connect();
}

function log(contents) {
    console.log('[DEBUG] CONTENTS: ', contents);
}

// signup
server.post('/auth/signup/:account_id/:pwd/:name', function (req, res, next) {
    if (req.params.account_id && req.params.pwd && req.params.name) {
        console.log(JSON.stringify({ id: req.params.account_id, pwd: req.params.pwd, name: req.params.name }));
        conn.query(
            'SELECT ACCOUNT_ID\
            FROM RED_USER \
            WHERE ACCOUNT_ID = ?',
            req.params.account_id,
            function (error, result, fields) {
                if (error) {
                    log(error);
                    next(new errors.InternalError());
                } else {
                    if (result.length > 0) {
                        log('That ID already exsists');
                        res.send({ error: 'Already exsists ID' });
                        return;
                    }
                    else {
                        conn.query(
                            'INSERT INTO RED_USER \
                             (ACCOUNT_ID, ACCOUNT_PWD, ACCOUNT_MAIL, USER_NAME, SIGNUP_DATE, IS_LOGGED_IN) \
                             VALUES (?, ?, ?, ?, NOW(), ?)',
                            [req.params.account_id, req.params.pwd, 'whosmail@mail.com', req.params.name, 0],
                            function (error, result, fields) {
                                if (error) {
                                    log(error);
                                    next(new errors.InternalError());
                                } else {
                                    console.log(result);
                                    res.send({ name: req.params.name, contents: 'Sign in success!' });
                                    next();
                                }
                            }
                        );
                    }
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
server.get('/auth/signin/:account_id/:pwd', function (req, res, next) {
    if (req.params.account_id && req.params.pwd) {
        console.log(JSON.stringify({ account_id: req.params.account_id, pwd: req.params.pwd }));
        // DB 접근
        conn.query(
            // function
            'SELECT USER_ID, IS_LOGGED_IN \
            FROM RED_USER \
            WHERE ACCOUNT_ID = ? and ACCOUNT_PWD = ?',
            [req.params.account_id, req.params.pwd],
            function (error, result, fields) {
                if (error) {
                    // 쿼리 에러 -- 서버 에러
                    log(error);
                    next(new errors.InternalError());
                } else {
                    if (result.length != 1) {
                        log("not registered account");
                        res.send({ result: 'not registered account' });
                        next();
                        return;
                    }

                    if (result[0]['IS_LOGGED_IN'] != 0) {
                        log("Already logged in");
                        res.send({ result: 'You are already logged in' });
                        next();
                        return;
                    }

                    conn.query(
                        'UPDATE RED_USER\
                        SET LAST_LOGIN_DATE = CURRENT_TIME(), IS_LOGGED_IN = 1\
                        WHERE USER_ID = ?',
                        result[0]['USER_ID'],
                        function (error, result, fields) {
                            if (error) {
                                // 쿼리 에러 -- 서버 에러
                                log(error);
                                next(new errors.InternalError());
                            } else {
                                // log('유저의 마지막 로그인 데이터 업데이트 완료');
                            }
                        }
                    );

                    conn.query(
                        'SELECT * \
                        FROM RED_USER\
                        WHERE USER_ID = ?',
                        result[0]['USER_ID'],
                        function (error, result, fields) {
                            if (error) {
                                // 쿼리 에러 -- 서버 에러
                                log(error);
                                next(new errors.InternalError());
                            } else {
                                log(result);
                                res.send(result);
                                next();
                            }
                        }
                    );
                }
            }
        );
    } else {
        next(new errors.MissingParameterError());
        return;
    }
    return;
});

// sign out - put
server.put('/auth/signout/:user_id', function (req, res, next) {
    if (req.params.user_id) {
        conn.query(
            'UPDATE RED_USER\
            SET IS_LOGGED_IN = 0\
            WHERE USER_ID = ?',
            req.params.user_id,
            function (error, result, fields) {
                if (error) {
                    // 쿼리 에러 -- 서버 에러
                    log(error);
                    next(new errors.InternalError());
                } else {
                    log('sign out completed');
                    res.send(200, { result: 'sign out completed' });
                    next();
                }
            }
        );
        return;
    } else {
        next(new errors.MissingParameterError());
        return;
    }
});

// get account info
server.get('/auth/account/:user_name', function (req, res, next) {
    if (req.params.user_name) {
        console.log(JSON.stringify({ user_name: req.params.user_name }));
        // DB 접근
        conn.query(
            'SELECT ACCOUNT_ID, USER_NAME, USER_ID, IS_LOGGED_IN \
            FROM RED_USER \
            WHERE USER_NAME = ?',
            req.params.user_name,
            function (error, result, fields) {
                if (error) {
                    // 쿼리 에러 -- 서버 에러
                    log(error);
                    next(new errors.InternalError());
                } else {
                    if (result.length > 0) {
                        log(result);
                        res.send(result);
                        next();
                    } else {
                        // 해당 유저 정보가 없음
                        log("no data");
                        res.send({result: 'not registered account'});
                        next();
                    }
                }
            }
        );

    } else {
        next(new errors.MissingParameterError());
        return;
    }

    return;
});

// enter the game
server.put('/game/enter/:game_id/:user_id', function (req, res, next) {
    if (req.params.game_id && req.params.user_id) {
        // 로그인한 상태인지(이건 이미 됐다고 치부), 다른 게임에 접속해있지는 않은지 체크
        conn.query(
            'SELECT *\
            FROM PLAYER\
            WHERE USER_ID = ?',
            req.params.user_id,
            function (error, result) {
                if (error) {
                    log(error);
                    next(new errors.InternalError());
                } else {
                    // 이미 다른 게임에 접속한 상태 - 다른 게임에서 로그아웃하거나 여기 접속을 안하거나
                    // 해당 게임에 이미 접속 or 다른 게임에서 이미 접속 --> 각 처리를 다르게
                    // 플레이어는 반드시 하나만 존재해야 함
                    if (result.length > 0) {
                        res.send({ player_status: 'You are already ..' });
                        next();
                        return;
                    }

                    conn.query(
                        'INSERT INTO PLAYER\
                        (GAME_ID, USER_ID)\
                        VALUES(?, ?)',
                        [req.params.game_id, req.params.user_id],
                        function (error, result) {
                            if (error) {
                                log(error);
                                next(new errors.InternalError());
                            } else {
                                log('READY PLAYER ON');
                                res.send(200, { result });
                                next();
                            }
                        }
                    );
                }
            }
        );


        return;
    } else {
        log('No parameter');
        next(new errors.MissingParameterError());
    }
    return;
});

// get game info by game_id
server.get('/game/search/id/:game_id', function (req, res, next) {
    if (req.params.game_id) {
        conn.query(
            'SELECT * FROM GAME WHERE GAME_ID = ?',
            req.params.game_id,
            function (error, result) {
                if (error) {
                    log(error);
                    next(new errors.InternalError());
                } else {
                    log('select success');
                    res.send(result);
                    next();
                }
            }
        );
        return;
    } else {
        log('No parameter');
        next(new errors.MissingParameterError());
    }
    return;
});

// get game info by game_name
server.get('/game/search/name/:game_name', function (req, res, next) {
    if (req.params.game_name) {
        conn.query(
            'SELECT * FROM GAME WHERE GAME_NAME = ?',
            req.params.game_name,
            function (error, result) {
                if (error) {
                    log(error);
                    next(new errors.InternalError());
                } else {
                    log('select success');
                    res.send(result);
                    next();
                }
            }
        );
        return;
    } else {
        log('No parameter');
        next(new errors.MissingParameterError());
    }
    return;
});

// exit the game
server.put('/game/exit/:player_id', function (req, res, next) {
    if (req.params.player_id) {
        conn.query(
            'DELETE FROM PLAYER WHERE PLAYER_ID = ?',
            req.params.player_id,
            function (error, result) {
                if (error) {
                    log(error);
                    next(new errors.InternalError());
                } else {
                    log('delete success');
                    res.send(result);
                    next();
                }
            }
        );
        return;
    } else {
        log('No parameter');
        next(new errors.MissingParameterError());
    }
    return;
});

// get whole player at game
server.get('/game/player', function (req, res, next) {
    conn.query(
        'SELECT * FROM PLAYER',
        function (error, result) {
            if (error) {
                log(error);
                next(new errors.InternalError());
            } else {
                res.send({ result: result });
                next();
            }
        }
    );
    return;
});

// create lobby
server.post('/lobby/create/:game_id/:lobby_name/:host_id', function (req, res, next) {
    if (req.params.game_id && req.params.lobby_name && req.params.host_id) {
        conn.query(
            'SELECT COUNT(*) as count\
            FROM LOBBY\
            WHERE HOST_ID = ?',
            req.params.host_id,
            function(error, result) {
                if(error) {
                    log(error);
                    next(new errors.InternalError());
                    return;
                } else {
                    if(result[0]['count'] < 1) {
                        conn.query(
                            'INSERT INTO LOBBY\
                            (GAME_ID, HOST_ID, MAX_USER_COUNT, LOBBY_NAME)\
                            VALUES\
                            (?, ?, 4, ?)',
                            [req.params.game_id, req.params.host_id, req.params.lobby_name],
                            function (error, result) {
                                if (error) {
                                    log(error);
                                    next(new errors.InternalError());
                                } else {
                                    log('create lobby success');
                                    res.send({result: 'create lobby success'});
                                    next();
                                }
                            }
                        );
                    } else {
                        log('can not create a lobby again');
                        res.send({result: 'you are already possessing a lobby'});
                        next();
                    }
                }
            }
        );
        return;
    } else {
        log('No parameter');
        next(new errors.MissingParameterError());
    }
    return;
});

// get all lobbies
server.get('/lobby/search/all', function(req, res, next) {
    conn.query(
        'SELECT * FROM LOBBY',
        function(error, result) {
            if(error) {
                log(error);
                next(new errors.InternalError());
            } else {
                log(result);
                res.send({result: result});
                next();
            }
        }
    );
    return;
});

// get by property 형식은 URI에 &연산자 넣는 방식으로 구현해야.. 찾아야함
// get lobby by game_id
// get lobby by name
// get lobby by host_id
// get lobby by create date

// get all joinable lobbies

// join lobby
server.put('/lobby/joun/:lobby_id', function(req, res, next) {
    if(req.params.lobby_id) {
        // 로비에 입장하기 위한 절차 밟기..
        // 플레이어
        conn.query(
            ''
        );

    } else {
        log('No parameter');
        next(new errors.MissingParameterError());
    }
    return;
});

// delete lobby


// update lobby

server.listen(8081, function () {
    console.log('%s started %s', server.name, server.url);
});
