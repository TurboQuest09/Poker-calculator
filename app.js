/****************************************************************
*  לוגיקה מקומית בלבד   (ללא Firebase)                         *
****************************************************************/
let players = [];

/* הוספת שחקן */
function addPlayer(){
  const input=document.getElementById('newPlayer');
  const name = input.value.trim();
  if(!name) return;

  players.push({name,buy:0,win:0});
  input.value='';
  renderPlayers();
}

/* בניית רשימות */
function renderPlayers(){
  const buyList=document.getElementById('buyList');
  const winList=document.getElementById('winList');
  buyList.innerHTML=winList.innerHTML='';

  players.forEach((p,idx)=>{
    buyList.appendChild(rowHTML(idx,'buy',p.buy));
    winList.appendChild(rowHTML(idx,'win',p.win));
  });
  updateTotals();
}
function rowHTML(i,type,val){
  const div=document.createElement('div');
  div.className='player-row';
  const label=`${players[i].name}: ${val}`;
  div.innerHTML=`${label}
     <span class="buttons">
        <button onclick="inc('${type}',${i},1)">+1</button>
        <button onclick="inc('${type}',${i},-1)">-1</button>
     </span>`;
  return div;
}

/* שינוי ניקוד */
function inc(type,idx,amt){
  players[idx][type]+=amt;
  if(players[idx][type]<0) players[idx][type]=0;
  renderPlayers();
}

/* סכומים כוללים */
function updateTotals(){
  const sumBuy=players.reduce((s,p)=>s+p.buy,0);
  const sumWin=players.reduce((s,p)=>s+p.win,0);
  document.getElementById('totalBuy').innerText=sumBuy;
  document.getElementById('totalWin').innerText=sumWin;
}

/* חישוב/סיכום */
function showSettle(){
  const pre=document.getElementById('result');
  const lines=players.map(p=>`${p.name}: קניות ${p.buy} | ניצח ${p.win}`);
  pre.innerText=lines.join('\n');
}
/* העתקה */
function copyResult(){
  navigator.clipboard.writeText(document.getElementById('result').innerText);
}

/* חשיפה ל-HTML */
window.addPlayer=addPlayer;
window.inc=inc;
window.showSettle=showSettle;
window.copyResult=copyResult;

/* (startNewGame() מוגדר ב-HTML פנימי) */
