import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    collection,
    getDocs,
    onSnapshot,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    getDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const usersBody = document.getElementById('users-body');
const depositsBody = document.getElementById('deposits-body');
const withdrawalsBody = document.getElementById('withdrawals-body');
const kycBody = document.getElementById('kyc-body');

// Check Admin Auth
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verify admin role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            loadUsers();
            loadDeposits();
            loadWithdrawals();
            loadKYCRequests();
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Load Users (Real-time)
function loadUsers() {
    console.log("Setting up real-time user listener...");
    usersBody.innerHTML = '<tr><td colspan="4">Initializing...</td></tr>';

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(collection(db, "users"), (querySnapshot) => {
        console.log(`User list updated. Total users: ${querySnapshot.size}`);
        usersBody.innerHTML = '';

        if (querySnapshot.empty) {
            usersBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No users found.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const row = `
                <tr>
                    <td>${user.email}</td>
                    <td>$${user.balance || 0}</td>
                    <td><span class="status-badge status-completed">${user.status || 'active'}</span></td>
                    <td>
                        <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="openUserModal('${docSnap.id}')">View</button>
                        <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('${docSnap.id}', ${user.balance || 0})">Edit Balance</button>
                    </td>
                </tr>
            `;
            usersBody.innerHTML += row;
        });
    }, (error) => {
        console.error("Error loading users:", error);
        usersBody.innerHTML = `<tr><td colspan="4" style="color: var(--error);">Error loading users. Check console. <br> ${error.message}</td></tr>`;
    });

    return unsubscribe;
}

// Load Withdrawals (Real-time)
function loadWithdrawals() {
    console.log("Setting up real-time withdrawal listener...");
    withdrawalsBody.innerHTML = '<tr><td colspan="6">Initializing...</td></tr>';

    const q = query(collection(db, "transactions"), where("type", "==", "withdraw"), where("status", "==", "Pending"), orderBy("date", "desc"));

    return onSnapshot(q, async (querySnapshot) => {
        console.log(`Withdrawal list updated. Total pending: ${querySnapshot.size}`);
        withdrawalsBody.innerHTML = '';

        if (querySnapshot.empty) {
            withdrawalsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No pending withdrawals.</td></tr>';
            return;
        }

        for (const docSnap of querySnapshot.docs) {
            const tx = docSnap.data();
            let userEmail = 'Unknown';
            try {
                const uDoc = await getDoc(doc(db, "users", tx.userId));
                if (uDoc.exists()) userEmail = uDoc.data().email;
            } catch (e) { }

            const row = `
                <tr>
                    <td>${userEmail}</td>
                    <td>$${tx.amount}</td>
                    <td>${(tx.method || 'crypto').toUpperCase()}</td>
                    <td style="font-family: monospace; font-size: 0.8rem;">${tx.walletAddress ? tx.walletAddress.substring(0, 10) + '...' : 'N/A'}</td>
                    <td>${new Date(tx.date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="openWithdrawalModal('${docSnap.id}')">Details</button>
                        <button class="btn-primary" style="background-color: var(--success); padding: 0.25rem 0.5rem;" onclick="approveWithdrawal('${docSnap.id}')">Approve</button>
                    </td>
                </tr>
            `;
            withdrawalsBody.innerHTML += row;
        }
    }, (error) => {
        console.error("Error loading withdrawals:", error);
        withdrawalsBody.innerHTML = `<tr><td colspan="6" style="color: var(--error);">Error: ${error.message}</td></tr>`;
    });
}

