import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyClek8PymDEgzj7G1NutiCEZ1idGf2buZo",
    authDomain: "donorproject-1778b.firebaseapp.com",
    projectId: "donorproject-1778b",
    storageBucket: "donorproject-1778b.firebasestorage.app",
    messagingSenderId: "360201717991",
    appId: "1:360201717991:web:e78857cabbd93a08bcfa42"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
