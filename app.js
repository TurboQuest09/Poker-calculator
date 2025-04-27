/***** 1. Firebase init *****/
const firebaseConfig = {
  apiKey: "AIzaSyBDXDiVPlT9Xc4-OGo9soTxmREtMR1gFHg",
  authDomain: "poker-eacf2.firebaseapp.com",
  databaseURL: "https://poker-eacf2-default-rtdb.firebaseio.com",
  projectId: "poker-eacf2",
  storageBucket: "poker-eacf2.appspot.com",
  messagingSenderId: "1023833535660",
  appId: "1:1023833535660:web:94ae3e2e0b8193d3625b09"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/***** 2. משתנים *****/
let players = [];
let gameId = null;

/***** 3. פונקציות ממשק *****/
function startNewGame(){
  gameId = firebase.database().ref('games').push({created:Date.now()}).key;
  players = [];
  switchScreen('gameScreen');
  renderLists();
}
function addPlayer(){
  const input = document.getElementById('playerName');
  const name  = input.value.trim();
  const err   = document.getElementById('nameErr');
  if(!name) return;
  if(players.find(p=>p.name===name)){err.textContent='⚠️ השם כבר קיים';return;}
  err.textContent='';
  players.push({name,buy:0,win:0});
  input.value='';
  renderLists();
}
function adjust(idx,type,amt){
  players[idx][type]+=amt;
  if(players[idx][type]<0) players[idx][type]=0;
  logAction(players[idx].name, type, amt);
  renderLists();
}
function renderLists(){
  const buyDiv=document.getElementById('buyList');
  const winDiv=document.getElementById('winList');
  buyDiv.innerHTML=winDiv.innerHTML='';
  players.forEach((p,i)=>{
    buyDiv.appendChild(createRow(p,i,'buy'));
    winDiv.appendChild(createRow(p,i,'win'));
  });
  updateTotals();
}
function createRow(p,i,type){
  const row=document.createElement('div');row.className='row';
  row.innerHTML=`<span class="name">${p.name}</span>
                 <button onclick="adjust(${i},'${type}',-1)">-1</button>
                 <button onclick="adjust(${i},'${type}',1)">+1</button>
                 <span>${p[type]}</span>`;
  return row;
}
function updateTotals(){
  const totalBuy = players.reduce((s,p)=>s+p.buy,0);
  const totalWin = players.reduce((s,p)=>s+p.win,0);
  document.getElementById('totals').textContent=`סה״כ קניות: ${totalBuy} | סה״כ ניצחונות: ${totalWin}`;
}
function showSettle(){
  const lines=players.map(p=>`${p.name}: ניצח ${p.win} – קנה ${p.buy}`);
  document.getElementById('result').textContent=lines.join('\n');
}
function copyResult(){
  navigator.clipboard.writeText(document.getElementById('result').textContent);
}

/***** 4. לוגים *****/
function logAction(name,type,amt){
  const now=new Date();
  const line=`${now.toLocaleDateString()} | ${now.toLocaleTimeString()} | ${name} | ${amt>0?'+1':'-1'} ${type==='buy'?'קנייה':'ניצחון'}`;
  const div=document.createElement('div');div.textContent=line;
  document.getElementById('actionLog').prepend(div);
}

/***** 5. ניווט מסכים *****/
function showLogScreen(){switchScreen('logScreen')}
function backToStart(){switchScreen('startScreen')}
function switchScreen(id){
  ['startScreen','gameScreen','logScreen'].forEach(s=>{
    document.getElementById(s).classList.toggle('hidden',s!==id);
  });
}

/***** 6. חשיפת פונקציות ל-HTML *****/
window.startNewGame=startNewGame;
window.addPlayer=addPlayer;
window.adjust=adjust;
window.showSettle=showSettle;
window.copyResult=copyResult;
window.showLogScreen=showLogScreen;
window.backToStart=backToStart;
