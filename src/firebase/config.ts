// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAD8pSz-hS9tpCTaAhmvbqappJarIsFqvE",
  authDomain: "coursera-minip.firebaseapp.com",
  databaseURL: "https://coursera-minip-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "coursera-minip",
  storageBucket: "coursera-minip.firebasestorage.app",
  messagingSenderId: "338358556756",
  appId: "1:338358556756:web:2dab3d2178ded21577f5c1",
  measurementId: "G-T304FKGZLQ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);