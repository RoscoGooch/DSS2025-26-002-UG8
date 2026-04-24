require('dotenv').config();
const { Pool } = require('pg');

class Database {
    constructor() {
        const pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            connectionString: process.env.DATABASE_URL,
        });
    }

    generateToken() { //creates long random string, for authentication
        return (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));
    }

    detailsCheck(user, password) { //checks inputted details against the database
        let query = "";
        if (user.match("^[^\s@]+@[^\s@]+\.[^\s@]+$")) { //email checking regex
            query = "SELECT * FROM users WHERE email = ? AND password = ?"; 
        } else {
            query = "SELECT * FROM users WHERE username = ? AND password = ?";
        }

        
    }

    createAccount(email, username, password) {
        query = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";

        
        return this.generateToken(); //automatically log the user in when they make an account
    }

    login(user, password) {
        if (this.detailsCheck(user, password) == true) {
            return this.generateToken();
            //need to store the tokens somewhere
        }
    }

    deleteAccount(user, password) {
        //user should have to put in their details before they can delete their account
        if (this.detailsCheck(user, password) == true) {
            query = "DELETE FROM users WHERE userid = ?";
            //currently unfinished
        }
    }
}