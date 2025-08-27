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
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = 'Checking...';

        try {
            const response = await fetch(`${BIN_URL}/latest`, { 
                headers: { 'X-Master-Key': API_KEY } 
            });
            if (!response.ok) throw new Error('Failed to fetch user data.');
            
            const data = await response.json();
            const users = data.record.users || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                sessionStorage.setItem('loggedInUser', email);
                window.location.href = 'index.html';
            } else {
                loginError.textContent = 'Invalid email or password.';
            }
        } catch (error) {
            console.error('Login Error:', error);
            loginError.textContent = 'Error connecting to the database.';
        }
    });

    // --- Registration Logic ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        registerError.textContent = 'Processing...';

        if (!validatePassword(password)) {
            registerError.textContent = 'Password does not meet all requirements.';
            return;
        }

        try {
            const resGet = await fetch(`${BIN_URL}/latest`, { 
                headers: { 'X-Master-Key': API_KEY } 
            });
            if (!resGet.ok) throw new Error('Could not read the database.');
            
            const data = await resGet.json();
            const users = data.record.users || [];

            if (users.some(u => u.email === email)) {
                registerError.textContent = 'An account with this email already exists.';
                return;
            }

            users.push({ email, password });
            
            const resPut = await fetch(BIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify({ users: users })
            });
            if (!resPut.ok) throw new Error('Could not save new account.');

            // The alert() has been removed. The page will just reload.
            window.location.reload();

        } catch (error) {
            console.error('Registration Error:', error);
            registerError.textContent = 'Failed to create account.';
        }
    });
});
