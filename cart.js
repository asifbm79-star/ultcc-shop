// This script manages the shopping cart page. It does not need Firebase
// because it only reads data from the browser's session storage.
// The secure checkout process is handled by processing.js.

document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // --- Main Function to Load and Display Cart ---
    function loadCart() {
        // Get cart data from the browser's session storage. If empty, create an empty array.
        const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = ''; // Clear any old items to prevent duplicates

        // If the cart is empty, show a message and disable the checkout button.
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
            checkoutBtn.disabled = true;
            updateTotals(0);
            return;
        }

        let subtotal = 0;
        // Loop through each item in the cart and create the HTML for it.
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            // Use docId for the data attribute to uniquely identify items for removal.
            itemEl.innerHTML = `
                <div class="cart-item-details">
                    <p class="item-name">${item.name}</p>
                    <p class="item-price">€ ${item.price.toFixed(2)}</p>
                </div>
                <button class="remove-item-btn" data-doc-id="${item.docId}">&times;</button>
            `;
            cartItemsContainer.appendChild(itemEl);
            subtotal += item.price; // Add the item's price to the running subtotal.
        });

        updateTotals(subtotal);
        checkoutBtn.disabled = false;
    }

    // --- Function to Update Price Totals ---
    function updateTotals(subtotal) {
        subtotalEl.textContent = `€ ${subtotal.toFixed(2)}`;
        totalEl.textContent = `€ ${subtotal.toFixed(2)}`;
    }

    // --- Function to Remove an Item from the Cart ---
    cartItemsContainer.addEventListener('click', (e) => {
        // Check if the clicked element is a remove button.
        if (e.target.classList.contains('remove-item-btn')) {
            const docIdToRemove = e.target.getAttribute('data-doc-id');
            let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            // Filter out the item that was clicked, keeping all others.
            cart = cart.filter(item => item.docId !== docIdToRemove);
            // Save the updated (smaller) cart back to session storage.
            sessionStorage.setItem('cart', JSON.stringify(cart));
            loadCart(); // Reload the cart display to show the change.
        }
    });
    
    // --- Checkout Button Logic ---
    checkoutBtn.addEventListener('click', () => {
        // Redirect to the processing page to handle the secure checkout.
        window.location.href = 'processing.html';
    });

    // --- Initial Load ---
    // Load the cart as soon as the page is ready.
    loadCart();
});
