/*
2021-11-12 스키마
DATABASE: RED_DB
TABLE
    RED_USER, 
*/

-- 초기 데이터베이스 생성
CREATE DATABASE RED_DB;
USE RED_DB;

CREATE TABLE RED_USER
(
    USER_ID INT(10) AUTO_INCREMENT NOT NULL,
    USER_PWD VARCHAR(30) NOT NULL,
    ACCOUNT_ID CHAR(30) NOT NULL,
    ACCOUNT_MAIL VARCHAR(30) NOT NULL,
    USER_NAME VARCHAR(16) NOT NULL,
    LAST_LOGIN_DATE DATE NOT NULL,
    SIGNUP_DATE DATE NOT NULL,
    OPEN_AUTH_TYPE INT(10),
    IS_LOGGED_IN BOOLEAN,
    PRIMARY KEY(USER_ID)
);

-- 회원가입 테스트 쿼리
-- USER_ID는 자동 증가, 패스워드 암호화 없음, 유저 이름 중복 체크 없음, 마지막 로그인 날짜는 1970/1/1로 디폴트로 설정, 회원가입일 SYSDATE()
INSERT INTO RED_USER
(USER_PWD, ACCOUNT_ID, ACCOUNT_MAIL, USER_NAME, LAST_LOGIN_DATE, SIGNUP_DATE, IS_LOGGED_IN)
VALUES
('1234', 'test02', 'test@mail.com', 'test02', '1970/1/1', SYSDATE(), 0);
-- URI 예시 localhost:8081/signup/postred05/1234/red05

-- 유저 계정 조회
SELECT ACCOUNT_ID, USER_PWD, USER_NAME, USER_ID, LAST_LOGIN_DATE
FROM RED_USER
WHERE ACCOUNT_ID = '';

SELECT ACCOUNT_ID, USER_PWD, USER_NAME, USER_ID, LAST_LOGIN_DATE, IS_LOGGED_IN
FROM RED_USER
WHERE ACCOUNT_ID = 'test02';