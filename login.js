// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
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
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.remove('active');
            registerContainer.classList.add('active');
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.remove('active');
            loginContainer.classList.add('active');
        });
    }

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
            if (passwordReqs[key]) {
                passwordReqs[key].classList.toggle('valid', checks[key]);
            }
        });
        return Object.values(checks).every(Boolean);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', () => validatePassword(passwordInput.value));
    }

    // --- Login Logic using Firebase Auth ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginError.textContent = 'Checking...';

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed in successfully
                    sessionStorage.setItem('loggedInUser', userCredential.user.email);
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    // Handle login errors
                    loginError.textContent = 'Invalid email or password.';
                    console.error("Firebase login error:", error.message);
                });
        });
    }

    // --- Registration Logic using Firebase Auth ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            registerError.textContent = 'Processing...';

            if (!validatePassword(password)) {
                registerError.textContent = 'Password does not meet all requirements.';
                return;
            }

            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const userEmail = userCredential.user.email;
                    
                    // Create a new document in the "wallets" collection with the user's email as the ID
                    await setDoc(doc(db, "wallets", userEmail), {
                        balance: 0,
                        transactions: []
                    });

                    alert(`Account for "${userEmail}" created successfully! You can now log in.`);
                    window.location.reload(); // Reload to switch to the login form
                })
                .catch((error) => {
                    // Handle registration errors
                    if (error.code === 'auth/email-already-in-use') {
                        registerError.textContent = 'An account with this email already exists.';
                    } else {
                        registerError.textContent = 'Failed to create account. Please try again.';
                    }
                    console.error("Firebase registration error:", error.message);
                });
        });
    }
});
