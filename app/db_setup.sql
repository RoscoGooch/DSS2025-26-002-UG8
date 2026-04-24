CREATE DATABASE dss_DB;

CREATE USER username WITH PASSWORD 'password';

ALTER ROLE username SET client_encoding TO 'utf8';
ALTER ROLE username SET default_transaction_isolation TO 'read committed';
ALTER ROLE username SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE dss_DB TO username;

CREATE TABLE user (
    userid INT PRIMARY KEY NOT NULL,
    username VARCHAR(45),
    email VARCHAR(45),
    password VARCHAR(45),
    password_salt VARCHAR(45)
);

CREATE TABLE payment (
    userid INT PRIMARY KEY NOT NULL,
    card_number INT,
    expiration_date DATE,
    security_number INT
);

INSERT INTO user (
    userid, 
    username, 
    email, 
    password, 
    password_salt
) VALUES (
    1234,
    "test",
    "test@test.com",
    "password1234",
    "1234"
);

INSERT INTO payment (
    userid,
    card_number,
    expiration_date,
    security_number
) VALUES (
    1234,
    4659430012944612,
    2026-01,
    220
);