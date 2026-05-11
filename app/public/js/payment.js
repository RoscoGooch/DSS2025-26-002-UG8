const bcrypt = require("bcrypt");
const pool = require("./database");
require('dotenv').config();

document.getElementById("payment_form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById("card_number_input").value;
    const expirationDate = document.getElementById("expiration_date_input").value;
    const securityNumber = document.getElementById("security_number_input").value;

    const hashedCardNumber = await bcrypt.hash(cardNumber, 10);
    const hashedSecurityNumber = await bcrypt.hash(securityNumber, 10);

    const response = await fetch("/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cardNumber_input: hashedCardNumber,
            expirationDate_input: expirationDate,
            securityNumber_input: hashedSecurityNumber
        })
    });

    const data = await response.json();

    if (data.success) {
        
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