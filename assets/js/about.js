(() => {
    const aboutSection = document.querySelector(".about-section");

    if (!aboutSection || !("IntersectionObserver" in window)) {
        return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            aboutSection.classList.add("is-visible");
            currentObserver.unobserve(aboutSection);
        });
    }, { threshold: 0.2 });

    aboutSection.classList.add("about-section--reveal");
    observer.observe(aboutSection);
})();
