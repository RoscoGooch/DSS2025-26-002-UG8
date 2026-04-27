document.getElementById("login_form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username_input").value;
    const password = document.getElementById("password_input").value;

    const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username_input: username,
            password_input: password
        })
    });

    const data = await response.json();

    if (data.success) {
        // login worked → go to homepage (or dashboard)
        window.location.href = "/html/index.html";
    } else {
        showError(data.message);
    }
});

function showError(msg) {
    let old = document.getElementById("login_error");
    if (old) old.remove();

    let error = document.createElement("p");
    error.id = "login_error";
    error.classList.add("error");
    error.textContent = msg;
    document.querySelector("#login_btn").before(error);
}