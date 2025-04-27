let players = [];

function addPlayer() {
  const nameInput = document.getElementById("newPlayer");
  const name = nameInput.value.trim();
  if (!name) return;

  players.push({ name: name, buy: 0, win: 0 });
  nameInput.value = "";
  updatePlayers();
  updateTotals();
}

function updatePlayers() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");
  buyList.innerHTML = "";
  winList.innerHTML = "";

  players.forEach((p, index) => {
    // קנייה
    const buyRow = document.createElement("div");
    buyRow.className = "player-row";
    buyRow.innerHTML = `
      <span>${p.name}: ${p.buy}</span>
      <div class="buttons">
        <button onclick="incBuy(${index}, 1)">+1</button>
        <button onclick="incBuy(${index}, -1)">-1</button>
      </div>
    `;
    buyList.appendChild(buyRow);

    // ניצחון
    const winRow = document.createElement("div");
    winRow.className = "player-row";
    winRow.innerHTML = `
      <span>${p.name}: ${p.win}</span>
      <div class="buttons">
        <button onclick="incWin(${index}, 1)">+1</button>
        <button onclick="incWin(${index}, -1)">-1</button>
      </div>
    `;
    winList.appendChild(winRow);
  });
}

function incBuy(index, amount) {
  players[index].buy += amount;
  if (players[index].buy < 0) players[index].buy = 0;
  updatePlayers();
  updateTotals();
}

function incWin(index, amount) {
  players[index].win += amount;
  if (players[index].win < 0) players[index].win = 0;
  updatePlayers();
  updateTotals();
}

function updateTotals() {
  const totalBuy = players.reduce((sum, p) => sum + p.buy, 0);
  const totalWin = players.reduce((sum, p) => sum + p.win, 0);
  document.getElementById("totalBuy").innerText = totalBuy;
  document.getElementById("totalWin").innerText = totalWin;
}

function showSettle() {
  let result = "";

  players.forEach((p) => {
    const balance = p.win - p.buy;
    result += `${p.name}: ${balance}\n`;
  });

  result += "\n---\n";

  let balances = players.map(p => ({ name: p.name, balance: p.win - p.buy }));
  balances.sort((a, b) => a.balance - b.balance);

  let i = 0, j = balances.length - 1;
  while (i < j) {
    let debtor = balances[i];
    let creditor = balances[j];
    let amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (amount > 0) {
      result += `${debtor.name} משלם ${amount} ל${creditor.name}\n`;
    }

    balances[i].balance += amount;
    balances[j].balance -= amount;

    if (balances[i].balance === 0) i++;
    if (balances[j].balance === 0) j--;
  }

  const totalBuy = players.reduce((sum, p) => sum + p.buy, 0);
  result += `\nסה"כ קניות: ${totalBuy}\n`;

  document.getElementById("result").innerText = result;
}

function copyResult() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 הסיכום הועתק!");
  });
}

// חושפים פונקציות
window.addPlayer = addPlayer;
window.incBuy = incBuy;
window.incWin = incWin;
window.showSettle = showSettle;
window.copyResult = copyResult;
