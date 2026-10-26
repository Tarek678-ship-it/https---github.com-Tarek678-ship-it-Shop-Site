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
            product.hidden =
                category !== "all" && product.dataset.category !== category;
        });
    }

    categoryFilter.addEventListener("change", updateProducts);
    sortSelect.addEventListener("change", updateProducts);
});
