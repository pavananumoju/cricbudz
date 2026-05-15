// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPnsHmjm88RItrxyukdgJleRrS_k_Asjk",
  authDomain: "next-firebase-app-ca390.firebaseapp.com",
  projectId: "next-firebase-app-ca390",
  storageBucket: "next-firebase-app-ca390.appspot.com",
  messagingSenderId: "642696879188",
  appId: "1:642696879188:web:82aa3b21eb66f5003921c1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export const db = getFirestore(app);