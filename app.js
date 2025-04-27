let players = [];

function addPlayer() {
  const nameInput = document.getElementById("newPlayer");
  const name = nameInput.value.trim();
  if (!name) return;

  players.push({ name: name, buy: 0, win: 0 });
  nameInput.value = "";
  renderPlayers();
}

function renderPlayers() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");
  buyList.innerHTML = "";
  winList.innerHTML = "";

  players.forEach((player, index) => {
    // קנייה
    const buyRow = document.createElement("div");
    buyRow.className = "player-row";
    buyRow.innerHTML = `
      ${player.name}: סה"כ קניות: ${player.buy}
      <button onclick="incBuy(${index},1)">+1</button>
      <button onclick="incBuy(${index},-1)">-1</button>
    `;
    buyList.appendChild(buyRow);

    // ניצחון
    const winRow = document.createElement("div");
    winRow.className = "player-row";
    winRow.innerHTML = `
      ${player.name}: סה"כ ניצחונות: ${player.win}
      <button onclick="incWin(${index},1)">+1</button>
      <button onclick="incWin(${index},-1)">-1</button>
    `;
    winList.appendChild(winRow);
  });

  updateTotals();
}

function incBuy(index, amount) {
  players[index].buy += amount;
  if (players[index].buy < 0) players[index].buy = 0;
  renderPlayers();
}

function incWin(index, amount) {
  players[index].win += amount;
  if (players[index].win < 0) players[index].win = 0;
  renderPlayers();
}

function updateTotals() {
  const totalBuy = players.reduce((sum, p) => sum + p.buy, 0);
  const totalWin = players.reduce((sum, p) => sum + p.win, 0);

  document.getElementById("totalBuy").innerText = `סה"כ קניות: ${totalBuy}`;
  document.getElementById("totalWin").innerText = `סה"כ ניצחונות: ${totalWin}`;
}

function showSettle() {
  let result = "🔹 רשימת שחקנים וקניות:\n";
  players.forEach(p => {
    result += `${p.name} - קניות: ${p.buy}\n`;
  });

  const totalBuy = players.reduce((sum, p) => sum + p.buy, 0);
  result += `סה"כ קניות: ${totalBuy}\n\n`;

  result += "🔹 רווח/הפסד:\n";
  let balances = [];
  players.forEach(p => {
    const balance = p.win - p.buy;
    balances.push({ name: p.name, balance });
    result += `${p.name}: ${balance}\n`;
  });

  result += "\n🔹 תשלומים:\n";
  const payers = balances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);
  const receivers = balances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);

  let i = 0, j = 0;
  while (i < payers.length && j < receivers.length) {
    const payer = payers[i];
    const receiver = receivers[j];
    const amount = Math.min(-payer.balance, receiver.balance);

    result += `${payer.name} משלם ${amount} ל${receiver.name}\n`;

    payer.balance += amount;
    receiver.balance -= amount;

    if (payer.balance === 0) i++;
    if (receiver.balance === 0) j++;
  }

  document.getElementById("result").innerText = result;
}

function copyResult() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("הסיכום הועתק!");
  });
}

function startGame() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
}

// חושפים את הפונקציות ל־HTML
window.addPlayer = addPlayer;
window.incBuy = incBuy;
window.incWin = incWin;
window.showSettle = showSettle;
window.copyResult = copyResult;
window.startGame = startGame;
