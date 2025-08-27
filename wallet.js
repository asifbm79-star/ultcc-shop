document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.';
    const WALLET_BIN_ID = 'PASTE_YOUR_WALLET_BIN_ID_HERE'; 
    const WALLET_BIN_URL = `https://api.jsonbin.io/v3/b/${WALLET_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');

    // --- Element References ---
    const balanceAmountEl = document.getElementById('balance-amount');
    const transactionsTableBody = document.querySelector('#transactions-table tbody');
    const newDepositBtn = document.getElementById('new-deposit-btn');
    const modalOverlay = document.getElementById('deposit-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const backToDepositBtn = document.getElementById('back-to-deposit-btn');
    const depositForm = document.getElementById('deposit-form');
    const modalFlipper = document.querySelector('.modal-flipper');

    // Payment details elements
    const paymentAmountEl = document.getElementById('payment-amount');
    const paymentCurrencyEl = document.getElementById('payment-currency');
    const qrCodeImg = document.getElementById('qr-code-img');
    const cryptoAddressInput = document.getElementById('crypto-address');
    const copyAddressBtn = document.getElementById('copy-address-btn');

    // --- Fake Address Generator ---
    const fakeAddresses = {
        BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        LTC: 'ltc1q3h2v5f9w2j9s6g7y8x0z1c3b4a5d6e7f8g9h0',
        USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        XMR: '44AFFq5kSiGBoZ4NMDwYtN18obc8A5S3jSHytLwsVLhG8i3QF8gBZH46'
    };

    // --- Main Function to Load Wallet Data ---
    async function loadWalletData() {
        // ... (This function remains the same as before)
        if (!loggedInUserEmail) return;
        try {
            const response = await fetch(`${WALLET_BIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } });
            if (!response.ok) throw new Error('Failed to fetch wallet data.');
            const data = await response.json();
            const allWallets = data.record.wallets || [];
            let userWallet = allWallets.find(w => w.email === loggedInUserEmail);
            if (!userWallet) {
                userWallet = { email: loggedInUserEmail, balance: 0, transactions: [] };
            }
            updateUI(userWallet);
        } catch (error) {
            console.error("Wallet Load Error:", error);
            balanceAmountEl.textContent = 'Error';
            transactionsTableBody.innerHTML = `<tr><td colspan="4">Could not load transaction history.</td></tr>`;
        }
    }

    // --- Function to Update the UI ---
    function updateUI(wallet) {
        // ... (This function remains the same as before)
        balanceAmountEl.textContent = `€ ${wallet.balance.toFixed(2)}`;
        transactionsTableBody.innerHTML = '';
        if (wallet.transactions.length === 0) {
            transactionsTableBody.innerHTML = `<tr><td colspan="4">No transactions found.</td></tr>`;
        } else {
            wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            wallet.transactions.forEach(tx => {
                const row = `<tr><td>${tx.id}</td><td>${tx.date}</td><td>${tx.description}</td><td class="${tx.amount >= 0 ? 'amount-credit' : 'amount-debit'}">€ ${tx.amount.toFixed(2)}</td></tr>`;
                transactionsTableBody.innerHTML += row;
            });
        }
    }

    // --- Modal Handling ---
    function showModal() {
        modalOverlay.style.display = 'flex';
        modalFlipper.classList.remove('is-flipped'); // Ensure form is always shown first
    }
    function hideModal() {
        modalOverlay.style.display = 'none';
    }

    newDepositBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    backToDepositBtn.addEventListener('click', () => modalFlipper.classList.remove('is-flipped'));
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
        showPaymentDetails(currency, amount);
    });

    // --- Show Payment Details Logic ---
    function showPaymentDetails(currency, amount) {
        const address = fakeAddresses[currency];
        paymentAmountEl.textContent = `€${amount.toFixed(2)}`;
        paymentCurrencyEl.textContent = currency;
        cryptoAddressInput.value = address;
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${address}&bgcolor=1a1a29&color=e0e0e0&qzone=1`;
        
        // Flip the modal card
        modalFlipper.classList.add('is-flipped');
    }

    // --- Copy Address Button ---
    copyAddressBtn.addEventListener('click', () => {
        cryptoAddressInput.select();
        document.execCommand('copy'); // Use this for iframe compatibility
        copyAddressBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyAddressBtn.textContent = 'Copy';
        }, 2000);
    });

    // --- Initial Load ---
    loadWalletData();
});
