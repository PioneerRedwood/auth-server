/*
2021-11-15
https://www.researchgate.net/publication/323787227_Openlobby_an_open_game_server_for_lobby_and_matchmaking
DATABASE: OPEN_LOBBY 
TABLES
    GAME, PLAYER(USER), GAME_SESSION, MATCHING_QUEUE
*/

-- 초기 데이터베이스 생성
CREATE DATABASE RED_DB;
USE RED_DB;
-- deprecated
{
    CREATE TABLE PLAYER
    (
        PLAYER_ID INT(10) NOT NULL,
        USER_NAME VARCHAR(30) NOT NULL,
        GAME_ID INT(10) NOT NULL,
        EXPERIENCE VARCHAR(30),
        PROPERTIES VARCHAR(30),
        PRIMARY KEY (PLAYER_ID),
        FOREIGN KEY (GAME_ID) REFERENCES GAME(GAME_ID) ON UPDATE CASCADE
    );
}

-- RED_USER QUERIES
{
    CREATE TABLE RED_USER
    (
        USER_ID INT(10) AUTO_INCREMENT NOT NULL,
        ACCOUNT_ID CHAR(30) NOT NULL,
        ACCOUNT_PWD CHAR(30) NOT NULL,
        ACCOUNT_MAIL VARCHAR(30) NOT NULL,
        USER_NAME VARCHAR(16) NOT NULL,
        LAST_LOGIN_DATE TIMESTAMP,
        SIGNUP_DATE DATE NOT NULL,
        OPEN_AUTH_TYPE INT(10),
        IS_LOGGED_IN BOOLEAN,
        PRIMARY KEY(USER_ID)
    );

    INSERT INTO RED_USER
    (ACCOUNT_ID, ACCOUNT_PWD, ACCOUNT_MAIL, USER_NAME, SIGNUP_DATE, IS_LOGGED_IN)
    VALUES
    ('test02', '1234', 'test@mail.com', 'test02', NOW(), 0);

    SELECT ACCOUNT_ID, ACCOUNT_PWD, USER_NAME, USER_ID, LAST_LOGIN_DATE, IS_LOGGED_IN
    FROM RED_USER
    WHERE ACCOUNT_ID = 'test02';

    SELECT ACCOUNT_ID, ACCOUNT_PWD, USER_NAME, USER_ID, LAST_LOGIN_DATE
    FROM RED_USER
    WHERE ACCOUNT_ID = '';

    UPDATE RED_USER
    SET LAST_LOGIN_DATE = CURRENT_TIME()
    WHERE ACCOUNT_ID = 'test02';
}

-- 로그인 프로시저 .. restify로 결과를 얻는게 잘 안되서 안함
{
    DELIMITER $$
    DROP PROCEDURE IF EXISTS CHECK_USER$$
    CREATE PROCEDURE CHECK_USER
    (
        IN ID CHAR(30),
        IN PWD VARCHAR(30),
        OUT RET_ID INT(10)
    )
    BEGIN
        DECLARE _ID INT DEFAULT -1;
        
        SELECT USER_ID INTO _ID
        FROM RED_USER
        WHERE ACCOUNT_ID = ID and ACCOUNT_PWD = PWD;

        IF(_ID != -1) THEN
            UPDATE RED_USER
            SET LAST_LOGIN_DATE = CURRENT_TIME()
            WHERE USER_ID = _ID;
            SET RET_ID = _ID;
        END IF;
    END $$
    DELIMITER ;

    CALL CHECK_USER('test02', '1234', @_value);
    select @_value;
}

