// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    // const response = await fetch("../json/login_attempt.json");
    // const user_data = await response.json();

    // document.querySelector("#login_link").textContent = user_data.username;

    const response = await fetch("/api/user");
    const user_data = await response.json();

    if (user_data.loggedIn) {
        document.querySelector("#login_link").textContent = user_data.username;
    }

}

//Function to timeout logins after fixed length of time
var minutesLeft = 5;
const showTimeoutDisplay = setTimeout(displayTimeoutMessage, 120000);

function displayTimeoutMessage() {
    document.getElementById("session-timeout").removeAttribute('hidden');
}

//reset login timeout if button is clicke
document.getElementById("login_cont").addEventListener("click", function resetTimeout() {
    minutesLeft = 3;
    document.getElementById("timeout_display").innerHTML = "Logout in " + minutesLeft + " minutes";
    document.getElementById("session-timeout").setAttribute('hidden', true);
    setTimeout(displayTimeoutMessage, 120000);
});

const updateTimeout = setInterval(updateTimeoutMessage, 60000);

function updateTimeoutMessage() {
    minutesLeft = minutesLeft - 1;
    document.getElementById("timeout_display").innerHTML = "Logout in " + minutesLeft + " minutes";
    if (minutesLeft == 0) {
        forceLogout()
    }
}

function forceLogout() {
    window.location.href = "../html/login.html"
    alert("Your session has expired. You have been forced to log out")
}

window.addEventListener("unload", function logoutOnClosing() {
    alert("Logout upon closing tab")
    window.location.href = "../html/login.html"
});


displayUsername();