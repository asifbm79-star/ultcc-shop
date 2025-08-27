document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.'; // Your Master Key
    const ORDERS_BIN_ID = '68aedf0ed0ea881f4067d31a'; // The same bin from my_orders.js
    const ORDERS_BIN_URL = `https://api.jsonbin.io/v3/b/${ORDERS_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');

    // --- Element References ---
    const checkerUnlockedDiv = document.getElementById('checker-unlocked');
    const checkerLockedDiv = document.getElementById('checker-locked');
    const cardInput = document.getElementById('card-input');
    const checkCardsBtn = document.getElementById('check-cards-btn');
    const approvedBox = document.querySelector('#approved-cards pre');
    const declinedBox = document.querySelector('#declined-cards pre');
    const approvedTitle = document.querySelector('#approved-cards h4');
    const declinedTitle = document.querySelector('#declined-cards h4');

    // --- Main Function to Check Access ---
    async function checkAccess() {
        if (!loggedInUserEmail) return;

        try {
            const response = await fetch(`${ORDERS_BIN_URL}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            if (!response.ok) throw new Error('Failed to fetch order data.');
            
            const data = await response.json();
            const allOrders = data.record.orders || [];
            const userHasOrders = allOrders.some(order => order.email === loggedInUserEmail);

            if (userHasOrders) {
                // User has orders, so unlock the checker
                checkerLockedDiv.style.display = 'none';
                checkerUnlockedDiv.classList.remove('hidden');
            } else {
                // User has no orders, keep it locked
                checkerLockedDiv.style.display = 'block';
                checkerUnlockedDiv.classList.add('hidden');
            }

        } catch (error)
        {
            console.error("Checker Access Error:", error);
            // Default to locked state if there's an error
            checkerLockedDiv.style.display = 'block';
            checkerUnlockedDiv.classList.add('hidden');
        }
    }

    // --- Checker Functionality (only runs if unlocked) ---
    if (checkCardsBtn) {
        checkCardsBtn.addEventListener('click', () => {
            const cards = cardInput.value.trim().split('\n').filter(line => line.length > 0);
            if (cards.length === 0) {
                alert('Please enter at least one card to check.');
                return;
            }

            // Reset UI
            approvedBox.textContent = '';
            declinedBox.textContent = '';
            approvedTitle.textContent = 'Approved';
            declinedTitle.textContent = 'Declined';
            checkCardsBtn.disabled = true;
            checkCardsBtn.textContent = 'Checking...';

            let approvedCount = 0;
            let declinedCount = 0;
            let processedCount = 0;

            cards.forEach((card, index) => {
                setTimeout(() => {
                    const isApproved = Math.random() < 0.5; // 50% chance

                    if (isApproved) {
                        approvedCount++;
                        approvedBox.textContent += card + '\n';
                        approvedTitle.textContent = `Approved (${approvedCount})`;
                    } else {
                        declinedCount++;
                        declinedBox.textContent += card + '\n';
                        declinedTitle.textContent = `Declined (${declinedCount})`;
                    }

                    processedCount++;
                    if (processedCount === cards.length) {
                        checkCardsBtn.disabled = false;
                        checkCardsBtn.textContent = 'Check Cards';
                    }
                }, index * 500); // Stagger checks
            });
        });
    }

    // --- Initial Load ---
    checkAccess();
});
