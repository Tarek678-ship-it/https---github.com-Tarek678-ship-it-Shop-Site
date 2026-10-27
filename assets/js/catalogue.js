const catalogueSection = document.querySelector("#catalogue");
const catalogueSearch = document.querySelector("#catalogue-search");
const searchInput = document.querySelector("#product-search");
const resultsStatus = document.querySelector("#catalogue-results-status");
const searchResultsSection = document.querySelector("#search-results");
const searchResultsTitle = document.querySelector("#search-results-title");
const searchResultsStatus = document.querySelector("#search-results-status");
const searchResultsGrid = document.querySelector("#search-results-grid");
const searchSuggestions = document.querySelector("#search-suggestions");
const searchClearButton = document.querySelector("#search-clear");
const productSections = Array.from(document.querySelectorAll(".products:not(#search-results)"));
const updateSectionProducts = [];

function findSearchMatches() {
    const searchQuery = searchInput.value.trim().toLocaleLowerCase();
    if (!searchQuery) {
        return null;
    }

    const searchTerms = searchQuery.split(/\s+/).filter(Boolean);
    const matchingProducts = productSections.flatMap((section) => {
        const categoryFilter = section.querySelector(".category-filter");
        const category = categoryFilter.value;
        const products = Array.from(section.querySelector(".product-grid").querySelectorAll(".product-card"));

        return products.flatMap((product) => {
            if (category !== "all" && product.dataset.category !== category) {
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

            const relevance = searchTerms.reduce((score, term) => score
                + (name.includes(term) ? 5 : 0)
                + (productCategory.includes(term) ? 3 : 0)
                + (description.includes(term) ? 1 : 0), 0)
                + (name.includes(searchQuery) ? 8 : 0);
            return [{ product, relevance }];
        });
    });

    matchingProducts.sort((a, b) => b.relevance - a.relevance);
    return new Set(matchingProducts.slice(0, 2).map(({ product }) => product));
}

function updateSearchResults() {
    const query = searchInput.value.trim();
    const searching = Boolean(query);
    const matches = findSearchMatches();
    document.body.classList.toggle("is-searching", searching);
    searchResultsSection.hidden = !searching;
    if (!searching) {
        searchResultsGrid.replaceChildren();
        return;
    }

    searchResultsTitle.textContent = `Search results for “${query}”`;
    searchSuggestions.hidden = matches.size > 0;
    searchResultsStatus.textContent = matches.size === 0
        ? `No results found for “${query}”.`
        : `Showing the ${matches.size} most relevant ${matches.size === 1 ? "product" : "products"}.`;
    searchResultsGrid.replaceChildren(...matches);
}

productSections.forEach((section) => {
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
        const searchQuery = searchInput.value.trim().toLocaleLowerCase();
        const searchMatches = findSearchMatches();
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
            if (!matchesCategory || (searchMatches && !searchMatches.has(product))) {
                return [];
            }

            return [product];
        });
        const visibleProducts = new Set(matchingProducts);

        sortedProducts.forEach((product) => {
            if (!searchQuery) {
                productGrid.appendChild(product);
            }
            product.hidden = !visibleProducts.has(product);
        });

        if (carouselViewport) {
            carouselViewport.scrollLeft = 0;
            updateCarouselButtons();
        }

        if (section === catalogueSection) {
            const visibleCount = searchMatches?.size ?? visibleProducts.size;
            resultsStatus.textContent = searchQuery
                ? ""
                : visibleCount === 0
                    ? "No products found. Try another category."
                    : `${visibleCount} ${visibleCount === 1 ? "product" : "products"} found.`;
        }
    }

    categoryFilter.addEventListener("change", updateProducts);
    sortSelect.addEventListener("change", updateProducts);
    updateSectionProducts.push(updateProducts);

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

searchInput.addEventListener("input", () => {
    updateSectionProducts.forEach((updateProducts) => updateProducts());
    updateSearchResults();
});

searchClearButton.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    searchInput.focus();
});

document.querySelectorAll("[data-search-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
        searchInput.value = button.dataset.searchSuggestion;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.focus();
    });
});

catalogueSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    if (searchInput.value.trim()) {
        searchResultsSection.scrollIntoView({ behavior: "smooth" });
    } else {
        catalogueSection.scrollIntoView({ behavior: "smooth" });
    }
});
