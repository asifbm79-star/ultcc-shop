document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.';
    const WALLET_BIN_ID = '68aedadf43b1c97be92ce2b7'; 
    const WALLET_BIN_URL = `https://api.jsonbin.io/v3/b/${WALLET_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');
    let depositTimer;

    // --- Element References ---
    const balanceAmountEl = document.getElementById('balance-amount');
    const transactionsTableBody = document.querySelector('#transactions-table tbody');
    const newDepositBtn = document.getElementById('new-deposit-btn');
    const modalOverlay = document.getElementById('deposit-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const backToDepositBtn = document.getElementById('back-to-deposit-btn');
    const depositForm = document.getElementById('deposit-form');
    const modalFlipper = document.querySelector('.modal-flipper');
    const paymentAmountEl = document.getElementById('payment-amount');
    const paymentCurrencyEl = document.getElementById('payment-currency');
    const qrCodeImg = document.getElementById('qr-code-img');
    const cryptoAddressInput = document.getElementById('crypto-address');
    const copyAddressBtn = document.getElementById('copy-address-btn');
    const timerDisplay = document.getElementById('timer-display');

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
        balanceAmountEl.textContent = `€ ${wallet.balance.toFixed(2)}`;
        transactionsTableBody.innerHTML = '';
        if (wallet.transactions.length === 0) {
            transactionsTableBody.innerHTML = `<tr><td colspan="4">No transactions found.</td></tr>`;
        } else {
            wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            wallet.transactions.forEach(tx => {
                // Simplified logic: positive amount is credit, negative is debit
                const amountClass = tx.amount >= 0 ? 'amount-credit' : 'amount-debit';
                const row = `
                    <tr>
                        <td>${tx.id}</td>
                        <td>${tx.date}</td>
                        <td>${tx.description}</td>
                        <td class="${amountClass}">€ ${tx.amount.toFixed(2)}</td>
                    </tr>
                `;
                transactionsTableBody.innerHTML += row;
            });
        }
    }

    // --- Timer Logic ---
    function startTimer(durationInSeconds) {
        let timer = durationInSeconds;
        clearInterval(depositTimer);
        depositTimer = setInterval(() => {
            const minutes = parseInt(timer / 60, 10);
            const seconds = parseInt(timer % 60, 10);
            const displayMinutes = minutes < 10 ? "0" + minutes : minutes;
            const displaySeconds = seconds < 10 ? "0" + seconds : seconds;
            timerDisplay.textContent = `${displayMinutes}:${displaySeconds}`;
            if (--timer < 0) {
                clearInterval(depositTimer);
                timerDisplay.textContent = "Expired!";
                modalFlipper.classList.remove('is-flipped');
            }
        }, 1000);
    }

    // --- Modal Handling ---
    function showModal() {
        modalOverlay.style.display = 'flex';
        modalFlipper.classList.remove('is-flipped');
        clearInterval(depositTimer);
    }
    function hideModal() {
        modalOverlay.style.display = 'none';
        clearInterval(depositTimer);
    }

    newDepositBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    backToDepositBtn.addEventListener('click', () => {
        const userConfirmed = confirm('Are you sure you want to go back? This payment session will be cancelled.');
        if (userConfirmed) {
            modalFlipper.classList.remove('is-flipped');
            clearInterval(depositTimer);
        }
    });
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
        
        if (amount > 200) {
            alert('Maximum deposit amount is 200 EUR.');
            return;
        }
        
        showPaymentDetails(currency, amount);
    });

    // --- Show Payment Details Logic ---
    function showPaymentDetails(currency, amount) {
        const address = fakeAddresses[currency];
        paymentAmountEl.textContent = `€${amount.toFixed(2)}`;
        paymentCurrencyEl.textContent = currency;
        cryptoAddressInput.value = address;
        qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${address}&bgcolor=1a1a29&color=e0e0e0&qzone=1`;
        modalFlipper.classList.add('is-flipped');
        startTimer(60 * 5);
    }

    // --- Copy Address Button ---
    copyAddressBtn.addEventListener('click', () => {
        cryptoAddressInput.select();
        document.execCommand('copy');
        const copySpan = copyAddressBtn.querySelector('span');
        if (copySpan) {
            copySpan.textContent = 'Copied!';
            setTimeout(() => {
                copySpan.textContent = 'Copy';
            }, 2000);
        }
    });

    // --- Initial Load ---
    loadWalletData();
});
