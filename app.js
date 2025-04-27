let players = [];

window.startGame = function() {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
};

window.addPlayer = function() {
  const nameInput = document.getElementById("newPlayer");
  const name = nameInput.value.trim();
  if (!name) return;

  players.push({ name: name, buy: 0, win: 0 });
  updateUI();
  nameInput.value = "";
};

window.incBuy = function(index, amount) {
  players[index].buy += amount;
  updateUI();
};

window.incWin = function(index, amount) {
  players[index].win += amount;
  updateUI();
};

window.showSettle = function() {
  let result = "סיכום קניות:\n";
  let totalBuy = 0;

  players.forEach(p => {
    result += `${p.name}: ${p.buy}\n`;
    totalBuy += p.buy;
  });

  result += `\nסה"כ קניות: ${totalBuy}\n\n`;
  result += "מאזן:\n";

  const balances = players.map(p => ({ name: p.name, balance: p.win - p.buy }));

  balances.forEach(b => {
    result += `${b.name}: ${b.balance}\n`;
  });

  // חישוב תשלומים
  result += "\nתשלומים:\n";
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.balance, creditor.balance);

    result += `${debtor.name} משלם ${amount} ל${creditor.name}\n`;

    debtor.balance += amount;
    creditor.balance -= amount;

    if (debtor.balance === 0) i++;
    if (creditor.balance === 0) j++;
  }

  document.getElementById("result").innerText = result;
};

window.copyResult = function() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("הועתק!");
  });
};

function updateUI() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");
  const totalBuy = document.getElementById("totalBuy");
  const totalWin = document.getElementById("totalWin");

  buyList.innerHTML = "";
  winList.innerHTML = "";

  let sumBuy = 0;
  let sumWin = 0;

  players.forEach((p, index) => {
    sumBuy += p.buy;
    sumWin += p.win;

    const buyRow = document.createElement("div");
    buyRow.className = "player-row";
    buyRow.innerHTML = `
      ${p.name}: ${p.buy}
      <button onclick="incBuy(${index}, 1)">+1</button>
      <button onclick="incBuy(${index}, -1)">-1</button>
    `;
    buyList.appendChild(buyRow);

    const winRow = document.createElement("div");
    winRow.className = "player-row";
    winRow.innerHTML = `
      ${p.name}: ${p.win}
      <button onclick="incWin(${index}, 1)">+1</button>
      <button onclick="incWin(${index}, -1)">-1</button>
    `;
    winList.appendChild(winRow);
  });

  totalBuy.innerText = sumBuy;
  totalWin.innerText = sumWin;
}
