/* firebase.js
   ────────────
   הגדרת Firebase + ייצוא כלי-עזר לשימוש בקבצים אחרים
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* ---  החלפתי כאן לפרטי-הפרויקט שסיפקת  --- */
const firebaseConfig = {
  apiKey:            "AIzaSyBDXDiVPlT9Xc4-OGo9soTxmREtMR1gFHg",
  authDomain:        "poker-eacf2.firebaseapp.com",
  databaseURL:       "https://poker-eacf2-default-rtdb.firebaseio.com",
  projectId:         "poker-eacf2",
storageBucket: "poker-eacf2.appspot.com",
  messagingSenderId: "1023833535660",
  appId:             "1:1023833535660:web:94ae3e2e0b8193d3625b09"
};

/* --- אתחול Firebase --- */
export const app  = initializeApp(firebaseConfig);
export const db   = getDatabase(app);
export const auth = getAuth(app);

/* --- ייצוא פונקציות לשימוש בקבצים אחרים --- */
export {
  ref, push, set, remove, onValue,                 // Realtime DB
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged                      // Auth
};
