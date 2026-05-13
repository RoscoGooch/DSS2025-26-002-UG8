//npm install pg
require('dotenv').config({     path: require('path').resolve(__dirname, '.env') });

const { Pool } = require('pg');

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: process.env.DB_PASSWORD, //Use the password you used to set up pgAdmin
    database: "dss_db"
});

module.exports = pool;
