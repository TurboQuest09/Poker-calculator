let players = [];

function startGame() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
}

function addPlayer() {
  const nameInput = document.getElementById("newPlayer");
  const name = nameInput.value.trim();
  if (!name) return;

  players.push({ name: name, buy: 0, win: 0 });
  nameInput.value = "";
  updatePlayersList();
}

function updatePlayersList() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");

  buyList.innerHTML = "";
  winList.innerHTML = "";

  players.forEach((player, index) => {
    // לקנייה
    const buyRow = document.createElement("div");
    buyRow.className = "playerRow";
    buyRow.innerHTML = `
      <span>${player.name}</span>
      <button onclick="incBuy(${index}, 1)">+1</button>
      <button onclick="incBuy(${index}, -1)">-1</button>
      <span>סה"כ קניות: ${player.buy}</span>
    `;
    buyList.appendChild(buyRow);

    // לניצחון
    const winRow = document.createElement("div");
    winRow.className = "playerRow";
    winRow.innerHTML = `
      <span>${player.name}</span>
      <button onclick="incWin(${index}, 1)">+1</button>
      <button onclick="incWin(${index}, -1)">-1</button>
      <span>סה"כ ניצחונות: ${player.win}</span>
    `;
    winList.appendChild(winRow);
  });
}

function incBuy(index, amount) {
  players[index].buy += amount;
  if (players[index].buy < 0) players[index].buy = 0;
  updatePlayersList();
}

function incWin(index, amount) {
  players[index].win += amount;
  if (players[index].win < 0) players[index].win = 0;
  updatePlayersList();
}

function showSettle() {
  let result = "תוצאה:\n\n";

  players.forEach(p => {
    const balance = p.win - p.buy;
    result += `${p.name}: מאזן ${balance}\n`;
  });

  result += "\n";

  // ממי למי (פשטני כרגע)
  players.forEach(p => {
    if (p.win > p.buy) {
      result += `${p.name} צריך לקבל.\n`;
    } else if (p.buy > p.win) {
      result += `${p.name} צריך לשלם.\n`;
    }
  });

  result += "\nשחקנים (קניות):\n";
  players.forEach(p => {
    result += `${p.name}: ${p.buy} קניות\n`;
  });

  document.getElementById("result").innerText = result;
}

function copyResult() {
  const result = document.getElementById("result").innerText;
  navigator.clipboard.writeText(result).then(() => {
    alert("תוצאה הועתקה!");
  });
}

// חושפים את הפונקציות
window.startGame = startGame;
window.addPlayer = addPlayer;
window.incBuy = incBuy;
window.incWin = incWin;
window.showSettle = showSettle;
window.copyResult = copyResult;
