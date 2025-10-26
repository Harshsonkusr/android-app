// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyANcGw7sRDvx3nBQlSRMYt5-5RggXjgURw",
//   authDomain: "insurance-2580c.firebaseapp.com",
//   projectId: "insurance-2580c",
//   storageBucket: "insurance-2580c.firebasestorage.app",
//   messagingSenderId: "408794115193",
//   appId: "1:408794115193:web:a8c4ce7c2218f3d7e3f8a8"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);























// firebase.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyANcGw7sRDvx3nBQlSRMYt5-5RggXjgURw",
  authDomain: "insurance-2580c.firebaseapp.com",
  projectId: "insurance-2580c",
  storageBucket: "insurance-2580c.firebasestorage.app",
  messagingSenderId: "408794115193",
  appId: "1:408794115193:web:a8c4ce7c2218f3d7e3f8a8"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app); // for images
export const firestore = getFirestore(app); // for metadata
