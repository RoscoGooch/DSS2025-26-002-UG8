// Fetches a fresh CSRF token when the payment page loads and stores it in the hidden form field.
// Handles form submission by sending payment details and the CSRF token to the server via AJAX.
//AJAX allows handling responeses without full page reload. 
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/api/csrf-token", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();
        document.getElementById("csrf_token_input").value = data.csrfToken;
        console.log("Payment CSRF token loaded:", data.csrfToken);
    } catch (error) {
        console.error("Could not load CSRF token:", error);
    }
});

document.getElementById("payment_form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById("card_number_input").value;
    const expirationDate = document.getElementById("expiration_date_input").value;
    const securityNumber = document.getElementById("security_number_input").value;
    const csrfToken = document.getElementById("csrf_token_input").value;

    if (!csrfToken) {
        showError("CSRF token has not loaded yet. Please refresh the page and try again.");
        return;
    }

    console.log(cardNumber);
    console.log(expirationDate);
    console.log(securityNumber);

    const [month, year] = expirationDate.split('/');

    const sqlExpirationDate = `20${year}-${month}-01`;

    if (cardNumber.length != 16 || securityNumber.length != 3) {
        showError("Card Number or Security Number Incorrect");
        return;
    }

    const response = await fetch("/payment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cardNumber_input: cardNumber,
            expirationDate_input: sqlExpirationDate,
            securityNumber_input: securityNumber,
            // Token attached to payment request, validated before processing.
            _csrf: csrfToken
        })
    });

    const responseText = await response.text();
    let data;

    try {
        data = JSON.parse(responseText);
    } catch (error) {
        showError(responseText || "Request failed. This may be due to an invalid or missing CSRF token.");
        return;
    }

    if (data.success) {
        window.alert("Payment Added Successfully");
    } else {
        showError(data.message || "Payment request failed.");
    }
});

function showError(msg) {
    let old = document.getElementById("payment_error");
    if (old) old.remove();

    let error = document.createElement("p");
    error.id = "payment_error";
    error.classList.add("error");
    error.textContent = msg;
    document.querySelector("#payment_btn").before(error);
}