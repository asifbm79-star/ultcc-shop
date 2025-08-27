document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.';
    const CARDS_BIN_ID = '68aefc0943b1c97be92d23b7';
    const WALLET_BIN_ID = '68aece44ae596e708fd88790';
    const CARDS_BIN_URL = `https://api.jsonbin.io/v3/b/${CARDS_BIN_ID}`;
    const WALLET_BIN_URL = `https://api.jsonbin.io/v3/b/${WALLET_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');
    let allCards = [];

    // --- Element References ---
    const countrySelect = document.getElementById('country-select');
    const bankSelect = document.getElementById('bank-select');
    const zipSelect = document.getElementById('zip-select');
    const binInput = document.getElementById('bin-search');
    const resultsTbody = document.getElementById('card-results-tbody');
    const preorderBtn = document.getElementById('preorder-btn');
    const crateTimerEl = document.getElementById('crate-timer');

    // --- Friday Crate Logic (remains the same) ---
    function isFridayInEurope() {
        const now = new Date();
        const options = { timeZone: 'Europe/Berlin', weekday: 'long' };
        return new Intl.DateTimeFormat('en-US', options).format(now) === 'Friday';
    }

    function handleFridayCrate() {
        if (isFridayInEurope()) {
            preorderBtn.disabled = false;
            preorderBtn.textContent = 'Pre-Order Now';
            crateTimerEl.textContent = 'Available today only!';
        } else {
            preorderBtn.disabled = true;
            preorderBtn.textContent = 'Available on Friday';
            crateTimerEl.textContent = 'Check back soon for this exclusive offer.';
        }
    }

    if (preorderBtn) {
        preorderBtn.addEventListener('click', async () => {
            const crateCost = 65;
            preorderBtn.disabled = true;
            preorderBtn.textContent = 'Checking Balance...';
            try {
                const response = await fetch(`${WALLET_BIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } });
                if (!response.ok) throw new Error('Could not connect to wallet.');
                const data = await response.json();
                const userWallet = data.record.wallets.find(w => w.email === loggedInUserEmail);
                if (userWallet && userWallet.balance >= crateCost) {
                    preorderBtn.textContent = 'Pre-Order Confirmed!';
                    preorderBtn.classList.add('instant-btn');
                    alert('Success! Your pre-order for the Friday Crate is confirmed.');
                } else {
                    preorderBtn.textContent = 'Insufficient Balance!';
                    preorderBtn.classList.add('preorder-btn');
                    alert('You have insufficient balance to pre-order this crate.');
                    setTimeout(() => { window.location.href = 'wallet.html'; }, 1000);
                }
            } catch (error) {
                console.error('Pre-order error:', error);
                alert('Could not verify your wallet balance. Please try again.');
                preorderBtn.disabled = false;
                preorderBtn.textContent = 'Pre-Order Now';
            }
        });
    }

    // --- Main Function to Load Card Data ---
    async function loadCardData() {
        try {
            const response = await fetch(`${CARDS_BIN_URL}/latest`, { headers: { 'X-Master-Key': API_KEY } });
            if (!response.ok) throw new Error('Failed to fetch card data.');
            const data = await response.json();
            allCards = processAndSortCards(data.record.cards || []);
            renderTable(allCards);
        } catch (error) {
            console.error("Card Load Error:", error);
            resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Could not load cards.</td></tr>`;
        }
    }
    
    // --- NEW Logic for Pricing, Status, and Sorting ---
    function processAndSortCards(cards) {
        const totalCards = cards.length;
        const statusOrder = { 'instant': 1, 'preorder': 2, 'sold': 3 };

        const processed = cards.map((card, index) => {
            let price, status, button, sortOrder;
            
            if (index < totalCards * 0.2) { // 20% Buy Instantly
                status = 'instant';
                sortOrder = 1;
                button = `<button class="action-button-small buy-btn instant-btn" data-bin="${card.bin}">Buy Instantly</button>`;
            } else if (index < totalCards * 0.4) { // 20% Pre-Order
                status = 'preorder';
                sortOrder = 2;
                button = `<button class="action-button-small preorder-btn" disabled>Pre-Order</button>`;
            } else { // 60% Sold
                status = 'sold';
                sortOrder = 3;
                button = `<button class="action-button-small sold-btn" disabled>Sold</button>`;
            }

            if (status === 'sold') {
                price = parseFloat((Math.random() * (2 - 1) + 1).toFixed(2));
            } else {
                price = parseFloat((Math.random() * (5 - 2) + 2).toFixed(2));
            }
            
            return { ...card, price, status, buttonHTML: button, sortOrder };
        });

        // Sort the array based on the new sortOrder property
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
                const bin = e.target.getAttribute('data-bin');
                const cardData = allCards.find(c => c.bin === bin);
                if (cardData) {
                    const cartItem = {
                        bin: cardData.bin,
                        name: `${cardData.address.country} - ${cardData.brand} - ${cardData.level}`,
                        price: cardData.price
                    };
                    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
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
    }
    
    // --- Filter Logic ---
    const searchData = { "United States": { code: "USA", banks: ["Chase Bank", "Bank of America"], zips: ["90210", "10001"] }, "United Kingdom": { code: "UK", banks: ["HSBC", "Barclays"], zips: ["SW1A 0AA", "W1A 1AA"] }, "Canada": { code: "Canada", banks: ["RBC", "TD"], zips: ["M5H 2N2", "V6C 3L6"] } /* ... add more mappings ... */ };
    function populateCountries() { Object.keys(searchData).sort().forEach(country => { const option = document.createElement('option'); option.value = country; option.textContent = country; countrySelect.appendChild(option); }); }
    
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

        renderTable(filteredCards);
    }
    
    // --- Event Listeners ---
    [binInput, countrySelect, bankSelect, zipSelect].forEach(el => {
        if(el) {
            el.addEventListener('input', filterAndRender);
            el.addEventListener('change', filterAndRender);
        }
    });
    
    // --- Initial Load ---
    populateCountries();
    loadCardData();
    handleFridayCrate();
});
