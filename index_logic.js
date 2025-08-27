document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.';
    const CARDS_BIN_ID = 'PASTE_YOUR_CARDS_BIN_ID_HERE';
    const CARDS_BIN_URL = `https://api.jsonbin.io/v3/b/${CARDS_BIN_ID}`;

    let allCards = [];

    // --- Element References ---
    const countrySelect = document.getElementById('country-select');
    const binInput = document.getElementById('bin-search');
    const resultsTbody = document.getElementById('card-results-tbody');

    // --- Main Function to Load Card Data ---
    async function loadCardData() {
        try {
            const response = await fetch(`${CARDS_BIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } });
            if (!response.ok) throw new Error('Failed to fetch card data.');
            const data = await response.json();
            
            // Process cards with new logic
            allCards = processCards(data.record.cards || []);
            
            renderTable(allCards);
        } catch (error) {
            console.error("Card Load Error:", error);
            resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Could not load cards.</td></tr>`;
        }
    }

    // --- New Logic for Pricing and Status ---
    function processCards(cards) {
        const totalCards = cards.length;
        const sixtyPercent = Math.floor(totalCards * 0.6);
        const twentyPercent = Math.floor(totalCards * 0.2);

        return cards.map((card, index) => {
            let price, status, button;
            
            // Assign price
            if (index < sixtyPercent) {
                price = parseFloat((Math.random() * (2 - 1) + 1).toFixed(2)); // 1-2 EUR
            } else {
                price = parseFloat((Math.random() * (5 - 2) + 2).toFixed(2)); // 2-5 EUR
            }

            // Assign status
            if (index < totalCards * 0.6) { // 60% Buy Now
                status = 'buy';
                button = `<button class="action-button-small buy-btn" data-bin="${card.bin}">Buy Now</button>`;
            } else if (index < totalCards * 0.8) { // 20% Pre-Order
                status = 'preorder';
                button = `<button class="action-button-small preorder-btn" disabled>Pre-Order</button>`;
            } else { // 20% Buy Instantly
                status = 'instant';
                button = `<button class="action-button-small buy-btn instant-btn" data-bin="${card.bin}">Buy Instantly</button>`;
            }
            
            return { ...card, price, status, buttonHTML: button };
        });
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
    resultsTbody.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-btn')) {
            const bin = e.target.getAttribute('data-bin');
            const cardData = allCards.find(c => c.bin === bin);
            
            if (cardData) {
                const cartItem = {
                    bin: cardData.bin,
                    name: `${cardData.address.country} - ${cardData.brand} - ${cardData.level}`,
                    price: cardData.price
                };
                
                let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
                // Prevent adding duplicates
                if (!cart.some(item => item.bin === bin)) {
                    cart.push(cartItem);
                    sessionStorage.setItem('cart', JSON.stringify(cart));
                    window.location.href = 'cart.html';
                } else {
                    alert('This item is already in your cart.');
                }
            }
        }
    });

    // --- Filter Logic (remains the same) ---
    function filterAndRender() {
        const binFilter = binInput.value.trim();
        let filteredCards = allCards;
        if (binFilter) {
            filteredCards = filteredCards.filter(card => card.bin.startsWith(binFilter));
        }
        renderTable(filteredCards);
    }
    binInput.addEventListener('input', filterAndRender);
    
    // --- Initial Load ---
    loadCardData();
});
