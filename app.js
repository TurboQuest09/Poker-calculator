import { db, ref, set, push, onValue, update } from "./firebase.js";

let players = [];
let currentGameId = null;

// פתיחת משחק חדש
window.startNewGame = function() {
  const now = new Date();
  const id = now.getTime().toString();
  const dateStr = now.toLocaleString('he-IL');

  currentGameId = id;

  // שמירת משחק חדש
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

// הוספת שחקן חדש
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

// הצגת השחקנים
function renderPlayers() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");
  buyList.innerHTML = "";
  winList.innerHTML = "";

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
  });
}

// שמירת מצב המשחק
function saveGame() {
  if (currentGameId) {
    update(ref(db, 'games/' + currentGameId), {
      players: players
    });
  }
}

// חישוב סיכום ואיזון
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

// העתקת הסיכום
window.copyResult = function() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("הועתק!");
  });
};

// הצגת מסך משחק
function showGameScreen() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
}

// טעינת כל המשחקים במסך פתיחה
function loadGamesList() {
  onValue(ref(db, 'games'), (snapshot) => {
    const data = snapshot.val();
    const gamesList = document.getElementById("gamesList");
    gamesList.innerHTML = "";

    if (data) {
      Object.keys(data).reverse().forEach(id => {
        const btn = document.createElement("button");
        btn.textContent = `משחק מ־ ${data[id].date}`;
        btn.onclick = () => loadGame(id);
        gamesList.appendChild(btn);
      });
    }
  });
}

loadGamesList();
