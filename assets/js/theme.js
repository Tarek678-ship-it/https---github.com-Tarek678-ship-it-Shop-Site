(() => {
    const themeToggle = document.querySelector(".theme-toggle");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    if (!themeToggle) {
        return;
    }

    function setTheme(theme) {
        const isDark = theme === "dark";
        document.documentElement.dataset.theme = isDark ? "dark" : "light";
        themeToggle.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
        themeToggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
        themeToggle.querySelector("span").textContent = isDark ? "Light mode" : "Dark mode";
        if (themeMeta) {
            themeMeta.content = isDark ? "#15191d" : "#ffffff";
        }
    }

    themeToggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);

        try {
            localStorage.setItem("shopmate-theme", nextTheme);
        } catch (error) {
            console.error("Could not save the ShopMate theme.", error);
        }
    });

    window.addEventListener("storage", (event) => {
        if (event.key === "shopmate-theme" && (event.newValue === "light" || event.newValue === "dark")) {
            setTheme(event.newValue);
        }
    });

    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
})();
