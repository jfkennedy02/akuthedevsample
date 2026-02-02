import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, onSnapshot, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// DOM Elements
const userDisplayNameEl = document.getElementById('user-display-name');
const sidebarAvatar = document.getElementById('sidebar-avatar');
const userInitialEl = document.getElementById('user-initial');
const totalBalanceEl = document.getElementById('total-balance');
const transactionsBody = document.getElementById('transactions-body');
const logoutBtn = document.getElementById('logout-btn');
const greetingMsg = document.getElementById('greeting-msg');

// Check Auth State
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        userInitialEl.textContent = user.email[0].toUpperCase();
        if (userDisplayNameEl) userDisplayNameEl.textContent = user.email;

        await fetchUserData(user.uid);
        await fetchTransactions(user.uid);
        fetchActiveInvestments(user.uid); // New Listener
        updateGreeting();
    } else {
        // No user is signed in, redirect to login
        window.location.href = 'login.html';
    }
});

// Real-time Listeners
let userUnsubscribe;
let txUnsubscribe;

// Fetch User Data (Real-time)
function fetchUserData(uid) {
    if (userUnsubscribe) userUnsubscribe(); // Unsubscribe previous if exists

    userUnsubscribe = onSnapshot(doc(db, "users", uid), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const balanceFormatted = formatCurrency(data.balance || 0);

            totalBalanceEl.textContent = balanceFormatted;

            // Update History Page Balance
            const historyBalanceEl = document.getElementById('history-total-balance');
            if (historyBalanceEl) historyBalanceEl.textContent = balanceFormatted;

            // Update Profile Display
            const displayName = data.username || data.email;
            if (userDisplayNameEl) userDisplayNameEl.textContent = displayName;

            if (data.photoURL) {
                sidebarAvatar.src = data.photoURL;
                sidebarAvatar.style.display = 'block';
                userInitialEl.style.display = 'none';
            }

            // Populate Form if exists
            const usernameInput = document.getElementById('username');
            if (usernameInput && document.getElementById('profile-section').style.display === 'none') {
                // Only update form if not currently editing (basic check)
                if (data.username) usernameInput.value = data.username;
                if (data.dob) document.getElementById('dob').value = data.dob;
                if (data.defaultCrypto) document.getElementById('default-crypto').value = data.defaultCrypto;
                if (data.defaultWallet) document.getElementById('default-wallet').value = data.defaultWallet;

                // Also auto-fill withdrawal form if it's empty
                const withdrawWalletInput = document.getElementById('withdraw-wallet');
                if (withdrawWalletInput && !withdrawWalletInput.value) {
                    if (data.defaultCrypto) document.getElementById('withdraw-method').value = data.defaultCrypto;
                    if (data.defaultWallet) withdrawWalletInput.value = data.defaultWallet;
                }

                if (data.photoURL) {
                    document.getElementById('profile-preview').src = data.photoURL;
                    document.getElementById('profile-preview').style.display = 'block';
                    document.getElementById('profile-placeholder').style.display = 'none';
                }
            }

            // Update KYC Status UI
            const statusEl = document.getElementById('kyc-status');
            const kycStatus = data.kycStatus || 'Unverified';
            if (statusEl) {
                statusEl.textContent = kycStatus;
                statusEl.style.color = kycStatus === 'Verified' ? 'var(--success)' :
                    kycStatus === 'Pending' ? 'var(--warning)' : 'var(--error)';
            }
            window.currentUserKYCStatus = kycStatus; // Store globally for field logic

            updateGreeting(displayName);

        } else {
            console.log("No such user document!");
        }
    }, (error) => {
        console.error("Error getting user document:", error);
    });
}

