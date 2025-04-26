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
  updatePlayerLists();
  nameInput.value = "";
}

function updatePlayerLists() {
  const buyList = document.getElementById("buyList");
  const winList = document.getElementById("winList");
  buyList.innerHTML = "";
  winList.innerHTML = "";

  players.forEach((p, index) => {
    // שורה לקנייה
    const buyRow = document.createElement("div");
    buyRow.innerHTML = `
      ${p.name}: ${p.buy}
      <button onclick="changeBuy(${index}, 1)">+1</button>
      <button onclick="changeBuy(${index}, -1)">-1</button>
    `;
    buyList.appendChild(buyRow);

    // שורה לניצחון
    const winRow = document.createElement("div");
    winRow.innerHTML = `
      ${p.name}: ${p.win}
      <button onclick="changeWin(${index}, 1)">+1</button>
      <button onclick="changeWin(${index}, -1)">-1</button>
    `;
    winList.appendChild(winRow);
  });
}

function changeBuy(index, amount) {
  players[index].buy += amount;
  updatePlayerLists();
}

function changeWin(index, amount) {
  players[index].win += amount;
  updatePlayerLists();
}

function showSettle() {
  let result = "";

  players.forEach((p) => {
    const balance = p.win - p.buy;
    result += `${p.name}: ${balance}\n`;
  });

  document.getElementById("result").innerText = result;
}

// חושפים פונקציות ל־onclick
window.startGame = startGame;
window.addPlayer = addPlayer;
window.changeBuy = changeBuy;
window.changeWin = changeWin;
window.showSettle = showSettle;
