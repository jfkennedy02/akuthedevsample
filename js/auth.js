import { auth, db } from './firebase-config.js';
import { Country, State } from 'country-state-city';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// UI Elements
console.log("Auth script loaded and initializing...");
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const toggleBtn = document.getElementById('toggle-auth');
const toggleText = document.getElementById('auth-toggle-text');
const submitBtn = authForm.querySelector('button[type="submit"]');

// Recovery Modal Elements
const recoveryModal = document.getElementById('recovery-modal');
const forgotPasswordLink = document.getElementById('forgot-password');
const closeRecoveryBtn = document.getElementById('close-recovery');
const recoveryForm = document.getElementById('recovery-form');
const recoveryEmailInput = document.getElementById('recovery-email');
const recoveryMessage = document.getElementById('recovery-message');
const loginExtras = document.getElementById('login-extras');

// Registration Selects
const countrySelect = document.getElementById('country');
const stateSelect = document.getElementById('state');

// Signup Fields
const signupFieldsDiv = document.getElementById('signup-fields');
const signupInputs = signupFieldsDiv.querySelectorAll('input, select');

let isLogin = true;

// 1. Monitor Auth State
let activeRegistration = false;
onAuthStateChanged(auth, (user) => {
    if (user && !activeRegistration) {
        checkAdminAndRedirect(user);
    }
});

// 2. Toggle Login/Register
toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;

    if (isLogin) {
        document.querySelector('h2').textContent = 'Welcome Back';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = 'Create Account';
        loginExtras.style.display = 'block';

        // Hide and disable required
        signupFieldsDiv.style.display = 'none';
        signupInputs.forEach(input => input.required = false);
    } else {
        document.querySelector('h2').textContent = 'Create Account';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleBtn.textContent = 'Sign In';
        loginExtras.style.display = 'none';

        // Show and enable required
        signupFieldsDiv.style.display = 'block';
        signupInputs.forEach(input => input.required = true);
    }
    errorMessage.style.display = 'none';
});

// 2.1 Password Recovery Modal Logic
forgotPasswordLink.addEventListener('click', (e) => {
    console.log("Forgot Password link clicked");
    e.preventDefault();
    recoveryModal.style.display = 'block';
    recoveryMessage.style.display = 'none';
    if (emailInput) {
        recoveryEmailInput.value = emailInput.value; // Pre-fill with login email if any
    }
});

closeRecoveryBtn.addEventListener('click', () => {
    recoveryModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === recoveryModal) {
        recoveryModal.style.display = 'none';
    }
});

// 2.2 Password Recovery Form Submit
recoveryForm.addEventListener('submit', async (e) => {
    console.log("Recovery form submitted");
    e.preventDefault();
    const email = recoveryEmailInput.value;
    const recoverySubmitBtn = recoveryForm.querySelector('button');

    if (!email) {
        console.warn("No email provided for password recovery");
        return;
    }

    recoverySubmitBtn.disabled = true;
    recoverySubmitBtn.textContent = 'Sending...';
    recoveryMessage.style.display = 'none';

    try {
        console.log("Attempting to send password reset email to:", email);
        await sendPasswordResetEmail(auth, email);
        console.log("Password reset email sent successfully");

        recoveryMessage.textContent = 'Reset link sent! Please check your inbox and spam folder.';
        recoveryMessage.style.color = '#bef264'; // Explicit lime green
        recoveryMessage.style.display = 'block';
        recoverySubmitBtn.textContent = 'Resend Link';
    } catch (error) {
        console.error("Recovery Error Detail:", error);
        let msg = "Error sending reset link. Please try again later.";

        if (error.code === 'auth/user-not-found') {
            msg = "No account found with this email.";
        } else if (error.code === 'auth/invalid-email') {
            msg = "Please enter a valid email address.";
        } else if (error.code === 'auth/too-many-requests') {
            msg = "Too many attempts. Please try again later.";
        } else if (error.code === 'auth/network-request-failed') {
            msg = "Network error. Please check your connection.";
        }

        recoveryMessage.textContent = msg;
        recoveryMessage.style.color = '#ef4444'; // Explicit red
        recoveryMessage.style.display = 'block';
        recoverySubmitBtn.textContent = 'Try Again';
    } finally {
        recoverySubmitBtn.disabled = false;
    }
});

