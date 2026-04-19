// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    const response = await fetch("../json/login_attempt.json");
    const user_data = await response.json();

    document.querySelector("#login_link").textContent = user_data.username;
}

//Function to timeout logins after fixed length of time
var minutesLeft = 3;
const showTimeoutDisplay = setTimeout(displayTimeoutMessage, 120000);

function displayTimeoutMessage() {
  document.getElementById("session-timeout").removeAttribute('hidden');
}

document.getElementById("login_cont").addEventListener("click", function resetTimeout(){
    minutesLeft = 3;
    document.getElementById("timeout_display").innerHTML = "Logout in " + minutesLeft + " minutes";
    document.getElementById("session-timeout").setAttribute('hidden', true);
    setTimeout(displayTimeoutMessage, 120000);
});

const updateTimeout = setInterval(updateTimeoutMessage, 60000);

function updateTimeoutMessage() {
    minutesLeft = minutesLeft - 1;
    document.getElementById("timeout_display").innerHTML = "Logout in " + minutesLeft + " minutes";
    if (minutesLeft == 0){
        forceLogout()
    }
}

function forceLogout() {
    alert("Your session has expired. You have been forced to log out")
    window.location.href = "../html/login.html"
}


displayUsername();