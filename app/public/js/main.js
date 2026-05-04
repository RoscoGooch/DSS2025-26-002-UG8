// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    try {
        const response = await fetch("/api/user", {
            credentials: "include"
        });

        //If the session expires, take the user back to login page
        if (response.status === 401) {
            alert("Your session has expired. Please log in again.");
            window.location.href = "/html/login.html";
            return;
        }

        const user_data = await response.json();

        if (user_data.loggedIn) {
            document.querySelector("#login_link").textContent = user_data.username;
        }

    } catch (err) {
        console.error("User check failed", err);
    }

}

//If the user interacts with the page at all, resets the maxAge of the session
let activityTimer = null;

async function resetSessionMaxAge() {
    try {
        await fetch("/api/keepSessionActive", {
            method: "GET",
            credentials: "include"
        });
        console.log("Session Refreshed");
    } catch { }
}

function registerActivity() {
    if (activityTimer) return;

    activityTimer = setTimeout(() => {
        resetSessionMaxAge();
        activityTimer = null;
    }, 30 * 1000); //Only calls this once per 30 seconds
}

["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(event =>
    document.addEventListener(event, registerActivity)
);

//Checks to see if the session has expired, if it has, returns the user to the login page
async function checkSessionAlive() {
    console.log("CHECKED SESSION");
    try {
        const response = await fetch("/api/user", {
            credentials: "include"
        });

        if (response.status === 401) {
            alert("Your session has expired. Please log in again.");
            window.location.href = "/html/login.html";
        }
    } catch (err) {
        console.error("Session check failed", err);
    }
}

document.addEventListener("focusin", checkSessionAlive);

displayUsername();