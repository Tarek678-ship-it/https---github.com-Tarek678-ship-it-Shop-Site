const emailInput = document.querySelector("#email");
const emailError = document.querySelector("#email-error");

function validateEmail() {
    const email = emailInput.value.trim();
    const validAddress = !emailInput.validity.typeMismatch &&
        /^[^\s@]+@gmail\.com$/i.test(email);
    const message = email && !validAddress
        ? "Enter a valid email address ending in @gmail.com."
        : "";

    emailInput.setCustomValidity(message);
    emailInput.setAttribute("aria-invalid", message ? "true" : "false");
    emailError.textContent = message;
    emailError.hidden = !message;
}

emailInput.addEventListener("input", validateEmail);
emailInput.addEventListener("blur", validateEmail);
