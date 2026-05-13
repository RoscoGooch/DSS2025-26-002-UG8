CREATE DATABASE dss_DB;

CREATE USER username WITH PASSWORD 'password';

ALTER ROLE username SET client_encoding TO 'utf8';
ALTER ROLE username SET default_transaction_isolation TO 'read committed';
ALTER ROLE username SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE dss_DB TO username;

CREATE TABLE users (
    userid INT PRIMARY KEY NOT NULL,
    username VARCHAR(45),
    email VARCHAR(45),
    password VARCHAR(255),
    password_salt VARCHAR(45)
);

CREATE TABLE payment (
    userid INT PRIMARY KEY NOT NULL,
    card_number VARCHAR(255),
    expiration_date DATE,
    security_number VARCHAR(255)
);

CREATE TABLE posts (
    postid SERIAL PRIMARY KEY,
    username VARCHAR(45),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

INSERT INTO posts (
    username,
    title,
    content,
    timestamp
) VALUES (
    'homersimpson',
    'To Sprinkle or Not To Sprinkle',
    'What do you consider to be the classic donut? Sprinkled or glazed? Does a simple glaze cut it? There''s hundreds and thousands of options to consider.',
    '2024-11-23 13:37:02'
);

INSERT INTO posts (
    username,
    title,
    content,
    timestamp
) VALUES (
    'breakfastman',
    'Pancakes or Waffles: The Never Ending Debate',
    'Why do we feel the need to pit them against one another? Why can''t pancakes and waffles live in harmony?',
    '2024-11-23 19:14:16'
);

INSERT INTO posts (
    username,
    title,
    content,
    timestamp
) VALUES (
    'foodguy79',
    'Dessert Sushi - should it exist?',
    'I personally think it is an abomination. ''Red Hots'' are not a suitable wasabi substitute!',
    '2024-11-24 15:14:32'
);

INSERT INTO users (
    userid, 
    username, 
    email, 
    password
) VALUES (
    1234,
    'test',
    'test@test.com',
    'password1234'
);

INSERT INTO payment (
    userid,
    card_number,
    expiration_date,
    security_number
) VALUES (
    1234,
    4659430012944612,
    '2026-01-01',
    220
);
