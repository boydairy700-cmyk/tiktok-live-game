const socket = io();

// UI
const setupPanel = document.getElementById('setup-panel');
const usernameInput = document.getElementById('username-input');
const connectBtn = document.getElementById('connect-btn');
const testModeBtn = document.getElementById('test-mode-btn');
const statusMsg = document.getElementById('status-msg');

const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const connectionInputs = document.getElementById('connection-inputs');

const leaderboardDiv = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const gameStatusDiv = document.getElementById('game-status');
const connectedUserSpan = document.getElementById('connected-user');
const winnerScreen = document.getElementById('winner-screen');
const winnerInfo = document.getElementById('winner-info');
const winnerTitle = document.getElementById('winner-title');
const restartBtn = document.getElementById('restart-btn');
const visualInstructions = document.getElementById('visual-instructions');
const instructionsToggleBtn = document.getElementById('instructions-toggle-btn');
const debugPanel = document.getElementById('debug-panel');

let isConnected = false;

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'rose') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(); osc.stop(now + 0.2);
    } else if (type === 'heart') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(); osc.stop(now + 0.2);
    } else if (type === 'tiktok') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(); osc.stop(now + 0.15);
    } else if (type === 'lion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1.0);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        osc.start(); osc.stop(now + 1.0);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.2);
        osc.frequency.setValueAtTime(800, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        osc.start(); osc.stop(now + 1.0);
    } else {
        // generic boost
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(); osc.stop(now + 0.1);
    }
}

// Settings toggle
settingsToggleBtn.addEventListener('click', () => {
    if (setupPanel.style.display === 'none') setupPanel.style.display = 'block';
    else setupPanel.style.display = 'none';
});

closeSettingsBtn.addEventListener('click', () => {
    setupPanel.style.display = 'none';
});

if (instructionsToggleBtn) {
    instructionsToggleBtn.addEventListener('click', () => {
        if (visualInstructions.style.display === 'none') {
            visualInstructions.style.display = 'block';
            instructionsToggleBtn.style.opacity = '1';
        } else {
            visualInstructions.style.display = 'none';
            instructionsToggleBtn.style.opacity = '0.5';
        }
    });
}

// Setup debug panel buttons
document.querySelectorAll('.test-gift-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (!isConnected || isGameOver) return;
        const giftType = e.target.getAttribute('data-gift');
        
        let amount = 10;
        let giftName = '';
        if (giftType === 'rose') { giftName = ''; amount = 10; }
        else if (giftType === 'heart') { giftName = ''; amount = 30; }
        else if (giftType === 'tiktok') { giftName = ' '; amount = 100; }
        else if (giftType === 'lion') { giftName = ''; amount = 1000; }
        
        // boost a random bot or the first player
        if (players.size > 0) {
            const playerArray = Array.from(players.values());
            const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
            boostPlayer(randomPlayer, amount, giftName);
        }
    });
});

function hideSetup() {
    setupPanel.style.display = 'none';
    settingsToggleBtn.style.display = 'block';
    if(instructionsToggleBtn) instructionsToggleBtn.style.display = 'block';
    leaderboardDiv.style.display = 'block';
    gameStatusDiv.style.display = 'block';
    if(debugPanel) debugPanel.style.display = 'flex';
    if(visualInstructions) visualInstructions.style.display = 'block';
}

// Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let width, height;
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Game State
const players = new Map();
const particles = [];
let isGameOver = false;
const winCounts = new Map();
let testInterval = null;
let finishLineX = 0;
const floatingTexts = [];

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 60%)`;
}

// Add/Get Player
function getOrCreatePlayer(data) {
    if (!players.has(data.uniqueId)) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        if (data.profilePictureUrl) img.src = data.profilePictureUrl;
        
        // Find an empty lane to prevent overlapping
        const laneHeight = 100;
        const startY = 120;
        let laneIndex = players.size;
        let numLanes = Math.max(5, Math.floor((height - 200) / laneHeight)); // 100px per lane
        const yPos = startY + (laneIndex % numLanes) * laneHeight;
        
        players.set(data.uniqueId, {
            id: data.uniqueId,
            nickname: data.nickname,
            picImg: img,
            color: getRandomColor(),
            x: 50,
            y: yPos,
            targetX: 50,
            speed: 0,
            picUrl: data.profilePictureUrl,
            score: 0
        });
        updateLeaderboard();
    }
    return players.get(data.uniqueId);
}

// Actions
function boostPlayer(player, amount, giftName = '') {
    if (isGameOver) return;
    player.score += amount;
    player.targetX += amount * 2; // move forward
    
    let numParticles = 10;
    let particleSpeed = 5;
    let particleSize = 4;
    let effectColor = ['#ff8a00', '#e52e71', '#ffd700', '#00f2fe'][Math.floor(Math.random()*4)];
    let textEffect = '';
    let soundType = 'generic';
    
    if (giftName) {
        const lowerName = giftName.toLowerCase();
        if (lowerName.includes('rose') || giftName === '') {
            effectColor = '#ff0000';
            numParticles += 20;
            textEffect = '';
            soundType = 'rose';
        } else if (lowerName.includes('heart') || giftName === '') {
            effectColor = '#ff69b4';
            numParticles += 30;
            particleSize += 2;
            textEffect = '';
            soundType = 'heart';
        } else if (lowerName.includes('tiktok') || giftName === ' ') {
            effectColor = '#00f2fe';
            numParticles += 40;
            textEffect = '';
            soundType = 'tiktok';
        } else if (lowerName.includes('lion') || giftName === '') {
            effectColor = '#ffd700';
            numParticles = 200;
            particleSpeed = 30;
            particleSize = 20;
            textEffect = '';
            soundType = 'lion';
        } else {
            textEffect = giftName;
            soundType = 'rose'; // default for named gifts
        }
    }
    
    playSound(soundType);
    
    if (amount >= 1000) {
        numParticles = Math.max(numParticles, 150);
        particleSpeed = Math.max(particleSpeed, 25);
        particleSize = Math.max(particleSize, 15);
    } else if (amount >= 100) {
        numParticles = Math.max(numParticles, 80);
        particleSpeed = Math.max(particleSpeed, 18);
        particleSize = Math.max(particleSize, 10);
    } else if (amount >= 30) {
        numParticles = Math.max(numParticles, 40);
        particleSpeed = Math.max(particleSpeed, 12);
        particleSize = Math.max(particleSize, 8);
    }
    
    if (textEffect) {
        floatingTexts.push({
            x: player.x,
            y: player.y - 40,
            text: textEffect,
            life: 60,
            vy: -1.5
        });
    }
    
    for(let i=0; i<numParticles; i++) {
        particles.push({
            x: player.x - 45, // Back of the car
            y: player.y + (Math.random()-0.5)*15,
            vx: -Math.random()*particleSpeed - 2,
            vy: (Math.random()-0.5)*(particleSpeed/2),
            life: 20 + Math.random()*30,
            size: Math.random() * particleSize + 2,
            color: effectColor
        });
    }
    updateLeaderboard();
}

// Socket Events
socket.on('tiktokChat', (data) => boostPlayer(getOrCreatePlayer(data), 1));
socket.on('tiktokLike', (data) => {
    const likes = Math.ceil(data.likeCount / 10);
    boostPlayer(getOrCreatePlayer(data), likes);
});
socket.on('tiktokFollow', (data) => boostPlayer(getOrCreatePlayer(data), 5));
socket.on('tiktokShare', (data) => boostPlayer(getOrCreatePlayer(data), 5));
socket.on('tiktokGift', (data) => {
    const amount = (data.diamondCount * data.repeatCount) || 1;
    const giftName = data.giftName || '';
    boostPlayer(getOrCreatePlayer(data), amount * 10, giftName);
});

// Mock / Start logic
connectBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const sessionInput = document.getElementById('session-input');
    const sessionId = sessionInput ? sessionInput.value.trim() : '';

    if (!username) { statusMsg.innerText = "   "; return; }
    
    localStorage.setItem('tiktok_username', username);
    if (sessionId) localStorage.setItem('tiktok_session_id', sessionId);
    
    statusMsg.innerText = "  ...  ";
    socket.emit('connectTikTok', { username, sessionId });
});

testModeBtn.addEventListener('click', () => {
    onGameStart();
    connectedUserSpan.innerText = "  ()";
    
    if (testInterval) clearInterval(testInterval);
    testInterval = setInterval(() => {
        if (isGameOver) return;
        const mockUser = {
            uniqueId: 'bot' + Math.floor(Math.random() * 5),
            nickname: ' ' + Math.floor(Math.random() * 5),
            profilePictureUrl: ''
        };
        const p = getOrCreatePlayer(mockUser);
        boostPlayer(p, Math.floor(Math.random()*5) + 1);
    }, 500);
});

function onGameStart() {
    isConnected = true;
    hideSetup();
    isGameOver = false;
    winnerScreen.style.display = 'none';
    finishLineX = width - 150;
    
    const savedSession = localStorage.getItem('tiktok_session_id');
    const savedUsername = localStorage.getItem('tiktok_username');
    if (savedSession && document.getElementById('session-input')) document.getElementById('session-input').value = savedSession;
    if (savedUsername && usernameInput) usernameInput.value = savedUsername;
}

socket.on('tiktokConnected', (data) => {
    onGameStart();
    connectedUserSpan.innerText = usernameInput.value.trim();
});
socket.on('tiktokError', (err) => { statusMsg.innerText = "  : " + err; });
socket.on('tiktokDisconnected', () => {
    isConnected = false;
    setupPanel.style.display = 'block';
    leaderboardDiv.style.display = 'none';
    gameStatusDiv.style.display = 'none';
    settingsToggleBtn.style.display = 'none';
    if(instructionsToggleBtn) instructionsToggleBtn.style.display = 'none';
    if(debugPanel) debugPanel.style.display = 'none';
    if(visualInstructions) visualInstructions.style.display = 'none';
    connectionInputs.style.display = 'block';
    connectBtn.style.display = 'block';
    testModeBtn.style.display = 'block';
    closeSettingsBtn.style.display = 'none';
    statusMsg.innerText = "    .";
});

restartBtn.addEventListener('click', () => {
    // Reset all players to start line instead of clearing them
    for (let p of players.values()) {
        p.x = 50;
        p.targetX = 50;
        p.score = 0;
    }
    particles.length = 0;
    isGameOver = false;
    winnerScreen.style.display = 'none';
    updateLeaderboard();
});

function updateLeaderboard() {
    const sorted = Array.from(players.values()).sort((a, b) => b.x - a.x);
    leaderboardList.innerHTML = '';
    sorted.slice(0, 10).forEach((p, index) => {
        const li = document.createElement('li');
        li.style.padding = '8px';
        li.style.marginBottom = '5px';
        li.style.background = 'rgba(0,0,0,0.5)';
        li.style.borderRadius = '8px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        
        let pName = p.nickname.length > 8 ? p.nickname.substring(0,8)+'..' : p.nickname;
        li.innerHTML = `<span style="color:${p.color}">#${index+1} ${pName}</span> <span style="color:#fff">${Math.floor(p.x)}m</span>`;
        leaderboardList.appendChild(li);
    });
}

