// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_B1LaYupXKEyTSOJh9_8dn1CVU-OWJhk",
    authDomain: "xd-hst.firebaseapp.com",
    projectId: "xd-hst",
    storageBucket: "xd-hst.firebasestorage.app",
    messagingSenderId: "608280106360",
    appId: "1:608280106360:web:b0efe9bd271523dfa6248d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
