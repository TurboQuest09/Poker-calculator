// firebase.js — ייבוא מה-CDN
import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, remove, update }
        from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDXDiVPlT9Xc4-OGo9soTxmREtMR1gFHg",
  authDomain: "poker-eacf2.firebaseapp.com",
  databaseURL: "https://poker-eacf2-default-rtdb.firebaseio.com",
  projectId: "poker-eacf2",
  storageBucket: "poker-eacf2.appspot.com",
  messagingSenderId: "1023833535660",
  appId: "1:1023833535660:web:94ae3e2e0b8193d3625b09"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

export { db, ref, set, push, onValue, get, remove, update };
