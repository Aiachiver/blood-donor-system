import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Sections
const donorSection = document.getElementById("donorSection");
const adminSection = document.getElementById("adminSection");
const dashboardSection = document.getElementById("dashboardSection");

// Navigation
document.getElementById("donorPageBtn").onclick = () => {
  donorSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
};
document.getElementById("adminPageBtn").onclick = () => {
  adminSection.classList.remove("hidden");
  donorSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
};

// 📍 Get Location
document.getElementById("getLocation").onclick = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    alert("Geolocation not supported!");
  }
};

async function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  // Use reverse geocoding API (OpenStreetMap)
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
  const data = await res.json();
  document.getElementById("location").value = data.address.city || data.address.town || data.address.state || "Unknown";
}

function error() {
  alert("Unable to fetch location!");
}

// 🔐 OTP Registration
const sendOtpBtn = document.getElementById("sendOtp");
const verifyOtpBtn = document.getElementById("verifyOtp");
const statusEl = document.getElementById("status");

// Initialize reCAPTCHA verifier only once
window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {});

sendOtpBtn.addEventListener("click", async () => {
  const phone = document.getElementById("phone").value;
  if (!phone.startsWith("+91")) {
    alert("Phone number must start with +91 and include country code.");
    return;
  }

  try {
    const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
    window.confirmationResult = confirmation;
    statusEl.textContent = "OTP sent successfully!";
  } catch (err) {
    statusEl.textContent = err.message;
  }
});

verifyOtpBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const location = document.getElementById("location").value;
  const otp = document.getElementById("otp").value;
  const bloodGroup = document.querySelector("select[name='blood group']").value;

  if (!name || !email || !otp || !bloodGroup) {
    alert("Please fill all fields.");
    return;
  }

  try {
    const result = await window.confirmationResult.confirm(otp);
    await addDoc(collection(db, "donors"), {
      name,
      email,
      phone: result.user.phoneNumber,
      location,
      bloodGroup
    });
    statusEl.textContent = "Registration successful!";
  } catch (err) {
    statusEl.textContent = err.message;
  }
});

// Admin Login
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginStatus = document.getElementById("loginStatus");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    loginStatus.textContent = "Login successful!";
    document.getElementById("adminSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    loadDonors();
  } catch (error) {
    loginStatus.textContent = "Login failed: " + error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("adminSection").classList.remove("hidden");
});

// 📋 Load Donors + Search
async function loadDonors() {
  const donorTable = document.getElementById("donorTable").querySelector("tbody");
  donorTable.innerHTML = "";
  const snapshot = await getDocs(collection(db, "donors"));
  window.allDonors = [];
  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    d.id = docSnap.id; // 🔹 Store Firestore document ID
    window.allDonors.push(d);
  });
  renderTable(window.allDonors);
}


function renderTable(data) {
  const tbody = document.getElementById("donorTable").querySelector("tbody");
  tbody.innerHTML = "";
  data.forEach(d => {
    tbody.innerHTML += `<tr>
      <td>${d.name}</td>
      <td>${d.email}</td>
      <td>${d.phone}</td>
      <td>${d.location}</td>
      <td><button onclick="deleteDonor('${d.id}')">🗑️ Delete</button></td>
    </tr>`;
  });
}

// ✅ Delete Donor Function
window.deleteDonor = async function (id) {
  if (confirm("Are you sure you want to delete this donor?")) {
    try {
      await deleteDoc(doc(db, "donors", id));
      alert("Donor deleted successfully!");
      loadDonors(); // refresh the table
    } catch (err) {
      console.error("Error deleting donor:", err);
      alert("Failed to delete donor. Check console for details.");
    }
  }
};


// 🔍 Search Filter
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  const filtered = window.allDonors.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.location.toLowerCase().includes(q)
  );
  renderTable(filtered);
});

// 🚪 Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  dashboardSection.classList.add("hidden");
  adminSection.classList.remove("hidden");
});
