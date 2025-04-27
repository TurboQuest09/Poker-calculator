// --- Firebase חיבור ---
// לפני השימוש החלף את הערכים באלו של הפרויקט שלך!
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ‼️ הכנס כאן את ההגדרות שלך
const firebaseConfig = {
  apiKey: "AIzaSyBDXDiVPlT9Xc4-OGo9soTxmREtMR1gFHg",
  authDomain: "poker-eacf2.firebaseapp.com",
  databaseURL: "https://poker-eacf2-default-rtdb.firebaseio.com",
  projectId: "poker-eacf2",
  storageBucket: "poker-eacf2.appspot.com",
  messagingSenderId: "1023833535660",
  appId: "1:1023833535660:web:94ae3e2e0b8193d3625b09"
};

export const app   = initializeApp(firebaseConfig);
export const db    = getDatabase(app);
export { ref, push, set, onValue, remove };
