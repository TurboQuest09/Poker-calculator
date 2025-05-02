import { db, ref, push, set, remove, onValue } from "./firebase.js";

/* ====== DOM קיצור ===== */
const $ = (sel) => document.querySelector(sel);

/* ====== מצב גלובלי ===== */
let players = [];
let currentGameId = null;

/* ====== אתחול ===== */
document.addEventListener("DOMContentLoaded", () => {
  $("#newGameBtn").addEventListener("click", startNewGame);
$("#logBtn").addEventListener("click", requestPasswordAndShowLog);

function requestPasswordAndShowLog() {
  const pass = prompt("הכנס סיסמה:");
  if (pass === "101010") { // כאן תחליף לסיסמה שאתה רוצה
    showLogScreen();
  } else {
    alert("סיסמה שגויה");
  }
}
  $("#addPlayerBtn").addEventListener("click", addPlayer);
  $("#copyBtn").addEventListener("click", copyResult);
  $("#settleBtn").addEventListener("click", showSettle);
  $("#backBtn").addEventListener("click", showStartScreen);

  loadGames();
});

/* ====== Firebase − משחקים ===== */
function startNewGame() {
  const newRef = push(ref(db, "games"));
  set(newRef, { created: Date.now(), players: [] }).then(() => openGame(newRef.key));
}

function openGame(gameId) {
  currentGameId = gameId;
  $("#startScreen").classList.add("hidden");
  $("#logScreen").classList.add("hidden");
  $("#mainScreen").classList.remove("hidden");

  onValue(ref(db, `games/${gameId}/players`), (snap) => {
    players = snap.val() ? Object.values(snap.val()) : [];
    renderPlayers();
  });
}

function loadGames() {
  const list = $("#gamesList");
  onValue(ref(db, "games"), (snap) => {
    list.innerHTML = "";
    const data = snap.val() || {};
Object.entries(data)
  .map(([id, g]) => ({ id, ...g }))
  .sort((a, b) => b.created - a.created)
  .forEach((g) => {
    const wrap = document.createElement("div");
    const btn = document.createElement("button");
    btn.className = "btn-secondary";
    btn.textContent = `משחק  ${new Date(g.created).toLocaleString("he-IL")}`;
    btn.onclick = () => openGame(g.id || g.originalId);

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.onclick = () => deleteGame(g.id || g.originalId, g);

    wrap.append(btn, del);
    list.appendChild(wrap);
  });

  });
}

function deleteGame(id, g) {
  const delRef = push(ref(db, "deletedGames"));
  set(delRef, { ...g, originalId: id, deletedAt: Date.now() }).then(() =>
    remove(ref(db, `games/${id}`))
  );
}

/* ====== לוג מחיקות ===== */
function showLogScreen() {
  $("#startScreen").classList.add("hidden");
  $("#logScreen").classList.remove("hidden");

  const logs = $("#logsList");
  onValue(ref(db, "deletedGames"), (snap) => {
    logs.innerHTML = "";
    const data = snap.val() || {};
    Object.entries(data)
      .map(([id, g]) => ({ id, ...g }))
      .sort((a, b) => b.deletedAt - a.deletedAt)
      .forEach((g) => {
        const row = document.createElement("div");
        row.className = "log-item";
        row.innerHTML = `
          ${new Date(g.deletedAt).toLocaleString("he-IL")}
          | משחק מ־ ${new Date(g.created).toLocaleString("he-IL")}
        `;
        row.style.cursor = "pointer";
        row.onclick = () => openDeletedGame(g);
        logs.appendChild(row);
      });
  });
}
function openDeletedGame(g) {
  $("#startScreen").classList.add("hidden");
  $("#logScreen").classList.add("hidden");
  $("#mainScreen").classList.remove("hidden");

  players = g.players ? Object.values(g.players) : [];
  currentGameId = null; // אין GameId כי זה משחק מחוק
  renderPlayers();

  $("#result").textContent = "🔒 מצב צפייה במשחק שנמחק";
}

function restoreGame(delId, g) {
  const { id, deletedAt, ...pureGame } = g; // להוציא id ו-deletedAt
  const newRef = push(ref(db, "games"));
  set(newRef, { ...pureGame, restoredFrom: delId }).then(() =>
    remove(ref(db, `deletedGames/${delId}`))
  );
}

function showStartScreen() {
  $("#logScreen").classList.add("hidden");
  $("#startScreen").classList.remove("hidden");
}

