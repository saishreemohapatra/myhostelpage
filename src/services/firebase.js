import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC5aTRzQFyk9KWXQ9TDmGD8qCKbsRrPBng",
  authDomain: "my-hostel-expenditure-details.firebaseapp.com",
  projectId: "my-hostel-expenditure-details",
  storageBucket: "my-hostel-expenditure-details.firebasestorage.app",
  messagingSenderId: "486929882258",
  appId: "1:486929882258:web:7a7f89c4021741b4205a4b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getDatabase(app);
