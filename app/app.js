const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const pool = require('./database');
const helmet = require("helmet");
// const xss = require("xss-clean");
const app = express();
const port = 3000;
const crypto = require('crypto');
const https = require('https');

var bodyParser = require('body-parser');
const fs = require('fs');

function createCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(helmet());

//Sets HTTPS headers appropriately to avoid a lot of common attacks
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"], //Only allows things from the server to run
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"], //Only JS files hosted on the server are allowed, alongside DOMpurify 
        styleSrc: ["'self'", "https://cdnjs.cloudflare.com"], //No malicious CSS
        imgSrc: ["'self'", "data:"], //No malicious images allowed
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"], //Allows fonts to be loaded still
        connectSrc: ["'self'"], //Only allows API calls from the server
        objectSrc: ["'none'"], //Blocks plugins
        frameAncestors: ["'none'"], //Prevents clickjacking by not allowing invisible buttons
        upgradeInsecureRequests: [], //Forces all HTTP requests to be HTTPS
    },
}));

// app.use(xss());

app.use(session({
    name: "sessionId",
    secret: "DONTTRYIT",
    resave: false,
    saveUninitialized: false,
    rolling: true, //Resets maxAge after each request, keeps user logged in if they are interacting with the website
    cookie: {
        httpOnly: true,
        secure: true, //SET TO TRUE WHEN USING HTTPS
        maxAge: 1000 * 60 * 5 //10 minutes
    },
}));

// Landing page
app.get('/', (req, res) => {
    /// Send the static file
    res.sendFile(__dirname + '/public/html/login.html', (err) => {
        if (err) {
            console.log(err);
        }
    })
});

// Login POST request
app.post('/login', async function (req, res) {

    const username = req.body.username_input;
    const password = req.body.password_input;

    //Empty inputs check
    if (!username || !password) {
        return res.json({
            success: false,
            message: "Please fill out the login fields."
        });
    }

    try {
        //Find user in database
        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        const user = result.rows[0];

        //Username not found
        if (result.rows.length === 0) {
            //Compares the input password with this fake hash, keeps the response time the same to avoid accounte enumeration
            const fakeMatch = await bcrypt.compare(password, "$2b$10$WE93n9GGTuQOueCbVyHq4OV3giSGE3kAc.0xP1OswsIBhPWdF.fbq");
            return res.json({
                success: false,
                message: "Incorrect username or password."
            });
        };

        const passwordMatch = await bcrypt.compare(password, user.password)

        //Wrong password
        if (!passwordMatch) {
            return res.json({
                success: false,
                message: "Incorrect username or password."
            });
        };

        return res.json({
            success: true,
            email: user.email
        });

    } catch (err) {
        console.error(err);
        return res.json({
            success: false,
            message: "Server error. Please try again."
        });
    }
});

app.post('/setup-login', async function (req, res) {

    const username = req.body.username_input;

    req.session.user = username;
    req.session.csrfToken = createCSRFToken();
});

app.get("/api/user", (req, res) => {
    if (!req.session.user) {
        if (req.session) {
            req.session.destroy(() => { });
        }
        return res.status(401).json({ loggedIn: false });
    }
    res.json({ loggedIn: true, username: req.session.user });
});

//Get all posts
app.get("/api/posts", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM posts ORDER BY timestamp DESC, postid DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error retrieving posts." });
    }
});

//Get specific user's posts
app.get("/api/myPosts", requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM posts WHERE username = $1 ORDER BY postid DESC",
            [req.session.user]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error retrieving posts." });
    }
});

//If the session is still active and the user interacts with the webpage, a status is sent, resetting the sessions maxAge
app.get("/api/keepSessionActive", (req, res) => {
    if (!req.session || !req.session.user) {
        return res.sendStatus(401);
    }

    res.sendStatus(200);
});

//If the user isn't logged in, returns them to the login screen
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("../html/login.html");
    }
    next();
};

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Logout failed");
        }

        res.clearCookie("connect.sid");
        res.redirect("../html/login.html");
    });
});

function checkCSRF(req, res, next) {
    const submittedToken = req.body.csrfToken;

    if (!submittedToken || submittedToken !== req.session.csrfToken) {
        return res.status(403).send("Invalid CSRF token.");
    }
    next();
}

app.get('/api/csrf-token', requireLogin, (req, res) => {
    res.json({ csrfToken: req.session.csrfToken });
})

// Make a post POST request
app.post('/makepost', requireLogin, checkCSRF, async (req, res) => {
    try {
        const { title_field, content_field, postId } = req.body;

        // If editing an existing post
        if (postId && postId !== "") {
            await pool.query(
                `UPDATE posts 
                 SET title = $1, content = $2, timestamp = NOW()
                 WHERE postid = $3 AND username = $4`,
                [title_field, content_field, postId, req.session.user]
            );
        }
        // If creating new post
        else {
            await pool.query(
                `INSERT INTO posts (username, title, content, timestamp)
                 VALUES ($1,$2,$3,NOW())`,
                [req.session.user, title_field, content_field]
            );
        }

        res.redirect("/html/my_posts.html");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating post");
    }
});

// Delete a post POST request
app.post('/deletepost', requireLogin, checkCSRF, async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM posts WHERE postid = $1 AND username = $2",
            [req.body.postId, req.session.user]
        );

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting post");
    }
});

const nodemailer = require("nodemailer");

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: 'roscogoo13@gmail.com',
    pass: 'mris zxei lizn cepp',
  },
  tls: {
    rejectUnauthorized: false
  }
});

//send email
app.post('/send-email', (req, res) => {
    const email = req.body.email;
    const verification_code = Math.floor(100000 + Math.random() * 900000);
    req.session.verificationCode = verification_code;
    req.session.verificationExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    await transporter.sendMail({
        from: '"Foodies R Us" <roscogoo13@gmail.com>', // sender address
        to: `${email}`, // list of recipients
        subject: "Hello", // subject line
        text: `Verification code = ${verification_code}`, // plain text body
        html: `<b>Verification code = ${verification_code}<b>`, // HTML body
    });

    res.json({ success: true });
});

app.post('/verify-code', (req, res) => {
    if (req.session.verificationCode && req.body.code === req.session.verificationCode && Date.now() < req.session.verificationExpires) {
        req.session.loggedIn = true;
        res.json({ success: true });
    }
    else {
        res.json({ success: false})
    }
});

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(port, () => {
    console.log(`App is running securely on port ${port}`);
});