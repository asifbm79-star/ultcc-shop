// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-functions.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

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
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    let allCards = [];
    let allPreorderCards = [];

    // --- Element References ---
    const countrySelect = document.getElementById('country-select');
    const binInput = document.getElementById('bin-search');
    const resultsTbody = document.getElementById('card-results-tbody');
    const preorderResultsTbody = document.getElementById('preorder-results-tbody');
    const preorderBtn = document.getElementById('preorder-btn');
    const crateTimerEl = document.getElementById('crate-timer');

    // --- Wait for Firebase Auth to be ready before loading any data ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, now we can load all the page data
            loadCardData();
            loadPreorderData();
            handleFridayCrate();
        } else {
            // This case is handled by script.js, but it's good practice
            window.location.href = 'login.html';
        }
    });

    // --- Main Function to Load Card Data from Firestore ---
    async function loadCardData() {
        try {
            const cardsCol = collection(db, 'cards');
            const cardSnapshot = await getDocs(cardsCol);
            const cardList = cardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allCards = processAndSortCards(cardList);
            renderTable(allCards, resultsTbody);
        } catch (error) {
            console.error("Card Load Error:", error);
            resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Could not load cards.</td></tr>`;
        }
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

    // --- Logic for Sorting and Display ---
    function processAndSortCards(cards) {
        const statusOrder = { 'available': 1, 'sold': 2 };
        const processed = cards.map(card => {
            const button = (card.status === 'available')
                ? `<button class="action-button-small buy-btn" data-doc-id="${card.id}">Buy Now</button>`
                : `<button class="action-button-small sold-btn" disabled>Sold</button>`;
            return { ...card, buttonHTML: button, sortOrder: statusOrder[card.status] || 3 };
        });
        return processed.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // --- Render the Main Results Table ---
    function renderTable(cards, tableBody) {
        tableBody.innerHTML = '';
        if (cards.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No matching cards found.</td></tr>`;
            return;
        }
        cards.forEach(card => {
            const row = `
                <tr>
                    <td>${card.bin}</td>
                    <td><span class="card-brand card-brand-${card.brand.toLowerCase()}">${card.brand}</span></td>
                    <td>${card.level}</td>
                    <td>${card.type}</td>
                    <td>${card.expire}</td>
                    <td>${card.address.city}, ${card.address.country}</td>
                    <td>€ ${card.price.toFixed(2)}</td>
                    <td>${card.buttonHTML}</td>
                </tr>`;
            tableBody.innerHTML += row;
        });
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
                </tr>`;
            preorderResultsTbody.innerHTML += row;
        });
    }

    // --- Add to Cart Logic ---
    resultsTbody.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-btn')) {
            const docId = e.target.getAttribute('data-doc-id');
            const cardData = allCards.find(c => c.id === docId);
            if (cardData) {
                const cartItem = { docId: cardData.id, name: `${cardData.address.country} - ${cardData.brand}`, price: cardData.price };
                let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
                if (!cart.some(item => item.docId === docId)) {
                    cart.push(cartItem);
                    sessionStorage.setItem('cart', JSON.stringify(cart));
                    window.location.href = 'cart.html';
                } else {
                    alert('This item is already in your cart.');
                }
            }
        }
    });

    // --- Pre-Order Button Logic ---
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
                    alert(`Pre-order successful! Order ID: ${result.data.orderId}. Check "My Orders".`);
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

    // --- Filter Logic ---
    const searchData = { "France": { code: "FR" } };
    function populateCountries() {
        Object.keys(searchData).sort().forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    }

    function filterAndRender() {
        const countryFilter = countrySelect.value;
        const binFilter = binInput.value.trim();
        let filteredCards = allCards;

        if (countryFilter && searchData[countryFilter]) {
            const countryCode = searchData[countryFilter].code;
            filteredCards = filteredCards.filter(card => card.address.country === countryCode);
        }
        
        if (binFilter) {
            filteredCards = filteredCards.filter(card => card.bin.startsWith(binFilter));
        }

        renderTable(filteredCards, resultsTbody);
    }
    
    // --- Event Listeners ---
    [binInput, countrySelect].forEach(el => {
        if(el) {
            el.addEventListener('input', filterAndRender);
            el.addEventListener('change', filterAndRender);
        }
    });
    
    // --- Friday Crate Logic ---
    function handleFridayCrate() {
        // ... (This function remains the same)
    }
    
    // Initial population of dropdowns
    populateCountries();
});
