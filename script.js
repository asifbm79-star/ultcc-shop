// This script is shared across all protected pages (index.html, cc_checker.html, etc.).
document.addEventListener('DOMContentLoaded', function() {
    
    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');

    // --- Primary Security Check ---
    // Redirects to login page if no user session is found.
    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return; 
    }

    // --- Element References ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('close-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const notificationBtn = document.getElementById('notification-btn');
    const notificationPanel = document.getElementById('notification-panel');

    // --- Sidebar Menu Functionality ---
    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
    }
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // --- Notification Panel Logic ---
    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the window click from firing immediately
            if (notificationPanel) notificationPanel.classList.toggle('active');
        });
    }
    // Close panel if clicking anywhere else on the page
    window.addEventListener('click', () => {
        if (notificationPanel && notificationPanel.classList.contains('active')) {
            notificationPanel.classList.remove('active');
        }
    });
    // Prevent panel from closing when clicking inside it
    if (notificationPanel) {
        notificationPanel.addEventListener('click', (e) => e.stopPropagation());
    }

    // --- Logout Button Functionality ---
    const headerRight = document.querySelector('.header-right');
    if(headerRight) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        };
        headerRight.appendChild(logoutBtn);
    }
});