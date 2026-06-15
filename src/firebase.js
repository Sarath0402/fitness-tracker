import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6KfetfJ-mjD8Y5zOcGzNCCWqyI8chHuE",
  authDomain: "fitness-tracker-4bf88.firebaseapp.com",
  databaseURL: "https://fitness-tracker-4bf88-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fitness-tracker-4bf88",
  storageBucket: "fitness-tracker-4bf88.firebasestorage.app",
  messagingSenderId: "562829945422",
  appId: "1:562829945422:web:11c9111cd41060ed8c711f",
  measurementId: "G-JRYJ36VRG4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app, "default");