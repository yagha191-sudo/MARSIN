// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
    getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 👈 أضفنا استدعاء الـ Storage هنا
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQZJBnLqFwLQL4_-5BCqzEeNZqoNSXJZM",
  authDomain: "marsin-e1444.firebaseapp.com",
  projectId: "marsin-e1444",
  storageBucket: "marsin-e1444.firebasestorage.app",
  messagingSenderId: "110988220260",
  appId: "1:110988220260:web:c86fe0d331d029433f4c71"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // 👈 تهيئة الـ Storage

// تصدير كل شيء لملف app.js
export {
    auth, db, storage, // 👈 تصدير الـ storage هنا
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword,
    collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc,
    ref, uploadBytes, getDownloadURL // 👈 تصدير دوال الرفع
};