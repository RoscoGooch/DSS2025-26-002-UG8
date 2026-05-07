document.getElementById("login_form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username_input").value;
    const password = document.getElementById("password_input").value;

    const response = await fetch("/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username_input: username,
            password_input: password
        })
    });

    const data = await response.json();

    if (data.success) {
        // login worked → send verification email
        await fetch("/send-email", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: data.email,
            })
        });
        window.alert("Verification code sent to your email address. Please check it");
        document.getElementById("verification_form").removeAttribute("hidden")
    } else {
        showError(data.message);
    }
});

document.getElementById("verification_form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const verification_input = Number(document.getElementById("verification_code").value);

    const response = await fetch("/verify-code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code: verification_input
        })
    });

    const data = await response.json();

    if (data.success) {
        window.location.href = "/html/index.html";
    } else {
        showVerifyError(data.message);
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

function showVerifyError(msg) {
    let old = document.getElementById("verify_error");
    if (old) old.remove();

    let error = document.createElement("p");
    error.id = "verify_error";
    error.classList.add("error");
    error.textContent = msg;
    document.querySelector("#verify_btn").before(error);
}