// Fetch Transactions (Real-time)
function fetchTransactions(uid) {
    if (txUnsubscribe) txUnsubscribe();

    const q = query(
        collection(db, "transactions"),
        where("userId", "==", uid),
        orderBy("date", "desc"),
        limit(10)
    );

    txUnsubscribe = onSnapshot(q, (querySnapshot) => {
        transactionsBody.innerHTML = '';

        if (querySnapshot.empty) {
            transactionsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-gray);">No transactions found.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const tx = doc.data();
            const date = new Date(tx.date).toLocaleDateString();

            // "Read More" button for Pending Deposits
            let statusHtml = `<span class="status-badge status-${tx.status.toLowerCase()}">${tx.status}</span>`;
            if (tx.status === 'Pending' && tx.type === 'deposit') {
                statusHtml += ` <button onclick="showPendingDetails()" style="background: none; border: none; padding: 0; margin-left: 5px; cursor: pointer; color: var(--primary-color); text-decoration: underline; font-size: 0.8rem;">Read More</button>`;
            }

            const row = `
                <tr class="transaction-row">
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="${tx.type.includes('in') || tx.type === 'deposit' ? 'arrow-down-left' : 'arrow-up-right'}" style="width: 16px;"></i>
                            </div>
                            ${capitalize(tx.type)}
                        </div>
                    </td>
                    <td style="font-weight: 600;">${formatCurrency(tx.amount)}</td>
                    <td>${statusHtml}</td>
                    <td style="color: var(--text-gray);">${date}</td>
                </tr>
            `;
            transactionsBody.innerHTML += row;
        });

        lucide.createIcons();
    }, (error) => {
        console.error("Error fetching transactions:", error);
        if (error.code === 'failed-precondition') {
            transactionsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--warning);">Setup Required: Check Console for Index Link</td></tr>';
        } else {
            transactionsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error);">${error.message}</td></tr>`;
        }
    });
}

// Fetch Active Investments
// Profit Tracking
let activeInvestments = [];
let profitInterval;
let activeInvUnsubscribe;

function fetchActiveInvestments(uid) {
    if (activeInvUnsubscribe) activeInvUnsubscribe();

    const q = query(
        collection(db, "investments"),
        where("userId", "==", uid),
        where("status", "==", "Active")
    );

    activeInvUnsubscribe = onSnapshot(q, (querySnapshot) => {
        activeInvestments = [];
        querySnapshot.forEach(doc => {
            activeInvestments.push({ id: doc.id, ...doc.data() });
        });

        const activeCount = activeInvestments.length;
        updateLiveProfits(); // Immediate update

        // 1. Update Stat Card
        const activeStatEl = document.getElementById('active-investments');
        if (activeStatEl) activeStatEl.textContent = activeCount;

        // 2. Render Active Plans List
        const container = document.getElementById('active-plans-container');
        const grid = document.getElementById('active-plans-grid');

        if (activeCount > 0) {
            container.style.display = 'block';
            grid.innerHTML = ''; // Clear

            querySnapshot.forEach((doc) => {
                const inv = doc.data();
                const start = new Date(inv.startDate);
                const end = new Date(inv.endDate);
                const now = new Date();
                const totalDuration = end - start;
                const elapsed = now - start;
                const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

                const card = `
                    <div class="stat-card" style="border: 1px solid var(--success);">
                        <div class="stat-header">
                            <span class="stat-title" style="color: var(--success);">${inv.planName}</span>
                            <span style="font-size: 0.75rem; background: rgba(190, 242, 100, 0.2); color: var(--success); padding: 2px 8px; border-radius: 12px;">Active</span>
                        </div>
                        <div class="stat-value" style="font-size: 1.5rem;">${formatCurrency(inv.amount)}</div>
                        <div class="stat-change" style="margin-top: 0.5rem; width: 100%; display: block;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                                <span>ROI: ${inv.roi}%</span>
                                <span>${daysRemaining} days left</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
                                <div style="width: ${progress}%; height: 100%; background: var(--success); border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                `;
                grid.innerHTML += card;
            });
        } else {
            container.style.display = 'none';
        }

    }, (error) => {
        console.error("Error fetching investments:", error);
    });
}

function updateLiveProfits() {
    let totalAccrued = 0;
    const now = new Date();

    activeInvestments.forEach(inv => {
        const start = new Date(inv.startDate);
        const end = new Date(inv.endDate);

        // Handle ROI normalization: 
        // If roi is small (e.g. 1.2), it was stored as a decimal multiplier.
        // If roi is large (e.g. 120), it was stored as a percentage.
        let roiMultiplier;
        if (inv.roi < 10) {
            roiMultiplier = inv.roi; // Old format (multiplier)
        } else {
            roiMultiplier = (inv.roi || 100) / 100; // New format (percentage)
        }

        const totalProfit = inv.amount * (roiMultiplier - 1);

        if (now >= end) {
            totalAccrued += totalProfit;
        } else if (now > start) {
            const totalDuration = end - start;
            const elapsed = now - start;
            const ratio = elapsed / totalDuration;
            totalAccrued += totalProfit * ratio;
        }
    });

    const profitDisplay = document.getElementById('total-profit');
    const historyProfitDisplay = document.getElementById('history-total-profit');

    if (profitDisplay) profitDisplay.textContent = formatCurrency(totalAccrued);
    if (historyProfitDisplay) historyProfitDisplay.textContent = formatCurrency(totalAccrued);

    console.log(`Profits updated: ${formatCurrency(totalAccrued)} at ${now.toLocaleTimeString()}`);
}

