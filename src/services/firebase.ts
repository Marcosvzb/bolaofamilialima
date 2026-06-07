import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtsd0MqzSqrAWlNAkjoyeYyKFD52Uo6CU",
  authDomain: "bolao-fbdff.firebaseapp.com",
  projectId: "bolao-fbdff",
  storageBucket: "bolao-fbdff.firebasestorage.app",
  messagingSenderId: "1098428709552",
  appId: "1:1098428709552:web:ffcbc7c3a5757e8ba79975"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
