document.addEventListener('DOMContentLoaded', function() {
    const loggedInUserEmail = sessionStorage.getItem('loggedInUser');
    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return; 
    }

    // --- Element References ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('close-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

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