// Start Profit Update Loop (Every 10 minutes)
if (typeof profitInterval !== 'undefined') clearInterval(profitInterval);
window.profitInterval = setInterval(updateLiveProfits, 10 * 60 * 1000);

// Format Helper
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// Modal Logic
window.showDepositModal = () => {
    document.getElementById('deposit-modal').classList.add('active');
}

window.closeDepositModal = () => {
    document.getElementById('deposit-modal').classList.remove('active');
}

// Navigation
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');

        // Special Case: Deposit -> Open Modal directly
        if (page === 'deposit') {
            showDepositModal();
            return;
        }

        // Update Active Menu
        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // Show Section
        document.querySelectorAll('.content-wrapper').forEach(el => el.style.display = 'none');

        const sectionId = page + '-section';
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
            document.getElementById('page-title').textContent = capitalize(page);
        }
    });
});

// Withdraw Form
document.getElementById('withdraw-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = document.getElementById('withdraw-method').value;
    const walletAddress = document.getElementById('withdraw-wallet').value;
    const user = auth.currentUser;

    if (!user || !amount || !walletAddress) return;

    try {
        // Check balance (simple client check, should be server side rules too)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const currentBalance = userDoc.data().balance || 0;

        if (amount > currentBalance) {
            alert('Insufficient balance.');
            return;
        }

        const newBalance = currentBalance - amount;

        // Deduct balance immediately
        await updateDoc(doc(db, "users", user.uid), {
            balance: newBalance
        });

        await addDoc(collection(db, "transactions"), {
            userId: user.uid,
            type: 'withdraw',
            amount: amount,
            status: 'Pending',
            method: method,
            walletAddress: walletAddress,
            date: new Date().toISOString()
        });

        alert('Withdrawal request submitted.');
        fetchUserData(user.uid);
        fetchTransactions(user.uid);
        document.getElementById('withdraw-form').reset();
    } catch (error) {
        console.error("Withdraw error:", error);
        alert('Error processing withdrawal.');
    }
});

// Transfer Form
document.getElementById('transfer-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('transfer-email').value;
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const user = auth.currentUser;

    if (!user || !amount || !email) return;
    if (email === user.email) {
        alert("Cannot transfer to yourself.");
        return;
    }

    try {
        // Find recipient
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("User not found.");
            return;
        }

        const recipientDoc = querySnapshot.docs[0];

        // Check Sender Balance
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const currentBalance = userDocSnap.data().balance || 0;

        if (amount > currentBalance) {
            alert("Insufficient balance.");
            return;
        }

        // Perform Transfer
        // 1. Deduct from sender
        await updateDoc(userDocRef, {
            balance: currentBalance - amount
        });

        // 2. Add to recipient
        await updateDoc(recipientDoc.ref, {
            balance: (recipientDoc.data().balance || 0) + amount
        });

        // 3. Log Transaction for Sender
        await addDoc(collection(db, "transactions"), {
            userId: user.uid,
            type: 'transfer_out',
            amount: amount,
            to: email,
            status: 'Completed',
            date: new Date().toISOString()
        });

        // 4. Log Transaction for Recipient
        await addDoc(collection(db, "transactions"), {
            userId: recipientDoc.id,
            type: 'transfer_in',
            amount: amount,
            from: user.email,
            status: 'Completed',
            date: new Date().toISOString()
        });

        alert("Transfer successful!");
        fetchUserData(user.uid);
        fetchTransactions(user.uid);
        document.getElementById('transfer-form').reset();

    } catch (error) {
        console.error("Transfer error:", error);
        alert("Transfer failed. Please try again.");
    }
});

