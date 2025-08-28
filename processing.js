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

document.addEventListener('DOMContentLoaded', async () => {
    const statusEl = document.getElementById('processing-status');
    const messageEl = document.getElementById('processing-message');

    const cart = JSON.parse(sessionStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        statusEl.textContent = 'Error';
        messageEl.textContent = 'Your cart is empty. Redirecting...';
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }

    try {
        const processCheckout = httpsCallable(functions, 'processCheckout');
        const result = await processCheckout({ cart: cart });

        if (result.data.success) {
            // SUCCESS
            statusEl.textContent = 'Transaction Successful!';
            messageEl.textContent = `Your Order ID is: ${result.data.orderId}. Check your "My Orders" page. Redirecting now...`;
            sessionStorage.removeItem('cart'); // Clear the cart
            setTimeout(() => { window.location.href = 'my_orders.html'; }, 3000);
        } else {
            // Handle specific errors from the backend
            throw new Error(result.data.error || 'An unknown error occurred.');
        }
    } catch (error) {
        // FAILURE
        statusEl.textContent = 'Transaction Failed';
        messageEl.textContent = `Error: ${error.message}. Redirecting back to cart...`;
        setTimeout(() => { window.location.href = 'cart.html'; }, 3000);
    }
});
