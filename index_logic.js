document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.';
    const CARDS_BIN_ID = '68aefc0943b1c97be92d23b7';
    const WALLET_BIN_ID = '68aedadf43b1c97be92ce2b7';
    const CARDS_BIN_URL = `https://api.jsonbin.io/v3/b/${CARDS_BIN_ID}`;
    const WALLET_BIN_URL = `https://api.jsonbin.io/v3/b/${WALLET_BIN_ID}`;

    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');
    let allCards = []; // This will store the processed and sorted list of all cards

    // --- Element References ---
    const countrySelect = document.getElementById('country-select');
    const bankSelect = document.getElementById('bank-select');
    const zipSelect = document.getElementById('zip-select');
    const binInput = document.getElementById('bin-search');
    const resultsTbody = document.getElementById('card-results-tbody');
    const preorderBtn = document.getElementById('preorder-btn');
    const crateTimerEl = document.getElementById('crate-timer');

    // --- Data for Search Filters with Correct Country Codes ---
    const searchData = {
        "United States": { code: "USA", banks: ["Chase Bank", "Bank of America", "Wells Fargo", "Citibank", "U.S. Bank", "PNC Bank", "Capital One", "TD Bank", "American Express", "Discover Bank", "Navy Federal Credit Union", "Ally Bank", "SunTrust Bank", "BB&T", "HSBC Bank USA"], zips: ["90210", "10001", "60601", "33109", "75201", "94102"] },
        "United Kingdom": { code: "UK", banks: ["HSBC", "Lloyds Bank", "Barclays", "NatWest", "Santander UK", "Standard Chartered", "Nationwide Building Society", "Royal Bank of Scotland", "Monzo", "Revolut", "Starling Bank", "The Co-operative Bank", "Virgin Money", "Metro Bank", "TSB Bank"], zips: ["SW1A 0AA", "W1A 1AA", "EC1A 1BB", "M1 1AE", "B1 1BB", "G1 1AA"] },
        "Canada": { code: "Canada", banks: ["Royal Bank of Canada (RBC)", "Toronto-Dominion Bank (TD)", "Scotiabank", "Bank of Montreal (BMO)", "Canadian Imperial Bank of Commerce (CIBC)", "National Bank of Canada", "Desjardins Group", "HSBC Bank Canada", "Tangerine Bank", "Simplii Financial", "Manulife Bank", "ATB Financial", "Vancity", "EQ Bank", "Laurentian Bank"], zips: ["M5H 2N2", "V6C 3L6", "H3B 4G7", "T2P 5E6", "K1A 0B1", "G1R 4P8"] },
        "Australia": { code: "Australia", banks: ["Commonwealth Bank", "Westpac", "ANZ Bank", "National Australia Bank (NAB)", "Macquarie Bank", "ING Australia", "Suncorp Bank", "Bank of Queensland", "Bendigo and Adelaide Bank", "AMP Bank", "ME Bank", "Up Bank", "HSBC Australia", "Citibank Australia", "Bankwest"], zips: ["2000", "3000", "4000", "6000", "5000", "2600"] },
        "Germany": { code: "Germany", banks: ["Deutsche Bank", "Commerzbank", "KfW Bankengruppe", "DZ Bank", "HypoVereinsbank (UniCredit)", "Landesbank Baden-Württemberg", "BayernLB", "N26", "ING-DiBa", "Postbank", "DekaBank", "Helaba", "Norddeutsche Landesbank", "Comdirect Bank", "DKB"], zips: ["10117", "20095", "80331", "60311", "40213", "50667"] },
        "France": { code: "France", banks: ["BNP Paribas", "Crédit Agricole", "Société Générale", "Groupe BPCE", "Crédit Mutuel", "La Banque Postale", "HSBC France", "Boursorama", "ING France", "Fortuneo Banque", "AXA Banque", "CIC", "LCL", "Hello bank!", "BforBank"], zips: ["75001", "69001", "13001", "31000", "59000", "33000"] },
        "India": { code: "India", banks: ["State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank (PNB)", "Bank of Baroda", "Canara Bank", "Union Bank of India", "IDBI Bank", "IndusInd Bank", "Yes Bank", "Federal Bank", "RBL Bank", "Bandhan Bank"], zips: ["110001", "400001", "700001", "560001", "600001", "500001"] },
        "Brazil": { code: "Brazil", banks: ["Itaú Unibanco", "Banco do Brasil", "Bradesco", "Caixa Econômica Federal", "Santander Brasil", "BTG Pactual", "Banco Safra", "Nubank", "Banco Inter", "XP Inc.", "Sicoob", "Sicredi", "Banco Votorantim", "Banrisul", "Banco Original"], zips: ["01000-000", "20000-000", "70000-000", "40000-000", "50000-000", "30000-000"] },
        "Japan": { code: "Japan", banks: ["Mitsubishi UFJ Financial Group (MUFG)", "Sumitomo Mitsui Financial Group (SMBC)", "Mizuho Financial Group", "Japan Post Bank", "Nomura Holdings", "Resona Holdings", "Shinsei Bank", "Aozora Bank", "Rakuten Bank", "Sony Bank", "Aeon Bank", "Seven Bank", "SBI Sumishin Net Bank", "PayPay Bank", "GMO Aozora Net Bank"], zips: ["100-0001", "530-0001", "450-0002", "810-0001", "060-0001", "980-0021"] },
        "Russia": { code: "Russia", banks: ["Sberbank", "VTB Bank", "Gazprombank", "Alfa-Bank", "Rosselkhozbank", "Credit Bank of Moscow", "Tinkoff Bank", "Otkritie FC Bank", "Promsvyazbank", "Sovcombank", "Raiffeisenbank Russia", "Rosbank", "UniCredit Bank Russia", "Ak Bars Bank", "Bank Saint Petersburg"], zips: ["101000", "190000", "620014", "603000", "420111", "630099"] },
        "South Africa": { code: "South Africa", banks: ["Standard Bank", "First National Bank (FNB)", "Absa Group", "Nedbank", "Capitec Bank", "Investec", "African Bank", "TymeBank", "Discovery Bank", "Bidvest Bank", "Sasfin Bank", "Mercantile Bank", "Grindrod Bank", "Ubank", "Postbank"], zips: ["0001", "2001", "8001", "4001", "1201", "6001"] },
        "Nigeria": { code: "Nigeria", banks: ["Access Bank", "Zenith Bank", "Guaranty Trust Bank (GTB)", "United Bank for Africa (UBA)", "First Bank of Nigeria", "Ecobank Nigeria", "Fidelity Bank", "Stanbic IBTC Bank", "Union Bank of Nigeria", "Sterling Bank", "Wema Bank", "Kuda Bank", "Opay", "PalmPay", "First City Monument Bank (FCMB)"], zips: ["100001", "900001", "500001", "200001", "300001", "101241"] },
        "Mexico": { code: "Mexico", banks: ["BBVA México", "Santander México", "Banorte", "Citibanamex", "HSBC México", "Scotiabank México", "Inbursa", "BanBajío", "Hey Banco", "Banco Azteca", "BanCoppel", "Compartamos Banco", "Actinver", "Multiva", "Afirme"], zips: ["06000", "44100", "64000", "72000", "22000", "97000"] },
        "Indonesia": { code: "Indonesia", banks: ["Bank Mandiri", "Bank Rakyat Indonesia (BRI)", "Bank Central Asia (BCA)", "Bank Negara Indonesia (BNI)", "CIMB Niaga", "Bank Danamon", "Panin Bank", "OCBC NISP", "Permata Bank", "Bank Tabungan Negara (BTN)", "Jago", "SeaBank", "Bank Syariah Indonesia (BSI)", "Maybank Indonesia", "UOB Indonesia"], zips: ["10110", "40115", "60174", "50131", "20111", "90174"] },
        "Turkey": { code: "Turkey", banks: ["Ziraat Bankası", "Garanti BBVA", "Akbank", "İş Bankası", "Yapı Kredi", "Halkbank", "VakıfBank", "DenizBank", "QNB Finansbank", "TEB", "Odeabank", "Fibabanka", "Şekerbank", "Alternatif Bank", "Anadolubank"], zips: ["34000", "06000", "35000", "16000", "01000", "07000"] }
    };

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
    
    // --- CORRECTED Logic for Pricing, Status, and Sorting ---
    function processAndSortCards(cards) {
        // 1. Shuffle the array to randomize the cards
        const shuffled = [...cards].sort(() => 0.5 - Math.random());
        const totalCards = shuffled.length;
        const instantCount = Math.floor(totalCards * 0.2);
        const preorderCount = Math.floor(totalCards * 0.2);

        // 2. Assign status and price based on the shuffled order
        const processed = shuffled.map((card, index) => {
            let price, status, button, sortOrder;
            
            if (index < instantCount) {
                status = 'instant'; sortOrder = 1;
                button = `<button class="action-button-small buy-btn instant-btn" data-bin="${card.bin}">Buy Instantly</button>`;
            } else if (index < instantCount + preorderCount) {
                status = 'preorder'; sortOrder = 2;
                button = `<button class="action-button-small preorder-btn" disabled>Pre-Order</button>`;
            } else {
                status = 'sold'; sortOrder = 3;
                button = `<button class="action-button-small sold-btn" disabled>Sold</button>`;
            }

            price = (status === 'sold') 
                ? parseFloat((Math.random() * (2 - 1) + 1).toFixed(2)) // 1-2 EUR for sold
                : parseFloat((Math.random() * (5 - 2) + 2).toFixed(2)); // 2-5 EUR for others
            
            return { ...card, price, status, buttonHTML: button, sortOrder };
        });

        // 3. Sort the array for final display order
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
    
    // --- CORRECTED Filter Logic ---
    function populateCountries() { Object.keys(searchData).sort().forEach(country => { const option = document.createElement('option'); option.value = country; option.textContent = country; countrySelect.appendChild(option); }); }
    
    function filterAndRender() {
        const countryFilter = countrySelect.value;
        const binFilter = binInput.value.trim();
        let filteredCards = allCards;

        // Filter by Country
        if (countryFilter && searchData[countryFilter]) {
            const countryCode = searchData[countryFilter].code;
            filteredCards = filteredCards.filter(card => card.address.country === countryCode);
        }
        
        // Filter by BIN
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
