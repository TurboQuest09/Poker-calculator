import { db, ref, push, onValue, get, remove, set } from "./firebase.js";

/* ───── מצב ───── */
let players = [];
let currentGameId = null;
let unsubscribePlayers = null;           // לשמירת פונקציית-ביטול
const lastSavedId = localStorage.getItem("currentGameId");

/* ───── מסך פתיחה ───── */
loadGamesList();
toggleScreens("start");

/* ───── יצירת משחק חדש ───── */
function startNewGame() {
  const newRef = push(ref(db, "games"), { created: Date.now() });
  currentGameId = newRef.key;
  localStorage.setItem("currentGameId", currentGameId);
  players = [];
  savePlayers();
  attachPlayersListener();
  toggleScreens("main");
  updateLists();
}

/* ───── פתיחת משחק קיים ───── */
function openGame(id) {
  detachPlayersListener();
  currentGameId = id;
  localStorage.setItem("currentGameId", id);
  attachPlayersListener();
  toggleScreens("main");
}

/* ───── מאזין real-time ───── */
function attachPlayersListener() {
  if (!currentGameId) return;
  const pRef = ref(db, `games/${currentGameId}/players`);
  unsubscribePlayers = onValue(pRef, snap => {
    players = snap.exists() ? Object.values(snap.val()) : [];
    updateLists();
  });
}
function detachPlayersListener() {
  if (typeof unsubscribePlayers === "function") unsubscribePlayers();
  unsubscribePlayers = null;
}

/* ───── CRUD שחקנים ───── */
function addPlayer() {
  const input = document.getElementById("newPlayer");
  const name  = input.value.trim();
  const err   = document.getElementById("nameError");
  if (!name) return;
  if (players.some(p => p.name === name)) { err.textContent = "⚠️ השם כבר קיים!"; return; }
  err.textContent = "";
  players.push({ name, buy: 0, win: 0 });
  input.value = "";
  savePlayers();
}
function adjustScore(i, type, d) {
  if (type === "buy") players[i].buy += d;
  else                players[i].win += d;
  savePlayers();
}
function savePlayers() {
  if (!currentGameId) return;
  const obj = {}; players.forEach((p, i) => obj[i] = p);
  set(ref(db, `games/${currentGameId}/players`), obj);
}

/* ───── UI ───── */
function updateLists() {
  ["buy", "win"].forEach(type => {
    const list = document.getElementById(type + "List");
    list.innerHTML = "";
    players.forEach((_, i) => list.appendChild(row(i, type)));
    const total = players.reduce((s, p) => s + (type === "buy" ? p.buy : p.win), 0);
    const sum = document.createElement("div");
    sum.className = "totalRow";
    sum.textContent = `סה״כ ${type === "buy" ? "קניות" : "ניצחונות"}: ‎${total}`;
    list.appendChild(sum);
  });
}
function row(i, type) {
  const p = players[i];
  const div = document.createElement("div"); div.className = "playerRow";
  div.innerHTML = `
    <span class="playerName">${p.name}</span>
    <span class="countSpan">${type === "buy" ? p.buy : p.win}</span>
    <button>-1</button><button>+1</button>`;
  const [minus, plus] = div.querySelectorAll("button");
  minus.onclick = () => adjustScore(i, type, -1);
  plus .onclick = () => adjustScore(i, type,  1);
  return div;
}

/* ───── איזון ───── */
function showSettle() {
  const purchases = players.map(p => `${p.name}: ${p.buy}`).join("\n");
  const totalBuys = players.reduce((s, p) => s + p.buy, 0);

  const owes = [], gets = [];
  players.forEach(p => {
    const bal = p.win - p.buy;
    (bal < 0 ? owes : gets).push({ name: p.name, bal: Math.abs(bal) });
  });
  owes.sort((a, b) => b.bal - a.bal);
  gets.sort((a, b) => b.bal - a.bal);

  const moves = [];
  while (owes.length && gets.length) {
    const o = owes[0], g = gets[0];
    const pay = Math.min(o.bal, g.bal);
    moves.push(`${o.name} ➜ ${g.name}: ‎${pay}`);
    o.bal -= pay; g.bal -= pay;
    if (!o.bal) owes.shift();
    if (!g.bal) gets.shift();
  }

  document.getElementById("result").textContent =
`קניות:
${purchases}
סה״כ קניות: ‎${totalBuys}

מאזן:
${moves.length ? moves.join("\n") : "אין חובות – כולם מאוזנים."}`;
}
function copyResult() {
  navigator.clipboard.writeText(document.getElementById("result").textContent)
    .catch(() => alert("‎⚠️ העתקה נכשלה"));
}

/* ───── רשימת משחקים ───── */
function loadGamesList() {
  onValue(ref(db, "games"), snap => {
    const wrap = document.getElementById("gamesList");
    wrap.innerHTML = "";

    if (lastSavedId && snap.hasChild(lastSavedId)) {
      const dt = new Date(snap.child(lastSavedId).val().created).toLocaleString("he-IL");
      const btn = document.createElement("button");
      btn.textContent = `🎯 המשך למשחק האחרון (${dt})`;
      btn.style.background = "#17a2b8";
      btn.onclick = () => openGame(lastSavedId);
      wrap.appendChild(btn);
    }

    if (!snap.exists()) { wrap.append("אין משחקים"); return; }

    snap.forEach(child => {
      const id = child.key;
      const label = "🃏 " + new Date(child.val().created).toLocaleString("he-IL");

      const row = document.createElement("div");
      row.className = "gameItem";
      row.onclick = () => openGame(id);

      const span = document.createElement("span");
      span.textContent = label;

      const del = document.createElement("button");
      del.className = "delBtn"; del.textContent = "🗑️";
      del.onclick = e => { e.stopPropagation(); deleteGame(id, label); };

      row.append(span, del);
      wrap.appendChild(row);
    });
  });
}

/* ───── מחיקה + לוג ───── */
function deleteGame(id, label) {
  if (!confirm(`למחוק את "${label}"?`)) return;
  remove(ref(db, `games/${id}`));
  push(ref(db, "logs"), { when: Date.now(), label });
  if (id === currentGameId) {
    localStorage.removeItem("currentGameId");
    detachPlayersListener();
    toggleScreens("start");
  }
}

/* ───── לוג מחיקות ───── */
function showLogScreen() {
  toggleScreens("log");
  const box = document.getElementById("logsList");
  box.innerHTML = "טוען...";
  get(ref(db, "logs")).then(s => {
    if (!s.exists()) { box.textContent = "אין מחיקות"; return; }
    const arr = []; s.forEach(c => arr.push(c.val()));
    box.innerHTML = arr.sort((a, b) => b.when - a.when)
      .map(l => `🗑️ ‎${new Date(l.when).toLocaleString("he-IL")} – ${l.label}`)
      .join("<br>");
  });
}

/* ───── ניווט ───── */
function toggleScreens(v) {
  document.getElementById("startScreen").classList.toggle("hidden", v !== "start");
  document.getElementById("mainScreen") .classList.toggle("hidden", v !== "main");
  document.getElementById("logScreen")  .classList.toggle("hidden", v !== "log");
}
function showStartScreen() { toggleScreens("start"); }

/* ───── חשיפה ל-HTML ───── */
window.startNewGame    = startNewGame;
window.addPlayer       = addPlayer;
window.showSettle      = showSettle;
window.copyResult      = copyResult;
window.showLogScreen   = showLogScreen;
window.showStartScreen = showStartScreen;