// 2.3 Populate Countries and States
function initCountryState() {
    try {
        const countries = Country.getAllCountries();

        // Populate Countries
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.isoCode;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });

        countrySelect.addEventListener('change', () => {
            const countryCode = countrySelect.value;
            const states = State.getStatesOfCountry(countryCode);

            stateSelect.innerHTML = '<option value="">Select State / Province</option>';

            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.name;
                option.textContent = state.name;
                stateSelect.appendChild(option);
            });
        });
    } catch (error) {
        console.error("Error initializing country/state data:", error);
    }
}

initCountryState();

// 3. Form Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        if (isLogin) {
            // LOGIN
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            checkAdminAndRedirect(userCredential.user);
        } else {
            // REGISTER
            activeRegistration = true;
            console.log("Registration process started for:", email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created in Firebase Auth:", userCredential.user.uid);

            // Gather extra data
            console.log("Gathering extra user data...");
            const fullName = document.getElementById('fullname').value;
            const phone = document.getElementById('phone').value;
            const country = countrySelect.options[countrySelect.selectedIndex]?.text || "Unknown";
            const state = stateSelect.value || "Unknown";
            const address = document.getElementById('address').value;
            const zip = document.getElementById('zip').value;

            // Create User Document
            console.log("Attempting to create Firestore document for user...");
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                fullName,
                phone,
                country,
                state,
                address,
                zip,
                balance: 0,
                createdAt: serverTimestamp(),
                role: 'user',
                status: 'active'
            });
            console.log("Firestore registration step complete. User role set to 'user'.");
            console.log("Registration fully complete for:", email);
            activeRegistration = false;
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error("Auth Action Error:", error);

        // Handle "Email already in use" specifically
        if (error.code === 'auth/email-already-in-use') {
            // Suggest logging in instead
            submitBtn.textContent = 'Sign Up';
            errorMessage.innerHTML = `
                This email is already registered. <br>
                <a href="#" onclick="document.getElementById('toggle-auth').click(); return false;" style="color: var(--primary-color);">Switch to Login?</a>
            `;
            errorMessage.style.display = 'block';
            submitBtn.disabled = false;
            return;
        }

        // Handle Firestore Permission Error (Account created key, but DB write failed)
        // If the user was created in Auth but DB failed, they are technically logged in now.
        if (error.code === 'permission-denied' && !isLogin) {
            console.error("Firestore write failed (Permission Denied). Please check security rules.");
            errorMessage.textContent = "Database access denied. Please contact support.";
            errorMessage.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
            return;
        }

        handleAuthError(error);
        activeRegistration = false;
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Sign In' : 'Sign Up';
    }
});

// Helpers
async function checkAdminAndRedirect(user) {
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        // Hardcoded Admin Override for Demo/Safety
        if (user.email === 'admin@invest.com' || user.email === 'admin@example.com') {
            window.location.href = 'admin.html';
            return;
        }

        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Fallback for new users if doc creation lagged (though await above prevents this mostly)
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error("Redirect error:", error);
        window.location.href = 'dashboard.html';
    }
}

function handleAuthError(error) {
    console.error("Auth Error:", error);
    let msg = "An error occurred.";

    switch (error.code) {
        case 'auth/email-already-in-use':
            msg = 'This email is already registered.';
            break;
        case 'auth/invalid-email':
            msg = 'Please enter a valid email address.';
            break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            msg = 'Invalid email or password.';
            break;
        case 'auth/weak-password':
            msg = 'Password should be at least 6 characters.';
            break;
        case 'permission-denied':
            msg = 'Database permission denied.';
            break;
    }

    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
}
