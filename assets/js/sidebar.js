(() => {
    const sidebar = document.querySelector("#site-sidebar");
    const openButton = document.querySelector(".sidebar-open");

    if (!sidebar || !openButton) {
        return;
    }

    function closeSidebar() {
        if (sidebar.open) {
            sidebar.close();
        }
        openButton.setAttribute("aria-expanded", "false");
    }

    openButton.addEventListener("click", () => {
        sidebar.showModal();
        openButton.setAttribute("aria-expanded", "true");
    });

    sidebar.querySelector(".sidebar-close").addEventListener("click", closeSidebar);

    sidebar.querySelectorAll(".sidebar-nav a").forEach((link) => {
        link.addEventListener("click", () => {
            closeSidebar();
        });
    });

    sidebar.addEventListener("close", () => {
        openButton.setAttribute("aria-expanded", "false");
    });

    sidebar.addEventListener("cancel", () => {
        closeSidebar();
    });

    sidebar.addEventListener("click", (event) => {
        if (event.target === sidebar) {
            closeSidebar();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && sidebar.open) {
            event.preventDefault();
            closeSidebar();
        }
    });
})();
