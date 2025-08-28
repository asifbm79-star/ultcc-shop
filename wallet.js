// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
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
const db = getFirestore(app);
const functions = getFunctions(app);

document.addEventListener('DOMContentLoaded', () => {
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

    // --- Main Function to Load Wallet Data (Real-time from Firestore) ---
    function loadWalletData() {
        if (!loggedInUserEmail) return;

        const walletRef = doc(db, "wallets", loggedInUserEmail);
        
        onSnapshot(walletRef, (doc) => {
            if (doc.exists()) {
                updateUI(doc.data());
            } else {
                console.log("No wallet found for user! This should not happen if registration is correct.");
                updateUI({ balance: 0, transactions: [] });
            }
        }, (error) => {
            console.error("Wallet Load Error:", error);
            balanceAmountEl.textContent = 'Error';
            transactionsTableBody.innerHTML = `<tr><td colspan="4">Could not load transaction history.</td></tr>`;
        });
    }

    // --- Function to Update the UI ---
    function updateUI(wallet) {
        balanceAmountEl.textContent = `€ ${wallet.balance.toFixed(2)}`;
        transactionsTableBody.innerHTML = '';
        if (!wallet.transactions || wallet.transactions.length === 0) {
            transactionsTableBody.innerHTML = `<tr><td colspan="4">No transactions found.</td></tr>`;
        } else {
            wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            wallet.transactions.forEach(tx => {
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
    depositForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const currency = document.getElementById('crypto-select').value;
        
        if (amount > 200) {
            alert('Maximum deposit amount is 200 EUR.');
            return;
        }
        
        const createDeposit = httpsCallable(functions, 'createDepositRequest');
        
        try {
            const submitBtn = depositForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            const result = await createDeposit({ amount: amount, currency: currency });

            if (result.data.success) {
                showPaymentDetails(currency, amount);
            } else {
                alert('Error: ' + result.data.error);
            }
        } catch (error) {
            console.error("Error calling Firebase Function:", error);
            alert('Could not create deposit request. The backend function may not be deployed yet.');
        } finally {
            const submitBtn = depositForm.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create';
        }
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