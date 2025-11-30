import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBcn_MT0yIYFJn53Ojd85KcFvlF9whldlU",
  authDomain: "borrowbox-991ab.firebaseapp.com",
  projectId: "borrowbox-991ab",
  storageBucket: "borrowbox-991ab.firebasestorage.app",
  messagingSenderId: "800428859948",
  appId: "1:800428859948:web:69540eff16bb61323ea789",
  measurementId: "G-7TFY6WWB6Q"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
