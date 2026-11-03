(() => {
    const viewButtons = document.querySelectorAll("[data-account-view]");
    const panels = document.querySelectorAll("[data-account-panel]");

    function showAccountView(view) {
        viewButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.accountView === view));
        });
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.accountPanel !== view;
        });
    }

    viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const view = button.dataset.accountView;
            showAccountView(view);
            window.history.replaceState(null, "", view === "sign-up" ? "#sign-up" : window.location.pathname);
        });
    });

    const initialView = window.location.hash === "#sign-up" ? "sign-up" : "sign-in";
    if (viewButtons.length && panels.length) {
        showAccountView(initialView);
    }

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
