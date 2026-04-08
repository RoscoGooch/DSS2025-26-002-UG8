let mysql = require('mysql');

class Database {
    constructor() {
        con = mysql.createConnection({
            host: "localhost",
            user: "ug8",
            password: "ug8",
            database: "dss_DB"
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

        this.con.connect(function(err) {
            if (err) throw err;
            this.con.query(query, [user, password], function(err, result) {
                //if an error is returned it means that either the details don't match or something has gone wrong
                //either way the login should fail in that situation
                if (err) {
                    return false;
                } else {
                    return true;
                }
            })
        });
    }

    createAccount(email, username, password) {
        query = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";

        this.con.connect(function(err) {
            if (err) throw err;
            this.con.query(query, [email, username, password], function(err, result) {
                if (err) throw err;
            })
        });
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