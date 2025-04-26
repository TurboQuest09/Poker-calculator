let players = [];

function addPlayer() {
  const nameInput = document.getElementById("newPlayer");
  const name = nameInput.value.trim();
  if (!name) return;

  players.push({ name: name, buy: 0, win: 0 });
  updateSelectors();
  nameInput.value = "";
}

function updateSelectors() {
  const selBuy = document.getElementById("selBuy");
  const selWin = document.getElementById("selWin");
  selBuy.innerHTML = "";
  selWin.innerHTML = "";

  players.forEach((p, index) => {
    const opt1 = new Option(p.name, index);
    const opt2 = new Option(p.name, index);
    selBuy.add(opt1);
    selWin.add(opt2);
  });
}

function incBuy(amount) {
  const sel = document.getElementById("selBuy");
  const idx = sel.value;
  if (idx !== "") {
    players[idx].buy += amount;
  }
}

function incWin(amount) {
  const sel = document.getElementById("selWin");
  const idx = sel.value;
  if (idx !== "") {
    players[idx].win += amount;
  }
}

function showSettle() {
  let result = "";

  players.forEach((p) => {
    const balance = p.win - p.buy;
    result += `${p.name}: ${balance}\n`;
  });

  document.getElementById("result").innerText = result;
}

// חושפים את הפונקציות כדי שהכפתורים יפעלו
window.addPlayer = addPlayer;
window.incBuy = incBuy;
window.incWin = incWin;
window.showSettle = showSettle;
