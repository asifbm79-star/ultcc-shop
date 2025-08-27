// This script is shared across all protected pages (index.html, cc_checker.html, etc.).
// It is NOT used by login.html or home.html.

document.addEventListener('DOMContentLoaded', function() {
    
    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');

    // --- Primary Security Check ---
    // This is the most important part. It checks if a user session exists.
    // If no 'loggedInUser' is found in sessionStorage, it immediately
    // redirects the user back to the login page, preventing unauthorized access.
    if (!loggedInUserEmail) {
        // Redirect to the login page because the user is not authenticated.
        window.location.href = 'login.html';
        // Stop the rest of the script from running to prevent errors.
        return; 
    }

    // --- Sidebar Menu Functionality ---
    // Get all necessary elements from the DOM for the sidebar menu.
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('close-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    // Function to open the sidebar by adding the 'open' class to the elements.
    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
    }

    // Function to close the sidebar by removing the 'open' class.
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    // Attach event listeners to the buttons and the overlay to trigger the functions.
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // --- Welcome Message & Logout Button ---
    // Find the placeholder element in the header for the welcome message and logout button.
    const headerRight = document.querySelector('.header-right');
    
    if (headerRight) {
        // Create a welcome message element.
        const welcomeEl = document.createElement('span');
        welcomeEl.id = 'welcome-message';
        welcomeEl.textContent = `Welcome, ${loggedInUserEmail}`;
        headerRight.appendChild(welcomeEl);

        // Dynamically create the logout button.
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = 'Logout';
        
        // When the logout button is clicked:
        logoutBtn.onclick = () => {
            sessionStorage.removeItem('loggedInUser'); // 1. Clear the user session.
            window.location.href = 'login.html';      // 2. Redirect back to the login page.
        };
        
        // Add the newly created button to the header.
        headerRight.appendChild(logoutBtn);
    }
});
