// BARS
function updateBars(){
  const total=boysScore+girlsScore;
  const bPct=total===0?50:(boysScore/total)*100;
  boysBar.style.width=bPct+'%';
  girlsBar.style.width=(100-bPct)+'%';
  boysLabel.textContent=Math.floor(boysScore);
  girlsLabel.textContent=Math.floor(girlsScore);
  boysPts.textContent=Math.floor(boysScore);
  girlsPts.textContent=Math.floor(girlsScore);
}

// FACE EXPRESSIONS
function updateFaceExpressions(){
  const total=boysScore+girlsScore;
  if(total===0)return;
  const bPct=boysScore/total,gPct=girlsScore/total;
  let bState='neutral',gState='neutral';
  if(bPct>0.65){bState='excited';gState=girlsHP<30?'crying':'sad';}
  else if(bPct>0.52){bState='happy';gState='neutral';}
  else if(gPct>0.65){gState='excited';bState=boysHP<30?'crying':'sad';}
  else if(gPct>0.52){gState='happy';bState='neutral';}
  FaceSystem.updateState('boys',bState);
  FaceSystem.updateState('girls',gState);
}

function triggerFaceAnim(team,type){
  const w=document.getElementById(team+'-face-wrapper');
  if(!w)return;
  w.classList.remove('celebrate','hit');
  void w.offsetWidth;
  w.classList.add(type);
  setTimeout(()=>w.classList.remove(type),700);
}

// SPECIAL ANIMATIONS
function triggerSpitEffect(){
  const el=document.createElement('div');
  el.innerHTML='💧💦💧';
  el.style.cssText=position:fixed;font-size:28px;z-index:300;pointer-events:none;
    left:28%;top:42%;animation:spitFly 0.8s ease-out forwards;;
  document.body.appendChild(el);
  addEvent('🧒','',' '+t('spit'),'boys',0);
  setTimeout(()=>el.remove(),900);
}

function triggerHairThrowEffect(){
  for(let i=0;i<6;i++){
    setTimeout(()=>{
      const el=document.createElement('div');
      el.innerHTML='〰️';
      el.style.cssText=position:fixed;font-size:22px;z-index:300;pointer-events:none;
        right:28%;top:%;animation:hairFly 1s ease-out forwards;;
      document.body.appendChild(el);
      setTimeout(()=>el.remove(),1100);
    },i*80);
  }
  addEvent('👧','',' '+t('hairThrow'),'girls',0);
}

function triggerGirlSparkleEffect(){
  for(let i=0;i<10;i++){
    setTimeout(()=>{
      const el=document.createElement('div');
      el.innerHTML=['✨','💖','🌟','💫','🌸'][Math.floor(Math.random()*5)];
      el.style.cssText=position:fixed;font-size:24px;z-index:300;pointer-events:none;
        right:%;top:%;
        animation:sparklePop s ease-out forwards;;
      document.body.appendChild(el);
      setTimeout(()=>el.remove(),1000);
    },i*100);
  }
}

// ROCKET
function launchRocket(attackTeam){
  const r=document.createElement('div');
  r.className='rocket '+(attackTeam==='boys'?'boys-to-girls':'girls-to-boys');
  r.textContent=['🚀','⚡','💥','🔥','🌊','💨'][Math.floor(Math.random()*6)];
  document.body.appendChild(r);
  setTimeout(()=>{r.remove();spawnExplosion(attackTeam);},870);
}

function spawnExplosion(attackTeam){
  const e=document.createElement('div');
  e.className='explosion';e.textContent='💥';
  e.style.left=attackTeam==='boys'?'75%':'20%';
  e.style.top='40%';
  document.body.appendChild(e);
  shakeScreen();
  setTimeout(()=>e.remove(),650);
}

function triggerLaserEffect(team){
  const l=document.createElement('div');
  l.className='laser-beam '+(team==='boys'?'l-to-r':'r-to-l');
  document.body.appendChild(l);
  setTimeout(()=>{l.remove();spawnExplosion(team);},600);
}

function triggerSawEffect(team){
  const s=document.createElement('div');
  s.className='saw-anim '+(team==='boys'?'s-to-r':'s-to-l');
  s.textContent='🪚';
  document.body.appendChild(s);
  setTimeout(()=>{s.remove();spawnExplosion(team);},800);
}

// COMBO
function showCombo(team,count){
  const el=document.createElement('div');
  el.className='combo-display';
  el.style.color=team==='boys'?'#00f2fe':'#e94560';
  el.style.left=team==='boys'?'20%':'65%';
  el.style.top='30%';
  el.textContent=COMBO x! 🔥;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1600);
}

// TIMER EDIT
window.toggleTimerEdit=function(){document.getElementById('timer-edit-panel').classList.toggle('show');};
window.applyTimerEdit=function(){
  const mins=parseInt(document.getElementById('timer-edit-input').value)||5;
  timeLeft=mins*60;
  const m=Math.floor(timeLeft/60),s=timeLeft%60;
  timerEl.textContent=${String(m).padStart(2,'0')}:;
  timerEl.classList.remove('urgent');
  document.getElementById('timer-edit-panel').classList.remove('show');
};

function triggerVSHit(){
  vsLogo.classList.remove('hit');void vsLogo.offsetWidth;vsLogo.classList.add('hit');
  setTimeout(()=>vsLogo.classList.remove('hit'),400);
}

// FLOATING POINTS
function floatPoints(team,amount){
  const area=document.getElementById(team+'-area');
  const rect=area.getBoundingClientRect();
  const el=document.createElement('div');
  el.className='float-pts';
  el.textContent='+'+Math.floor(amount);
  el.style.color=team==='boys'?'#00f2fe':'#e94560';
  el.style.left=(rect.left+rect.width/2-30)+'px';
  el.style.top=(rect.top+rect.height/2)+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1300);
}

// SHAPES
function spawnShapes(team,amount){
  const shapes=['⭐','💥','🔥','💫','✨','⚡','💪'];
  const count=amount>=100?8:amount>=50?5:3;
  const area=document.getElementById(team+'-area');
  const rect=area.getBoundingClientRect();
  for(let i=0;i<count;i++){
    const el=document.createElement('div');
    el.className='fly-shape';
    el.textContent=shapes[Math.floor(Math.random()*shapes.length)];
    el.style.left=(rect.left+rect.width/2)+'px';
    el.style.top=(rect.top+rect.height/2)+'px';
    el.style.setProperty('--tx',(Math.random()-0.5)*350+'px');
    el.style.setProperty('--ty',(Math.random()-0.5)*350+'px');
    el.style.setProperty('--rot',(Math.random()*720-360)+'deg');
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1600);
  }
}