// Helper to compress images (Max 800px width, 60% quality)
function compressImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Convert to JPEG at 0.6 quality to keep file size < 80KB
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => reject("Failed to load image for compression.");
            img.src = e.target.result;
        };
        reader.onerror = () => reject("Failed to read file.");
        reader.readAsDataURL(file);
    });
}

// Helper to read any file as Base64 (used for video)
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// --- Recorder Logic ---
let mediaRecorder;
let recordedChunks = [];
window.recordedVideoBlob = null;
let camStream;

// (Storage uploads deprecated in favor of Optimized Base64 to avoid CORS issues)

const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);

async function startCamera() {
    try {
        camStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
        });
        const video = document.getElementById('kyc-preview');
        video.srcObject = camStream;
        document.getElementById('start-camera-btn').style.display = 'none';
        document.getElementById('start-record-btn').style.display = 'inline-block';
    } catch (err) {
        console.error("Camera error:", err);
        alert("Could not access camera. Please ensure you have given permission in your browser settings.");
    }
}

function startRecording() {
    recordedChunks = [];
    const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 150000 // 150kbps low bitrate for small file size
    };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        delete options.mimeType; // Let browser choose
    }

    mediaRecorder = new MediaRecorder(camStream, options);
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = async () => {
        window.recordedVideoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        document.getElementById('record-success-msg').style.display = 'block';
        document.getElementById('recording-indicator').style.display = 'none';

        // Stop camera tracks to release device
        if (camStream) {
            camStream.getTracks().forEach(track => track.stop());
        }
    };

    mediaRecorder.start();
    document.getElementById('recording-indicator').style.display = 'block';
    document.getElementById('start-record-btn').style.display = 'none';
    document.getElementById('stop-record-btn').style.display = 'inline-block';

    // Auto-stop after 5 seconds
    setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
        }
    }, 5000);
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    document.getElementById('stop-record-btn').style.display = 'none';
}

// Listeners for camera
document.addEventListener('click', (e) => {
    if (e.target.id === 'start-camera-btn') startCamera();
    if (e.target.id === 'start-record-btn') startRecording();
    if (e.target.id === 'stop-record-btn') stopRecording();
});

