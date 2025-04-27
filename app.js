import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, get, child, update, remove } from "firebase/database";
import { firebaseConfig } from "./firebase.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// משתנים
let players = [];
let currentGameId = null;

// פונקציות

function startNewGame() {
  currentGameId = push(ref(db, 'games')).key;
  players = [];
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
  updateLists();
}

function addPlayer() {
  const input = document.getElementById("newPlayer");
  const name = input.value.trim();
  const nameError = document.getElementById("nameError");
  if (!name) return;

  if (players.find(p => p.name === name)) {
    nameError.textContent = "⚠️ השם כבר קיים!";
    return;
  }

  nameError.textContent = "";
  players.push({ name: name, buy: 0, win: 0 });
  updateLists();
  input.value = "";
}

function updateLists() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");

  buyList.innerHTML = "";
  winList.innerHTML = "";

  players.forEach((p, index) => {
    buyList.appendChild(createPlayerRow(index, "buy"));
    winList.appendChild(createPlayerRow(index, "win"));
  });
}

function createPlayerRow(index, type) {
  const div = document.createElement("div");
  div.className = "playerRow";

  const nameSpan = document.createElement("span");
  nameSpan.className = "playerName";
  nameSpan.innerText = players[index].name;

  const minusBtn = document.createElement("button");
  minusBtn.innerText = "-1";
  minusBtn.onclick = () => adjustScore(index, type, -1);

  const plusBtn = document.createElement("button");
  plusBtn.innerText = "+1";
  plusBtn.onclick = () => adjustScore(index, type, 1);

  div.appendChild(nameSpan);
  div.appendChild(minusBtn);
  div.appendChild(plusBtn);

  return div;
}

function adjustScore(index, type, amount) {
  if (type === "buy") {
    players[index].buy += amount;
  } else {
    players[index].win += amount;
  }
  updateLists();
}

function showSettle() {
  const result = document.getElementById("result");
  result.innerText = players.map(p => `${p.name}: ניצחונות ${p.win} - קניות ${p.buy}`).join("\n");
}

function copyResult() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text);
}

function showLogScreen() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("logScreen").classList.remove("hidden");
}

function showStartScreen() {
  document.getElementById("logScreen").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
}

// זמינות בפעולות
window.startNewGame = startNewGame;
window.addPlayer = addPlayer;
window.showSettle = showSettle;
window.copyResult = copyResult;
window.showLogScreen = showLogScreen;
window.showStartScreen = showStartScreen;
