const socket = io();

const setupPanel = document.getElementById('setup-panel');
const usernameInput = document.getElementById('username-input');
const connectBtn = document.getElementById('connect-btn');
const testModeBtn = document.getElementById('test-mode-btn');
const statusMsg = document.getElementById('status-msg');
const scoreBoard = document.getElementById('score-board');
const adminPanel = document.getElementById('admin-panel');
const instructions = document.getElementById('instructions');
const winnerScreen = document.getElementById('winner-screen');
const winnerTitle = document.getElementById('winner-title');
const supportersGrid = document.getElementById('supporters-grid');
const nextRoundBtn = document.getElementById('next-round-btn');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

let isConnected = false;
let isGameOver = false;
let ropePosition = 0; // -100 to 100
let players = new Map();
let pullEffects = [];
let confetti = [];

// Audio
const AC=new(window.AudioContext||window.webkitAudioContext)();
function beep(freq,type,dur,vol,sweep){
  if(AC.state==='suspended')AC.resume();
  const o=AC.createOscillator(),g=AC.createGain();
  o.connect(g);g.connect(AC.destination);
  o.type=type;o.frequency.setValueAtTime(freq,AC.currentTime);
  if(sweep)o.frequency.exponentialRampToValueAtTime(sweep,AC.currentTime+dur);
  g.gain.setValueAtTime(vol,AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+dur);
  o.start();o.stop(AC.currentTime+dur);
}
function playSound(t){
  if(t==='pull') beep(150,'triangle',0.1,0.05,100);
  if(t==='win')  [400,600,800,1000].forEach((f,i)=>setTimeout(()=>beep(f,'sine',0.35,0.08),i*170));
}

// Physics/Smoothing
let currentVisualPos = 0;

function addConfetti(x, y) {
    for (let i = 0; i < 50; i++) {
        confetti.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15 - 5,
            color: ['#ff4b2b', '#00aaff', '#ffd700', '#fff'][Math.floor(Math.random() * 4)],
            size: Math.random() * 6 + 2,
            life: 100
        });
    }
}

function startGame() {
    isConnected = true;
    isGameOver = false;
    ropePosition = 0;
    players.clear();
    setupPanel.style.display = 'none';
    scoreBoard.style.display = 'block';
    adminPanel.style.display = 'block';
    instructions.style.display = 'block';
    winnerScreen.style.display = 'none';
    if(AC.state==='suspended')AC.resume();
}

function resetRound() {
    isGameOver = false;
    ropePosition = 0;
    currentVisualPos = 0;
    players.forEach(p => p.score = 0);
    winnerScreen.style.display = 'none';
}

function getBot(team) {
    const id = '__bot_' + team;
    if (!players.has(id)) players.set(id, { id, name: 'تجربة', team, picImg: null, score: 0 });
    return players.get(id);
}

function pull(team, power, playerName) {
    if (isGameOver) return;
    ropePosition += (team === 'red' ? -power : power);
    playSound('pull');
    
    // Add visual effect
    pullEffects.push({
        x: W/2 + (currentVisualPos/100)*(W/2 - 100) + (team==='red'? -50 : 50),
        y: H/2 - 50,
        text: playerName + ' +' + power,
        color: team === 'red' ? '#ff4b2b' : '#00aaff',
        life: 50,
        vy: -2
    });

    if (ropePosition <= -100) endRound('red');
    if (ropePosition >= 100) endRound('blue');
}

function endRound(winner) {
    isGameOver = true;
    playSound('win');
    winnerTitle.innerText = winner === 'red' ? 'الفريق الأحمر فاز!' : 'الفريق الأزرق فاز!';
    winnerTitle.style.color = winner === 'red' ? '#ff4b2b' : '#00aaff';
    
    supportersGrid.innerHTML = '';
    const teamPlayers = [...players.values()].filter(p => p.team === winner && p.id.indexOf('__bot') < 0).sort((a,b) => b.score - a.score);
    const crowns = ['👑 (ذهبي)', '🥈 (فضي)', '🥉 (برونزي)'];
    const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    
    (teamPlayers.length ? teamPlayers.slice(0,3) : [{name:'لا أحد', picImg:null, score:0}]).forEach((p, idx) => {
        const card = document.createElement('div'); card.className = 'supporter-card';
        card.style.border = '2px solid ' + (colors[idx] || '#fff');
        card.style.transform = idx === 0 ? 'scale(1.1)' : 'scale(1)';
        card.innerHTML = '<div><div class="sup-name" style="color:'+ (colors[idx] || '#fff') +'">'+p.name+' '+ (crowns[idx]||'') +'</div><div class="sup-score"> '+(p.score||0).toLocaleString()+'</div></div>';
        supportersGrid.appendChild(card);
    });

    winnerScreen.style.display = 'flex';
    let fwCount = 0;
    const fwInt = setInterval(() => {
        if(!isGameOver || fwCount > 10) { clearInterval(fwInt); return; }
        addConfetti(W*0.2 + Math.random()*W*0.6, H*0.2 + Math.random()*H*0.4);
        fwCount++;
    }, 400);
}

socket.on('tiktokLike', (d) => {
    let p = players.get(d.uniqueId);
    if (!p) { p = { id: d.uniqueId, name: d.nickname || d.uniqueId, team: 'red', score: 0 }; players.set(d.uniqueId, p); }
    p.score += 1;
    pull('red', 1, p.name);
});

