CREATE DATABASE dss_DB;

CREATE TABLE user (
    userid INT PRIMARY KEY NOT NULL,
    username VARCHAR(45),
    email VARCHAR(45),
    password VARCHAR(45),
    password_salt VARCHAR(45)
)

CREATE TABLE payment (
    userid INT PRIMARY KEY NOT NULL,
    card_number INT,
    expiration_date DATE,
    security_number INT
)