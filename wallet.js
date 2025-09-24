// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

    // --- NEW: Real Wallet Addresses ---
    const realAddresses = {
        BTC: 'bc1qvq4d9a2jv56vwqyh6mfkl4mqh60p6d03anrngl',
        ETH: '0x15a9CC40D777890218f17FE26273144536bFFfd8',
        LTC: 'LLiefmMxiZNv63UgwsAa7zJJ5VqYP1B8F6'
    };

    // --- Main Function to Load Wallet Data ---
    function loadWalletData() {
        if (!loggedInUserEmail) return;
        const walletRef = doc(db, "wallets", loggedInUserEmail);
        onSnapshot(walletRef, (doc) => {
            if (doc.exists()) {
                updateUI(doc.data());
            } else {
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
                        <td class="${amountClass}">${tx.status ? `<span class="status-badge status-${tx.status.toLowerCase()}">${tx.status}</span>` : ''} € ${tx.amount.toFixed(2)}</td>
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
        const submitBtn = depositForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        try {
            const walletRef = doc(db, "wallets", loggedInUserEmail);
            const transactionId = `TX-${Date.now()}`;
            const newTransaction = {
                id: transactionId,
                date: new Date().toISOString().split('T')[0],
                description: `Deposit via ${currency}`,
                amount: amount,
                status: "Pending"
            };
            await updateDoc(walletRef, {
                transactions: arrayUnion(newTransaction)
            });
            showPaymentDetails(currency, amount);
        } catch (error) {
            console.error("Error creating deposit request:", error);
            alert("Could not create deposit request. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create';
        }
    });

    // --- Show Payment Details Logic ---
    function showPaymentDetails(currency, amount) {
        const address = realAddresses[currency];
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
