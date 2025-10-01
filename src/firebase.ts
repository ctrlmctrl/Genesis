// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoZzsijw4Br7uIZzyX-rCTWndGeXQOJ00",
  authDomain: "genesis-8ca86.firebaseapp.com",
  projectId: "genesis-8ca86",
  storageBucket: "genesis-8ca86.firebasestorage.app",
  messagingSenderId: "47380732193",
  appId: "1:47380732193:web:5aabe37ca1edf4ba680660",
  measurementId: "G-D30PFWDW1K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

export default app;
