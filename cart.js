document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // --- Load Cart from Session Storage ---
    function loadCart() {
        const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = ''; // Clear existing items

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
            checkoutBtn.disabled = true;
            updateTotals(0);
            return;
        }

        let subtotal = 0;
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-details">
                    <p class="item-name">${item.name}</p>
                    <p class="item-price">€ ${item.price.toFixed(2)}</p>
                </div>
                <button class="remove-item-btn" data-bin="${item.bin}">&times;</button>
            `;
            cartItemsContainer.appendChild(itemEl);
            subtotal += item.price;
        });

        updateTotals(subtotal);
        checkoutBtn.disabled = false;
    }

    // --- Update Totals ---
    function updateTotals(subtotal) {
        subtotalEl.textContent = `€ ${subtotal.toFixed(2)}`;
        totalEl.textContent = `€ ${subtotal.toFixed(2)}`;
    }

    // --- Remove Item from Cart ---
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const binToRemove = e.target.getAttribute('data-bin');
            let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            cart = cart.filter(item => item.bin !== binToRemove);
            sessionStorage.setItem('cart', JSON.stringify(cart));
            loadCart(); // Reload the cart display
        }
    });
    
    // --- Checkout Button ---
    checkoutBtn.addEventListener('click', () => {
        alert('Checkout functionality is not implemented in this project.');
    });

    // --- Initial Load ---
    loadCart();
});