// Load KYC Requests (Real-time)
function loadKYCRequests() {
    console.log("Setting up real-time KYC listener...");
    if (!kycBody) return;
    kycBody.innerHTML = '<tr><td colspan="4">Initializing...</td></tr>';

    const q = query(collection(db, "users"), where("kycStatus", "==", "Pending"));

    return onSnapshot(q, (querySnapshot) => {
        kycBody.innerHTML = '';
        if (querySnapshot.empty) {
            kycBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No pending KYC requests.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const row = `
                <tr>
                    <td>${user.email}</td>
                    <td>${(user.kycData?.idType || 'ID Card').replace('_', ' ').toUpperCase()}</td>
                    <td>${user.kycData?.submittedAt ? new Date(user.kycData.submittedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <button class="btn-primary" onclick="openKYCModal('${docSnap.id}')">Review Docs</button>
                    </td>
                </tr>
            `;
            kycBody.innerHTML += row;
        });
    }, (error) => {
        console.error("Error loading KYC:", error);
        kycBody.innerHTML = `<tr><td colspan="4" style="color: var(--error);">Error: ${error.message}</td></tr>`;
    });
}

// Load Deposits
async function loadDeposits() {
    depositsBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
        const q = query(collection(db, "transactions"), where("type", "==", "deposit"), where("status", "==", "Pending"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        depositsBody.innerHTML = '';
        if (querySnapshot.empty) {
            depositsBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No pending deposits.</td></tr>';
            return;
        }

        for (const docSnap of querySnapshot.docs) {
            const tx = docSnap.data();
            // Fetch user email for context
            let userEmail = 'Unknown';
            try {
                const uDoc = await getDoc(doc(db, "users", tx.userId));
                if (uDoc.exists()) userEmail = uDoc.data().email;
            } catch (e) { }

            const row = `
                <tr>
                    <td>${userEmail}</td>
                    <td>$${tx.amount}</td>
                    <td>${tx.method}</td>
                    <td>${new Date(tx.date).toLocaleDateString()}</td>
                    <td>
                        ${(tx.proofImage || tx.proofUrl) ? `<button class="btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="openProofModal('${docSnap.id}')">Proof</button>` : ''}
                        ${tx.requiresKYC ? `<span class="status-badge status-pending" style="margin-right: 0.5rem;">Awaiting KYC</span>` : ''}
                        <button class="btn-primary" style="background-color: var(--success); padding: 0.25rem 0.5rem;" onclick="approveDeposit('${docSnap.id}', '${tx.userId}', ${tx.amount})">Approve</button>
                        <button class="btn-primary" style="background-color: var(--error); padding: 0.25rem 0.5rem;" onclick="rejectDeposit('${docSnap.id}')">Reject</button>
                    </td>
                </tr>
            `;
            depositsBody.innerHTML += row;
        }
    } catch (error) {
        console.error("Error loading deposits:", error);
        // Helper specifically for Index Errors
        if (error.code === 'failed-precondition') {
            depositsBody.innerHTML = `<tr><td colspan="5" style="color: var(--warning);">MISSING INDEX: Check browser console for the link to create it.</td></tr>`;
        } else {
            depositsBody.innerHTML = `<tr><td colspan="5" style="color: var(--error);">Error: ${error.message}</td></tr>`;
        }
    }
}

// Global functions for HTML access
window.openEditModal = (uid, currentBalance) => {
    document.getElementById('edit-user-id').value = uid;
    document.getElementById('edit-balance').value = currentBalance;
    document.getElementById('edit-modal').classList.add('active');
};

window.closeEditModal = () => {
    document.getElementById('edit-modal').classList.remove('active');
};

window.openUserModal = async (uid) => {
    const modal = document.getElementById('user-detail-modal');
    const content = document.getElementById('user-detail-content');
    content.innerHTML = 'Loading...';
    modal.classList.add('active');

    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            content.innerHTML = `
                <p><strong>Full Name:</strong> ${data.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">
                <p><strong>Address:</strong><br>
                ${data.address || ''}<br>
                ${data.city ? data.city + ', ' : ''} ${data.state || ''} ${data.zip || ''}<br>
                ${data.country || ''}</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">
                <p><strong>Default Crypto:</strong> ${(data.defaultCrypto || 'N/A').toUpperCase()}</p>
                <p><strong>Default Wallet:</strong> <span style="font-family: monospace; font-size: 0.9rem; word-break: break-all;">${data.defaultWallet || 'N/A'}</span></p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">
                <p><strong>Joined:</strong> ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
            `;
        } else {
            content.innerHTML = 'User not found.';
        }
    } catch (e) {
        console.error(e);
        content.innerHTML = 'Error loading details.';
    }
};



window.closeUserModal = () => {
    document.getElementById('user-detail-modal').classList.remove('active');
};

window.openWithdrawalModal = async (txId) => {
    const modal = document.getElementById('withdrawal-detail-modal');
    const content = document.getElementById('withdrawal-detail-content');
    const approveBtn = document.getElementById('modal-approve-btn');
    const rejectBtn = document.getElementById('modal-reject-btn');

    content.innerHTML = 'Loading...';
    modal.classList.add('active');

    try {
        const docSnap = await getDoc(doc(db, "transactions", txId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            let userEmail = 'Unknown User';
            try {
                const uDoc = await getDoc(doc(db, "users", data.userId));
                if (uDoc.exists()) userEmail = uDoc.data().email;
            } catch (e) { }

            content.innerHTML = `
                <p><strong>User:</strong> ${userEmail}</p>
                <p><strong>Amount:</strong> <span style="color: #fff; font-weight: bold;">$${data.amount}</span></p>
                <p><strong>Crypto:</strong> ${(data.method || 'crypto').toUpperCase()}</p>
                <p><strong>Wallet Address:</strong></p>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; font-family: monospace; word-break: break-all; color: var(--primary-color); border: 1px solid rgba(255,255,255,0.1);">
                    ${data.walletAddress || 'No address provided'}
                </div>
                <p style="font-size: 0.85rem; margin-top: 1rem;"><strong>Requested:</strong> ${new Date(data.date).toLocaleString()}</p>
            `;

            // Assign buttons
            approveBtn.onclick = () => {
                closeWithdrawalModal();
                approveWithdrawal(txId);
            };
            rejectBtn.onclick = () => {
                closeWithdrawalModal();
                rejectWithdrawal(txId, data.userId, data.amount);
            };
        } else {
            content.innerHTML = 'Transaction not found.';
        }
    } catch (e) {
        console.error(e);
        content.innerHTML = 'Error loading transaction details.';
    }
};

window.closeWithdrawalModal = () => {
    document.getElementById('withdrawal-detail-modal').classList.remove('active');
};

window.openProofModal = async (txId) => {
    const modal = document.getElementById('proof-modal');
    const img = document.getElementById('proof-image');

    try {
        const docSnap = await getDoc(doc(db, "transactions", txId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const source = data.proofUrl || data.proofImage;
            if (source) {
                img.src = source;
                modal.classList.add('active');
            } else {
                alert("No proof link found.");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Error loading proof.");
    }
};

window.closeProofModal = () => {
    document.getElementById('proof-modal').classList.remove('active');
};

window.approveDeposit = async (txId, userId, amount) => {
    if (!confirm('Approve this deposit?')) return;

    try {
        // Update transaction status
        await updateDoc(doc(db, "transactions", txId), {
            status: 'Completed'
        });

        // Update user balance using increment for atomicity
        await updateDoc(doc(db, "users", userId), {
            balance: increment(amount)
        });

        alert('Deposit approved!');
        loadDeposits();
        loadUsers(); // Refresh to see balance update
    } catch (error) {
        console.error("Error approving:", error);
        alert('Action failed.');
    }
};

window.rejectDeposit = async (txId) => {
    if (!confirm('Reject this deposit?')) return;
    try {
        await updateDoc(doc(db, "transactions", txId), {
            status: 'Rejected'
        });
        alert('Deposit rejected.');
        loadDeposits();
    } catch (error) {
        console.error("Error rejecting:", error);
    }
};

window.approveWithdrawal = async (txId) => {
    if (!confirm('Approve this withdrawal?')) return;
    try {
        await updateDoc(doc(db, "transactions", txId), {
            status: 'Completed'
        });
        alert('Withdrawal approved!');
    } catch (error) {
        console.error("Error approving withdrawal:", error);
        alert('Action failed.');
    }
};

window.rejectWithdrawal = async (txId, userId, amount) => {
    if (!confirm('Reject this withdrawal and REFUND the user?')) return;
    try {
        // 1. Update transaction status
        await updateDoc(doc(db, "transactions", txId), {
            status: 'Rejected'
        });

        // 2. Refund User Balance (Deducted at time of request)
        await updateDoc(doc(db, "users", userId), {
            balance: increment(amount)
        });

        alert('Withdrawal rejected and funds refunded to user.');
    } catch (error) {
        console.error("Error rejecting withdrawal:", error);
        alert('Action failed.');
    }
};

// Handle Balance Edit Submit
document.getElementById('edit-balance-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const uid = document.getElementById('edit-user-id').value;
    const newBalance = parseFloat(document.getElementById('edit-balance').value);

    try {
        await updateDoc(doc(db, "users", uid), {
            balance: newBalance
        });
        closeEditModal();
        loadUsers();
        alert('Balance updated.');
    } catch (error) {
        console.error("Update failed:", error);
        alert('Update failed.');
    }
});

// KYC Modal Logic
window.openKYCModal = async (uid) => {
    const modal = document.getElementById('kyc-detail-modal');
    const content = document.getElementById('kyc-detail-content');
    const approveBtn = document.getElementById('kyc-approve-btn');
    const rejectBtn = document.getElementById('kyc-reject-btn');

    content.innerHTML = 'Loading documents...';
    modal.classList.add('active');

    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists() && docSnap.data().kycData) {
            const data = docSnap.data().kycData;
            const user = docSnap.data();

            content.innerHTML = `
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.1);">
                    <p style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color); margin-bottom: 0.25rem;">${data.fullName || 'No Name Provided'}</p>
                    <p style="color: var(--text-gray); font-size: 0.85rem;">${user.email} • ${data.country || 'Unknown Country'}</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-gray); font-weight: bold; text-transform: uppercase;">ID FRONT</p>
                        <img src="${data.idFrontUrl || data.frontImg}" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #222;">
                    </div>
                    <div>
                        <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-gray); font-weight: bold; text-transform: uppercase;">ID BACK</p>
                        <img src="${data.idBackUrl || data.backImg}" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #222;">
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-gray); font-weight: bold; text-transform: uppercase;">LIVENESS VERIFICATION</p>
                    <video src="${data.liveVideoUrl || data.video}" controls style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #000; max-height: 250px;"></video>
                </div>

                <div style="font-size: 0.9rem; line-height: 1.6;">
                    <p><strong style="color: var(--text-gray);">Document:</strong> ${String(data.idType || 'ID').toUpperCase().replace('_', ' ')}</p>
                    <p><strong style="color: var(--text-gray);">Submitted:</strong> ${data.submittedAt ? (data.submittedAt.toDate ? data.submittedAt.toDate().toLocaleString() : new Date(data.submittedAt).toLocaleString()) : 'N/A'}</p>
                </div>
            `;

            approveBtn.onclick = async () => {
                if (!confirm('Approve this user identity?')) return;
                try {
                    await updateDoc(doc(db, "users", uid), { kycStatus: 'Verified' });
                    alert('User verified!');
                    closeKYCModal();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            };

            rejectBtn.onclick = async () => {
                const reason = prompt('Reason for rejection:');
                if (!reason) return;
                try {
                    await updateDoc(doc(db, "users", uid), {
                        kycStatus: 'Rejected',
                        kycNote: reason
                    });
                    alert('KYC Rejected.');
                    closeKYCModal();
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            };

        } else {
            content.innerHTML = '<p style="color: var(--error);">No KYC data found for this user.</p>';
        }
    } catch (e) {
        console.error(e);
        content.innerHTML = '<p style="color: var(--error);">Error loading documents.</p>';
    }
};

window.closeKYCModal = () => {
    document.getElementById('kyc-detail-modal').classList.remove('active');
};

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