/* ====== שחקנים ===== */
function addPlayer() {
  const input = document.getElementById("newPlayer");
  const raw = input.value.trim();
  if (!raw || !currentGameId) {
    alert("אנא הזן שם שחקן וודא שמשחק פעיל");
    return;
  }
  const nameRegex = /^[\p{L}\s]+$/u;
  if (!nameRegex.test(raw)) {
    alert("השם צריך לכלול רק אותיות ורווחים");
    return;
  }
  if (players.some(p => p.name.toLowerCase() === raw.toLowerCase())) {
    alert(`השחקן "${raw}" כבר קיים במשחק`);
    return;
  }

  input.value = "";
  const pRef = push(ref(db, `games/${currentGameId}/players`));
  set(pRef, { id: pRef.key, name: raw, buy: 0, win: 0 });
}

function changeVal(index, field, delta) {
  players[index][field] += delta;
  if (players[index][field] < 0) players[index][field] = 0;

  set(ref(db, `games/${currentGameId}/players/${players[index].id}`), players[index]);
  push(ref(db, `games/${currentGameId}/actions`), {
    time: Date.now(), player: players[index].name, type: field, delta
  });
}

function renderPlayers() {
  const buyList = $("#buyList");
  const winList = $("#winList");
  buyList.innerHTML = winList.innerHTML = "";

  players.forEach((p, i) => {
    buyList.appendChild(playerRow(p, "buy", i));
    winList.appendChild(playerRow(p, "win", i));
  });

  $("#totalBuy").textContent = players.reduce((s, p) => s + p.buy, 0);
  $("#totalWin").textContent = players.reduce((s, p) => s + p.win, 0);

  renderActionLog();
}

function playerRow(p, field, idx) {
  const row = document.createElement("div");
  row.className = "player-row";

  const minus = document.createElement("button");
  minus.textContent = "-1";
  minus.onclick = () => changeVal(idx, field, -1);

  const plus = document.createElement("button");
  plus.textContent = "+1";
  plus.onclick = () => changeVal(idx, field, 1);

  const value = document.createElement("span");
  value.className = "value";
  value.textContent = p[field];

  const nameSpan = document.createElement("span");
  nameSpan.textContent = p.name;

  row.append(minus, plus, value, nameSpan);
  return row;
}

/* לוג פעולות במשחק */
function renderActionLog() {
  const pre = $("#actionLog");

  onValue(ref(db, `games/${currentGameId}/actions`), (snap) => {
    const arr = snap.val() ? Object.values(snap.val()) : [];
    pre.innerHTML = arr
      .filter(a => a.type === "buy")
      .map(a => {
        const d = new Date(a.time);
        const dt = d.toLocaleDateString("he-IL");
        const tm = d.toLocaleTimeString("he-IL");
return `<span class="ltr">${dt} ${tm}</span> | ${a.player} | ${(a.delta > 0 ? '+' : '')}${a.delta} קנייה`;
      })
      .reverse()
      .join("<br>");
  });
}

/* חישוב איזון */
function showSettle() {
  // כותרות + נתוני כניסות
  let txt = "🧾 רשימת שחקנים וכניסות:\n";
  players.forEach(p => (txt += `${p.name} ${p.buy}\n`));
  txt += `סה״כ כניסות: ${players.reduce((s, p) => s + p.buy, 0)}\n\n`;

  // מאזן רווח / הפסד
  txt += "🧮 מאזן רווח / הפסד:\n";
  const balances = players.map(p => ({ name: p.name, bal: p.win - p.buy }));
  balances.forEach(b => (txt += `${b.name} ${b.bal}\n`));

  // חישוב תשלומים
  txt += "\n💰 סיכום:\n";
  const payers = balances.filter(b => b.bal < 0).sort((a, b) => a.bal - b.bal); // שליליים (גדול->קטן)
  const recvs  = balances.filter(b => b.bal > 0).sort((a, b) => b.bal - a.bal); // חיוביים (גדול->קטן)

  /* ======= אלגוריתם one‑shot‑if‑possible ======= */
  for (const p of payers) {
    if (p.bal === 0) continue;

    // נסה למצוא מקבל יחיד שיכול לסגור את כל החוב
    const r = recvs.find(r => r.bal >= -p.bal);

    if (r) {                                             // 🎯 נסגר במכה אחת
      txt += `${p.name} ${-p.bal} (${-p.bal * 50}) ל${r.name}\n`;
      r.bal += p.bal;            // p.bal שלילי
      p.bal  = 0;
    } else {                                             // אחרת – פיצול כרגיל
      for (const r2 of recvs) {
        if (r2.bal === 0) continue;
        const amt = Math.min(-p.bal, r2.bal);
        txt += `${p.name} ${amt} (${amt * 50}) ל${r2.name}\n`;
        p.bal += amt;
        r2.bal -= amt;
        if (p.bal === 0) break;
      }
    }
  }
  /* ============================================== */

  // מציגים בדף
  $("#result").textContent = txt.trim();
}


function copyResult() {
  navigator.clipboard.writeText($("#result").textContent)
    .then(() => alert("הסיכום הועתק!"));
}
