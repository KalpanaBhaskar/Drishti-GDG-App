import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDGs1Ylf8WtDc8T05sXb6WlhdPIjz-DKoQ",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "drishti-database.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "drishti-database",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "drishti-database.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "184614512864",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:184614512864:web:7c651e5e2f6bc6ee610885"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
