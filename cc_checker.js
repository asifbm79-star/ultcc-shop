document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.'; // Your Master Key
    const ORDERS_BIN_ID = 'PASTE_YOUR_ORDERS_BIN_ID_HERE'; // The same bin from my_orders.js
    const ORDERS_BIN_URL = `https://api.jsonbin.io/v3/b/${ORDERS_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');

    // --- Element References ---
    const checkerUnlockedDiv = document.getElementById('checker-unlocked');
    const checkerLockedDiv = document.getElementById('checker-locked');
    const purchasesTableBody = document.querySelector('#purchases-table tbody');
    const resultsArea = document.getElementById('check-results-area');
    const resultText = document.getElementById('check-result-text');

    // --- Main Function to Check Access and Load Items ---
    async function initializeChecker() {
        if (!loggedInUserEmail) return;

        try {
            const response = await fetch(`${ORDERS_BIN_URL}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            if (!response.ok) throw new Error('Failed to fetch order data.');
            
            const data = await response.json();
            const allOrders = data.record.orders || [];
            const userOrders = allOrders.filter(order => order.email === loggedInUserEmail);

            if (userOrders.length > 0) {
                // User has orders, so unlock the checker
                checkerLockedDiv.classList.add('hidden');
                checkerUnlockedDiv.classList.remove('hidden');
                populatePurchasesTable(userOrders);
            } else {
                // User has no orders, show the locked message
                checkerLockedDiv.classList.remove('hidden');
                checkerUnlockedDiv.classList.add('hidden');
            }
        } catch (error) {
            console.error("Checker Access Error:", error);
            checkerLockedDiv.classList.remove('hidden');
            checkerUnlockedDiv.classList.add('hidden');
            checkerLockedDiv.querySelector('p').textContent = 'Could not verify your purchase history. Please try again later.';
        }
    }

    // --- Function to populate the table with purchased items ---
    function populatePurchasesTable(orders) {
        purchasesTableBody.innerHTML = '';
        
        orders.forEach(order => {
            order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${order.orderId}</td>
                    <td>${order.date}</td>
                    <td><button class="action-button-small check-btn">Check</button></td>
                `;
                purchasesTableBody.appendChild(row);
            });
        });
    }

    // --- Event Delegation for "Check" buttons ---
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('check-btn')) {
            const button = event.target;
            // Prevent multiple clicks
            button.disabled = true;
            button.textContent = 'Checking...';

            // Show results area
            resultsArea.classList.remove('hidden');
            resultText.textContent = 'Contacting bank...';
            resultText.className = 'result-checking';

            // Simulate network delay
            setTimeout(() => {
                const isApproved = Math.random() < 0.7; // 70% chance of success for purchased items

                if (isApproved) {
                    resultText.textContent = 'LIVE - Card is approved and ready for use.';
                    resultText.className = 'result-approved';
                } else {
                    resultText.textContent = 'DEAD - Card was declined.';
                    resultText.className = 'result-declined';
                }
                
                // Allow checking again after a delay
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = 'Check';
                }, 5000); // User can check the same card again after 5 seconds
            }, 1500); // 1.5 second check simulation
        }
    });

    // --- Initial Load ---
    initializeChecker();
});
