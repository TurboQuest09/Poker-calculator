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

  updateBuyList();
  updateWinList();
}

function updateBuyList() {
  const buyList = document.getElementById("buyList");
  buyList.innerHTML = "";

  players.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "playerRow";
    row.innerHTML = `
      <strong>${p.name}</strong>
      <button onclick="incBuy(${index}, 1)">+1</button>
      <button onclick="incBuy(${index}, -1)">-1</button>
      <span id="buy-${index}">סה"כ: ${p.buy}</span>
    `;
    buyList.appendChild(row);
  });
}

function updateWinList() {
  const winList = document.getElementById("winList");
  winList.innerHTML = "";

  players.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "playerRow";
    row.innerHTML = `
      <strong>${p.name}</strong>
      <button onclick="incWin(${index}, 1)">+1</button>
      <button onclick="incWin(${index}, -1)">-1</button>
      <span id="win-${index}">סה"כ: ${p.win}</span>
    `;
    winList.appendChild(row);
  });
}

function incBuy(index, amount) {
  players[index].buy += amount;
  document.getElementById(`buy-${index}`).innerText = `סה"כ: ${players[index].buy}`;
}

function incWin(index, amount) {
  players[index].win += amount;
  document.getElementById(`win-${index}`).innerText = `סה"כ: ${players[index].win}`;
}

function showSettle() {
  let result = "📋 סיכום משחק:\n\n";

  players.forEach((p) => {
    const balance = p.win - p.buy;
    result += `${p.name}: ${balance >= 0 ? "+" : ""}${balance}\n`;
  });

  result += "\n";

  // חישוב חובות
  const debts = calculateDebts();
  debts.forEach(debt => {
    result += `💸 ${debt.from} משלם ל-${debt.to}: ${debt.amount} ש"ח\n`;
  });

  // הצגת שמות וקניות
  result += "\n🧑‍🤝‍🧑 רשימת שחקנים:\n";
  players.forEach((p) => {
    result += `• ${p.name} - קנייה: ${p.buy}\n`;
  });

  document.getElementById("result").innerText = result;
}

function calculateDebts() {
  const balances = players.map(p => ({
    name: p.name,
    balance: p.win - p.buy
  }));

  balances.sort((a, b) => a.balance - b.balance);

  const debts = [];
  let i = 0, j = balances.length - 1;

  while (i < j) {
    const debtor = balances[i];
    const creditor = balances[j];
    const amount = Math.min(-debtor.balance, creditor.balance);

    if (amount > 0) {
      debts.push({ from: debtor.name, to: creditor.name, amount: amount });
      debtor.balance += amount;
      creditor.balance -= amount;
    }

    if (debtor.balance === 0) i++;
    if (creditor.balance === 0) j--;
  }

  return debts;
}

function copySummary() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 הסיכום הועתק! אפשר להדביק בווטסאפ ✅");
  });
}

// מאפשרים גישה מהכפתורים
window.startGame = startGame;
window.addPlayer = addPlayer;
window.incBuy = incBuy;
window.incWin = incWin;
window.showSettle = showSettle;
window.copySummary = copySummary;
