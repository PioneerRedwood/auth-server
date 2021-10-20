// // 2021-10-20
// // Copyright (c) 2012 Mark Cavage. All rights reserved.
// // https://github.com/restify/node-restify/blob/master/examples/todoapp
// // 학습하기 위해 영어로 된 주석을 맥락에 대한 주관적인 이해를 바탕으로 하여 번역했습니다.
// // 오류가 있을 수 있습니다.. 🙏
// // 해당 파일의 모든 저작권은 Mark Cavage에게 있음을 알립니다.

// var fs = require('fs');
// var path = require('path');

// var pino = require('pino');
// var getopt = require('posix-getopt');
// var restify = require('restify');

// var todo = require('./lib');

// var NAME = 'todoapp';
// var LOG = pino({name: NAME});

// /**
//  * 표준 POSIX 옵션 파싱
//  * 
//  * 일부 옵션들 directory/user/port 와 같은 것은 편리하지만 
//  * 로그 레벨에 영향을 줄 수 있기 때문에 주의해야 함
//  * 
//  * 다음과 같이 사용하시오
//  * node main.js -p 80 -vv 2>&1 | npx pino-pretty
//  * 
//  * 로그 레벨은 TRACE로 설정
//  */
// function parseOptions() {
//     var option;
//     var opts = {};
//     var parser = new getopt.BasicParser('hvd:p:u:z:', process.argv);

//     while((option = parser.getopt()) !== undefined) {
//         switch(option.option) {
//             case 'd':
//                 opts.directory = path.normalize(option.optarg);
//                 break;
//             case 'h':
//                 usage();
//                 break;
//             case 'p':
//                 opts.port = parseInt(option.optarg, 10);
//                 break;
//             case 'u':
//                 opts.user = option.optarg;
//                 break;
//             case 'v':
//                 // 살짝 hackery하게 -vvv도 가능하도록
//                 // TRACE 미만의 로그를 사용하도록 ..
//                 LOG.level(Math.max(pino.levels.values.trace, LOG.level - 10));

//                 if(LOG.level <= pino.levels.values.debug) {
//                     LOG = LOG.child({src: true});
//                 }
//                 break;
//             case 'z':
//                 opts.password = option.optarg;
//                 break;
//             default:
//                 usage('invalid option: ' + option.option);
//                 break;
//         }
//     }

//     return opts;
// }

// function usage(msg) {
//     if(msg) {
//         console.error(msg);
//     }

//     var str = 
//         'usage: ' + NAME + ' [-v] [-d dir] [-p port] [-u user] [-z password]';
//     console.error(str);
//     process.exit(msg ? 1 : 0);
// }

// // MAIN
// (function main() {
//     var options = parseOptions();

//     LOG.debug(options, 'command line arguments parsed');

//     // DB 설정
//     var dir = path.normalize((options.directory || '/tmp') + '/todos');

//     try {
//         // console.log(options.directory);
//         fs.mkdirSync(dir);
//     } catch (e) {
//         if(e.code !== 'EEXIST') {
//             LOG.fatal(e, 'unable to create "database" %s', dir);
//             process.exit(1);
//         }
//     }

//     var server =todo.createServer({
//         directory: dir,
//         log: LOG
//     });

//     // 마지막으로, 제대로 놀아보죠
//     server.listen(options.port || 8080, function onListening() {
//         LOG.info('listening at %s', server.url);
//     });
// })();


// Copyright (c) 2012 Mark Cavage. All rights reserved.

var fs = require('fs');
var path = require('path');

var pino = require('pino');
var getopt = require('posix-getopt');
var restify = require('restify');

var todo = require('./lib');

///--- Globals

var NAME = 'todoapp';

var LOG = pino({ name: NAME });

///--- Helpers

/**
 * Standard POSIX getopt-style options parser.
 *
 * Some options, like directory/user/port are pretty cut and dry, but note
 * the 'verbose' or '-v' option afflicts the log level, repeatedly. So you
 * can run something like:
 *
 * node main.js -p 80 -vv 2>&1 | npx pino-pretty
 *
 * And the log level will be set to TRACE.
 */
function parseOptions() {
    var option;
    var opts = {};
    var parser = new getopt.BasicParser('hvd:p:u:z:', process.argv);

    while ((option = parser.getopt()) !== undefined) {
        switch (option.option) {
            case 'd':
                opts.directory = path.normalize(option.optarg);
                break;

            case 'h':
                usage();
                break;

            case 'p':
                opts.port = parseInt(option.optarg, 10);
                break;

            case 'u':
                opts.user = option.optarg;
                break;

            case 'v':
                // Allows us to set -vvv -> this little hackery
                // just ensures that we're never < TRACE
                LOG.level(Math.max(pino.levels.values.trace, LOG.level - 10));

                if (LOG.level <= pino.levels.values.debug) {
                    LOG = LOG.child({ src: true });
                }
                break;

            case 'z':
                opts.password = option.optarg;
                break;

            default:
                usage('invalid option: ' + option.option);
                break;
        }
    }

    return opts;
}

function usage(msg) {
    if (msg) {
        console.error(msg);
    }

    var str =
        'usage: ' + NAME + ' [-v] [-d dir] [-p port] [-u user] [-z password]';
    console.error(str);
    process.exit(msg ? 1 : 0);
}

///--- Mainline

(function main() {
    var options = parseOptions();

    LOG.debug(options, 'command line arguments parsed');

    // First setup our 'database'
    var dir = path.normalize((options.directory || '/tmp') + '/todos');

    try {
        fs.mkdirSync(dir);
    } catch (e) {
        if (e.code !== 'EEXIST') {
            LOG.fatal(e, 'unable to create "database" %s', dir);
            process.exit(1);
        }
    }

    var server = todo.createServer({
        directory: dir,
        log: LOG
    });

    // At last, let's rock and roll
    server.listen(options.port || 8080, function onListening() {
        LOG.info('listening at %s', server.url);
    });
})();