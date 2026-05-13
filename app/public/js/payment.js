document.getElementById("payment_form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById("card_number_input").value;
    const expirationDate = document.getElementById("expiration_date_input").value;
    const securityNumber = document.getElementById("security_number_input").value;

    console.log(cardNumber);
    console.log(expirationDate);
    console.log(securityNumber);

    const [month, year] = expirationDate.split('/');

    const sqlExpirationDate = `20${year}-${month}-01`;

    if (cardNumber.length != 16 || securityNumber.length != 3) {
        showError("Card Number or Security Number Incorrect");
    }

    const response = await fetch("/payment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            card_number_input: cardNumber,
            expiration_date_input: sqlExpirationDate,
            security_number_input: securityNumber
        })
    });

    const data = await response.json();

    if (data.success) {
        window.alert("Payment Added Successfully");
    } else {
        showError(data.message);
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