import { db, ref, set, push, onValue, remove, update } from "./firebase.js";

let players = [];
let currentGameId = null;

// התחלת משחק חדש
window.startNewGame = function() {
  const now = new Date();
  const id = now.getTime().toString();
  const dateStr = now.toLocaleString('he-IL');

  currentGameId = id;

  set(ref(db, 'games/' + id), {
    date: dateStr,
    players: []
  });

  players = [];
  showGameScreen();
  renderPlayers();
};

// טעינת משחק קיים
window.loadGame = function(id) {
  currentGameId = id;

  onValue(ref(db, 'games/' + id), (snapshot) => {
    const data = snapshot.val();
    players = data.players || [];
    renderPlayers();
  });

  showGameScreen();
};

// מחיקת משחק
window.deleteGame = function(id) {
  if (confirm("האם למחוק את המשחק?")) {
    remove(ref(db, 'games/' + id));

    const now = new Date().toLocaleString('he-IL');
    push(ref(db, 'logs/deletions'), {
      gameId: id,
      time: now
    });
  }
};

// שחזור משחק
window.restoreGame = function(id) {
  onValue(ref(db, 'logs/deletions/' + id), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const newId = new Date().getTime().toString();
      set(ref(db, 'games/' + newId), {
        date: data.time,
        players: []
      });
      alert("משחק שוחזר!");
      showStartScreen();
    }
  });
};

// הוספת שחקן
window.addPlayer = function() {
  const nameInput = document.getElementById("newPlayer");
  const name = nameInput.value.trim();
  if (!name) return;

  players.push({ name: name, buy: 0, win: 0 });
  nameInput.value = "";
  saveGame();
  renderPlayers();
};

// עדכון קנייה
window.incBuy = function(index, amount) {
  players[index].buy += amount;
  if (players[index].buy < 0) players[index].buy = 0;
  saveGame();
  renderPlayers();
};

// עדכון ניצחון
window.incWin = function(index, amount) {
  players[index].win += amount;
  if (players[index].win < 0) players[index].win = 0;
  saveGame();
  renderPlayers();
};

// שמירת מצב המשחק
function saveGame() {
  if (currentGameId) {
    update(ref(db, 'games/' + currentGameId), {
      players: players
    });
  }
}

// הצגת רשימת שחקנים
function renderPlayers() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");
  const totalBuys = document.getElementById("totalBuys");
  const totalWins = document.getElementById("totalWins");

  buyList.innerHTML = "";
  winList.innerHTML = "";

  let sumBuys = 0;
  let sumWins = 0;

  players.forEach((player, index) => {
    const buyRow = document.createElement("div");
    buyRow.innerHTML = `
      ${player.name}: ${player.buy}
      <button onclick="incBuy(${index},1)">+1</button>
      <button onclick="incBuy(${index},-1)">-1</button>
    `;
    buyList.appendChild(buyRow);

    const winRow = document.createElement("div");
    winRow.innerHTML = `
      ${player.name}: ${player.win}
      <button onclick="incWin(${index},1)">+1</button>
      <button onclick="incWin(${index},-1)">-1</button>
    `;
    winList.appendChild(winRow);

    sumBuys += player.buy;
    sumWins += player.win;
  });

  totalBuys.textContent = sumBuys;
  totalWins.textContent = sumWins;
}

// חישוב סיכום
window.showSettle = function() {
  let result = "";

  result += "📋 שחקנים:\n";
  players.forEach(p => {
    result += `${p.name}: ${p.buy} קניות\n`;
  });

  const totalBuy = players.reduce((sum, p) => sum + p.buy, 0);
  result += `סה"כ קניות: ${totalBuy}\n\n`;

  result += "📈 מאזן:\n";
  const balances = players.map(p => ({ name: p.name, balance: p.win - p.buy }));

  balances.forEach(p => {
    result += `${p.name}: ${p.balance}\n`;
  });

  result += "\n💸 תשלומים:\n";
  const payers = balances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);
  const receivers = balances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);

  let i = 0, j = 0;
  while (i < payers.length && j < receivers.length) {
    const amount = Math.min(-payers[i].balance, receivers[j].balance);
    result += `${payers[i].name} משלם ${amount} ל${receivers[j].name}\n`;
    payers[i].balance += amount;
    receivers[j].balance -= amount;
    if (payers[i].balance === 0) i++;
    if (receivers[j].balance === 0) j++;
  }

  document.getElementById("result").innerText = result;
};

// העתקת סיכום
window.copyResult = function() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 הסיכום הועתק!");
  });
};

// מסך משחק
function showGameScreen() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
  document.getElementById("logScreen").classList.add("hidden");
}

// חזרה למסך ראשי
window.showStartScreen = function() {
  document.getElementById("startScreen").classList.remove("hidden");
  document.getElementById("mainScreen").classList.add("hidden");
  document.getElementById("logScreen").classList.add("hidden");
}

// הצגת לוג מחיקות
window.showLogScreen = function() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.add("hidden");
  document.getElementById("logScreen").classList.remove("hidden");

  const logsList = document.getElementById("logsList");
  logsList.innerHTML = "";

  onValue(ref(db, 'logs/deletions'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      Object.keys(data).reverse().forEach(id => {
        const div = document.createElement("div");
        div.textContent = `🗑️ ${data[id].time} - משחק ${data[id].gameId}`;
        div.onclick = () => restoreGame(id);
        logsList.appendChild(div);
      });
    } else {
      logsList.innerHTML = "אין מחיקות.";
    }
  });
};

// טעינת רשימת משחקים
function loadGamesList() {
  const gamesList = document.getElementById("gamesList");
  onValue(ref(db, 'games'), (snapshot) => {
    const data = snapshot.val();
    gamesList.innerHTML = "";

    if (data) {
      Object.keys(data).reverse().forEach(id => {
        const container = document.createElement("div");
        container.className = "game-item";

        const btn = document.createElement("button");
        btn.textContent = `משחק מ־ ${data[id].date}`;
        btn.onclick = () => loadGame(id);

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ מחק";
        delBtn.onclick = () => deleteGame(id);

        container.appendChild(btn);
        container.appendChild(delBtn);
        gamesList.appendChild(container);
      });
    }
  });
}

loadGamesList();
