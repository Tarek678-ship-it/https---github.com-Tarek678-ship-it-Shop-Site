(() => {
    const storageKey = "shopmate-cart";
    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    });
    const storageError = document.querySelector("#cart-storage-error");
    let items = loadCart();

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
            );
        } catch (error) {
            console.error("Unable to load the saved cart.", error);
            showStorageError("We couldn’t load your saved bag. You can continue shopping, but the previous saved items may not be available.");
            return [];
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

            const controls = document.createElement("div");
            controls.className = "cart-item-controls";
            controls.append(
                makeQuantityControl(item.id, "decrease", "−", `Remove one ${item.name}`),
                document.createTextNode(` ${item.quantity} `),
                makeQuantityControl(item.id, "increase", "+", `Add one ${item.name}`),
                makeQuantityControl(item.id, "remove", "Remove", `Remove ${item.name} from bag`)
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
        document.querySelector("#cart-total").textContent = formatPrice(subtotalCents);

        const count = document.querySelector("#cart-count");
        if (count) {
            count.textContent = quantity ? `Cart (${quantity})` : "Cart";
        }

        document.querySelectorAll("[data-cart-add]").forEach((button) => {
            const item = items.find((cartItem) => cartItem.id === button.dataset.cartAdd);
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

        list.replaceChildren();
        items.forEach((item) => {
            const row = document.createElement("li");
            row.className = "summary-item";

            const details = document.createElement("div");
            details.className = "summary-item-details";
            const name = document.createElement("span");
            name.className = "summary-item-name";
            name.textContent = item.name;

            const controls = document.createElement("div");
            controls.className = "summary-item-controls";
            controls.append(
                makeQuantityControl(item.id, "decrease", "−", `Remove one ${item.name}`),
                document.createTextNode(` Qty: ${item.quantity} `),
                makeQuantityControl(item.id, "increase", "+", `Add one ${item.name}`),
                makeQuantityControl(item.id, "remove", "Remove", `Remove ${item.name} from order`)
            );
            details.append(name, controls);

            const lineTotal = document.createElement("strong");
            lineTotal.textContent = formatPrice(item.priceCents * item.quantity);
            row.append(details, lineTotal);
            list.append(row);
        });

        emptyMessage.hidden = items.length > 0;
        document.querySelector("#summary-subtotal").textContent = formatPrice(subtotalCents);
        document.querySelector("#summary-total").textContent = formatPrice(subtotalCents);
    }

    document.querySelectorAll("[data-cart-add]").forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest(".product-card");
            const name = card.querySelector("h3").textContent.trim();
            const priceCents = Math.round(Number(card.dataset.price) * 100);
            if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
                showStorageError(`Couldn’t add ${name}: its price is invalid.`);
                return;
            }

            addProduct({
                id: card.dataset.productId,
                name,
                priceCents
            });
            render();
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
