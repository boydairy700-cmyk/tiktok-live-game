// i18n
const LANG = { ar: {
  boys:'الشباب', girls:'البنات', round:'الجولة', crown:'التاج',
  topSupporter:'أكبر داعم', supporter:'داعم', vs:'ضد',
  boysWin:'الشباب فازوا!', girlsWin:'البنات فاززن!', draw:'تعادل!',
  newRound:'جولة جديدة', testMode:'وضع التجربة', stopTest:'إيقاف',
  adminPanel:'لوحة التحكم', connect:'اتصال', preview:'معاينة',
  connecting:'جاري الاتصال...', connected:'متصل!', error:'خطأ',
  mins:'دقائق', duration:'المدة', likePts:'نقاط اللايك',
  sharePts:'نقاط المشاركة', followPts:'نقاط المتابعة',
  followTeam:'يعود لـ', both:'الكلين', setup:'إعداد المباراة',
  username:'اسم المستخدم', gifts:'الهدايا', settings:'الإعدادات',
  donutVal:'قيمة الدونت (نقطة)',
  hairThrow:'رمت شعرها!', spit:'بصق!', girlAttack:'هجوم البنات!',
  boysScore:'شباب', girlsScore:'بنات',
  winsRound:'فاز بالجولة', crowns:'تيجان'
}, en: {
  boys:'BOYS', girls:'GIRLS', round:'Round', crown:'Crown',
  topSupporter:'Top Supporter', supporter:'Supporter', vs:'VS',
  boysWin:'Boys Win!', girlsWin:'Girls Win!', draw:'Draw!',
  newRound:'New Round', testMode:'Test Mode', stopTest:'Stop',
  adminPanel:'Admin Panel', connect:'Connect', preview:'Preview',
  connecting:'Connecting...', connected:'Connected!', error:'Error',
  mins:'mins', duration:'Duration', likePts:'Like pts',
  sharePts:'Share pts', followPts:'Follow pts',
  followTeam:'Goes to', both:'Both', setup:'Battle Setup',
  username:'Username', gifts:'Gifts', settings:'Settings',
  donutVal:'Donut Value (pts)',
  hairThrow:'Threw her hair!', spit:'Spit!', girlAttack:'Girls Attack!',
  boysScore:'Boys', girlsScore:'Girls',
  winsRound:'wins round', crowns:'crowns'
}};

let currentLang = 'ar';
function t(k){ return (LANG[currentLang]||LANG.ar)[k]||k; }
function switchLang(l){ currentLang=l; applyLang(); }
function applyLang(){
  document.querySelectorAll('[data-t]').forEach(el=>{
    const k=el.getAttribute('data-t');
    el.textContent=t(k);
  });
  document.documentElement.dir = currentLang==='ar'?'rtl':'ltr';
  document.documentElement.lang = currentLang;
  updateRoundCounter();
  updateSupporterBadges();
  updateHints();
}

// DOM REFS
const setupPanel   = document.getElementById('setup-panel');
const battleScreen = document.getElementById('battle-screen');
const connectBtn   = document.getElementById('connect-btn');
const previewBtn   = document.getElementById('preview-btn');
const statusMsg    = document.getElementById('status-msg');
const boysBar      = document.getElementById('boys-bar');
const girlsBar     = document.getElementById('girls-bar');
const boysLabel    = document.getElementById('boys-score-label');
const girlsLabel   = document.getElementById('girls-score-label');
const boysPts      = document.getElementById('boys-pts');
const girlsPts     = document.getElementById('girls-pts');
const boysHint     = document.getElementById('boys-hint');
const girlsHint    = document.getElementById('girls-hint');
const timerEl      = document.getElementById('timer');
const vsLogo       = document.getElementById('vs-logo');
const superOverlay = document.getElementById('super-overlay');
const superText    = document.getElementById('super-text');
const superIcon    = document.getElementById('super-icon');
const winnerScreen = document.getElementById('winner-screen');
const winnerTitle  = document.getElementById('winner-title');
const winnerFinal  = document.getElementById('winner-final');
const eventFeed    = document.getElementById('event-feed');

