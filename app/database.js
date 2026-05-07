//npm install pg

const { Pool } = require('pg');

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "kat22Feb", //Use the password you used to set up pgAdmin
    database: "dss_db"
});

module.exports = pool;