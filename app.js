import { db, ref, push, set, remove, onValue } from "./firebase.js";

/* ====== DOM קיצור ===== */
const $ = (sel) => document.querySelector(sel);

/* ====== מצב גלובלי ===== */
let players = [];
let currentGameId = null;

/* ====== אתחול כש-DOM נטען ===== */
document.addEventListener("DOMContentLoaded", () => {
  // כפתורי מסך הבית
  $("#newGameBtn").addEventListener("click", startNewGame);
  $("#logBtn"     ).addEventListener("click", showLogScreen);
  // כפתורי מסך המשחק
  $("#addPlayerBtn").addEventListener("click", addPlayer);
  $("#copyBtn"     ).addEventListener("click", copyResult);
  $("#settleBtn"   ).addEventListener("click", showSettle);
  // כפתור חזרה
  $("#backBtn").addEventListener("click", showStartScreen);

  loadGames();
});

/* ====== ממשק Firebase למשחקים ===== */
function startNewGame() {
  const newRef = push(ref(db, "games"));
  const when   = Date.now();
  set(newRef, { created: when, players: [] }).then(() => {
    openGame(newRef.key);
  });
}

function openGame(gameId) {
  currentGameId = gameId;
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("logScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");

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
    for (const [id, g] of Object.entries(data)) {
      const wrap = document.createElement("div");

      const btn = document.createElement("button");
      btn.className = "btn-secondary";
      btn.textContent =
        `משחק מ־ ${new Date(g.created).toLocaleString("he-IL")}`;
      btn.onclick = () => openGame(id);

      const del = document.createElement("button");
      del.textContent = "🗑️ מחק";
      del.onclick = () => deleteGame(id, g);

      wrap.append(btn, del);
      list.appendChild(wrap);
    }
  });
}

/* מחיקה → מעביר אל ‎/deletedGames ושומר Stamp */
function deleteGame(id, gameObj) {
  const delRef = push(ref(db, "deletedGames"));
  set(delRef, { ...gameObj, originalId: id, deletedAt: Date.now() })
    .then(() => remove(ref(db, `games/${id}`)));
}

/* ====== לוג מחיקות ===== */
function showLogScreen() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("logScreen").classList.remove("hidden");

  const logs = $("#logsList");
  onValue(ref(db, "deletedGames"), (snap) => {
    logs.innerHTML = "";
    const data = snap.val() || {};
    for (const [id, g] of Object.entries(data)) {
      const row = document.createElement("div");
      row.className = "log-item";
      row.innerHTML =
        `${new Date(g.deletedAt).toLocaleString("he-IL")} | משחק מ־ ${new Date(g.created).toLocaleString("he-IL")}`;

      const restore = document.createElement("button");
      restore.textContent = "♻️ שחזר";
      restore.onclick = () => restoreGame(id, g);

      row.appendChild(restore);
      logs.appendChild(row);
    }
  });
}
function restoreGame(delId, g) {
  const newRef = push(ref(db, "games"));
  set(newRef, { ...g, restoredFrom: delId }).then(() =>
    remove(ref(db, `deletedGames/${delId}`))
  );
}
function showStartScreen() {
  document.getElementById("logScreen").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
}

/* ====== לוגיקת שחקנים בתוך משחק ===== */
function addPlayer() {
  const name = $("#newPlayer").value.trim();
  if (!name || currentGameId === null) return;
  $("#newPlayer").value = "";

  const pRef = push(ref(db, `games/${currentGameId}/players`));
  set(pRef, { id: pRef.key, name, buy: 0, win: 0 });
}

function changeVal(index, type, delta) {
  players[index][type] += delta;
  if (players[index][type] < 0) players[index][type] = 0;

  // עדכון Firebase
  set(
    ref(db, `games/${currentGameId}/players/${players[index].id}`),
    players[index]
  );

  // לוג פעולה
  push(ref(db, `games/${currentGameId}/actions`), {
    time: Date.now(),
    player: players[index].name,
    type,
    delta
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

  // לוג פעולות
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

  row.append(minus, plus, value, ` : ${p.name}`);
  return row;
}

/* ====== לוג פעולות בזמן אמת ===== */
function renderActionLog() {
  const logPre = $("#actionLog");
  onValue(ref(db, `games/${currentGameId}/actions`), (snap) => {
    const arr = snap.val() ? Object.values(snap.val()) : [];
    logPre.textContent = arr
      .map((a) =>
        `${new Date(a.time).toLocaleTimeString("he-IL")} | ${a.player} | ${a.delta > 0 ? "+" : ""}${a.delta} ${a.type === "buy" ? "קנייה" : "ניצחון"}`
      )
      .reverse()
      .join("\n");
  });
}

/* ====== חישוב איזון + העתקה ===== */
function showSettle() {
  let txt = "🔸 רשימת שחקנים וקניות\n";
  players.forEach((p) => (txt += `${p.name} – קניות: ${p.buy}\n`));

  const totalBuy = players.reduce((s, p) => s + p.buy, 0);
  txt += `סה״כ קניות: ${totalBuy}\n\n`;

  txt += "🔸 רווח / הפסד\n";
  const balances = players.map((p) => ({
    name: p.name,
    bal: p.win - p.buy
  }));
  balances.forEach((b) => (txt += `${b.name}: ${b.bal}\n`));

  txt += "\n🔸 תשלומים:\n";
  const payers = balances.filter((b) => b.bal < 0).sort((a, b) => a.bal - b.bal);
  const recvs  = balances.filter((b) => b.bal > 0).sort((a, b) => b.bal - a.bal);

  let i = 0,
    j = 0;
  while (i < payers.length && j < recvs.length) {
    const amount = Math.min(-payers[i].bal, recvs[j].bal);
    txt += `${payers[i].name} ➜ ${recvs[j].name} : ${amount}\n`;
    payers[i].bal += amount;
    recvs[j].bal -= amount;
    if (payers[i].bal === 0) i++;
    if (recvs[j].bal === 0) j++;
  }

  $("#result").textContent = txt;
}

function copyResult() {
  navigator.clipboard.writeText($("#result").textContent).then(() =>
    alert("הסיכום הועתק!")
  );
}
