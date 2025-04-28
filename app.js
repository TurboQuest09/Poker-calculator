import { db, ref, push, set, remove, onValue } from "./firebase.js";

/* ====== DOM קיצור ===== */
const $ = (sel) => document.querySelector(sel);

/* ====== מצב גלובלי ===== */
let players = [];
let currentGameId = null;

/* ====== אתחול ===== */
document.addEventListener("DOMContentLoaded", () => {
  $("#newGameBtn").addEventListener("click", startNewGame);
  $("#logBtn").addEventListener("click", showLogScreen);
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
    btn.textContent = `משחק מ־ ${new Date(g.created).toLocaleString("he-IL")}`;
    btn.onclick = () => openGame(g.id || g.originalId);

    const del = document.createElement("button");
    del.textContent = "🗑️ מחק";
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
        row.textContent = `${new Date(g.deletedAt).toLocaleString("he-IL")} | משחק מ־ ${new Date(g.created).toLocaleString("he-IL")}`;

        const restore = document.createElement("button");
        restore.textContent = "♻️ שחזר";
        restore.onclick = () => restoreGame(g.id, g);

        row.appendChild(restore);
        logs.appendChild(row);
      });
  });
}

function restoreGame(delId, g) {
  const newRef = push(ref(db, "games"));
  set(newRef, { ...g, restoredFrom: delId }).then(() =>
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
  let txt = "🔸 רשימת שחקנים וקניות\n";
  players.forEach(p => txt += `${p.name} – קניות: ${p.buy}\n`);
  txt += `סה״כ קניות: ${players.reduce((s, p) => s + p.buy, 0)}\n\n`;

  txt += "🔸 רווח / הפסד\n";
  const balances = players.map(p => ({ name: p.name, bal: p.win - p.buy }));
  balances.forEach(b => txt += `${b.name}: ${b.bal}\n`);

  txt += "\n🔸 תשלומים:\n";
  const payers = balances.filter(b => b.bal < 0).sort((a, b) => a.bal - b.bal);
  const recvs = balances.filter(b => b.bal > 0).sort((a, b) => b.bal - a.bal);
  let i = 0, j = 0;
  while (i < payers.length && j < recvs.length) {
    const amt = Math.min(-payers[i].bal, recvs[j].bal);
    txt += `${payers[i].name} ${amt} ל${recvs[j].name}\n`;
    payers[i].bal += amt;
    recvs[j].bal -= amt;
    if (payers[i].bal === 0) i++;
    if (recvs[j].bal === 0) j++;
  }
  $("#result").textContent = txt;
}

function copyResult() {
  navigator.clipboard.writeText($("#result").textContent)
    .then(() => alert("הסיכום הועתק!"));
}
