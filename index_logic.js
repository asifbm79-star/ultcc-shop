// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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
    let allCards = [];

    // --- Element References ---
    const countrySelect = document.getElementById('country-select');
    const binInput = document.getElementById('bin-search');
    const resultsTbody = document.getElementById('card-results-tbody');
    const preorderBtn = document.getElementById('preorder-btn');
    const crateTimerEl = document.getElementById('crate-timer');

    // --- Main Function to Load Card Data from Firestore ---
    async function loadCardData() {
        try {
            const cardsCol = collection(db, 'cards');
            const cardSnapshot = await getDocs(cardsCol);
            // Get both data and the document ID for each card
            const cardList = cardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            allCards = processAndSortCards(cardList);
            renderTable(allCards);
        } catch (error) {
            console.error("Card Load Error:", error);
            resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Could not load cards. Check security rules.</td></tr>`;
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

    // --- Render the Results Table ---
    function renderTable(cards) {
        resultsTbody.innerHTML = '';
        if (cards.length === 0) {
            resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No matching cards found.</td></tr>`;
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
                    <td>${card.address.city}, ${card.address.state}, ${card.address.country}</td>
                    <td>€ ${card.price.toFixed(2)}</td>
                    <td>${card.buttonHTML}</td>
                </tr>
            `;
            resultsTbody.innerHTML += row;
        });
    }
    
    // --- Add to Cart Logic ---
    if (resultsTbody) {
        resultsTbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-btn')) {
                const docId = e.target.getAttribute('data-doc-id');
                const cardData = allCards.find(c => c.id === docId);
                if (cardData) {
                    const cartItem = {
                        docId: cardData.id,
                        name: `${cardData.address.country} - ${cardData.brand} - ${cardData.level}`,
                        price: cardData.price
                    };
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
    }
    
    // --- Filter Logic ---
    // (This section remains the same, it is for UI only)
    
    // --- Initial Load ---
    loadCardData();
    // ... (Friday Crate logic remains the same)
});
