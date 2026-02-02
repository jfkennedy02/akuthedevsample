import { v4 as uuidv4 } from 'uuid';

const DELAY_MS = 600;

// Seed Data
const INITIAL_PACKAGES = [
    { id: '1', name: 'Bronze', roi: 5, duration: 7, price: 100, color: 'bronze' },
    { id: '2', name: 'Silver', roi: 12, duration: 14, price: 500, color: 'silver' },
    { id: '3', name: 'Gold', roi: 25, duration: 30, price: 2000, color: 'gold' },
    { id: '4', name: 'VIP', roi: 50, duration: 60, price: 10000, color: 'platinum' },
];

const INITIAL_BALANCES = {
    btc: 0,
    eth: 0,
    usdt: 0,
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const db = {
    // --- AUTH ---
    register: async ({ username, password, fullName }) => {
        await delay(DELAY_MS);
        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
        if (users.find((u) => u.username === username)) {
            throw new Error('Username already exists');
        }
        const newUser = {
            id: uuidv4(),
            username,
            password, // In a real app, hash this!
            fullName,
            role: 'user', // or 'admin'
            balance: { ...INITIAL_BALANCES },
            kycStatus: 'none', // none, pending, approved, rejected
            kycData: null,
            joinedAt: new Date().toISOString(),
        };
        users.push(newUser);
        localStorage.setItem('sim_users', JSON.stringify(users));
        return newUser;
    },

    login: async (username, password) => {
        await delay(DELAY_MS);
        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
        const user = users.find((u) => u.username === username && u.password === password);
        if (!user) throw new Error('Invalid credentials');
        return user;
    },

    getUser: async (userId) => {
        await delay(DELAY_MS);
        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
        return users.find((u) => u.id === userId);
    },

    // --- WALLET ---
    deposit: async (userId, asset, amount, proofImage) => {
        await delay(DELAY_MS);
        const transactions = JSON.parse(localStorage.getItem('sim_transactions') || '[]');
        const newTx = {
            id: uuidv4(),
            userId,
            type: 'deposit',
            asset,
            amount: parseFloat(amount),
            status: 'pending',
            proofImage, // Base64 string
            date: new Date().toISOString(),
        };
        transactions.push(newTx);
        localStorage.setItem('sim_transactions', JSON.stringify(transactions));
        return newTx;
    },

    getTransactions: async (userId = null) => {
        await delay(DELAY_MS);
        const transactions = JSON.parse(localStorage.getItem('sim_transactions') || '[]');
        if (userId) {
            return transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    transfer: async (senderId, recipientUsername, amount, asset) => {
        await delay(DELAY_MS);
        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');

        const senderIndex = users.findIndex(u => u.id === senderId);
        const recipientIndex = users.findIndex(u => u.username === recipientUsername);

        if (senderIndex === -1) throw new Error("Sender not found");
        if (recipientIndex === -1) throw new Error("Recipient not found");
        if (users[senderIndex].username === recipientUsername) throw new Error("Cannot send to yourself");

        const sender = users[senderIndex];
        const recipient = users[recipientIndex];

        const val = parseFloat(amount);
        if (sender.balance[asset] < val) throw new Error("Insufficient balance");

        // Perform Transfer
        sender.balance[asset] -= val;
        recipient.balance[asset] += val;

        users[senderIndex] = sender;
        users[recipientIndex] = recipient;
        localStorage.setItem('sim_users', JSON.stringify(users));

        // Record Transactions
        const transactions = JSON.parse(localStorage.getItem('sim_transactions') || '[]');
        const date = new Date().toISOString();

        transactions.push({
            id: uuidv4(),
            userId: senderId,
            type: 'transfer_out',
            asset,
            amount: val,
            status: 'completed',
            date,
            description: `Sent to ${recipientUsername}`
        });

        transactions.push({
            id: uuidv4(),
            userId: recipient.id,
            type: 'transfer_in',
            asset,
            amount: val,
            status: 'completed',
            date,
            description: `Received from ${sender.username}`
        });

        localStorage.setItem('sim_transactions', JSON.stringify(transactions));
        return { success: true };
    },

    // --- ADMIN ---
    getAllUsers: async () => {
        await delay(DELAY_MS);
        return JSON.parse(localStorage.getItem('sim_users') || '[]');
    },

    updateTransactionStatus: async (txId, status) => {
        await delay(DELAY_MS);
        const transactions = JSON.parse(localStorage.getItem('sim_transactions') || '[]');
        const txIndex = transactions.findIndex(t => t.id === txId);
        if (txIndex === -1) throw new Error('Transaction not found');

        const tx = transactions[txIndex];
        tx.status = status;
        transactions[txIndex] = tx;
        localStorage.setItem('sim_transactions', JSON.stringify(transactions));

        // If approved, update user balance
        if (status === 'approved' && tx.type === 'deposit') {
            const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
            const userIndex = users.findIndex(u => u.id === tx.userId);
            if (userIndex !== -1) {
                users[userIndex].balance[tx.asset] += tx.amount;
                localStorage.setItem('sim_users', JSON.stringify(users));
            }
        }
        return tx;
    },

    // --- PACKAGES ---
    getPackages: async () => {
        await delay(DELAY_MS / 2);
        const packages = JSON.parse(localStorage.getItem('sim_packages'));
        if (!packages) {
            localStorage.setItem('sim_packages', JSON.stringify(INITIAL_PACKAGES));
            return INITIAL_PACKAGES;
        }
        return packages;
    },

    savePackage: async (pkg) => { // Create or Update
        await delay(DELAY_MS);
        const packages = JSON.parse(localStorage.getItem('sim_packages') || JSON.stringify(INITIAL_PACKAGES));

        if (pkg.id) {
            const index = packages.findIndex(p => p.id === pkg.id);
            if (index !== -1) packages[index] = pkg;
        } else {
            pkg.id = uuidv4();
            packages.push(pkg);
        }
        localStorage.setItem('sim_packages', JSON.stringify(packages));
        return pkg;
    },

    deletePackage: async (id) => {
        await delay(DELAY_MS);
        let packages = JSON.parse(localStorage.getItem('sim_packages') || JSON.stringify(INITIAL_PACKAGES));
        packages = packages.filter(p => p.id !== id);
        localStorage.setItem('sim_packages', JSON.stringify(packages));
    },

    purchasePackage: async (userId, packageId) => {
        await delay(DELAY_MS);
        const packages = JSON.parse(localStorage.getItem('sim_packages') || JSON.stringify(INITIAL_PACKAGES));
        const pkg = packages.find(p => p.id === packageId);
        if (!pkg) throw new Error("Package not found");

        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error("User not found");

        const user = users[userIndex];
        // Assuming packages are bought with USDT for simplicity, or we can make it generic
        if (user.balance.usdt < pkg.price) {
            throw new Error("Insufficient USDT balance");
        }

        // Deduct balance
        user.balance.usdt -= pkg.price;
        users[userIndex] = user;
        localStorage.setItem('sim_users', JSON.stringify(users));

        // Create investment record
        const investments = JSON.parse(localStorage.getItem('sim_investments') || '[]');
        const newInv = {
            id: uuidv4(),
            userId,
            packageId,
            packageName: pkg.name,
            amount: pkg.price,
            roi: pkg.roi,
            startDate: new Date().toISOString(),
            status: 'active',
            accumulatedProfit: 0
        };
        investments.push(newInv);
        localStorage.setItem('sim_investments', JSON.stringify(investments));

        // Record Transaction
        const transactions = JSON.parse(localStorage.getItem('sim_transactions') || '[]');
        transactions.push({
            id: uuidv4(),
            userId,
            type: 'investment',
            asset: 'USDT',
            amount: pkg.price,
            status: 'completed',
            date: new Date().toISOString(),
            description: `Bought ${pkg.name} Package`
        });
        localStorage.setItem('sim_transactions', JSON.stringify(transactions));

        return newInv;
    },

    getMyInvestments: async (userId) => {
        await delay(DELAY_MS);
        const investments = JSON.parse(localStorage.getItem('sim_investments') || '[]');
        return investments.filter(i => i.userId === userId);
    },

    // --- KYC ---
    submitKYC: async (userId, data) => { // data = { front, back, selfie }
        await delay(DELAY_MS + 1000); // Simulate processing
        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error("User not found");

        users[userIndex].kycStatus = 'pending';
        users[userIndex].kycData = {
            ...data,
            submittedAt: new Date().toISOString()
        };
        localStorage.setItem('sim_users', JSON.stringify(users));
        return { success: true };
    },

    adminGetKYCRequests: async () => {
        await delay(DELAY_MS);
        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
        return users.filter(u => u.kycStatus === 'pending');
    },

    adminReviewKYC: async (userId, status) => { // 'approved' or 'rejected'
        await delay(DELAY_MS);
        const users = JSON.parse(localStorage.getItem('sim_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error("User not found");

        users[userIndex].kycStatus = status;
        localStorage.setItem('sim_users', JSON.stringify(users));
        return { success: true };
    }
};