socket.on('tiktokShare', (d) => {
    let p = players.get(d.uniqueId);
    if (!p) { p = { id: d.uniqueId, name: d.nickname || d.uniqueId, team: 'blue', score: 0 }; players.set(d.uniqueId, p); }
    p.score += 5;
    pull('blue', 5, p.name);
});

socket.on('tiktokGift', (d) => {
  if (window.TikTokAlerts) window.TikTokAlerts.showAlert(d.nickname || d.uniqueId, d.profilePictureUrl, 'أرسل هدية: ' + (d.giftName || ''), 'gift');
    let p = players.get(d.uniqueId);
    if (!p) { p = { id: d.uniqueId, name: d.nickname || d.uniqueId, team: Math.random()>.5?'red':'blue', score: 0 }; players.set(d.uniqueId, p); }
    const amt = (d.diamondCount || 1) * (d.repeatCount || 1);
    p.score += amt * 10;
    pull(p.team, amt * 10, p.name);
});

socket.on('tiktokConnected', () => startGame());
socket.on('tiktokError', (e) => { statusMsg.innerText = 'خطأ: ' + e; });

connectBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (!username) { statusMsg.innerText = 'أدخل اسم المستخدم!'; return; }
    statusMsg.innerText = 'جاري الاتصال...';
    const sessionId = document.getElementById('session-input').value.trim();
    localStorage.setItem('tiktokUsername', username);
    if(sessionId) localStorage.setItem('tiktokSessionId', sessionId);
    socket.emit('connectTikTok', { username, sessionId });
});

testModeBtn.addEventListener('click', () => { startGame(); });

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('tiktokUsername');
    const savedSession = localStorage.getItem('tiktokSessionId');
    if (savedUser) usernameInput.value = savedUser;
    if (savedSession) document.getElementById('session-input').value = savedSession;
});
document.getElementById('test-red-btn').addEventListener('click', () => { pull('red', 10, 'تجربة أحمر'); });
document.getElementById('test-blue-btn').addEventListener('click', () => { pull('blue', 10, 'تجربة أزرق'); });
document.getElementById('reset-btn').addEventListener('click', resetRound);
nextRoundBtn.addEventListener('click', resetRound);

function drawBG() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#111'); sky.addColorStop(1, '#333');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    
    // Mud pit
    ctx.fillStyle = '#4a3320';
    ctx.beginPath(); ctx.ellipse(W/2, H/2 + 50, 200, 60, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2d1c0c'; ctx.lineWidth=5; ctx.stroke();
}

function draw() {
    requestAnimationFrame(draw);
    drawBG();

    if (!isConnected) return;

    currentVisualPos += (ropePosition - currentVisualPos) * 0.1;
    const ropeXOffset = (currentVisualPos / 100) * (W / 2 - 100);

    // Draw Rope
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(50, H/2); ctx.lineTo(W - 50, H/2); ctx.stroke();

    // Draw Center Mark (Flag)
    const centerX = W/2 + ropeXOffset;
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(centerX - 10, H/2 - 25, 20, 50);

    // Draw Teams
    // Draw animated avatars pulling the rope
    const pullCycle = (Date.now() * 0.005) % (Math.PI * 2);
    const redX = centerX - 150;
    const blueX = centerX + 120;
    const baseY = H/2 - 10;
    
    // Red Team
    ctx.save();
    ctx.translate(redX, baseY);
    ctx.fillStyle = '#ff4b2b';
    ctx.beginPath(); ctx.arc(0, -35, 12, 0, Math.PI*2); ctx.fill(); // Head
    ctx.fillRect(-10, -20, 20, 35); // Body
    ctx.strokeStyle = '#ff4b2b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(-15 + Math.sin(pullCycle)*10, 35); ctx.stroke(); // Left Leg
    ctx.beginPath(); ctx.moveTo(5, 15); ctx.lineTo(15 - Math.sin(pullCycle)*10, 35); ctx.stroke(); // Right Leg
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(30, 10 + Math.cos(pullCycle)*5); ctx.stroke(); // Arms pulling rope
    ctx.restore();

    // Blue Team
    ctx.save();
    ctx.translate(blueX, baseY);
    ctx.fillStyle = '#00aaff';
    ctx.beginPath(); ctx.arc(0, -35, 12, 0, Math.PI*2); ctx.fill(); // Head
    ctx.fillRect(-10, -20, 20, 35); // Body
    ctx.strokeStyle = '#00aaff'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(-15 - Math.sin(pullCycle)*10, 35); ctx.stroke(); // Left Leg
    ctx.beginPath(); ctx.moveTo(5, 15); ctx.lineTo(15 + Math.sin(pullCycle)*10, 35); ctx.stroke(); // Right Leg
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-30, 10 + Math.cos(pullCycle)*5); ctx.stroke(); // Arms pulling rope
    ctx.restore();

    // Draw Effects
    for (let i = pullEffects.length - 1; i >= 0; i--) {
        const e = pullEffects[i];
        ctx.fillStyle = e.color; ctx.font = 'bold 22px Cairo'; ctx.textAlign = 'center';
        ctx.fillText(e.text, e.x, e.y);
        e.y += e.vy; e.life--;
        if (e.life <= 0) pullEffects.splice(i, 1);
    }

    // Draw Confetti
    for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        ctx.fillStyle = c.color;
        ctx.globalAlpha = c.life / 100;
        ctx.fillRect(c.x, c.y, c.size, c.size);
        c.x += c.vx; c.y += c.vy; c.vy += 0.2; c.life--;
        if (c.life <= 0) confetti.splice(i, 1);
    }
    ctx.globalAlpha = 1;
}
draw();
