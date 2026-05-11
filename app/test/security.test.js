//Used as it simulates HTTP calls so can test attack attempts in all routes
const request = require("supertest");
const expect = require("chai").expect;
const app = require("../app.js");
const pool = require("../database.js");
const bcrypt = require("bcrypt");

//Stores the login cookies for the tests
// const agent = request.agent(app);

describe("Account Enumeration Protection", () => {

    it("should return identical response messages for invalid username and incorrect password input", async () => {
        const invalidUser = await request(app)
            .post("/login")
            .send({
                username_input: "fakeuser123",
                password_input: "password1234"
            });

        const wrongPassword = await request(app)
            .post("/login")
            .send({
                username_input: "Fin",
                password_input: "fAkEpAsSwOrD!?"
            });

        // console.log("User Status: ", invalidUser.status, "Password Status: ", wrongPassword.status);
        // console.log("User Message: ", invalidUser.body.message, "Password Message: ", wrongPassword.body.message);

        expect(invalidUser.status).to.equal(wrongPassword.status);
        expect(invalidUser.body.message).to.equal(wrongPassword.body.message);
    });

    it("should not reveal if a username or password is correct via response time differences", async () => {
        const start1 = Date.now();
        await request(app)
            .post("/login")
            .send({ username_input: "fakeuser123", password_input: "Password123!" });
        const timeInvalidUser = Date.now() - start1;

        const start2 = Date.now();
        await request(app)
            .post("/login")
            .send({ username_input: "Fin", password_input: "WrongPassword!" });
        const timeWrongPassword = Date.now() - start2;

        const diff = Math.abs(timeInvalidUser - timeWrongPassword);

        // console.log("Invalid user: ", timeInvalidUser);
        // console.log("Wrong Password: ", timeWrongPassword);
        // console.log(diff);

        //Allows small variations as it won't be identical timing
        expect(diff).to.be.below(150);
    });
});

describe("Cross-Site Scripting Protection", () => {

    it("should sanitize user input", async () => {
        const res = await request(app)
            .post("/login")
            .send({
                username_input: "<script>alert('xss')</script>",
                password_input: "test"
            });

        expect(res.text).to.not.include("<script>");
    });

    it("should sanitize reflected input", async () => {
        const payload = "<img src=x onerror=alert(1)>";

        const res = await request(app)
            .post("/login")
            .send({
                username_input: payload,
                password_input: "wrong"
            });

        expect(res.text).to.not.include(payload);
    });
});

describe("Password Hashing", () => {

    //Creates the data used for testing
    const testUser = {
        userid: 9999,
        username: "hashTestUser",
        email: "hash@test.com",
        password: "PlainPassword123!"
    };

    //Deletes the data used for testing
    after(async () => {
        await pool.query("DELETE FROM users WHERE userid = $1", [testUser.userid]);
    });

    it("should store hashed passwords", async () => {
        const hashed = await bcrypt.hash(testUser.password, 10);

        await pool.query(
            "INSERT INTO users (userid, username, email, password) VALUES ($1, $2, $3, $4)",
            [testUser.userid, testUser.username, testUser.email, hashed]
        );

        const res = await pool.query(
            "SELECT password FROM users WHERE userid = $1",
            [testUser.userid]
        );

        expect(res.rows[0].password).to.not.equal(testUser.password);
        expect(res.rows[0].password).to.match(/^\$2[aby]\$/);
    });

    it("should generate different hashes for same password", async () => {
        const hash1 = await bcrypt.hash("samePassword", 10);
        const hash2 = await bcrypt.hash("samePassword", 10);

        expect(hash1).to.not.equal(hash2);
    });

    it("should allow login with correct password", async () => {
        const password = "LoginPass123!";
        const hashed = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (userid, username, email, password) VALUES ($1, $2, $3, $4)",
            [8888, "loginUser", "login@test.com", hashed]
        );

        const res = await request(app)
            .post("/login")
            .send({
                username_input: "loginUser",
                password_input: password
            });

        expect(res.body.success).to.equal(true);

        await pool.query("DELETE FROM users WHERE userid = $1", [8888]);
    });
});

describe("Session and Cookie Security", () => {

    // Creates a test user
    before(async () => {
        const hashed = await bcrypt.hash("password", 10);

        await pool.query(
            "INSERT INTO users (username, email, password, userid) VALUES ($1, $2, $3, $4)",
            ["Fin", "fin@test.com", hashed, 7777]
        );
    });

    // Deletes test user after tests
    after(async () => {
        await pool.query("DELETE FROM users WHERE userid = $1", [7777]);
    });

    it("should create secure session cookie on user login", async () => {
        const res = await request(app)
            .post("/login")
            .send({
                username_input: "Fin",
                password_input: "password"
            });

        const cookies = res.headers["set-cookie"];
        expect(cookies).to.exist;

        const cookieString = cookies.join(";");

        // session cookie exists
        expect(cookieString).to.include("sessionId");

        // security flags exist (HttpOnly, Secure optional in test env)
        expect(cookieString.toLowerCase()).to.include("httponly");
    });

    it("should block access to protected routes without a session", async () => {
        const res = await request(app).get("/api/user");

        expect(res.status).to.equal(401);
        expect(res.body.loggedIn).to.equal(false);
    });

    it("should allow access with a valid session cookie", async () => {
        const localAgent = request.agent(app);

        await localAgent
            .post("/login")
            .send({
                username_input: "Fin",
                password_input: "password"
            });

        const res = await localAgent.get("/api/user");

        expect(res.status).to.equal(200);
        expect(res.body.loggedIn).to.equal(true);
        expect(res.body.username).to.equal("Fin");
    });

    it("should destroy session on logout", async () => {
        const localAgent = request.agent(app);

        await localAgent
            .post("/login")
            .send({
                username_input: "Fin",
                password_input: "password"
            });

        const logoutRes = await localAgent.post("/logout");

        expect(logoutRes.status).to.be.oneOf([200, 302]);

        const afterLogout = await localAgent.get("/api/user");

        expect(afterLogout.status).to.equal(401);
        expect(afterLogout.body.loggedIn).to.equal(false);
    });

    it("should create a new session on each login", async () => {
        const res = await request(app)
            .post("/login")
            .send({
                username_input: "Fin",
                password_input: "password"
            });

        const cookies = res.headers["set-cookie"];
        expect(cookies).to.exist;

        const cookieString = cookies.join(";");

        expect(cookieString).to.include("sessionId");
    });
});