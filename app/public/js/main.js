// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    const response = await fetch("../json/login_attempt.json");
    const user_data = await response.json();

    document.querySelector("#login_link").textContent = user_data.username;
}

minutesLeft = 3;
//Function to timeout logins after fixed length of time
const showTimeoutDisplay = setTimeout(displayTimeoutMessage, 120000);

function displayTimeoutMessage() {
  document.getElementById("session-timeout").removeAttribute('hidden');
}

const loginTimeout = setTimeout(forceLogout, 300000);

function forceLogout() {
    alert("Your session has expired. You have been forced to log out")
    window.location.href = "../html/login.html"
}


displayUsername();