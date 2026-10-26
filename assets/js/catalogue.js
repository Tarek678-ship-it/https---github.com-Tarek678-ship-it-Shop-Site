const catalogueSection = document.querySelector("#catalogue");
const catalogueSearch = document.querySelector("#catalogue-search");
const searchInput = document.querySelector("#product-search");
const resultsStatus = document.querySelector("#catalogue-results-status");

document.querySelectorAll(".products").forEach((section) => {
    const productGrid = section.querySelector(".product-grid");
    const categoryFilter = section.querySelector(".category-filter");
    const sortSelect = section.querySelector(".sort-products");
    const products = Array.from(productGrid.querySelectorAll(".product-card"));

    products.forEach((product, index) => {
        product.dataset.featuredOrder = index;
    });

    function updateProducts() {
        const category = categoryFilter.value;
        const sortBy = sortSelect.value;
        const searchTerms = section === catalogueSection
            ? searchInput.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
            : [];
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

        sortedProducts.forEach((product) => {
            productGrid.appendChild(product);
            const matchesCategory =
                category === "all" || product.dataset.category === category;
            const searchableText = [
                product.querySelector("h3").textContent,
                product.querySelector(".product-category")?.textContent ?? "",
                product.querySelector("img").alt
            ].join(" ").toLocaleLowerCase();
            const matchesSearch = searchTerms.every((term) =>
                searchableText.includes(term)
            );
            product.hidden = !matchesCategory || !matchesSearch;
        });

        if (section === catalogueSection) {
            const visibleCount = products.filter((product) => !product.hidden).length;
            resultsStatus.textContent = visibleCount === 0
                ? "No products found. Try another search or category."
                : `${visibleCount} ${visibleCount === 1 ? "product" : "products"} found.`;
        }
    }

    categoryFilter.addEventListener("change", updateProducts);
    sortSelect.addEventListener("change", updateProducts);

    if (section === catalogueSection) {
        searchInput.addEventListener("input", updateProducts);
    }
});

catalogueSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    catalogueSection.scrollIntoView({ behavior: "smooth" });
});
