(() => {
    document.querySelectorAll("[data-account-form]").forEach((form) => {
        const status = form.querySelector("[data-account-status]");
        const confirmPassword = form.querySelector('[name="confirm-password"]');

        if (confirmPassword) {
            const password = form.querySelector('[name="password"]');
            const checkPasswords = () => {
                confirmPassword.setCustomValidity(
                    confirmPassword.value && confirmPassword.value !== password.value
                        ? "Passwords do not match."
                        : ""
                );
            };

            password.addEventListener("input", checkPasswords);
            confirmPassword.addEventListener("input", checkPasswords);
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            status.textContent = "Demo only: no account was created and your details were not saved or sent.";
        });
    });
})();
