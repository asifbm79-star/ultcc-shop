// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');
    const ordersTableBody = document.querySelector('#orders-table tbody');

    // --- Main Function to Load All Order Data from Firestore ---
    async function loadAllOrders() {
        if (!loggedInUserEmail || !ordersTableBody) {
            // This check prevents errors if the script runs on a page without the necessary elements
            return;
        }
        ordersTableBody.innerHTML = `<tr><td colspan="5">Loading your orders...</td></tr>`;

        try {
            // 1. Fetch regular completed orders from the 'orders' collection
            const ordersRef = collection(db, "orders");
            const qOrders = query(ordersRef, where("userEmail", "==", loggedInUserEmail));
            const ordersSnapshot = await getDocs(qOrders);
            const regularOrders = ordersSnapshot.docs.map(doc => doc.data());

            // 2. Fetch pending pre-orders from the 'pre_orders' collection
            const preOrdersRef = collection(db, "pre_orders");
            const qPreOrders = query(preOrdersRef, where("userEmail", "==", loggedInUserEmail));
            const preOrdersSnapshot = await getDocs(qPreOrders);
            const preOrders = preOrdersSnapshot.docs.map(doc => doc.data());

            // 3. Combine both lists into a single array
            const allUserOrders = [...regularOrders, ...preOrders];
            
            // 4. Update the UI with the combined list of orders
            updateOrdersTable(allUserOrders);

        } catch (error) {
            console.error("Order Load Error:", error);
            ordersTableBody.innerHTML = `<tr><td colspan="5">Could not load your order history.</td></tr>`;
        }
    }

    // --- Function to Update the Orders Table UI ---
    function updateOrdersTable(orders) {
        ordersTableBody.innerHTML = ''; // Clear the "Loading..." message
        if (orders.length === 0) {
            ordersTableBody.innerHTML = `<tr><td colspan="5">You have not placed any orders yet.</td></tr>`;
            return;
        }

        // Sort all orders by date, so the newest ones appear first
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));

        orders.forEach(order => {
            const statusClass = order.status.toLowerCase().replace(/\s+/g, '-'); // e.g., "pending-payment"
            const row = `
                <tr>
                    <td>${order.orderId}</td>
                    <td>${order.date}</td>
                    <td>€ ${order.total.toFixed(2)}</td>
                    <td><span class="status-badge status-${statusClass}">${order.status}</span></td>
                    <td><button class="action-button-small" data-order-id="${order.orderId}">View</button></td>
                </tr>
            `;
            ordersTableBody.innerHTML += row;
        });
    }

    // --- Function to show order details (simulated) ---
    ordersTableBody.addEventListener('click', (e) => {
        if (e.target.matches('button[data-order-id]')) {
            const orderId = e.target.getAttribute('data-order-id');
            // A full implementation would fetch the specific order details again
            // and show them in a modal. For this project, an alert is sufficient.
            alert(`Viewing details for Order ID: ${orderId}\n\nFull item details would be displayed here.`);
        }
    });

    // --- Initial Load ---
    loadAllOrders();
});
