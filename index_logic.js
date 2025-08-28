// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
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
    let allCards = [];
    let allPreorderCards = [];

    // --- Element References ---
    const resultsTbody = document.getElementById('card-results-tbody');
    const preorderResultsTbody = document.getElementById('preorder-results-tbody');
    // ... (other element references)

    // --- Main Function to Load Card Data ---
    async function loadCardData() {
        // ... (This function remains the same)
    }

    // --- Function to Load Pre-Order Card Data ---
    async function loadPreorderData() {
        try {
            const preorderCol = collection(db, 'preorder_cards');
            const preorderSnapshot = await getDocs(preorderCol);
            const preorderList = preorderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allPreorderCards = preorderList;
            renderPreorderTable(allPreorderCards);
        } catch (error) {
            console.error("Pre-order Card Load Error:", error);
            preorderResultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Could not load pre-order stock.</td></tr>`;
        }
    }

    // --- Render the Pre-Order Table ---
    function renderPreorderTable(cards) {
        preorderResultsTbody.innerHTML = '';
        cards.forEach(card => {
            const button = (card.status === 'available')
                ? `<button class="action-button-small preorder-btn" data-doc-id="${card.id}">Pre-Order</button>`
                : `<button class="action-button-small sold-btn" disabled>Booked</button>`;
            const row = `
                <tr>
                    <td>${card.bin}</td>
                    <td><span class="card-brand card-brand-${card.brand.toLowerCase()}">${card.brand}</span></td>
                    <td>${card.level}</td>
                    <td>${card.type}</td>
                    <td>${card.expire}</td>
                    <td>${card.address.city}, ${card.address.country}</td>
                    <td>€ ${card.price.toFixed(2)}</td>
                    <td>${button}</td>
                </tr>
            `;
            preorderResultsTbody.innerHTML += row;
        });
    }

    // --- NEW: Pre-Order Button Logic ---
    preorderResultsTbody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('preorder-btn')) {
            const button = e.target;
            const docId = button.getAttribute('data-doc-id');
            const cardData = allPreorderCards.find(c => c.id === docId);

            if (!cardData) return;

            button.disabled = true;
            button.textContent = 'Booking...';

            try {
                const processPreOrder = httpsCallable(functions, 'processPreOrder');
                const result = await processPreOrder({ card: cardData });

                if (result.data.success) {
                    alert(`Pre-order successful! Your Order ID is: ${result.data.orderId}. Check "My Orders".`);
                    button.textContent = 'Booked';
                    button.classList.remove('preorder-btn');
                    button.classList.add('sold-btn');
                }
            } catch (error) {
                console.error("Pre-order Error:", error);
                if (error.message.includes("Insufficient balance")) {
                    alert("Pre-order failed: Insufficient balance.");
                    setTimeout(() => { window.location.href = 'wallet.html'; }, 1000);
                } else {
                    alert(`Pre-order failed: ${error.message}`);
                }
                button.disabled = false;
                button.textContent = 'Pre-Order';
            }
        }
    });

    // ... (rest of the file, including loadCardData, renderTable, add to cart, filters, etc., remains the same)
    
    // --- Initial Load ---
    loadCardData();
    loadPreorderData();
    // ... (Friday Crate logic remains the same)
});
