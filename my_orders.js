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

    // --- Main Function to Load Order Data from Firestore ---
    async function loadOrders() {
        if (!loggedInUserEmail || !ordersTableBody) return;

        try {
            // 1. Reference the 'orders' collection
            const ordersRef = collection(db, "orders");
            // 2. Create a query to get only the orders for the currently logged-in user
            const q = query(ordersRef, where("userEmail", "==", loggedInUserEmail));
            
            // 3. Execute the query
            const querySnapshot = await getDocs(q);
            const userOrders = querySnapshot.docs.map(doc => doc.data());
            
            // 4. Update the UI with the user's orders
            updateOrdersTable(userOrders);

        } catch (error) {
            console.error("Order Load Error:", error);
            ordersTableBody.innerHTML = `<tr><td colspan="5">Could not load your order history.</td></tr>`;
        }
    }

    // --- Function to Update the Orders Table UI ---
    function updateOrdersTable(orders) {
        ordersTableBody.innerHTML = ''; // Clear existing rows
        if (orders.length === 0) {
            ordersTableBody.innerHTML = `<tr><td colspan="5">You have not placed any orders yet.</td></tr>`;
            return;
        }

        // Sort orders by date, newest first
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));

        orders.forEach(order => {
            const statusClass = order.status.toLowerCase().replace(' ', '-'); // e.g., "pre-ordered"
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

    // --- Function to show order details (now uses the order object directly) ---
    ordersTableBody.addEventListener('click', async (e) => {
        if (e.target.matches('button[data-order-id]')) {
            const orderId = e.target.getAttribute('data-order-id');
            // This is a simplified approach. A full implementation would re-fetch the specific order.
            // For this project, we can just show a generic message.
            alert(`Viewing details for Order ID: ${orderId}\n\nFull item details would be displayed here.`);
        }
    });

    // --- Initial Load ---
    loadOrders();
});
