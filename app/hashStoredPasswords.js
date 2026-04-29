const bcrypt = require("bcrypt");
const pool = require("./database");

async function hashStoredPasswords() {
    try {
        //Gets all users from db
        const users = await pool.query("SELECT userid, password FROM users");

        //Grabs the plain text password for each account, hashes them, then updates it in the db
        for (const user of users.rows) {
            const plainText = user.password;

            //Skip if already hashed
            if (plainText.startsWith("$2b$")) {
                console.log(`User ${user.userid} already hashed`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(plainText, 10);

            await pool.query(
                "UPDATE users SET password = $1 WHERE userid = $2",
                [hashedPassword, user.userid]
            );

            console.log(`Hashed user ${user.userid}'s password`)
        }

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

hashStoredPasswords();