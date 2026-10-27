const catalogueSection = document.querySelector("#catalogue");
const catalogueSearch = document.querySelector("#catalogue-search");
const searchInput = document.querySelector("#product-search");
const resultsStatus = document.querySelector("#catalogue-results-status");

document.querySelectorAll(".products").forEach((section) => {
    const productGrid = section.querySelector(".product-grid");
    const categoryFilter = section.querySelector(".category-filter");
    const sortSelect = section.querySelector(".sort-products");
    const products = Array.from(productGrid.querySelectorAll(".product-card"));
    const carousel = section.querySelector(".featured-carousel");
    const carouselViewport = carousel?.querySelector(".featured-carousel-viewport");
    const carouselButtons = carousel?.querySelectorAll("[data-carousel-direction]");

    function updateCarouselButtons() {
        if (!carouselViewport || !carouselButtons) {
            return;
        }

        const maxScroll = carouselViewport.scrollWidth - carouselViewport.clientWidth;
        carouselButtons.forEach((button) => {
            const direction = Number(button.dataset.carouselDirection);
            button.disabled = direction < 0
                ? carouselViewport.scrollLeft <= 1
                : carouselViewport.scrollLeft >= maxScroll - 1;
        });
    }

    products.forEach((product, index) => {
        product.dataset.featuredOrder = index;
    });

    function updateProducts() {
        const category = categoryFilter.value;
        const sortBy = sortSelect.value;
        const searchQuery = section === catalogueSection
            ? searchInput.value.trim().toLocaleLowerCase()
            : "";
        const searchTerms = searchQuery.split(/\s+/).filter(Boolean);
        const sortedProducts = [...products];

        if (sortBy === "price-low") {
            sortedProducts.sort((a, b) =>
                Number(a.dataset.price) - Number(b.dataset.price)
            );
        } else if (sortBy === "price-high") {
            sortedProducts.sort((a, b) =>
                Number(b.dataset.price) - Number(a.dataset.price)
            );
        } else if (sortBy === "name") {
            sortedProducts.sort((a, b) =>
                a.querySelector("h3").textContent.localeCompare(
                    b.querySelector("h3").textContent
                )
            );
        } else {
            sortedProducts.sort((a, b) =>
                Number(a.dataset.featuredOrder) - Number(b.dataset.featuredOrder)
            );
        }

        const matchingProducts = sortedProducts.flatMap((product) => {
            const matchesCategory =
                category === "all" || product.dataset.category === category;
            if (!matchesCategory) {
                return [];
            }

            const name = product.querySelector("h3").textContent.toLocaleLowerCase();
            const productCategory =
                product.querySelector(".product-category")?.textContent.toLocaleLowerCase() ?? "";
            const description = product.querySelector("img").alt.toLocaleLowerCase();
            const searchableText = `${name} ${productCategory} ${description}`;
            if (!searchTerms.every((term) => searchableText.includes(term))) {
                return [];
            }

            const relevance = searchQuery
                ? searchTerms.reduce((score, term) => score
                    + (name.includes(term) ? 5 : 0)
                    + (productCategory.includes(term) ? 3 : 0)
                    + (description.includes(term) ? 1 : 0), 0)
                    + (name.includes(searchQuery) ? 8 : 0)
                : 0;
            return [{ product, relevance }];
        });

        if (searchQuery) {
            matchingProducts.sort((a, b) => b.relevance - a.relevance);
        }

        const visibleProducts = new Set(
            (searchQuery ? matchingProducts.slice(0, 2) : matchingProducts)
                .map(({ product }) => product)
        );

        sortedProducts.forEach((product) => {
            productGrid.appendChild(product);
            product.hidden = !visibleProducts.has(product);
        });

        if (carouselViewport) {
            carouselViewport.scrollLeft = 0;
            updateCarouselButtons();
        }

        if (section === catalogueSection) {
            const visibleCount = visibleProducts.size;
            resultsStatus.textContent = searchQuery
                ? visibleCount === 0
                    ? "Product is not available."
                    : `Showing the ${visibleCount} most relevant ${visibleCount === 1 ? "product" : "products"}.`
                : visibleCount === 0
                    ? "No products found. Try another category."
                    : `${visibleCount} ${visibleCount === 1 ? "product" : "products"} found.`;
        }
    }

    categoryFilter.addEventListener("change", updateProducts);
    sortSelect.addEventListener("change", updateProducts);

    if (section === catalogueSection) {
        searchInput.addEventListener("input", updateProducts);
    }

    if (carouselViewport && carouselButtons) {
        carouselViewport.addEventListener("scroll", updateCarouselButtons, {
            passive: true
        });
        window.addEventListener("resize", updateCarouselButtons);
        carouselButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const direction = Number(button.dataset.carouselDirection);
                const firstVisibleCard = products.find((product) => !product.hidden);
                const gridStyles = getComputedStyle(productGrid);
                const gap = Number.parseFloat(gridStyles.columnGap) || 0;
                const distance = firstVisibleCard
                    ? firstVisibleCard.getBoundingClientRect().width + gap
                    : carouselViewport.clientWidth;
                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    carouselViewport.scrollLeft += direction * distance;
                } else {
                    carouselViewport.scrollBy({
                        left: direction * distance,
                        behavior: "smooth"
                    });
                }
            });
        });
        updateCarouselButtons();
    }
});

catalogueSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    catalogueSection.scrollIntoView({ behavior: "smooth" });
});
