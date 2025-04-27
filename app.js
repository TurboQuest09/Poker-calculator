import { db, ref, push, update, remove } from "./firebase.js";

// משתנים גלובליים
let players = [];
let currentGameId = null;

/* ─────────────  פונקציות ראשיות  ───────────── */

function startNewGame() {
  currentGameId = push(ref(db, "games")).key;   // יצירת game חדש
  players = [];
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
  updateLists();
}

function addPlayer() {
  const input = document.getElementById("newPlayer");
  const name  = input.value.trim();
  const err   = document.getElementById("nameError");

  if (!name) return;
  if (players.find(p => p.name === name)) {
    err.textContent = "⚠️ השם כבר קיים!";
    return;
  }

  err.textContent = "";
  players.push({ name, buy: 0, win: 0 });
  updateLists();
  input.value = "";
}

function adjustScore(idx, type, delta) {
  if (type === "buy") players[idx].buy += delta;
  else                players[idx].win += delta;
  updateLists();
}

function updateLists() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");
  buyList.innerHTML = "";
  winList.innerHTML = "";

  players.forEach((p, i) => {
    buyList.appendChild(row(i, "buy"));
    winList.appendChild(row(i, "win"));
  });
}

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

function showSettle() {
  const pre = document.getElementById("result");
  pre.textContent = players
    .map(p => `${p.name}: ניצחונות ${p.win} - קניות ${p.buy}`)
    .join("\n");
}

function copyResult() {
  navigator.clipboard.writeText(document.getElementById("result").textContent);
}

/* ─────────────  ניווט מסכים  ───────────── */

function showLogScreen() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("logScreen").classList.remove("hidden");
}

function showStartScreen() {
  document.getElementById("logScreen").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
}

/* ─────────────  חשיפת פונקציות ל-HTML  ───────────── */
/*  בגלל שאנחנו בטיפוס module חייבים לשים על window */
window.startNewGame    = startNewGame;
window.addPlayer       = addPlayer;
window.showSettle      = showSettle;
window.copyResult      = copyResult;
window.showLogScreen   = showLogScreen;
window.showStartScreen = showStartScreen;
