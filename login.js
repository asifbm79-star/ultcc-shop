document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_KEY = '$2a$10$JVm0GDFS81IgTuZTZk.UDemdFi9u03aLpEO1spZB6KK8m3xd9/a3.'; 
    const BIN_ID = '68aece44ae596e708fd88790'; 
    const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

    // --- Element References ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    
    const passwordInput = document.getElementById('register-password');
    const passwordReqs = {
        length: document.getElementById('req-length'),
        upper: document.getElementById('req-upper'),
        lower: document.getElementById('req-lower'),
        number: document.getElementById('req-number'),
        special: document.getElementById('req-special'),
    };

    // --- User Database Management (Using localStorage) ---
    async function initUserDB() {
        if (!localStorage.getItem('usersDB')) {
            try {
                const response = await fetch('users.json');
                if (!response.ok) throw new Error('Could not fetch initial user data.');
                const data = await response.json();
                localStorage.setItem('usersDB', JSON.stringify(data.users));
            } catch (error) {
                console.error("Failed to initialize user database:", error);
                localStorage.setItem('usersDB', JSON.stringify([]));
            }
        }
    }
    
    initUserDB();

    function getUsers() {
        return JSON.parse(localStorage.getItem('usersDB')) || [];
    }

    // --- Form Switching ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.remove('active');
        registerContainer.classList.add('active');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.remove('active');
        loginContainer.classList.add('active');
    });

    // --- Password Strength Checker ---
    function validatePassword(password) {
        const checks = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%]/.test(password),
        };
        Object.keys(checks).forEach(key => {
            passwordReqs[key].classList.toggle('valid', checks[key]);
        });
        return Object.values(checks).every(Boolean);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => validatePassword(passwordInput.value));
    }

    // --- Login Logic ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = '';

        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            sessionStorage.setItem('loggedInUser', email);
            window.location.href = 'index.html';
        } else {
            loginError.textContent = 'Invalid email or password.';
        }
    });

    // --- Registration Logic ---
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        registerError.textContent = '';

        if (!validatePassword(password)) {
            registerError.textContent = 'Password does not meet all requirements.';
            return;
        }

        const users = getUsers();

        if (users.some(u => u.email === email)) {
            registerError.textContent = 'An account with this email already exists.';
            return;
        }

        const newUser = { email, password };
        users.push(newUser);
        localStorage.setItem('usersDB', JSON.stringify(users));

        alert(`Account for "${email}" created successfully! You can now log in.`);
        
        registerContainer.classList.remove('active');
        loginContainer.classList.add('active');
        registerForm.reset();
        Object.values(passwordReqs).forEach(el => el.classList.remove('valid'));
    });
});
