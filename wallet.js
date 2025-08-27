document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // PASTE YOUR KEYS HERE
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.'; // The same key as your users bin
    const WALLET_BIN_ID = 'PASTE_YOUR_NEW_WALLET_BIN_ID_HERE'; 
    const WALLET_BIN_URL = `https://api.jsonbin.io/v3/b/${WALLET_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');

    // --- Element References ---
    const balanceAmountEl = document.getElementById('balance-amount');
    const transactionsTableBody = document.querySelector('#transactions-table tbody');
    const newDepositBtn = document.getElementById('new-deposit-btn');
    const modalOverlay = document.getElementById('deposit-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const depositForm = document.getElementById('deposit-form');

    // --- Main Function to Load Wallet Data ---
    async function loadWalletData() {
        if (!loggedInUserEmail) return;

        try {
            // 1. Fetch the entire wallet database
            const response = await fetch(`${WALLET_BIN_URL}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            if (!response.ok) throw new Error('Failed to fetch wallet data.');
            
            const data = await response.json();
            const allWallets = data.record.wallets || [];

            // 2. Find the wallet for the currently logged-in user
            let userWallet = allWallets.find(w => w.email === loggedInUserEmail);

            // 3. If no wallet exists, create a new one for this user
            if (!userWallet) {
                userWallet = { email: loggedInUserEmail, balance: 0, transactions: [] };
                // We won't save it back yet, we'll just display the zero-balance state
            }

            // 4. Update the UI with the wallet data
            updateUI(userWallet);

        } catch (error) {
            console.error("Wallet Load Error:", error);
            balanceAmountEl.textContent = 'Error';
            transactionsTableBody.innerHTML = `<tr><td colspan="4">Could not load transaction history.</td></tr>`;
        }
    }

    // --- Function to Update the UI ---
    function updateUI(wallet) {
        // Update balance
        balanceAmountEl.textContent = `€ ${wallet.balance.toFixed(2)}`;

        // Update transactions table
        transactionsTableBody.innerHTML = ''; // Clear existing rows
        if (wallet.transactions.length === 0) {
            transactionsTableBody.innerHTML = `<tr><td colspan="4">No transactions found.</td></tr>`;
        } else {
            // Sort transactions by date, newest first
            wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            wallet.transactions.forEach(tx => {
                const row = `
                    <tr>
                        <td>${tx.id}</td>
                        <td>${tx.date}</td>
                        <td>${tx.description}</td>
                        <td class="${tx.amount > 0 ? 'amount-credit' : 'amount-debit'}">€ ${tx.amount.toFixed(2)}</td>
                    </tr>
                `;
                transactionsTableBody.innerHTML += row;
            });
        }
    }

    // --- Modal Handling ---
    function showModal() {
        modalOverlay.style.display = 'flex';
    }
    function hideModal() {
        modalOverlay.style.display = 'none';
    }

    newDepositBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideModal();
        }
    });

    // --- Deposit Form Submission ---
    depositForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const currency = document.getElementById('crypto-select').value;

        if (amount < 15) {
            alert('Minimum deposit amount is 15 EUR.');
            return;
        }

        // In a real project, this would trigger a payment gateway.
        // For this project, we will just show an alert.
        alert(`Deposit created!\n\nTo complete your deposit of €${amount.toFixed(2)}, please send ${currency} to the following address:\n\nFAKE${currency}ADDRESS123456789\n\n(This is a simulation. No actual transaction will occur.)`);
        
        hideModal();
        depositForm.reset();
    });

    // --- Initial Load ---
    loadWalletData();
});
