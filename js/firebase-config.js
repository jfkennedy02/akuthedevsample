import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCwTHJUebPPr3B97Vi9wapX1Ecr9W2xsek",
    authDomain: "testnet-4fb78.firebaseapp.com",
    projectId: "testnet-4fb78",
    storageBucket: "testnet-4fb78.firebasestorage.app",
    messagingSenderId: "800668228663",
    appId: "1:800668228663:web:75a6f14f4fb8d5bf88b3b2",
    measurementId: "G-W5BSVBDPBS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
