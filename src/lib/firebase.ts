import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQQz7FsObV3lonSNv690WOYKQWLalD2ZM",
  authDomain: "school-management-system-db7e9.firebaseapp.com",
  projectId: "school-management-system-db7e9",
  storageBucket: "school-management-system-db7e9.firebasestorage.app",
  messagingSenderId: "81487464452",
  appId: "1:81487464452:web:79b0a8f48ef9ba9d26cd51"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
