let players = [];

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
  let result = "";

  players.forEach((p) => {
    const balance = p.win - p.buy;
    result += `${p.name}: ${balance}\n`;
  });

  document.getElementById("result").innerText = result;
}

// מאפשרים גישה מהכפתורים
window.addPlayer = addPlayer;
window.incBuy = incBuy;
window.incWin = incWin;
window.showSettle = showSettle;
