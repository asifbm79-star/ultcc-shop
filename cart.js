// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-functions.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBS5WvBZgg1Cr0iyFvMj7ciJl4_kxkOIt0",
  authDomain: "ultcc-shop-project.firebaseapp.com",
  projectId: "ultcc-shop-project",
  storageBucket: "ultcc-shop-project.appspot.com",
  messagingSenderId: "670031756880",
  appId: "1:670031756880:web:43e14f3f9c12ae8e2b1b55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // --- Load Cart from Session Storage ---
    function loadCart() {
        const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = '';

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
            // Use docId for the data attribute
            itemEl.innerHTML = `
                <div class="cart-item-details">
                    <p class="item-name">${item.name}</p>
                    <p class="item-price">€ ${item.price.toFixed(2)}</p>
                </div>
                <button class="remove-item-btn" data-doc-id="${item.docId}">&times;</button>
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
            const docIdToRemove = e.target.getAttribute('data-doc-id');
            let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            cart = cart.filter(item => item.docId !== docIdToRemove);
            sessionStorage.setItem('cart', JSON.stringify(cart));
            loadCart();
        }
    });
    
    // --- Checkout Button ---
    checkoutBtn.addEventListener('click', () => {
        // Redirect to the processing page to handle the secure checkout
        window.location.href = 'processing.html';
    });

    // --- Initial Load ---
    loadCart();
});
