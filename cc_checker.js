document.addEventListener('DOMContentLoaded', () => {
    const cardInput = document.getElementById('card-input');
    const checkCardsBtn = document.getElementById('check-cards-btn');
    const approvedBox = document.querySelector('#approved-cards pre');
    const declinedBox = document.querySelector('#declined-cards pre');
    const approvedTitle = document.querySelector('#approved-cards h4');
    const declinedTitle = document.querySelector('#declined-cards h4');

    checkCardsBtn.addEventListener('click', () => {
        const cards = cardInput.value.trim().split('\n').filter(line => line.length > 0);
        if (cards.length === 0) {
            alert('Please enter at least one card to check.');
            return;
        }

        // Reset UI
        approvedBox.textContent = '';
        declinedBox.textContent = '';
        approvedTitle.textContent = 'Approved';
        declinedTitle.textContent = 'Declined';
        checkCardsBtn.disabled = true;
        checkCardsBtn.textContent = 'Checking...';

        let approvedCount = 0;
        let declinedCount = 0;
        let processedCount = 0;

        cards.forEach((card, index) => {
            // Simulate network delay for each card check
            setTimeout(() => {
                const isApproved = Math.random() < 0.5; // 50% chance of approval

                if (isApproved) {
                    approvedCount++;
                    approvedBox.textContent += card + '\n';
                    approvedTitle.textContent = `Approved (${approvedCount})`;
                } else {
                    declinedCount++;
                    declinedBox.textContent += card + '\n';
                    declinedTitle.textContent = `Declined (${declinedCount})`;
                }

                processedCount++;
                // Re-enable button when all cards are processed
                if (processedCount === cards.length) {
                    checkCardsBtn.disabled = false;
                    checkCardsBtn.textContent = 'Check Cards';
                }

            }, index * 500); // Stagger each check by 500ms
        });
    });
});
