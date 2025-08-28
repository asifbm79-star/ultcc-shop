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
    let allCards = []; // This will store the master list of all cards from the database

    // --- Element References ---
    const countrySelect = document.getElementById('country-select');
    const bankSelect = document.getElementById('bank-select');
    const zipSelect = document.getElementById('zip-select');
    const binInput = document.getElementById('bin-search');
    const resultsTbody = document.getElementById('card-results-tbody');
    
    // --- Main Function to Load Card Data from Firestore ---
    async function loadCardData() {
        try {
            const cardsCol = collection(db, 'cards');
            const cardSnapshot = await getDocs(cardsCol);
            // Map over the documents to get the data and the unique document ID for each card
            const cardList = cardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Process and sort the cards to show available ones first
            allCards = processAndSortCards(cardList);
            // Display the sorted cards in the table
            renderTable(allCards);
        } catch (error) {
            console.error("Card Load Error:", error);
            resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Could not load cards. Please check security rules.</td></tr>`;
        }
    }
    // --- NEW: Function to Load Pre-Order Card Data ---
async function loadPreorderData() {
    try {
        const preorderCol = collection(db, 'preorder_cards');
        const preorderSnapshot = await getDocs(preorderCol);
        const preorderList = preorderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        allPreorderCards = preorderList; // No complex sorting needed for this list
        renderPreorderTable(allPreorderCards);
    } catch (error) {
        console.error("Pre-order Card Load Error:", error);
        preorderResultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Could not load pre-order stock.</td></tr>`;
    }
}

// --- NEW: Function to Render the Pre-Order Table ---
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
                <td>${card.address.city}, ${card.address.state}, ${card.address.country}</td>
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
    
    // --- Logic for Sorting and Display ---
    function processAndSortCards(cards) {
        // Define the sort order: 'available' items are more important than 'sold' items
        const statusOrder = { 'available': 1, 'sold': 2 };

        const processed = cards.map(card => {
            // Create the correct button based on the card's status from the database
            const button = (card.status === 'available')
                ? `<button class="action-button-small buy-btn" data-doc-id="${card.id}">Buy Now</button>`
                : `<button class="action-button-small sold-btn" disabled>Sold</button>`;
        
            // Return a new object for each card with the button HTML and a sort order value
            return { ...card, buttonHTML: button, sortOrder: statusOrder[card.status] || 3 };
        });

        // Sort the entire list based on the sortOrder value
        return processed.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // --- Function to Render the Results Table ---
    function renderTable(cards) {
        resultsTbody.innerHTML = ''; // Clear any previous content
        if (cards.length === 0) {
            resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No matching cards found.</td></tr>`;
            return;
        }
        // Create an HTML table row for each card and add it to the table
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
            // Check if a "Buy Now" button was clicked
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
                    // Prevent adding the same item to the cart twice
                    if (!cart.some(item => item.docId === docId)) {
                        cart.push(cartItem);
                        sessionStorage.setItem('cart', JSON.stringify(cart));
                        window.location.href = 'cart.html'; // Redirect to the cart page
                    } else {
                        alert('This item is already in your cart.');
                    }
                }
            }
        });
    }
    
    // --- Filter Logic ---
    const searchData = { "France": { code: "FR" } }; // Simplified for the current card stock
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

        // Filter the master list based on the selected country
        if (countryFilter && searchData[countryFilter]) {
            const countryCode = searchData[countryFilter].code;
            filteredCards = filteredCards.filter(card => card.address.country === countryCode);
        }
        
        // Further filter the list based on the BIN input
        if (binFilter) {
            filteredCards = filteredCards.filter(card => card.bin.startsWith(binFilter));
        }

        // Re-render the table with the filtered results
        renderTable(filteredCards);
    }
    
    // --- Event Listeners ---
    [binInput, countrySelect].forEach(el => {
        if(el) {
            el.addEventListener('input', filterAndRender);
            el.addEventListener('change', filterAndRender);
        }
    });
    
    // --- Initial Load ---
    populateCountries();
    loadCardData();
});
