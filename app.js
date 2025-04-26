import { initializeApp } from
 "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc }
 "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/* חיבור לפיירבייס שלך */
const firebaseConfig = {
  apiKey: "AIzaSyBDXDiVPlT9Xc4-OGo9soTxmREtMR1gFHg",
  authDomain: "poker-eacf2.firebaseapp.com",
  projectId: "poker-eacf2",
  storageBucket: "poker-eacf2.firebasestorage.app",
  messagingSenderId: "1023833535660",
  appId: "1:1023833535660:web:427f79a99e63cfd9625b09"
};
initializeApp(firebaseConfig);
const db = getFirestore();
const id = new URLSearchParams(location.search).get("game") || "default";
const ref = doc(db, "games", id);

/* מודל שחקן */
class Player {
  constructor(n) { this.name = n; this.buy = 0; this.win = 0; }
  get net() { return this.win - this.buy; }
}
const players = new Map();

/* סנכרון */
onSnapshot(ref, snap => {
  if (!snap.exists()) return;
  players.clear();
  snap.data().players.forEach(p => players.set(p.name, Object.assign(new Player(), p)));
  redraw();
});

/* שמירה */
function save() { setDoc(ref, { players: [...players.values()] }); }

/* פונקציות */
window.addPlayer = () => {
  const n = val('newPlayer'); if (!n || players.has(n)) return;
  players.set(n, new Player(n)); save(); val('newPlayer', '');
};
window.incBuy = d => change('selBuy', 'buy', d);
window.incWin = d => change('selWin', 'win', d);

function change(sel, field, d) {
  const n = val(sel); if (!n) return;
  players.get(n)[field] = Math.max(0, players.get(n)[field] + d);
  save();
}

window.showSettle = () => {
  const arr = [...players.values()];
  const payers = arr.filter(p => p.net < 0).sort((a, b) => a.net - b.net);
  const takers = arr.filter(p => p.net > 0).sort((a, b) => b.net - a.net);
  const out = []; let i = 0, j = 0;
  while (i < payers.length && j < takers.length) {
    const pay = Math.min(-payers[i].net, takers[j].net);
    out.push(`${payers[i].name}, ${pay}, ${takers[j].name}`);
    payers[i].buy += pay; takers[j].win -= pay;
    if (payers[i].net === 0) i++; if (takers[j].net === 0) j++;
  }
  val('result', out.join('\n') || 'כולם מאוזנים 🎉');
};

function redraw() {
  document.querySelectorAll('select').forEach(s => s.innerHTML = '');
  players.forEach(p => addOpt(p.name));
}
function addOpt(n) {
  ['selBuy', 'selWin'].forEach(id => {
    const o = document.createElement('option');
    o.value = o.textContent = n;
    document.getElementById(id).appendChild(o);
  });
}
const val = (id, v) => v === undefined
  ? document.getElementById(id).value
  : (document.getElementById(id).value = v);