-- GAME
{
    CREATE TABLE GAME
    (
        GAME_ID INT(10) NOT NULL AUTO_INCREMENT,
        GAME_NAME VARCHAR(20) NOT NULL,
        DEVELOPER_NAME VARCHAR(30) NOT NULL,
        PROPERTIES VARCHAR(30),
        SERVICE_START_DATE DATE,
        SERVICE_STATUS INT NOT NULL,
        MATCHMAKING_ALGORITHM INT NOT NULL,
        SESSION_EXPIRY INT NOT NULL,
        PRIMARY KEY (GAME_ID)
    );

    INSERT INTO GAME
    (GAME_ID, GAME_NAME, DEVELOPER_NAME, PROPERTIES, SERVICE_START_DATE, SERVICE_STATUS, MATCHMAKING_ALGORITHM, SESSION_EXPIRY)
    VALUES
    ('0', 'SURVIVE FROM RED', 'REDWOODY', 'DO NOT TRY THIS AT HOME', SYSDATE(), 0, 0, 0);

    INSERT INTO GAME
    (GAME_NAME, DEVELOPER_NAME, PROPERTIES, SERVICE_START_DATE, SERVICE_STATUS, MATCHMAKING_ALGORITHM, SESSION_EXPIRY)
    VALUES
    ('SURVIVE FROM RED', 'REDWOODY', 'DO NOT TRY THIS AT HOME', SYSDATE(), 0, 0, 0);

    SELECT * 
    FROM GAME;
}

-- GAME_SESSION
{
    CREATE TABLE GAME_SESSION
    (
        SESSION_ID INT(10) NOT NULL AUTO_INCREMENT,
        SESSION_STATUS INT(10) NOT NULL,
        SESSION_HOST_ID INT(10),
        PRIMARY KEY(SESSION_ID)
    );

    INSERT INTO GAME_SESSION
    (SESSION_STATUS, SESSION_HOST_ID)
    VALUES
    (0, 0, 0);

    DROP TABLE GAME_SESSION;

    SELECT * FROM GAME_SESSION;
}

-- MATCHING_QUEUE
{
    CREATE TABLE MATCHING_QUEUE
    (
        QUEUE_ID INT(10) NOT NULL AUTO_INCREMENT,
        USER_ID INT(10) NOT NULL,
        USER_IP VARCHAR(20),
        TIME_QUEUE TIMESTAMP,
        QUEUE_STATUS INT(10) NOT NULL,
        SESSION_ID INT(10),
        FOREIGN KEY (USER_ID) REFERENCES RED_USER(USER_ID) ON UPDATE CASCADE,
        FOREIGN KEY (SESSION_ID) REFERENCES GAME_SESSION(SESSION_ID) ON UPDATE CASCADE,
        PRIMARY KEY (QUEUE_ID)
    );

    INSERT INTO MATCHING_QUEUE
    (USER_ID, USER_IP, TIME_QUEUE, QUEUE_STATUS, SESSION_ID)
    VALUES
    (1, '127.0.0.1', CURRENT_TIME(), 0, 1);

    DROP TABLE MATCHING_QUEUE;

    SELECT * FROM MATCHING_QUEUE;
}

{
    CREATE TABLE SOCIAL_CHATTING
    (
    
    )
}

-- 플레이어 테이블
-- 인게임에 접속하면 생성됨
{
    CREATE TABLE PLAYER
    (
        PLAYER_ID INT(10) AUTO_INCREMENT NOT NULL,
        USER_ID INT(10) NOT NULL,
        GAME_ID INT(10) NOT NULL DEFAULT -1,
        IS_IN_LOBBY BOOLEAN NOT NULL DEFAULT 0,
        LOBBY_ID INT(10) DEFAULT -1,
        PRIMARY KEY (PLAYER_ID)
    );

    INSERT INTO PLAYER
    (USER_ID, GAME_ID, IS_IN_LOBBY, LOBBY_ID)
    VALUES
    (0, 1, 0, 0);
}

-- GROUP

{
    -- 로비 테이블
    -- 이 안에는 (로비 ID, 이름,  ), 로비에 접속한 유저에 대한 정보
    CREATE TABLE LOBBY
    (
        LOBBY_ID INT(10) AUTO_INCREMENT NOT NULL,
        GAME_ID INT(10) NOT NULL,
        HOST_ID INT(10) NOT NULL,
        MAX_USER_COUNT INT(10) NOT NULL DEFAULT 0,
        CURRENT_COUNT INT(10) NOT NULL DEFAULT 0,
        LOBBY_NAME VARCHAR(30) NOT NULL,
        PRIMARY KEY (LOBBY_ID)
    );

    INSERT INTO LOBBY
    (GAME_ID, HOST_ID, MAX_USER_COUNT, CURRENT_COUNT, LOBBY_NAME)
    VALUES
    (0, 0, 4, 0, "REDWOODY'S LOBBY");

}