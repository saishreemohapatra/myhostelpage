import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyC5aTRzQFyk9KWXQ9TDmGD8qCKbsRrPBng",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "my-hostel-expenditure-details.firebaseapp.com",
  databaseURL:
    process.env.REACT_APP_FIREBASE_DATABASE_URL ||
    "https://my-hostel-expenditure-details-default-rtdb.firebaseio.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID ||
    "my-hostel-expenditure-details",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "my-hostel-expenditure-details.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "486929882258",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:486929882258:web:7a7f89c4021741b4205a4b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getDatabase(app);