// Confetti
const confCanvas = document.getElementById('confetti-canvas');
const confCtx    = confCanvas.getContext('2d');
confCanvas.width  = window.innerWidth;
confCanvas.height = window.innerHeight;

// GAME STATE
let boysScore=0, girlsScore=0, boysHP=100, girlsHP=100;
let timeLeft=300, gameStarted=false, botInterval=null, config={};
let lastComboTime={}, comboCounts={boys:0,girls:0};
let boysTopSupporter={name:'',pic:'',points:0};
let girlsTopSupporter={name:'',pic:'',points:0};
let supporters={boys:new Map(),girls:new Map()};
// ROUND SYSTEM
let boysRounds=0, girlsRounds=0, roundNumber=1;
let donutPts=1000;

function readConfig(){
  const durationMins=parseInt(document.getElementById('duration-input').value)||5;
  timeLeft=durationMins*60;
  donutPts=parseInt(document.getElementById('donut-pts-input')?.value)||1000;
  const likePts   =parseInt(document.getElementById('like-pts-input').value)||1;
  const sharePts  =parseInt(document.getElementById('share-pts-input').value)||20;
  const followPts =parseInt(document.getElementById('follow-pts-input').value)||10;
  const followTeam=document.getElementById('follow-team-select').value;
  const boysGifts =GiftPicker.getConfig('boys');
  const girlsGifts=GiftPicker.getConfig('girls');
  // update donut pts in TIKTOK_GIFTS
  const donut=TIKTOK_GIFTS.find(g=>g.id==='donut');
  if(donut) donut.pts=donutPts;
  config={likePts,sharePts,followPts,followTeam,boysGifts,girlsGifts};
  updateHints();
}

function updateHints(){
  if(!gameStarted) return;
  const be=[...GiftPicker.selected.boys].map(id=>TIKTOK_GIFTS.find(g=>g.id===id)?.emoji||'').join(' ');
  const ge=[...GiftPicker.selected.girls].map(id=>TIKTOK_GIFTS.find(g=>g.id===id)?.emoji||'').join(' ');
  if(boysHint) boysHint.textContent=${t('supporter')}: ;
  if(girlsHint) girlsHint.textContent=${t('supporter')}: ;
}

// SOCKET
const socket=io();
connectBtn.addEventListener('click',()=>{
  const username=document.getElementById('username-input').value.trim();
  if(!username){statusMsg.textContent=t('error')+': Username required';return;}
  statusMsg.textContent=t('connecting');
  readConfig();
  socket.emit('connectTikTok',username);
});
previewBtn.addEventListener('click',()=>{ readConfig(); startBattle(); });
socket.on('tiktokConnected',()=>{ statusMsg.textContent=t('connected'); setTimeout(startBattle,800); });
socket.on('tiktokError',err=>{ statusMsg.textContent=t('error')+': '+err; });

// TIKTOK EVENTS
socket.on('tiktokLike',data=>{
  if(!gameStarted||!config.likePts)return;
  addPoints('boys',config.likePts,data.nickname,data.profilePictureUrl,'❤️');
});
socket.on('tiktokShare',data=>{
  if(!gameStarted||!config.sharePts)return;
  addPoints('girls',config.sharePts,data.nickname,data.profilePictureUrl,'🔗');
});
socket.on('tiktokFollow',data=>{
  if(!gameStarted||!config.followPts)return;
  const team=config.followTeam==='both'?(Math.random()>0.5?'boys':'girls'):config.followTeam;
  addPoints(team,config.followPts,data.nickname,data.profilePictureUrl,'➕');
});
socket.on('tiktokGift',data=>{
  if(!gameStarted)return;
  const match=GiftPicker.matchGift(data.giftName);
  if(match){
    const gObj=TIKTOK_GIFTS.find(g=>g.nameEn.toLowerCase()===data.giftName.toLowerCase())||{};
    const total=match.pts*(data.repeatCount||1);
    addPoints(match.team,total,data.nickname,data.profilePictureUrl,
      ${gObj.emoji||'🎁'}  x,gObj.effect);
  }
});
