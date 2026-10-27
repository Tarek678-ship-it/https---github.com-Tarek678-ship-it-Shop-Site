(() => {
    const storageKey = "shopmate-cart";
    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    });
    const storageError = document.querySelector("#cart-storage-error");
    const shippingStorageKey = "shopmate-shipping";
    const shippingOptions = Array.from(document.querySelectorAll('input[name="shipping"]'));
    let items = loadCart();
    let shippingMethod = loadShippingMethod();

    function showStorageError(message) {
        if (storageError) {
            storageError.textContent = message;
            storageError.hidden = false;
        }
    }

    function loadCart() {
        try {
            const storedCart = localStorage.getItem(storageKey);
            if (!storedCart) {
                return [];
            }

            const parsedCart = JSON.parse(storedCart);
            if (!Array.isArray(parsedCart)) {
                throw new TypeError("Saved cart data is not a list.");
            }

            return parsedCart.filter((item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                Number.isSafeInteger(item.priceCents) &&
                item.priceCents >= 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0 &&
                item.quantity <= 99
            ).map((item) => ({
                ...item,
                productId: typeof item.productId === "string" ? item.productId : item.id,
                size: typeof item.size === "string" ? item.size : ""
            }));
        } catch (error) {
            console.error("Unable to load the saved cart.", error);
            showStorageError("We couldn’t load your saved bag. You can continue shopping, but the previous saved items may not be available.");
            return [];
        }
    }

    function loadShippingMethod() {
        if (shippingOptions.length === 0) {
            return "standard";
        }

        try {
            const savedMethod = localStorage.getItem(shippingStorageKey);
            const selected = shippingOptions.find((option) => option.value === savedMethod);
            const method = selected?.value ?? "standard";
            shippingOptions.forEach((option) => {
                option.checked = option.value === method;
            });
            return method;
        } catch (error) {
            console.error("Unable to load the saved delivery option.", error);
            showStorageError("We couldn’t load your saved delivery choice. The standard option is selected.");
            return "standard";
        }
    }

    function persist(nextItems) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(nextItems));
            items = nextItems;
            window.dispatchEvent(new Event("shopmatecartchange"));
            return true;
        } catch (error) {
            console.error("Unable to save the cart.", error);
            showStorageError("Your browser couldn’t save the bag. Check browser storage settings and try again.");
            return false;
        }
    }

    function getItems() {
        return items.map((item) => ({ ...item }));
    }

    function addProduct(product) {
        const existing = items.find((item) => item.id === product.id);
        const quantity = (existing?.quantity ?? 0) + 1;
        if (quantity > 99) {
            showStorageError("You can add up to 99 of each item.");
            return false;
        }

        const nextItems = existing
            ? items.map((item) => item.id === product.id ? { ...item, quantity } : item)
            : [...items, { ...product, quantity: 1 }];
        return persist(nextItems);
    }

    function changeQuantity(id, amount) {
        const existing = items.find((item) => item.id === id);
        if (!existing) {
            return false;
        }

        const quantity = existing.quantity + amount;
        if (quantity > 99) {
            showStorageError("You can add up to 99 of each item.");
            return false;
        }
        const nextItems = quantity <= 0
            ? items.filter((item) => item.id !== id)
            : items.map((item) => item.id === id ? { ...item, quantity } : item);
        return persist(nextItems);
    }

    function removeProduct(id) {
        return persist(items.filter((item) => item.id !== id));
    }

    function saveShippingMethod(method) {
        try {
            localStorage.setItem(shippingStorageKey, method);
            shippingMethod = method;
            renderCheckout();
        } catch (error) {
            console.error("Unable to save the delivery option.", error);
            showStorageError("Your browser couldn’t save the delivery choice.");
        }
    }

    function getShippingCents() {
        const selectedOption = shippingOptions.find((option) => option.value === shippingMethod);
        const cents = Number(selectedOption?.dataset.priceCents ?? 0);
        return Number.isSafeInteger(cents) && cents >= 0 ? cents : 0;
    }

    function formatPrice(cents) {
        return currency.format(cents / 100);
    }

    function makeQuantityControl(id, action, text, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quantity-button";
        button.dataset.cartAction = action;
        button.dataset.productId = id;
        button.setAttribute("aria-label", label);
        button.textContent = text;
        return button;
    }

    function renderShopCart() {
        const list = document.querySelector("#cart-items");
        if (!list) {
            return;
        }

        const emptyMessage = document.querySelector("#cart-empty");
        const totals = document.querySelector("#cart-totals");
        const proceed = document.querySelector("#cart-proceed");
        const quantity = items.reduce((total, item) => total + item.quantity, 0);
        const subtotalCents = items.reduce(
            (total, item) => total + item.priceCents * item.quantity,
            0
        );

        list.replaceChildren();
        items.forEach((item) => {
            const row = document.createElement("li");
            row.className = "cart-item";

            const name = document.createElement("span");
            name.className = "cart-item-name";
            name.textContent = item.name;
            if (item.size) {
                const size = document.createElement("small");
                size.textContent = `Size: ${item.size}`;
                name.append(size);
            }

            const controls = document.createElement("div");
            controls.className = "cart-item-controls";
            const itemLabel = item.size ? `${item.name}, size ${item.size}` : item.name;
            controls.append(
                makeQuantityControl(item.id, "decrease", "−", `Remove one ${itemLabel}`),
                document.createTextNode(` ${item.quantity} `),
                makeQuantityControl(item.id, "increase", "+", `Add one ${itemLabel}`),
                makeQuantityControl(item.id, "remove", "Remove", `Remove ${itemLabel} from bag`)
            );

            const lineTotal = document.createElement("strong");
            lineTotal.textContent = formatPrice(item.priceCents * item.quantity);
            row.append(name, controls, lineTotal);
            list.append(row);
        });

        emptyMessage.hidden = items.length > 0;
        totals.hidden = items.length === 0;
        proceed.hidden = items.length === 0;
        document.querySelector("#cart-subtotal").textContent = formatPrice(subtotalCents);

        const count = document.querySelector("#cart-count");
        if (count) {
            count.textContent = quantity ? `Cart (${quantity})` : "Cart";
        }

        document.querySelectorAll("[data-cart-add]").forEach((button) => {
            const card = button.closest(".product-card");
            const size = card.querySelector(".product-size")?.value ?? "";
            const itemId = size ? `${button.dataset.cartAdd}:${size}` : button.dataset.cartAdd;
            const item = items.find((cartItem) => cartItem.id === itemId);
            button.textContent = item
                ? `Add another (${item.quantity} in bag)`
                : "Add to cart";
        });
    }

    function renderCheckout() {
        const list = document.querySelector("#summary-items");
        if (!list) {
            return;
        }

        const emptyMessage = document.querySelector("#checkout-empty");
        const subtotalCents = items.reduce(
            (total, item) => total + item.priceCents * item.quantity,
            0
        );
        const shippingCents = items.length ? getShippingCents() : 0;

        list.replaceChildren();
        items.forEach((item) => {
            const row = document.createElement("li");
            row.className = "summary-item";

            const details = document.createElement("div");
            details.className = "summary-item-details";
            const name = document.createElement("span");
            name.className = "summary-item-name";
            name.textContent = item.name;
            if (item.size) {
                const size = document.createElement("small");
                size.textContent = `Size: ${item.size}`;
                name.append(size);
            }

            const controls = document.createElement("div");
            controls.className = "summary-item-controls";
            const itemLabel = item.size ? `${item.name}, size ${item.size}` : item.name;
            controls.append(
                makeQuantityControl(item.id, "decrease", "−", `Remove one ${itemLabel}`),
                document.createTextNode(` Qty: ${item.quantity} `),
                makeQuantityControl(item.id, "increase", "+", `Add one ${itemLabel}`),
                makeQuantityControl(item.id, "remove", "Remove", `Remove ${itemLabel} from order`)
            );
            details.append(name, controls);

            const lineTotal = document.createElement("strong");
            lineTotal.textContent = formatPrice(item.priceCents * item.quantity);
            row.append(details, lineTotal);
            list.append(row);
        });

        emptyMessage.hidden = items.length > 0;
        document.querySelector("#summary-subtotal").textContent = formatPrice(subtotalCents);
        document.querySelector("#summary-shipping").textContent = formatPrice(shippingCents);
        document.querySelector("#summary-total").textContent =
            formatPrice(subtotalCents + shippingCents);
    }

    document.querySelectorAll("[data-cart-add]").forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest(".product-card");
            const name = card.querySelector("h3").textContent.trim();
            const sizeSelect = card.querySelector(".product-size");
            const optionError = card.querySelector(".product-option-error");
            const size = sizeSelect?.value ?? "";
            if (sizeSelect && !size) {
                optionError.textContent = "Choose a size before adding this item.";
                optionError.hidden = false;
                sizeSelect.focus();
                return;
            }
            if (optionError) {
                optionError.hidden = true;
                optionError.textContent = "";
            }

            const priceCents = Math.round(Number(card.dataset.price) * 100);
            if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
                showStorageError(`Couldn’t add ${name}: its price is invalid.`);
                return;
            }

            addProduct({
                id: size ? `${card.dataset.productId}:${size}` : card.dataset.productId,
                productId: card.dataset.productId,
                name,
                priceCents,
                size
            });
            render();
        });
    });

    document.querySelectorAll(".product-size").forEach((select) => {
        select.addEventListener("change", () => {
            const optionError = select.closest(".product-card").querySelector(".product-option-error");
            optionError.hidden = true;
            optionError.textContent = "";
            renderShopCart();
        });
    });

    shippingOptions.forEach((option) => {
        option.addEventListener("change", () => {
            if (option.checked) {
                saveShippingMethod(option.value);
            }
        });
    });

    document.addEventListener("click", (event) => {
        const button = event.target instanceof Element
            ? event.target.closest("[data-cart-action]")
            : null;
        if (!button) {
            return;
        }

        const { cartAction, productId } = button.dataset;
        if (cartAction === "increase") {
            changeQuantity(productId, 1);
        } else if (cartAction === "decrease") {
            changeQuantity(productId, -1);
        } else if (cartAction === "remove") {
            removeProduct(productId);
        }
        render();
    });

    window.addEventListener("storage", (event) => {
        if (event.key === storageKey) {
            items = loadCart();
            render();
        } else if (event.key === shippingStorageKey) {
            shippingMethod = loadShippingMethod();
            renderCheckout();
        }
    });

    function render() {
        renderShopCart();
        renderCheckout();
    }

    window.ShopMateCart = {
        getItems,
        formatPrice,
        render
    };
    render();
})();
