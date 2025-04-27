import { db, ref, push, set, onValue, remove } from "./firebase.js";

/* ───────── משתנים ───────── */
let currentGameId   = null;
let players         = [];

/* ───────── עזר ───────── */
const $ = id => document.getElementById(id);

/* ───────── מסכים ───────── */
window.showStartScreen = () => {
  $("startScreen").classList.remove("hidden");
  $("mainScreen").classList.add   ("hidden");
  $("logScreen").classList.add    ("hidden");
};

/* ───────── יצירת משחק ───────── */
window.startNewGame = () => {
  const ts   = Date.now();
  const game = { created: ts, players: {}, log: [] };
  const newRef = push(ref(db, "games"));
  currentGameId = newRef.key;
  set(newRef, game).then(() => loadGames());
  players = [];
  $("newPlayer").value = "";
  renderPlayers();
  $("startScreen").classList.add ("hidden");
  $("mainScreen").classList.remove("hidden");
};

/* ───────── הוספת שחקן ───────── */
window.addPlayer = () => {
  const name = $("newPlayer").value.trim();
  if (!name) return;
  players.push({ name, buy: 0, win: 0 });
  $("newPlayer").value = "";
  renderPlayers();
  savePlayers();
};

/* ───────── קנייה / ניצחון ───────── */
window.incBuy = (idx, amt) => changeVal(idx, "buy", amt);
window.incWin = (idx, amt) => changeVal(idx, "win", amt);

function changeVal(idx, field, amt) {
  const p = players[idx];
  p[field] = Math.max(0, p[field] + amt);
  logAction(p.name, field === "buy" ? (amt>0?"+1":"-1") : (amt>0?"+1":"-1"));
  renderPlayers();
  savePlayers();
}

/* ───────── לוג פעולה ───────── */
function logAction(name, action) {
  const now = new Date();
  const date = now.toLocaleDateString("he-IL");
  const time = now.toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"});
  const entry = { date, time, name, action };
  const logTbody = $("buyLog").querySelector("tbody");
  const row = logTbody.insertRow();
  row.innerHTML = `<td>${date}</td><td>${time}</td><td>${name}</td><td>${action}</td>`;
  // שמירה ב-Firebase
  if (currentGameId) push(ref(db, `games/${currentGameId}/log`), entry);
}

/* ───────── רנדר שחקנים ───────── */
function renderPlayers() {
  const buyDiv = $("buyList");
  const winDiv = $("winList");
  buyDiv.innerHTML = winDiv.innerHTML = "";

  players.forEach((p,i)=>{
    buyDiv.appendChild(playerRow(p,"buy",i));
    winDiv.appendChild(playerRow(p,"win",i));
  });

  $("totalBuy").innerText = players.reduce((s,p)=>s+p.buy,0);
  $("totalWin").innerText = players.reduce((s,p)=>s+p.win,0);
}

function playerRow(p,type,i){
  const wrap = document.createElement("div");
  wrap.className="player-row";
  const plus  = `<button onclick="inc${type==="buy"?"Buy":"Win"}(${i},1)">+1</button>`;
  const minus = `<button onclick="inc${type==="buy"?"Buy":"Win"}(${i},-1)">-1</button>`;
  const val   = `<span class="value">${p[type]}</span>`;
  wrap.innerHTML = `${minus}${plus}&nbsp;&nbsp;${p.name} : ${val}`;
  return wrap;
}

/* ───────── סיכום / חישוב איזון ───────── */
window.showSettle = () => {
  let text = "🔹 רשימת שחקנים וקניות:\n";
  players.forEach(p=> text+=`${p.name} - ${p.buy}\n`);
  text += `סה\"כ קניות: ${players.reduce((s,p)=>s+p.buy,0)}\n\n`;
  text += "🔹 רווח / הפסד:\n";

  const balances=[];
  players.forEach(p=>{
    const bal=p.win-p.buy;
    balances.push({name:p.name,balance:bal});
    text+=`${p.name}: ${bal}\n`;
  });

  text+="\n🔹 תשלומים:\n";
  const payers   = balances.filter(b=>b.balance<0).sort((a,b)=>a.balance-b.balance);
  const receivers= balances.filter(b=>b.balance>0).sort((a,b)=>b.balance-a.balance);
  let i=0,j=0;
  while(i<payers.length && j<receivers.length){
    const pay=payers[i], rec=receivers[j];
    const amt=Math.min(-pay.balance,rec.balance);
    text+=`${pay.name} משלם ${amt} ל${rec.name}\n`;
    pay.balance+=amt; rec.balance-=amt;
    if(!pay.balance) i++; if(!rec.balance) j++;
  }
  $("result").innerText=text;
};

/* ───────── העתק תוצאה ───────── */
window.copyResult = () => {
  navigator.clipboard.writeText($("result").innerText)
    .then(()=>alert("הסיכום הועתק!"));
};

/* ───────── שמירה ל-Firebase ───────── */
function savePlayers() {
  if (!currentGameId) return;
  const obj = {};
  players.forEach(p=>obj[p.name]={buy:p.buy,win:p.win});
  set(ref(db, `games/${currentGameId}/players`), obj);
}

/* ───────── טעינת משחקים קיימים ───────── */
function loadGames(){
  onValue(ref(db,"games"), snap=>{
    const data=snap.val()||{};
    const list=$("gamesList");
    list.innerHTML="";
    Object.entries(data).forEach(([id,g])=>{
      const btn=document.createElement("button");
      btn.textContent=`משחק מ־ ${new Date(g.created).toLocaleString("he-IL")}`;
      btn.onclick=()=>openGame(id,g);
      const del=document.createElement("button");
      del.textContent="🗑️ מחק";
      del.onclick=()=>deleteGame(id);
      const wrap=document.createElement("div");
      wrap.append(btn,del);
      list.appendChild(wrap);
    });
  });
}
function openGame(id,g){
  currentGameId=id;
  players = Object.entries(g.players||{}).map(([name,v])=>({name, ...v}));
  $("startScreen").classList.add("hidden");
  $("mainScreen").classList.remove("hidden");
  renderPlayers();
  // טען לוג
  $("buyLog").querySelector("tbody").innerHTML="";
  Object.values(g.log||{}).forEach(e=>{
    const row=$("buyLog").querySelector("tbody").insertRow();
    row.innerHTML=`<td>${e.date}</td><td>${e.time}</td><td>${e.name}</td><td>${e.action}</td>`;
  });
}
function deleteGame(id){
  if(confirm("למחוק משחק?")) remove(ref(db,`games/${id}`));
}

/* ───────── לוג מחיקות ───────── */
window.showLogScreen = () => {
  $("startScreen").classList.add("hidden");
  $("logScreen").classList.remove("hidden");
  // טען מחיקות (בפשטות מה־Realtime DB /logs, לפי איך שתרצה)
};

/* ───────── init ───────── */
loadGames();
showStartScreen();
