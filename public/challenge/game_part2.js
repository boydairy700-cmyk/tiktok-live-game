// START BATTLE
function startBattle(){
  setupPanel.style.display='none';
  battleScreen.style.display='block';
  const inst=document.getElementById('start-instruct');
  if(inst){inst.style.display='block';setTimeout(()=>inst.style.display='none',4000);}
  document.getElementById('boys-face-container').innerHTML=FaceSystem.createSVG('boys');
  document.getElementById('girls-face-container').innerHTML=FaceSystem.createSVG('girls');
  FaceSystem.startBlinking('boys');
  FaceSystem.startBlinking('girls');
  gameStarted=true;
  updateRoundCounter();
  startTimer();
  updateBars();
  confettiLoop();
  applyLang();
}

// TIMER
function startTimer(){
  const iv=setInterval(()=>{
    if(!gameStarted){clearInterval(iv);return;}
    timeLeft--;
    const m=Math.floor(timeLeft/60),s=timeLeft%60;
    timerEl.textContent=${String(m).padStart(2,'0')}:;
    if(timeLeft<=30)timerEl.classList.add('urgent');
    if(timeLeft<=0){clearInterval(iv);endRound();}
  },1000);
}

// ROUND COUNTER
function updateRoundCounter(){
  const el=document.getElementById('round-counter');
  if(!el)return;
  el.innerHTML=
    <div class= rc-item boys-rc>
      <span class=rc-crown></span>
      <span class=rc-label></span>
      <span class=rc-num></span>
    </div>
    <div class=rc-mid>
      <div class=rc-round> </div>
      <div class=rc-crowns>👑</div>
    </div>
    <div class=rc-item girls-rc>
      <span class=rc-num></span>
      <span class=rc-label></span>
      <span class=rc-crown></span>
    </div>;
}

// END ROUND (not full game reset)
function endRound(){
  gameStarted=false;
  clearInterval(botInterval);
  botInterval=null;
  let winner=null;
  if(boysScore>girlsScore){boysRounds++;winner='boys';}
  else if(girlsScore>boysScore){girlsRounds++;winner='girls';}
  spawnConfetti(winner||(boysScore>=girlsScore?'boys':'girls'),100);
  endGame();
  updateRoundCounter();
}

// ADD POINTS & COMBAT
function addPoints(team,amount,name,pic,action,effect=null){
  if(!gameStarted)return;
  const now=Date.now();
  const lastT=lastComboTime[team]||0;
  if(now-lastT<3000){comboCounts[team]=(comboCounts[team]||1)+1;}
  else{comboCounts[team]=1;}
  lastComboTime[team]=now;
  const multiplier=Math.min(comboCounts[team],5);
  const finalAmount=amount*(multiplier>1?multiplier:1);
  const isSuper=finalAmount>=200, isBig=finalAmount>=100;
  const opTeam=team==='boys'?'girls':'boys';
  if(team==='boys')boysScore+=finalAmount; else girlsScore+=finalAmount;

  // Track supporters
  let ts=supporters[team];
  let cur=ts.get(name)||{points:0,pic:pic};
  cur.points+=finalAmount; ts.set(name,cur);
  let top=team==='boys'?boysTopSupporter:girlsTopSupporter;
  if(cur.points>top.points){
    top.name=name; top.pic=pic; top.points=cur.points;
    updateSupporterBadge(team,name,pic,cur.points);
  }

  // HP damage
  let actualDmg=Math.min(15,Math.floor(finalAmount/30));
  if(effect==='steal_points'){
    const steal=Math.floor(finalAmount*0.5);
    if(opTeam==='boys'){const r=Math.min(boysScore,steal);boysScore-=r;girlsScore+=r;}
    else{const r=Math.min(girlsScore,steal);girlsScore-=r;boysScore+=r;}
    actualDmg=20;
  } else if(effect==='heavy_dmg'){actualDmg=35;}
  else if(effect==='steal_all_hp'){actualDmg=100;}

  if(opTeam==='boys'){boysHP=Math.max(0,boysHP-actualDmg);document.getElementById('boys-hp-bar').style.width=boysHP+'%';}
  else{girlsHP=Math.max(0,girlsHP-actualDmg);document.getElementById('girls-hp-bar').style.width=girlsHP+'%';}

  updateBars(); updateFaceExpressions();
  addEvent(name,pic,action,team,finalAmount);
  floatPoints(team,finalAmount);
  spawnShapes(team,finalAmount);
  triggerVSHit();

  if(multiplier>1)showCombo(team,multiplier);
  triggerFaceAnim(team,'celebrate');
  triggerFaceAnim(opTeam,'hit');

  // SPECIAL ANIMATIONS
  if(effect==='steal_points')triggerLaserEffect(team);
  else if(effect==='heavy_dmg')triggerSawEffect(team);
  else{
    // Random special attack based on team
    const r=Math.random();
    if(team==='boys'&&r<0.3)triggerSpitEffect();
    else if(team==='girls'&&r<0.3)triggerHairThrowEffect();
    else if(team==='girls'&&r<0.5)triggerGirlSparkleEffect();
    else launchRocket(team);
  }

  if(isSuper)triggerSuperPower(team);
  else if(isBig){shakeScreen();spawnConfetti(team);}
}

function updateSupporterBadge(team,name,pic,pts){
  const isDonut=pts>=donutPts;
  const badge=document.getElementById(team==='boys'?'boys-king':'girls-queen');
  const imgEl=document.getElementById(team==='boys'?'boys-king-img':'girls-queen-img');
  const nameEl=document.getElementById(team==='boys'?'boys-king-name':'girls-queen-name');
  const ptsEl=document.getElementById(team==='boys'?'boys-king-pts':'girls-queen-pts');
  if(!badge)return;
  badge.style.display='block';
  badge.className='supporter-badge '+(isDonut?'donut-supporter':'rose-supporter')+(team==='boys'?' boys-badge':' girls-badge');
  if(imgEl)imgEl.src=pic||https://i.pravatar.cc/40?u=;
  if(nameEl)nameEl.textContent=name;
  if(ptsEl)ptsEl.textContent=${Math.floor(pts)} pts ;
  if(isDonut) triggerDonutCelebration(team);
}

function updateSupporterBadges(){
  if(boysTopSupporter.name)updateSupporterBadge('boys',boysTopSupporter.name,boysTopSupporter.pic,boysTopSupporter.points);
  if(girlsTopSupporter.name)updateSupporterBadge('girls',girlsTopSupporter.name,girlsTopSupporter.pic,girlsTopSupporter.points);
}

// DONUT CELEBRATION
function triggerDonutCelebration(team){
  for(let i=0;i<8;i++){
    setTimeout(()=>{
      const el=document.createElement('div');
      el.style.cssText=position:fixed;font-size:32px;z-index:999;pointer-events:none;
        left:;top:%;
        animation:donutFloat 2s ease-out forwards;;
      el.textContent='🍩';
      document.body.appendChild(el);
      setTimeout(()=>el.remove(),2000);
    },i*150);
  }
}
