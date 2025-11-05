import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCUhdYHcDTxpjvXnclsOh2_oXY0WIEyNgU",
  authDomain: "dreamevents-53a89.firebaseapp.com",
  projectId: "dreamevents-53a89",
  storageBucket: "dreamevents-53a89.firebasestorage.app",
  messagingSenderId: "142284846474",
  appId: "1:142284846474:web:7b833cc523f85de506c473",
  measurementId: "G-5CCLKKREG5"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;