// Deposit Form
document.getElementById('deposit-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const method = document.getElementById('deposit-method').value;
    const proofInput = document.getElementById('deposit-proof');
    const user = auth.currentUser;

    if (!user || !amount) return;

    // Validate Payment Proof
    if (proofInput.files.length === 0) {
        alert("Please upload a screenshot of your payment to proceed.");
        return;
    }

    // KYC Check
    const isHighValue = amount >= 5000;
    const isNotVerified = window.currentUserKYCStatus !== 'Verified';
    const kycFrontInput = document.getElementById('kyc-front');
    const kycBackInput = document.getElementById('kyc-back');
    const kycFullNameInput = document.getElementById('kyc-fullname');
    const kycCountryInput = document.getElementById('kyc-country');

    let kycDataToStorage = null;

    if (isHighValue && isNotVerified) {
        if (!kycFrontInput.files[0] || !kycBackInput.files[0] || !window.recordedVideoBlob || !kycFullNameInput.value || !kycCountryInput.value) {
            alert("Verification Required: Please provide your name, country, ID photos, and record a liveness video.");
            return;
        }

        kycDataToStorage = {
            fullName: kycFullNameInput.value,
            country: kycCountryInput.value,
            idType: document.getElementById('kyc-id-type').value,
            frontFile: kycFrontInput.files[0],
            backFile: kycBackInput.files[0],
            videoBlob: window.recordedVideoBlob
        };
    } else if (isHighValue && window.currentUserKYCStatus === 'Pending') {
        alert("Your previous verification request is still pending review. Please wait for approval before making another large deposit.");
        return;
    }

    try {
        // Show Progress Modal immediately
        closeDepositModal();
        const successModal = document.getElementById('success-modal');
        successModal.classList.add('active');
        const modalTitle = successModal.querySelector('h3');
        const modalDesc = successModal.querySelector('p');

        if (kycDataToStorage) {
            modalTitle.textContent = "Optimizing Documents...";
            modalDesc.textContent = "Please wait while we prepare your identity files for secure submission. This only takes a moment.";
        } else {
            modalTitle.textContent = "Processing...";
            modalDesc.textContent = "Compressing proof and logging your request.";
        }

        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("No active session.");

        // 1. Compress and Convert Payment Proof
        console.log("Optimizing payment proof...");
        const proofBase64 = await compressImage(proofInput.files[0]);

        // 2. Handle KYC optimization if present
        let kycFirestoreData = null;
        if (kycDataToStorage) {
            console.log("Optimizing KYC documents and video...");
            const [frontBase64, backBase64, videoBase64] = await Promise.all([
                compressImage(kycDataToStorage.frontFile),
                compressImage(kycDataToStorage.backFile),
                readFileAsBase64(kycDataToStorage.videoBlob)
            ]);

            kycFirestoreData = {
                fullName: kycDataToStorage.fullName,
                country: kycDataToStorage.country,
                idType: kycDataToStorage.idType,
                frontImg: frontBase64,
                backImg: backBase64,
                video: videoBase64,
                status: 'Pending',
                submittedAt: serverTimestamp()
            };

            await updateDoc(doc(db, "users", currentUser.uid), {
                kycStatus: 'Pending',
                kycData: kycFirestoreData
            });
        }

        // 3. Save Deposit Transaction
        const depositData = {
            userId: currentUser.uid,
            type: 'deposit',
            amount: amount,
            status: 'Pending',
            method: method,
            proofImage: proofBase64, // Stored as optimized Base64
            date: new Date().toISOString(),
            requiresKYC: !!kycFirestoreData
        };

        await addDoc(collection(db, "transactions"), depositData);
        console.log("Deposit logged successfully.");

        // Complete UI
        modalTitle.textContent = "Request Submitted";
        modalDesc.textContent = "Your deposit and identity documents have been received and are now under review. Check the history tab for updates.";

        document.getElementById('deposit-form').reset();
        document.getElementById('info-qr').src = '';
        document.getElementById('deposit-info').style.display = 'none';

        setTimeout(() => {
            const historyBtn = document.querySelector('.menu-item[data-page="history"]');
            if (historyBtn) historyBtn.click();
        }, 3000);

    } catch (error) {
        console.error("Submission error:", error);
        alert("Verification failed: " + error.message);
        document.getElementById('success-modal').classList.remove('active');
    }
});

// Success Modal Logic
window.closeSuccessModal = () => {
    document.getElementById('success-modal').classList.remove('active');
}

window.showPendingDetails = () => {
    // Re-use success modal but static
    const successModal = document.getElementById('success-modal');
    successModal.classList.add('active');
}