function endGame(winner) {
    isGameOver = true;
    playSound('win');
    winnerScreen.style.display = 'flex';
    winCounts.set(winner.id, (winCounts.get(winner.id) || 0) + 1);
    
    winnerTitle.innerText = ` : ${winner.nickname} `;
    winnerInfo.innerHTML = `
        <img src="${winner.picUrl || 'https://ui-avatars.com/api/?name='+winner.nickname}" style="width:150px; height:150px; border-radius:50%; border: 5px solid ${winner.color}; box-shadow: 0 0 30px ${winner.color}">
        <h2 style="color:white; margin-top: 20px;">: ${winCounts.get(winner.id)}</h2>
    `;
    
    for(let i=0; i<200; i++) {
        particles.push({
            x: width/2, y: height/2,
            vx: (Math.random()-0.5)*30, vy: (Math.random()-0.5)*30,
            life: 100 + Math.random()*100,
            color: ['#FFD700', '#fff', winner.color, '#00f2fe'][Math.floor(Math.random()*4)]
        });
    }
}

// Background stars
const stars = Array.from({length: 150}, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 5 + 1
}));

function draw() {
    ctx.clearRect(0, 0, width, height);
    finishLineX = width - 150;
    
    // Draw Stars (Cyberpunk space background)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        s.x -= s.speed;
        if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Racetrack Lanes
    const laneHeight = 100;
    const startY = 120;
    const numLanes = Math.max(5, Math.floor((height - 200) / laneHeight));
    
    for (let i = 0; i < numLanes; i++) {
        const yCenter = startY + i * laneHeight;
        const yTop = yCenter - laneHeight / 2;
        
        // 1. Draw Asphalt Road
        ctx.fillStyle = '#1e222b';
        ctx.fillRect(0, yTop, width, laneHeight);
        
        // 2. Draw Lane Dividers (Dashed lines at the bottom of the lane)
        if (i < numLanes - 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 4;
            ctx.setLineDash([20, 15]);
            ctx.beginPath();
            ctx.moveTo(0, yTop + laneHeight);
            ctx.lineTo(width, yTop + laneHeight);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 3. Draw Red/White Curbs at the top edge of each lane
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(0, yTop, width, 4);
        ctx.fillStyle = '#ffffff';
        // Alternating red/white stripes
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([30, 30]);
        ctx.beginPath();
        ctx.moveTo(0, yTop + 2);
        ctx.lineTo(width, yTop + 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 4. Draw lane starting number
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = '900 60px Cairo';
        ctx.textAlign = 'left';
        ctx.fillText(`LANE ${i + 1}`, 70, yCenter + 20);
        
        // 5. Draw Starting Grid (Grid checkered line at x = 50)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(50, yTop);
        ctx.lineTo(50, yTop + laneHeight);
        ctx.stroke();
    }

    // Draw Checkered Finish Line
    const squareSize = 15;
    const finishLineWidth = 30;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < height; y += squareSize * 2) {
        ctx.fillRect(finishLineX - finishLineWidth/2, y, squareSize, squareSize);
        ctx.fillRect(finishLineX - finishLineWidth/2 + squareSize, y + squareSize, squareSize, squareSize);
    }
    ctx.fillStyle = '#000000';
    for (let y = 0; y < height; y += squareSize * 2) {
        ctx.fillRect(finishLineX - finishLineWidth/2 + squareSize, y, squareSize, squareSize);
        ctx.fillRect(finishLineX - finishLineWidth/2, y + squareSize, squareSize, squareSize);
    }
    
    // Add text on finish line
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 24px Cairo';
    ctx.textAlign = 'center';
    
    ctx.save();
    ctx.translate(finishLineX - 25, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('FINISH LINE 🏁 النهاية', 0, 0);
    ctx.restore();

    // Update & Draw Players
    for (let p of players.values()) {
        if (!isGameOver) {
            // Smooth movement
            p.x += (p.targetX - p.x) * 0.05;
            
            // Check win
            if (p.x >= finishLineX) {
                p.x = finishLineX;
                endGame(p);
            }
            
            // Jet exhaust/smoke particles if the car is moving
            if (p.targetX > p.x + 2 && Math.random() < 0.3) {
                particles.push({
                    x: p.x - 45, // Back of car
                    y: p.y + (Math.random() - 0.5) * 10,
                    vx: -Math.random() * 8 - 4,
                    vy: (Math.random() - 0.5) * 3,
                    life: 15 + Math.random() * 15,
                    size: Math.random() * 4 + 2,
                    color: ['#ff3300', '#ffaa00', '#ffea00'][Math.floor(Math.random() * 3)] // fire colors
                });
            }
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        
        // 1. NEON UNDERGLOW
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(-5, 0, 42, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0; // reset shadow
        
        // 2. WHEELS (4 wheels - black rounded rectangles)
        ctx.fillStyle = '#0f1115';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        const wheelDraw = (wx, wy, wl, ww) => {
            ctx.beginPath();
            ctx.roundRect(wx - wl/2, wy - ww/2, wl, ww, 4);
            ctx.fill();
            ctx.stroke();
        };
        wheelDraw(22, -19, 16, 7); // FL
        wheelDraw(22, 19, 16, 7);  // FR
        wheelDraw(-22, -20, 18, 9); // RL
        wheelDraw(-22, 20, 18, 9);  // RR
        
        // 3. CAR BODY
        // Sports car sleek body shape path
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Nose (front right)
        ctx.moveTo(38, -8);
        ctx.bezierCurveTo(45, -5, 45, 5, 38, 8);
        // Right side
        ctx.lineTo(20, 16);
        ctx.lineTo(-20, 17);
        // Rear right wing base
        ctx.lineTo(-38, 14);
        // Rear bumper
        ctx.lineTo(-38, -14);
        // Left side
        ctx.lineTo(-20, -17);
        ctx.lineTo(20, -16);
        ctx.closePath();
        ctx.fill();
        
        // Dark outline for contrast
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 4. RACING STRIPES & DECALS
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // white stripes
        ctx.fillRect(-35, -3, 60, 2);
        ctx.fillRect(-35, 1, 60, 2);
        
        // 5. CABIN / WINDSHIELD
        ctx.fillStyle = '#00f2fe'; // glowing cyan glass
        ctx.beginPath();
        ctx.moveTo(15, -11);
        ctx.lineTo(25, -7);
        ctx.lineTo(25, 7);
        ctx.lineTo(15, 11);
        ctx.lineTo(-10, 12);
        ctx.lineTo(-10, -12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#051b2c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 6. SPOILER (back wing)
        ctx.fillStyle = '#0f1115';
        ctx.fillRect(-45, -23, 6, 46); // wing blade
        ctx.fillStyle = p.color;
        ctx.fillRect(-42, -18, 4, 3);   // wing mounts
        ctx.fillRect(-42, 15, 4, 3);
        
        // 7. DRIVER AVATAR (Helmet-like circular profile picture)
        ctx.save();
        ctx.beginPath();
        ctx.arc(-2, 0, 15, 0, Math.PI * 2);
        ctx.clip();
        if (p.picImg && p.picImg.complete && p.picImg.naturalWidth > 0) {
            ctx.drawImage(p.picImg, -17, -17, 34, 34);
        } else {
            ctx.fillStyle = p.color;
            ctx.fill();
        }
        ctx.restore();
        
        // Helmet chrome rim
        ctx.strokeStyle = '#ffd700'; // Gold helmet rim
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-2, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // 8. TEXT LABELS (Player name & Score)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Cairo';
        ctx.textAlign = 'center';
        // Draw background pill for text readability
        const textWidth = ctx.measureText(p.nickname).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(-textWidth/2 - 10, -42, textWidth + 20, 20, 6);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.fillText(p.nickname, 0, -28);
        
        ctx.restore();
    }
    
    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        ctx.globalAlpha = pt.life / 50;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size || 4, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) particles.splice(i, 1);
    }
    
    // Draw Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ctx.globalAlpha = ft.life / 60;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Cairo';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        ft.y += ft.vy;
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
    
    requestAnimationFrame(draw);
}
draw();
