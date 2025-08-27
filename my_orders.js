document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.'; // Your Master Key
    const ORDERS_BIN_ID = '68aedf0ed0ea881f4067d31a'; 
    const ORDERS_BIN_URL = `https://api.jsonbin.io/v3/b/${ORDERS_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');
    const ordersTableBody = document.querySelector('#orders-table tbody');

    // --- Main Function to Load Order Data ---
    async function loadOrders() {
        if (!loggedInUserEmail || !ordersTableBody) return;

        try {
            // 1. Fetch the entire orders database
            const response = await fetch(`${ORDERS_BIN_URL}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            if (!response.ok) throw new Error('Failed to fetch order data.');
            
            const data = await response.json();
            const allOrders = data.record.orders || [];

            // 2. Filter orders for the currently logged-in user
            const userOrders = allOrders.filter(order => order.email === loggedInUserEmail);
            
            // 3. Update the UI with the user's orders
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
            const statusClass = order.status.toLowerCase();
            const row = `
                <tr>
                    <td>${order.orderId}</td>
                    <td>${order.date}</td>
                    <td>€ ${order.total.toFixed(2)}</td>
                    <td><span class="status-badge status-${statusClass}">${order.status}</span></td>
                    <td><button class="action-button-small" onclick="viewOrderDetails('${order.orderId}')">View</button></td>
                </tr>
            `;
            ordersTableBody.innerHTML += row;
        });
    }

    // --- Function to show order details (simulated) ---
    window.viewOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`${ORDERS_BIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } });
            if (!response.ok) throw new Error('Failed to fetch details.');
            const data = await response.json();
            const order = data.record.orders.find(o => o.orderId === orderId);

            if (!order) {
                alert('Order not found!');
                return;
            }

            let details = `Order Details for: ${order.orderId}\n`;
            details += `Date: ${order.date}\n`;
            details += `Status: ${order.status}\n\n`;
            details += `Items Purchased:\n`;
            order.items.forEach(item => {
                details += `- ${item.name} (x${item.quantity}) - €${item.price.toFixed(2)}\n`;
            });
            details += `\nTotal: €${order.total.toFixed(2)}`;

            alert(details);

        } catch (error) {
            alert('Could not retrieve order details.');
        }
    };

    // --- Initial Load ---
    loadOrders();
});
