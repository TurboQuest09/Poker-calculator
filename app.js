import { db, ref, push, onValue, get, remove, set } from "./firebase.js";

/* ───── משתנים ───── */
let players = [];
let currentGameId = null;

/* ───── אתחול רשימת משחקים ───── */
loadGamesList();

/* ───── יצירת משחק חדש ───── */
function startNewGame() {
  currentGameId = push(ref(db, "games"), { created: Date.now(), players: {} }).key;
  players = [];
  toggleScreens("main");
  updateLists();
}

/* ───── הוספת שחקן ───── */
function addPlayer() {
  const input = document.getElementById("newPlayer");
  const name  = input.value.trim();
  const err   = document.getElementById("nameError");

  if (!name) return;
  if (players.some(p => p.name === name)) {
    err.textContent = "⚠️ השם כבר קיים!";
    return;
  }
  err.textContent = "";
  players.push({ name, buy: 0, win: 0 });
  updateLists();
  input.value = "";
}

/* ───── עדכון כמות קנייה / ניצחון ───── */
function adjustScore(i, type, d) {
  if (type === "buy") players[i].buy += d;
  else                 players[i].win += d;
  updateLists();
}

/* ───── בניית שורה לרשימה ───── */
function row(i, type) {
  const div = document.createElement("div");
  div.className = "playerRow";

  const name = document.createElement("span");
  name.className = "playerName";
  name.textContent = players[i].name;

  const minus = document.createElement("button");
  minus.textContent = "-1";
  minus.onclick = () => adjustScore(i, type, -1);

  const plus = document.createElement("button");
  plus.textContent = "+1";
  plus.onclick  = () => adjustScore(i, type, 1);

  div.append(name, minus, plus);
  return div;
}

/* ───── ריענון שתי הרשימות ───── */
function updateLists() {
  ["buy","win"].forEach(type => {
    const list = document.getElementById(type + "List");
    list.innerHTML = "";
    players.forEach((_, i) => list.appendChild(row(i, type)));
  });
}

/* ───── חישוב איזון (מי-מעביר-למי) ───── */
function showSettle() {
  const net = players.map(p => ({ name:p.name, bal:p.win - p.buy }));
  const owes=[], gets=[];
  net.forEach(p => p.bal<0 ? owes.push({...p}) : gets.push({...p}));
  owes.sort((a,b)=>a.bal-b.bal);          // שלילי -> הכי חייב
  gets.sort((a,b)=>b.bal-a.bal);          // חיובי -> הכי מקבל
  const lines=[];
  while (owes.length && gets.length){
    const o = owes[0], g = gets[0];
    const pay = Math.min(-o.bal, g.bal);
    lines.push(`${o.name} ➜ ${g.name}: ‎${pay}`);
    o.bal += pay; g.bal -= pay;
    if (o.bal===0) owes.shift();
    if (g.bal===0) gets.shift();
  }
  document.getElementById("result").textContent =
    lines.length ? lines.join("\n") :
    "אין חובות – כולם מאוזנים.";
}

/* ───── העתקת תוצאה ללוח ───── */
function copyResult() {
  navigator.clipboard.writeText(document.getElementById("result").textContent);
}

/* ───── טעינת רשימת משחקים מה-DB ───── */
function loadGamesList() {
  onValue(ref(db,"games"), snap => {
    const wrap = document.getElementById("gamesList");
    wrap.innerHTML = "";
    snap.forEach(child => {
      const id  = child.key;
      const div = document.createElement("div");
      div.className = "gameItem";

      const small = document.createElement("span");
      small.textContent = "🃏 " + new Date(child.val().created).toLocaleString("he-IL");

      const del  = document.createElement("button");
      del.className = "delBtn";
      del.textContent = "🗑️";
      del.onclick = () => deleteGame(id, small.textContent);

      div.append(small, del);
      wrap.appendChild(div);
    });
  });
}

/* ───── מחיקת משחק + לוג ───── */
function deleteGame(id, label) {
  if (!confirm(`למחוק את המשחק "${label}"?`)) return;
  remove(ref(db,`games/${id}`));
  push(ref(db,"logs"), { when: Date.now(), label });
}

/* ───── הצגת לוג מחיקות ───── */
function showLogScreen() {
  toggleScreens("log");
  const box = document.getElementById("logsList");
  box.innerHTML = "טוען...";
  get(ref(db,"logs")).then(snap=>{
    if (!snap.exists()){ box.textContent="אין מחיקות"; return; }
    const data = [];
    snap.forEach(c=>data.push(c.val()));
    box.innerHTML = data.sort((a,b)=>b.when-a.when)
      .map(l=>`🗑️ ‎${new Date(l.when).toLocaleString("he-IL")} – ${l.label}`)
      .join("<br>");
  });
}

/* ───── מעבר מסכים ───── */
function showStartScreen(){ toggleScreens("start"); }
function toggleScreens(what){
  document.getElementById("startScreen").classList.toggle("hidden", what!=="start");
  document.getElementById("mainScreen").classList.toggle("hidden",  what!=="main");
  document.getElementById("logScreen").classList.toggle("hidden",   what!=="log");
}

/* ───── חשיפת פונקציות ל-HTML ───── */
window.startNewGame = startNewGame;
window.addPlayer    = addPlayer;
window.showSettle   = showSettle;
window.copyResult   = copyResult;
window.showLogScreen= showLogScreen;
window.showStartScreen = showStartScreen;
