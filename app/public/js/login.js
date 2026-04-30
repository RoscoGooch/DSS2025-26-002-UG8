var true_verify_code = 0;

const generateVerifyCode = () => {
    const array = new Uint8Array(10);
    self.crypto.getRandomValues(array);

    true_verify_code = array[3];
};


document.getElementById("login_form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username_input").value;
    const password = document.getElementById("password_input").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username_input: username,
            password_input: password
        })
    });

    const data = await response.json();

    if (data.success) {
        generateVerifyCode();
        // login worked → send verification email
        ("/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: data.email,
            verification_code: true_verify_code
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

    const verification_input = document.getElementById("verification_code").value;

    if (verification_input == true_verify_code && true_verify_code != 0) {
        const username = document.getElementById("username_input").value;

        // login worked → go to homepage (or dashboard)
        ("/setup-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username_input: username,
        })});
        window.location.href = "/html/index.html";
    } else {
        showVerifyError("Invalid code");
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