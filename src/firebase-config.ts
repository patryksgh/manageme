import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBdSIt1vb3uWyuwB1M4O8x6wCny6vlcG9s",
  authDomain: "manageme-98709.firebaseapp.com",
  projectId: "manageme-98709",
  storageBucket: "manageme-98709.appspot.com",
  messagingSenderId: "1051165315743",
  appId: "1:1051165315743:web:523e3c3f549198e33a48aa",
  measurementId: "G-1STJJ8KYY8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);