// --- Dynamic Deposit Info ---
const WALLET_DATA = {
    btc: { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', label: 'Bitcoin (BTC)' },
    eth: { address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', label: 'Ethereum (ETH)' },
    usdt: { address: 'T9yD14Nj9j7xAB4dbGeiX9h8yuqlmfGhjx', label: 'Tether (USDT TRC20)' },
    sol: { address: 'H7937H7g8e2s3df4f5g6h7j8k9l0m1n2o3p4q5r6s', label: 'Solana (SOL)' },
    doge: { address: 'D8H7937H7g8e2s3df4f5g6h7j8k9l0m1n2o3p4q', label: 'Dogecoin (DOGE)' },
    ltc: { address: 'L7937H7g8e2s3df4f5g6h7j8k9l0m1n2o3p4q', label: 'Litecoin (LTC)' }
};

const methodSelect = document.getElementById('deposit-method');
const infoDiv = document.getElementById('deposit-info');
const infoCoin = document.getElementById('info-coin');
const infoAddress = document.getElementById('info-address');
const infoQr = document.getElementById('info-qr');

function updateDepositInfo() {
    const coin = methodSelect.value;
    const data = WALLET_DATA[coin];

    if (data) {
        infoDiv.style.display = 'block';
        infoCoin.textContent = data.label;
        infoAddress.textContent = data.address;
        // Using a public QR code API for simple dynamic generation
        infoQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
    } else {
        infoDiv.style.display = 'none';
    }
}

// Copy Logic
const copyBtn = document.getElementById('copy-btn');
copyBtn?.addEventListener('click', () => {
    const text = infoAddress.textContent;
    if (text === 'Loading...') return;

    navigator.clipboard.writeText(text).then(() => {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i data-lucide="check" style="width: 18px; margin: 0; color: var(--success);"></i>';
        lucide.createIcons();
        setTimeout(() => {
            copyBtn.innerHTML = original;
            lucide.createIcons();
        }, 2000);
    });
});

methodSelect?.addEventListener('change', updateDepositInfo);

// --- KYC Field Visibility Logic ---
const depositAmountInput = document.getElementById('deposit-amount');
const kycFields = document.getElementById('kyc-fields');
const kycNotice = document.getElementById('kyc-notice');

depositAmountInput?.addEventListener('input', () => {
    const amount = parseFloat(depositAmountInput.value) || 0;
    const isHighValue = amount >= 5000;
    const isNotVerified = window.currentUserKYCStatus !== 'Verified';

    if (isHighValue && isNotVerified) {
        kycFields.style.display = 'block';
        kycNotice.style.display = 'block';
        // Make ID fields required
        document.getElementById('kyc-front').required = true;
        document.getElementById('kyc-back').required = true;
    } else {
        kycFields.style.display = 'none';
        kycNotice.style.display = 'none';
        // Remove requirement
        document.getElementById('kyc-front').required = false;
        document.getElementById('kyc-back').required = false;
    }
});

// Initialize on modal open (hook into existing showDepositModal if possible, or just call on load)
const originalShowModal = window.showDepositModal;
window.showDepositModal = () => {
    // Reset KYC fields when opening
    if (document.getElementById('kyc-fields')) document.getElementById('kyc-fields').style.display = 'none';
    if (document.getElementById('kyc-notice')) document.getElementById('kyc-notice').style.display = 'none';

    // Reset Recorder UI
    window.recordedVideoBase64 = null;
    if (document.getElementById('record-success-msg')) document.getElementById('record-success-msg').style.display = 'none';
    if (document.getElementById('start-camera-btn')) document.getElementById('start-camera-btn').style.display = 'inline-block';
    if (document.getElementById('start-record-btn')) document.getElementById('start-record-btn').style.display = 'none';
    if (document.getElementById('stop-record-btn')) document.getElementById('stop-record-btn').style.display = 'none';
    if (document.getElementById('recording-indicator')) document.getElementById('recording-indicator').style.display = 'none';
    if (document.getElementById('kyc-preview')) document.getElementById('kyc-preview').srcObject = null;

    if (originalShowModal) originalShowModal();
};

// --- Investment Plans Logic ---
const INVESTMENT_PLANS = [
    { name: 'Cloud Node V1', min: 1000, max: 5000 },
    { name: 'Pro Mining Rig', min: 5001, max: 15000 },
    { name: 'Data Center A1', min: 15001, max: 50000 },
    { name: 'Quantum Farm', min: 50001, max: 100000 },
    { name: 'Global Network', min: 100001, max: 350000 }
];

let currentPlanMin = 0;
let currentPlanMax = 0;

window.openInvestModal = (name, min, max, roi, days) => {
    document.getElementById('invest-modal').classList.add('active');

    document.getElementById('invest-plan-name').textContent = name;

    // Normalize ROI for display (handle 1.2 vs 120)
    const displayRoi = roi < 10 ? Math.round(roi * 100) : Math.round(roi);
    document.getElementById('invest-plan-roi').textContent = displayRoi + '%';
    document.getElementById('invest-plan-days').textContent = days;

    document.getElementById('invest-min').textContent = formatCurrency(min);
    document.getElementById('invest-max').textContent = formatCurrency(max);

    // Set hidden/state
    currentPlanMin = min;
    currentPlanMax = max;
    document.getElementById('invest-roi').value = roi;
    document.getElementById('invest-days').value = days;

    // Show balance
    // We need to fetch latest balance to be sure, but visually we can use the cached one for now
    const currentBalanceStr = document.getElementById('total-balance').textContent;
    document.getElementById('invest-balance-display').textContent = currentBalanceStr;
};

window.closeInvestModal = () => {
    document.getElementById('invest-modal').classList.remove('active');
};

document.getElementById('invest-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('invest-amount').value);
    const planName = document.getElementById('invest-plan-name').textContent;
    const roi = parseFloat(document.getElementById('invest-roi').value);
    const duration = parseInt(document.getElementById('invest-days').value);
    const user = auth.currentUser;

    if (!user || !amount) return;

    // 1. Validate Amount
    if (amount < currentPlanMin || amount > currentPlanMax) {
        alert(`Amount must be between ${formatCurrency(currentPlanMin)} and ${formatCurrency(currentPlanMax)}`);
        return;
    }

    try {
        // 2. Check Balance (Server-side simulation)
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const currentBalance = userDocSnap.data().balance || 0;

        if (amount > currentBalance) {
            // Polite Message Logic
            let message = `We sincerely apologize, but your current balance of ${formatCurrency(currentBalance)} is insufficient for this purchase.\n\n`;

            // Find suggestions
            const affordablePlans = INVESTMENT_PLANS.filter(p => p.min <= currentBalance);

            if (affordablePlans.length > 0) {
                message += "Based on your available funds, we recommend the following packages:\n";
                affordablePlans.forEach(p => {
                    message += `• ${p.name} ($${p.min.toLocaleString()} - $${p.max.toLocaleString()})\n`;
                });
                message += "\nPlease choose one of these plans or deposit more funds to proceed.";
            } else {
                message += "You do not have enough funds for any investment plan at the moment.\n\nPlease visit the Deposit section to add funds to your wallet.";
            }

            alert(message);
            return;
        }

        // 3. Deduct Balance
        await updateDoc(userDocRef, {
            balance: currentBalance - amount
        });

        // 4. Create Investment Record
        const maturityDate = new Date();
        maturityDate.setDate(maturityDate.getDate() + duration);

        await addDoc(collection(db, "investments"), {
            userId: user.uid,
            planName: planName,
            amount: amount,
            roi: roi,
            expectedReturn: amount * (roi / 100), // Assuming ROI input is percentage e.g. 120
            startDate: new Date().toISOString(),
            endDate: maturityDate.toISOString(),
            status: 'Active'
        });

        // 5. Log Transaction (Purchase)
        await addDoc(collection(db, "transactions"), {
            userId: user.uid,
            type: 'investment',
            amount: amount,
            status: 'Completed',
            description: `Purchased ${planName}`,
            date: new Date().toISOString()
        });

        closeInvestModal();
        alert(`Successfully purchased ${planName}!`);

    } catch (error) {
        console.error("Investment failed:", error);
        alert('Transaction failed. Please try again.');
    }
});

// --- Profile & Greeting Logic ---

function updateGreeting(name) {
    if (!greetingMsg) return;

    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';

    const cleanName = name || (auth.currentUser ? auth.currentUser.email : 'User');
    greetingMsg.textContent = `${greeting}, ${cleanName}`;
}

// Profile Image Preview
const profilePicInput = document.getElementById('profile-pic-input');
profilePicInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) { // 500KB limit for profile
        alert("Image too large. Max 500KB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        const preview = document.getElementById('profile-preview');
        const placeholder = document.getElementById('profile-placeholder');
        preview.src = ev.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
});

