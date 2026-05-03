const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const pool = require('./database');
const helmet = require("helmet");
const xss = require("xss-clean");
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

//
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
    },
}));

app.use(xss());

app.use(session({
    secret: "DONTTRYIT",
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: true, //SET TO TRUE WHEN USING HTTPS
        maxAge: 1000 * 60 * 1 //10 minutes
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
        return res.json({ loggedIn: false });
    }
    res.json({ loggedIn: true, username: req.session.user });
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
app.post('/makepost', requireLogin, checkCSRF, function (req, res) {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Get the current date
    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");

    // Find post with the highest ID
    let maxId = 0;
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].postId > maxId) {
            maxId = posts[i].postId;
        }
    }

    // Initialise ID for a new post
    let newId = 0;

    // If postId is empty, user is making a new post
    if (req.body.postId == "") {
        newId = maxId + 1;
    } else { // If postID != empty, user is editing a post
        newId = req.body.postId;

        // Find post with the matching ID, delete it from posts so user can submit their new version
        let index = posts.findIndex(item => item.postId == newId);
        posts.splice(index, 1);
    }

    // Add post to posts.json
    posts.push({ "username": req.session.user, "timestamp": curDate, "postId": newId, "title": req.body.title_field, "content": req.body.content_field });

    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    // Redirect back to my_posts.html
    res.sendFile(__dirname + "/public/html/my_posts.html");
});

// Delete a post POST request
app.post('/deletepost', requireLogin, checkCSRF, (req, res) => {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Find post with matching ID and delete it
    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    // Update posts.json
    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + "/public/html/my_posts.html");
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