// Profile Form Submit
document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const username = document.getElementById('username').value;
    const dob = document.getElementById('dob').value;
    const defaultCrypto = document.getElementById('default-crypto').value;
    const defaultWallet = document.getElementById('default-wallet').value;
    const file = profilePicInput.files[0];

    let updateData = { username, dob, defaultCrypto, defaultWallet };

    if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            updateData.photoURL = reader.result;
            try {
                await updateDoc(doc(db, "users", user.uid), updateData);
                alert("Profile updated!");
            } catch (error) {
                console.error("Profile save error:", error);
                alert("Error saving profile.");
            }
        };
        reader.readAsDataURL(file);
    } else {
        try {
            await updateDoc(doc(db, "users", user.uid), updateData);
            alert("Profile updated!");
        } catch (error) {
            console.error("Profile save error:", error);
            alert("Error saving profile.");
        }
    }
});

// --- Scroll Animation for Plans ---
const plansGrid = document.querySelector('.plans-grid');
if (plansGrid) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Determine scrolling direction or just trigger once
                const cards = entry.target.querySelectorAll('.plan-card');
                cards.forEach(card => card.classList.add('scrolled-in'));
                observer.unobserve(entry.target); // Trigger once
            }
        });
    }, {
        threshold: 0.2, // Trigger when 20% visible
        rootMargin: "0px 0px -50px 0px"
    });

    observer.observe(plansGrid);
}
