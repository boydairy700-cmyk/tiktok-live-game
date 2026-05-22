const socket = io();

// UI Elements
const setupPanel = document.getElementById('setup-panel');
const usernameInput = document.getElementById('username-input');
const connectBtn = document.getElementById('connect-btn');
const testModeBtn = document.getElementById('test-mode-btn');
const statusMsg = document.getElementById('status-msg');

const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const instructionsToggleBtn = document.getElementById('instructions-toggle-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const visualInstructions = document.getElementById('visual-instructions');
const connectionInputs = document.getElementById('connection-inputs');

const leaderboardDiv = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const gameStatusDiv = document.getElementById('game-status');
const connectedUserSpan = document.getElementById('connected-user');
const timerDisplay = document.getElementById('timer-display');
const winnerScreen = document.getElementById('winner-screen');
const winnersListDiv = document.getElementById('winners-list');
const extraWinnersListDiv = document.getElementById('extra-winners-list');
const restartBtn = document.getElementById('restart-btn');

const gameDurationSelect = document.getElementById('game-duration');
const chatActionSelect = document.getElementById('chat-action');
const likeActionSelect = document.getElementById('like-action');
const followActionSelect = document.getElementById('follow-action');
const shareActionSelect = document.getElementById('share-action');

const gift1ActionSelect = document.getElementById('gift-1-action');
const gift5ActionSelect = document.getElementById('gift-5-action');
const gift30ActionSelect = document.getElementById('gift-30-action');
const gift100ActionSelect = document.getElementById('gift-100-action');
const gift1000ActionSelect = document.getElementById('gift-1000-action');

const autoRestartToggle = document.getElementById('auto-restart-toggle');
const autoRestartStatus = document.getElementById('auto-restart-status');
const autoRestartTimer = document.getElementById('auto-restart-timer');

let isConnected = false;
let autoRestartTimeout = null;
let autoRestartInterval = null;

// Format label (remove emojis for cleaner look in the card if needed, or keep them)
function formatActionLabel(selectElement) {
    if (!selectElement) return "...";
    const text = selectElement.options[selectElement.selectedIndex].text;
    return text;
}

// Update labels in visual instructions
function updateLabels() {
    if(document.getElementById('lbl-chat')) document.getElementById('lbl-chat').innerHTML = formatActionLabel(chatActionSelect);
    if(document.getElementById('lbl-like')) document.getElementById('lbl-like').innerHTML = formatActionLabel(likeActionSelect);
    if(document.getElementById('lbl-follow')) document.getElementById('lbl-follow').innerHTML = formatActionLabel(followActionSelect);
    if(document.getElementById('lbl-share')) document.getElementById('lbl-share').innerHTML = formatActionLabel(shareActionSelect);
    if(document.getElementById('lbl-gift-1')) document.getElementById('lbl-gift-1').innerHTML = formatActionLabel(gift1ActionSelect);
    if(document.getElementById('lbl-gift-5')) document.getElementById('lbl-gift-5').innerHTML = formatActionLabel(gift5ActionSelect);
    if(document.getElementById('lbl-gift-30')) document.getElementById('lbl-gift-30').innerHTML = formatActionLabel(gift30ActionSelect);
    if(document.getElementById('lbl-gift-100')) document.getElementById('lbl-gift-100').innerHTML = formatActionLabel(gift100ActionSelect);
    if(document.getElementById('lbl-gift-1000')) document.getElementById('lbl-gift-1000').innerHTML = formatActionLabel(gift1000ActionSelect);
}

document.querySelectorAll('.action-select').forEach(sel => {
    sel.addEventListener('change', updateLabels);
});
updateLabels(); // Initial setup

// Handle Settings Toggle
settingsToggleBtn.addEventListener('click', () => {
    if (setupPanel.style.display === 'none') {
        setupPanel.style.display = 'block';
    } else {
        setupPanel.style.display = 'none';
        updateLabels();
    }
});

// Handle Instructions Toggle
instructionsToggleBtn.addEventListener('click', () => {
    if (visualInstructions.style.display === 'none') {
        visualInstructions.style.display = 'block';
        instructionsToggleBtn.innerHTML = '  ';
    } else {
        visualInstructions.style.display = 'none';
        instructionsToggleBtn.innerHTML = '  ';
    }
});

function hideSetup() {
    setupPanel.style.display = 'none';
    settingsToggleBtn.style.display = 'block';
    instructionsToggleBtn.style.display = 'block';
    updateLabels();
}

closeSettingsBtn.addEventListener('click', () => {
    setupPanel.style.display = 'none';
});

// Canvas Setup
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

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'saw') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'grow') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'shock') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
        osc.start(); osc.stop(audioCtx.currentTime + 1.0);
    }
}

// Glow Utility
function drawGlowCircle(x, y, r, color, intensity) {
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * (1 + intensity));
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r * (1 + intensity), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Game State
const players = new Map();
const spikes = [];
const particles = [];
const lightnings = [];
const floatingTexts = [];
let energyBeams = [];
const meteors = [];
let blackHole = null;
let lasers = [];
const winCounts = new Map(); // Persistent across rounds

// Premium Background: Starfield
class Star {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 0.5 + 0.1;
        this.alpha = Math.random();
        this.color = Math.random() > 0.8 ? '#e94560' : (Math.random() > 0.8 ? '#00f2fe' : '#fff');
    }
    update() {
        this.y += this.speed;
        if (this.y > height) {
            this.y = 0;
            this.x = Math.random() * width;
        }
        this.alpha = 0.3 + Math.abs(Math.sin(time * this.speed)) * 0.7;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}
const stars = Array.from({ length: 150 }, () => new Star());

let shakeIntensity = 0;
function applyShake(intensity) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
}

let topPlayerId = null;
let gameDurationMinutes = 5;
let timeRemaining = 0;
let isGameOver = false;
let lastTime = Date.now();
let timerActive = false;
let testInterval = null;

function onGameStart() {
    isConnected = true;
    hideSetup();
    visualInstructions.style.display = 'block';
    leaderboardDiv.style.display = 'block';
    gameStatusDiv.style.display = 'block';
    settingsToggleBtn.style.display = 'block';
    instructionsToggleBtn.style.display = 'block';
    startGameTimer();
}

// Connection Logic
const savedSession = localStorage.getItem('tiktok_session_id');
const savedUsername = localStorage.getItem('tiktok_username');
if (savedSession && document.getElementById('session-input')) {
    document.getElementById('session-input').value = savedSession;
}
if (savedUsername && usernameInput) {
    usernameInput.value = savedUsername;
}

connectBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const sessionInput = document.getElementById('session-input');
    const sessionId = sessionInput ? sessionInput.value.trim() : '';

    if (!username) {
        statusMsg.innerText = "أدخل اسم المستخدم";
        return;
    }
    
    // Save for next time automatically
    localStorage.setItem('tiktok_username', username);
    if (sessionId) {
        localStorage.setItem('tiktok_session_id', sessionId);
    }
    
    gameDurationMinutes = parseInt(gameDurationSelect.value);
    
    updateLabels();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    statusMsg.innerText = "جاري الاتصال بـ TikTok...";
    socket.emit('connectTikTok', { username, sessionId });
});

testModeBtn.addEventListener('click', () => {
    gameDurationMinutes = parseInt(gameDurationSelect.value);
    updateLabels();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    onGameStart();
    connectedUserSpan.innerText = "وضع التجربة";
    
    if (testInterval) clearInterval(testInterval);
    
    testInterval = setInterval(() => {
        if (isGameOver) return;
        const randomEvent = Math.random();
        const mockUser = {
            uniqueId: 'bot' + Math.floor(Math.random() * 8),
            nickname: 'بوت ' + Math.floor(Math.random() * 8),
            profilePictureUrl: ''
        };
        
        if (randomEvent < 0.2) {
            const player = addPlayerIfNotExists(mockUser);
            handleAction(player, chatActionSelect.value, 1);
        } else if (randomEvent < 0.5) {
            const player = addPlayerIfNotExists(mockUser);
            player.score += 0.5;
            handleAction(player, likeActionSelect.value, 1);
        } else if (randomEvent < 0.6) {
            const player = addPlayerIfNotExists(mockUser);
            handleAction(player, followActionSelect.value, 1);
        } else if (randomEvent < 0.7) {
            const player = addPlayerIfNotExists(mockUser);
            handleAction(player, shareActionSelect.value, 1);
        } else if (randomEvent < 0.8) {
            const player = addPlayerIfNotExists(mockUser);
            // Simulate random gifts
            const giftType = Math.random();
            let actionType, amount;
            if (giftType < 0.3) { actionType = gift1ActionSelect.value; amount = 1; }
            else if (giftType < 0.5) { actionType = gift5ActionSelect.value; amount = 1; }
            else if (giftType < 0.7) { actionType = gift30ActionSelect.value; amount = 1; }
            else if (giftType < 0.9) { actionType = gift100ActionSelect.value; amount = 2; }
            else { actionType = gift1000ActionSelect.value; amount = 10; }
            handleAction(player, actionType, amount);
        }
    }, 800);
});

function startGameTimer() {
    if (gameDurationMinutes > 0) {
        timeRemaining = gameDurationMinutes * 60;
        timerActive = true;
        timerDisplay.style.display = 'block';
    } else {
        timerActive = false;
        timerDisplay.style.display = 'none';
    }
    lastTime = Date.now();
    isGameOver = false;
    winnerScreen.style.display = 'none';
}

socket.on('tiktokConnected', (data) => {
    onGameStart();
    connectedUserSpan.innerText = usernameInput.value.trim();
});

socket.on('tiktokError', (err) => {
    statusMsg.innerText = "خطأ: " + err;
});

socket.on('tiktokDisconnected', () => {
    isConnected = false;
    setupPanel.style.display = 'block';
    visualInstructions.style.display = 'none';
    leaderboardDiv.style.display = 'none';
    gameStatusDiv.style.display = 'none';
    timerDisplay.style.display = 'none';
    settingsToggleBtn.style.display = 'none';
    instructionsToggleBtn.style.display = 'none';
    connectionInputs.style.display = 'block';
    connectBtn.style.display = 'block';
    testModeBtn.style.display = 'block';
    closeSettingsBtn.style.display = 'none';
    statusMsg.innerText = "تم قطع الاتصال.";
});

restartBtn.addEventListener('click', () => {
    if (autoRestartTimeout) clearTimeout(autoRestartTimeout);
    if (autoRestartInterval) clearInterval(autoRestartInterval);
    autoRestartStatus.style.display = 'none';

    players.clear();
    spikes.length = 0;
    particles.length = 0;
    lightnings.length = 0;
    floatingTexts.length = 0;
    energyBeams.length = 0;
    meteors.length = 0;
    lasers.length = 0;
    blackHole = null;
    topPlayerId = null;
    updateLeaderboard();
    startGameTimer();
});

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 60%)`;
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 40, vy: -1.5 });
}

function addPlayerIfNotExists(data) {
    if (!players.has(data.uniqueId)) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        if (data.profilePictureUrl) img.src = data.profilePictureUrl;

        players.set(data.uniqueId, {
            id: data.uniqueId,
            nickname: data.nickname,
            picImg: img,
            score: 20,
            color: getRandomColor(),
            x: Math.random() * (width - 100) + 50,
            y: Math.random() * (height - 100) + 50,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            sawTimer: 0,
            freezeTimer: 0,
            speedTimer: 0,
            shieldTimer: 0,
            ghostTimer: 0,
            magnetTimer: 0,
            tornadoTimer: 0,
            picUrl: data.profilePictureUrl
        });
        updateLeaderboard();
    }
    return players.get(data.uniqueId);
}

function getPlayerRadius(score) {
    return Math.max(15, Math.sqrt(Math.max(1, score)) * 4);
}

function shootSpike(player, count = 1, multiplier = 1) {
    playSound('hit');
    const actualCount = Math.min(count, 40); // Prevent lag
    const dmg = 50 * multiplier;
    for (let i = 0; i < actualCount; i++) {
        let angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 5;
        const r = getPlayerRadius(player.score);
        spikes.push({
            ownerId: player.id,
            ownerColor: player.color,
            x: player.x + Math.cos(angle) * r,
            y: player.y + Math.sin(angle) * r,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 150,
            damage: dmg
        });
    }
}

function electricShock(player, multiplier) {
    playSound('shock');
    let targets = Array.from(players.values()).filter(p => p.id !== player.id && p.shieldTimer <= 0 && p.ghostTimer <= 0);
    targets.sort((a, b) => b.score - a.score);
    targets = targets.slice(0, 15); // Cap to 15 targets to avoid lag
    for (let p of targets) {
        lightnings.push({ x1: player.x, y1: player.y, x2: p.x, y2: p.y, life: 15, color: '#0ff' });
        const maxDmg = p.score * 0.4 + 200 * multiplier;
        const damage = Math.min(p.score - 5, maxDmg);
        if (damage > 0) {
            p.score -= damage;
            p.freezeTimer = 100;
            player.score += damage;
            addFloatingText(p.x, p.y, `-${Math.floor(damage)}`, '#ff0000');
            addFloatingText(player.x, player.y, `+${Math.floor(damage)}`, '#00ff00');
        }
    }
}

function handleAction(player, actionType, multiplier = 1) {
    if (actionType === 'grow_small') {
        player.score += 3 * multiplier;
        createParticles(player.x, player.y, player.color, 5);
        playSound('grow');
    } else if (actionType === 'grow_big') {
        player.score += 20 * multiplier;
        createParticles(player.x, player.y, player.color, 15);
        playSound('grow');
    } else if (actionType === 'shoot') {
        shootSpike(player, 5, multiplier);
        player.score = Math.max(10, player.score - 1);
    } else if (actionType === 'shoot_many') {
        shootSpike(player, Math.floor(10 + multiplier * 2), multiplier);
        player.score = Math.max(10, player.score - 2);
    } else if (actionType === 'saw') {
        player.sawTimer += 150 + (multiplier * 50);
        playSound('saw');
    } else if (actionType === 'electric_shock') {
        electricShock(player, multiplier);
    } else if (actionType === 'speed_boost') {
        player.speedTimer += 200 * multiplier;
        createParticles(player.x, player.y, '#ff0', 10);
    } else if (actionType === 'shield') {
        player.shieldTimer += 300 * multiplier;
        createParticles(player.x, player.y, '#00f', 15);
    } else if (actionType === 'ghost') {
        player.ghostTimer += 300 * multiplier;
        createParticles(player.x, player.y, '#fff', 15);
    } else if (actionType === 'magnetic_pull') {
        player.magnetTimer += 200 * multiplier;
        createParticles(player.x, player.y, '#f0f', 15);
    } else if (actionType === 'tornado') {
        player.tornadoTimer += 150 * multiplier;
        createParticles(player.x, player.y, '#ccc', 20);
    } else if (actionType === 'freeze_others') {
        playSound('shock');
        for (let [id, p] of players) {
            if (id !== player.id && p.shieldTimer <= 0 && p.ghostTimer <= 0) {
                p.freezeTimer = Math.min(p.freezeTimer + 150 * multiplier, 300);
                createParticles(width/2, height/2, '#000', 30);
            }
        }
    } else if (actionType === 'shrink_others') {
        playSound('saw');
        for (let [id, p] of players) {
            if (id !== player.id && p.shieldTimer <= 0 && p.ghostTimer <= 0 && p.score > 15) {
                const maxDmg = p.score * 0.3 + 100 * multiplier;
                const dmg = Math.min(p.score - 5, maxDmg);
                if (dmg > 0) {
                    p.score -= dmg;
                    player.score += dmg;
                    addFloatingText(p.x, p.y, `-${Math.floor(dmg)}`, '#f00');
                }
            }
        }
    } else if (actionType === 'heal') {
        player.score += 15 * multiplier;
        createParticles(player.x, player.y, '#0f0', 10);
        addFloatingText(player.x, player.y, `+${Math.floor(15*multiplier)}`, '#0f0');
    } else if (actionType === 'meteor_strike') {
        playSound('shock'); // Big sound
        meteors.push({
            x: width / 2 + (Math.random()-0.5)*300,
            y: -200,
            targetY: height / 2 + (Math.random()-0.5)*200,
            radius: 60 + Math.min(multiplier * 3, 150),
            vy: 25,
            color: '#ff4b2b',
            ownerId: player.id,
            multiplier: multiplier
        });
    } else if (actionType === 'laser_beam') {
        playSound('hit');
        lasers.push({
            x: player.x,
            y: player.y,
            angle: Math.random() * Math.PI * 2,
            life: 60,
            ownerId: player.id,
            multiplier: multiplier
        });
    } else if (actionType === 'black_hole') {
        playSound('saw');
        if(!blackHole) {
            blackHole = { x: width/2, y: height/2, life: 300, power: multiplier, ownerId: player.id };
        } else {
            blackHole.life += 150;
            blackHole.power += multiplier * 0.5;
        }
    } else if (actionType === 'join') {
        player.score += 1;
    }
    updateLeaderboard();
}

// Events
socket.on('tiktokChat', (data) => {
    if (isGameOver) return;
    const player = addPlayerIfNotExists(data);
    handleAction(player, chatActionSelect.value, 1);
});

socket.on('tiktokGift', (data) => {
    if (isGameOver) return;
    const player = addPlayerIfNotExists(data);
    
    const amount = data.diamondCount * data.repeatCount || 1;
    const singleCost = data.diamondCount || 1;
    
    let actionType;
    let multiplier = amount;
    
    // Exponential multiplier scaling for expensive gifts
    if (singleCost >= 1000) multiplier = amount * 15;
    else if (singleCost >= 100) multiplier = amount * 8;
    else if (singleCost >= 30) multiplier = amount * 5;
    else if (singleCost >= 5) multiplier = amount * 3;

    if (singleCost < 5) {
        actionType = gift1ActionSelect.value;
    } else if (singleCost < 30) {
        actionType = gift5ActionSelect.value;
    } else if (singleCost < 100) {
        actionType = gift30ActionSelect.value;
    } else if (singleCost < 1000) {
        actionType = gift100ActionSelect.value;
    } else {
        actionType = gift1000ActionSelect.value;
    }
    
    handleAction(player, actionType, multiplier);
});

socket.on('tiktokLike', (data) => {
    if (isGameOver) return;
    const player = addPlayerIfNotExists(data);
    const likes = Math.ceil(data.likeCount / 10);
    player.score += likes * 0.5; // inherent bonus
    handleAction(player, likeActionSelect.value, 1); 
});

socket.on('tiktokFollow', (data) => {
    if (isGameOver) return;
    const player = addPlayerIfNotExists(data);
    handleAction(player, followActionSelect.value, 1);
});

socket.on('tiktokShare', (data) => {
    if (isGameOver) return;
    const player = addPlayerIfNotExists(data);
    handleAction(player, shareActionSelect.value, 1);
});

// Effects
function createParticles(x, y, color, count) {
    if (isGameOver) return;
    const actualCount = Math.min(count, 40); // Cap particles to prevent freezing
    for (let i = 0; i < actualCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30 + Math.random() * 30,
            color: color
        });
    }
}

function updateLeaderboard() {
    const sorted = Array.from(players.values()).sort((a, b) => b.score - a.score);
    topPlayerId = sorted.length > 0 ? sorted[0].id : null;
    
    leaderboardList.innerHTML = '';
    sorted.slice(0, 7).forEach((p, index) => {
        if (index === 3) {
            const separator = document.createElement('div');
            separator.style.height = '1px';
            separator.style.background = 'rgba(255,255,255,0.1)';
            separator.style.margin = '5px 20px';
            leaderboardList.appendChild(separator);
        }
        const li = document.createElement('li');
        li.className = index < 3 ? 'rank-top' : 'rank-sub';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'player-info';
        
        const img = document.createElement('img');
        img.src = p.picUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.nickname) + '&background=random';
        img.className = 'player-avatar';
        
        const rankSpan = document.createElement('span');
        let wins = winCounts.get(p.id) || 0;
        let pName = p.nickname.length > 8 ? p.nickname.substring(0,8)+'..' : p.nickname;
        if (wins > 0) pName = ` ${pName}`;
        
        let rankIcon = '';
        if (index === 0) rankIcon = '';
        else if (index === 1) rankIcon = '';
        else if (index === 2) rankIcon = '';
        else rankIcon = `${index + 1}.`;

        rankSpan.innerText = `${rankIcon} ${pName}`;
        rankSpan.style.color = '#fff';
        
        infoDiv.appendChild(img);
        infoDiv.appendChild(rankSpan);

        const scoreSpan = document.createElement('span');
        scoreSpan.innerText = Math.floor(p.score);
        scoreSpan.style.color = p.color;
        scoreSpan.style.fontWeight = 'bold';

        li.appendChild(infoDiv);
        li.appendChild(scoreSpan);
        leaderboardList.appendChild(li);
    });
}

function endGame() {
    isGameOver = true;
    timerActive = false;
    playSound('win');
    
    winnerScreen.style.display = 'flex';
    
    const allSorted = Array.from(players.values()).sort((a, b) => b.score - a.score).slice(0, 7);
    const topThree = allSorted.slice(0, 3);
    const theRest = allSorted.slice(3, 7);

    winnersListDiv.innerHTML = '';
    extraWinnersListDiv.innerHTML = '';
    
    if (topThree.length === 0) {
        winnersListDiv.innerHTML = '<h3 style="color:white;">لا يوجد فائزون</h3>';
        return;
    }

    // Register wins for the top player
    if (topThree[0]) {
        const winnerId = topThree[0].id;
        winCounts.set(winnerId, (winCounts.get(winnerId) || 0) + 1);
        
        // Final Celebration Particles
        for(let i=0; i<150; i++) {
            particles.push({
                x: width/2,
                y: height/2,
                vx: (Math.random()-0.5)*25,
                vy: (Math.random()-0.5)*25,
                life: 120 + Math.random()*120,
                color: ['#FFD700', '#fff', '#e94560', '#00f2fe'][Math.floor(Math.random()*4)]
            });
        }
    }

    const heights = [220, 160, 120];
    const colors = ['#FFD700', '#E0E0E0', '#CD7F32'];
    const medals = ['', '', ''];

    let podiumOrder = [];
    if (topThree[1]) podiumOrder.push({p: topThree[1], rank: 1});
    if (topThree[0]) podiumOrder.push({p: topThree[0], rank: 0});
    if (topThree[2]) podiumOrder.push({p: topThree[2], rank: 2});

    podiumOrder.forEach((item, idx) => {
        const p = item.p;
        const rank = item.rank;
        
        const col = document.createElement('div');
        col.style.display = 'flex';
        col.style.flexDirection = 'column';
        col.style.alignItems = 'center';
        col.style.justifyContent = 'flex-end';
        col.style.animation = `popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards ${idx * 0.2}s`;
        col.style.opacity = '0';

        if (rank === 0) {
            const crown = document.createElement('div');
            crown.innerText = '';
            crown.style.fontSize = '60px';
            crown.style.marginBottom = '-15px';
            crown.style.zIndex = '2';
            crown.style.animation = 'float 2s ease-in-out infinite';
            col.appendChild(crown);
        }

        const img = document.createElement('img');
        img.src = p.picUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.nickname) + '&background=random';
        img.style.width = rank === 0 ? '110px' : '90px';
        img.style.height = rank === 0 ? '110px' : '90px';
        img.style.borderRadius = '50%';
        img.style.border = `5px solid ${colors[rank]}`;
        img.style.objectFit = 'cover';
        img.style.backgroundColor = '#333';
        img.style.zIndex = '1';
        img.style.boxShadow = `0 0 20px ${colors[rank]}`;
        col.appendChild(img);

        const nameSpan = document.createElement('div');
        nameSpan.innerText = p.nickname.length > 12 ? p.nickname.substring(0, 12) + '..' : p.nickname;
        
        let wins = winCounts.get(p.id) || 0;
        if (wins > 0) nameSpan.innerText += ` (+${wins})`;

        nameSpan.style.color = '#fff';
        nameSpan.style.fontSize = '24px';
        nameSpan.style.fontWeight = 'bold';
        nameSpan.style.marginTop = '10px';
        nameSpan.style.textShadow = '0 0 10px rgba(0,0,0,0.5)';
        col.appendChild(nameSpan);

        const scoreSpan = document.createElement('div');
        scoreSpan.innerText = Math.floor(p.score) + ' ';
        scoreSpan.style.color = colors[rank];
        scoreSpan.style.fontSize = '20px';
        scoreSpan.style.marginBottom = '15px';
        col.appendChild(scoreSpan);

        const bar = document.createElement('div');
        bar.style.width = '150px';
        bar.style.height = heights[rank] + 'px';
        bar.style.backgroundColor = colors[rank];
        bar.style.backgroundImage = 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.2) 100%)';
        bar.style.borderRadius = '15px 15px 0 0';
        bar.style.display = 'flex';
        bar.style.justifyContent = 'center';
        bar.style.alignItems = 'center';
        bar.style.boxShadow = `0 0 30px ${colors[rank]}80`;
        
        const medalSpan = document.createElement('div');
        medalSpan.innerText = medals[rank];
        medalSpan.style.fontSize = '70px';
        bar.appendChild(medalSpan);

        col.appendChild(bar);
        winnersListDiv.appendChild(col);
    });

    // Extra Winners (4-7)
    theRest.forEach((p, idx) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.padding = '10px 20px';
        item.style.borderRadius = '12px';
        item.style.border = '1px solid rgba(255,255,255,0.1)';
        item.style.animation = `slideInRight 0.5s ease-out forwards ${0.8 + idx * 0.1}s`;
        item.style.opacity = '0';
        item.style.width = '100%';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '15px';

        const rankLabel = document.createElement('span');
        rankLabel.innerText = `${idx + 4}.`;
        rankLabel.style.color = '#ccc';
        rankLabel.style.fontSize = '18px';
        rankLabel.style.fontWeight = 'bold';
        rankLabel.style.width = '25px';

        const img = document.createElement('img');
        img.src = p.picUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.nickname) + '&background=random';
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.borderRadius = '50%';
        img.style.border = '2px solid rgba(255,255,255,0.2)';

        const name = document.createElement('span');
        name.innerText = p.nickname;
        name.style.color = '#fff';
        name.style.fontSize = '18px';

        left.appendChild(rankLabel);
        left.appendChild(img);
        left.appendChild(name);

        const score = document.createElement('span');
        score.innerText = Math.floor(p.score);
        score.style.color = p.color || '#fff';
        score.style.fontWeight = 'bold';
        score.style.fontSize = '18px';

        item.appendChild(left);
        item.appendChild(score);
        extraWinnersListDiv.appendChild(item);
    });

    // Auto Restart Logic
    if (autoRestartToggle && autoRestartToggle.checked) {
        autoRestartStatus.style.display = 'block';
        let timeLeft = 5;
        autoRestartTimer.innerText = timeLeft;
        
        if (autoRestartInterval) clearInterval(autoRestartInterval);
        autoRestartInterval = setInterval(() => {
            timeLeft--;
            autoRestartTimer.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(autoRestartInterval);
            }
        }, 1000);

        if (autoRestartTimeout) clearTimeout(autoRestartTimeout);
        autoRestartTimeout = setTimeout(() => {
            if (isGameOver) {
                restartBtn.click();
            }
        }, 5000);
    } else {
        autoRestartStatus.style.display = 'none';
    }
}

function update() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (timerActive && !isGameOver) {
        timeRemaining -= dt;
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            endGame();
        }
        
        const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const secs = Math.floor(timeRemaining % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `${mins}:${secs}`;
    }

    if (isGameOver) return; // Stop movement

    const playersArr = Array.from(players.values());
    
    for (let i = 0; i < playersArr.length; i++) {
        let p = playersArr[i];
        
        // Timers
        if (p.sawTimer > 0) p.sawTimer--;
        if (p.shieldTimer > 0) p.shieldTimer--;
        if (p.speedTimer > 0) p.speedTimer--;
        if (p.ghostTimer > 0) p.ghostTimer--;
        
        if (p.magnetTimer > 0) {
            p.magnetTimer--;
            for (let p2 of playersArr) {
                if (p2.id !== p.id && p.score > p2.score) {
                    const angle = Math.atan2(p.y - p2.y, p.x - p2.x);
                    p2.vx += Math.cos(angle) * 0.5;
                    p2.vy += Math.sin(angle) * 0.5;
                }
            }
        }

        if (p.tornadoTimer > 0) {
            p.tornadoTimer--;
            for (let p2 of playersArr) {
                if (p2.id !== p.id) {
                    const dist = Math.hypot(p.y - p2.y, p.x - p2.x);
                    if (dist < 300) {
                        const angle = Math.atan2(p2.y - p.y, p2.x - p.x);
                        p2.vx += Math.cos(angle) * 1.5;
                        p2.vy += Math.sin(angle) * 1.5;
                    }
                }
            }
        }

        if (p.freezeTimer > 0) {
            p.freezeTimer--;
            continue; // Skip movement
        }

        // Apply speed boost
        let speedMult = p.speedTimer > 0 ? 2.5 : 1;
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        p.score = Math.max(1, p.score);
        const r = getPlayerRadius(p.score);

        // Bounce
        if (p.x - r < 0) { p.x = r; p.vx *= -1; }
        if (p.x + r > width) { p.x = width - r; p.vx *= -1; }
        if (p.y - r < 0) { p.y = r; p.vy *= -1; }
        if (p.y + r > height) { p.y = height - r; p.vy *= -1; }

        if (Math.random() < 0.05) {
            p.vx += (Math.random() - 0.5) * 2;
            p.vy += (Math.random() - 0.5) * 2;
            const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
            const maxSpeed = 3;
            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }
        }
    }

    // Black Hole Update
    if (blackHole) {
        blackHole.life--;
        for (let p of playersArr) {
            if (p.shieldTimer <= 0 && p.ghostTimer <= 0) {
                const dist = Math.hypot(p.x - blackHole.x, p.y - blackHole.y);
                if (dist > 20) {
                    const angle = Math.atan2(blackHole.y - p.y, blackHole.x - p.x);
                    const force = (1000 / (dist * dist)) * blackHole.power;
                    p.vx += Math.cos(angle) * Math.min(force, 2);
                    p.vy += Math.sin(angle) * Math.min(force, 2);
                }
                if (dist < 80 && p.score > 5 && p.id !== blackHole.ownerId) {
                    const maxDmg = p.score * 0.1 + 100.0 * blackHole.power;
                    const dmg = Math.min(p.score - 5, maxDmg);
                    if(dmg > 0) {
                        p.score -= dmg;
                        const owner = players.get(blackHole.ownerId);
                        if (owner) owner.score += dmg;
                        createParticles(p.x, p.y, '#500', 5);
                    }
                }
            }
        }
        if (blackHole.life <= 0) blackHole = null;
    }

    // Lasers Update
    for (let i = lasers.length - 1; i >= 0; i--) {
        let l = lasers[i];
        l.angle += 0.05; // sweep
        l.life--;
        
        // Damage players crossing the laser (approximate with raycast distance)
        const lx = Math.cos(l.angle);
        const ly = Math.sin(l.angle);
        
        for (let p of playersArr) {
            if (p.id !== l.ownerId && p.shieldTimer <= 0 && p.ghostTimer <= 0 && p.score > 10) {
                // Vector from laser origin to player
                const dx = p.x - l.x;
                const dy = p.y - l.y;
                // Dot product for projection
                const dot = dx * lx + dy * ly;
                if (dot > 0) {
                    // Distance from point to line
                    const px = l.x + dot * lx;
                    const py = l.y + dot * ly;
                    const distToLine = Math.hypot(p.x - px, p.y - py);
                    if (distToLine < getPlayerRadius(p.score) + 30) {
                        const rawDmg = p.score * 0.2 + 200 * (l.multiplier || 1);
                        const dmg = Math.min(p.score - 5, rawDmg);
                        if(dmg > 0) {
                            p.score -= dmg;
                            const owner = players.get(l.ownerId);
                            if(owner && owner.id !== p.id) owner.score += dmg;
                            createParticles(p.x, p.y, '#f00', 5);
                        }
                    }
                }
            }
        }
        
        if (l.life <= 0) lasers.splice(i, 1);
    }

    // Meteors Update
    for (let i = meteors.length - 1; i >= 0; i--) {
        let m = meteors[i];
        m.y += m.vy;
        
        if (m.y >= m.targetY) {
            // EXPLOSION!
            createParticles(m.x, m.targetY, '#ff4b2b', 50);
            playSound('hit');
            applyShake(25);
            
            // Screen shake effect
            for (let p of playersArr) {
                if (p.shieldTimer <= 0 && p.ghostTimer <= 0) {
                    const dist = Math.hypot(p.x - m.x, p.y - m.targetY);
                    if (dist < m.radius * 4) {
                        const rawDmg = Math.max(100, (m.radius * 4 - dist) * 5) * m.multiplier;
                        const damage = Math.min(p.score - 5, p.score * 0.8 + rawDmg);
                        if (damage > 0) {
                            p.score -= damage;
                            const owner = players.get(m.ownerId);
                            if (owner && owner.id !== p.id) owner.score += damage;
                        }
                        
                        const angle = Math.atan2(p.y - m.targetY, p.x - m.x);
                        p.vx += Math.cos(angle) * 15;
                        p.vy += Math.sin(angle) * 15;
                        
                        addFloatingText(p.x, p.y, `-${Math.floor(damage)}`, '#ff0000');
                    }
                }
            }
            meteors.splice(i, 1);
        }
    }

    // Collisions
    for (let i = 0; i < playersArr.length; i++) {
        for (let j = i + 1; j < playersArr.length; j++) {
            let p1 = playersArr[i];
            let p2 = playersArr[j];
            let r1 = getPlayerRadius(p1.score);
            let r2 = getPlayerRadius(p2.score);
            let dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            
            if (dist < r1 + r2) {
                if (p1.ghostTimer <= 0 && p2.ghostTimer <= 0) {
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    const push = 1.0;
                    if(p1.freezeTimer <= 0) { p1.vx -= Math.cos(angle) * push; p1.vy -= Math.sin(angle) * push; }
                    if(p2.freezeTimer <= 0) { p2.vx += Math.cos(angle) * push; p2.vy += Math.sin(angle) * push; }
                }

                let drained = false;
                const p1Protected = p1.shieldTimer > 0 || p1.ghostTimer > 0;
                const p2Protected = p2.shieldTimer > 0 || p2.ghostTimer > 0;
                let drainAmount = 0.5;
                if (p1.sawTimer > 0 || p2.sawTimer > 0) drainAmount = 20.0;

                if (p1.sawTimer > 0 && !p2Protected && p2.score > 10) { 
                    p2.score -= drainAmount; p1.score += drainAmount; drained = true; 
                    energyBeams.push({x1: p2.x, y1: p2.y, x2: p1.x, y2: p1.y, life: 2});
                }
                if (p2.sawTimer > 0 && !p1Protected && p1.score > 10) { 
                    p1.score -= drainAmount; p2.score += drainAmount; drained = true; 
                    energyBeams.push({x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, life: 2});
                }
                
                if (!drained) {
                    if (p1.score > p2.score + 5 && !p2Protected && p2.score > 10) {
                        p2.score -= drainAmount; p1.score += drainAmount; drained = true;
                        energyBeams.push({x1: p2.x, y1: p2.y, x2: p1.x, y2: p1.y, life: 2});
                    } else if (p2.score > p1.score + 5 && !p1Protected && p1.score > 10) {
                        p1.score -= drainAmount; p2.score += drainAmount; drained = true;
                        energyBeams.push({x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, life: 2});
                    }
                }
                
                if (drained && Math.random() < 0.1) {
                    createParticles(p1.x + (p2.x - p1.x)/2, p1.y + (p2.y - p1.y)/2, '#fff', 1);
                    if (Math.random() < 0.05) updateLeaderboard();
                }
            }
        }
    }

    // Spikes update
    for (let i = spikes.length - 1; i >= 0; i--) {
        let s = spikes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life--;

        if (s.life <= 0 || s.x < 0 || s.x > width || s.y < 0 || s.y > height) {
            spikes.splice(i, 1);
            continue;
        }

        for (let p of playersArr) {
            if (p.id === s.ownerId) continue;
            const r = getPlayerRadius(p.score);
            const dist = Math.hypot(p.x - s.x, p.y - s.y);
            if (dist < r) {
                if (p.shieldTimer <= 0 && p.ghostTimer <= 0) {
                    const rawDmg = s.damage || 50;
                    const damage = Math.min(p.score - 5, p.score * 0.1 + rawDmg);
                    if (damage > 0) {
                        p.score -= damage;
                        const owner = players.get(s.ownerId);
                        if (owner) owner.score += damage;
                    }
                    
                    createParticles(s.x, s.y, s.ownerColor, 15);
                    playSound('hit');
                    
                    addFloatingText(p.x, p.y - r, `-${Math.floor(damage)}`, '#ff0000');
                    if (owner) addFloatingText(owner.x, owner.y - getPlayerRadius(owner.score), `+${Math.floor(damage)}`, '#00ff00');
                }
                spikes.splice(i, 1);
                updateLeaderboard();
                break;
            }
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

let time = 0;
function draw() {
    time += 0.1;
    
    ctx.save();
    if (shakeIntensity > 0) {
        ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity);
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.1) shakeIntensity = 0;
    }

    // Clear background with deep space gradient
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    bgGrad.addColorStop(0, '#16213e');
    bgGrad.addColorStop(1, '#05050a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Stars
    stars.forEach(s => { s.update(); s.draw(); });

    if (blackHole) {
        ctx.save();
        ctx.translate(blackHole.x, blackHole.y);
        ctx.rotate(time);
        
        const r = 30 + Math.sin(time*2)*5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fillStyle = '#000';
        ctx.shadowColor = '#50f';
        ctx.shadowBlur = 30;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, 0, r+10, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(100, 0, 255, ${Math.abs(Math.sin(time))})`;
        ctx.lineWidth = 5;
        ctx.stroke();
        
        ctx.restore();
    }

    for (let l of lasers) {
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + Math.cos(l.angle)*2000, l.y + Math.sin(l.angle)*2000);
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 10 + Math.sin(time*10)*5;
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 20;
        ctx.stroke();
        
        // inner core
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + Math.cos(l.angle)*2000, l.y + Math.sin(l.angle)*2000);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
        ctx.stroke();
    }

    for (let b of energyBeams) {
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#0f0';
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(b.x1 + (b.x2 - b.x1) * Math.random(), b.y1 + (b.y2 - b.y1) * Math.random(), 4, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        b.life--;
    }
    energyBeams = energyBeams.filter(b => b.life > 0);

    for(let l of lightnings) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        let steps = 6;
        for(let i=1; i<=steps; i++) {
            let nx = l.x1 + (l.x2 - l.x1) * (i/steps) + (Math.random()-0.5)*30;
            let ny = l.y1 + (l.y2 - l.y1) * (i/steps) + (Math.random()-0.5)*30;
            if (i === steps) { nx = l.x2; ny = l.y2; }
            ctx.lineTo(nx, ny);
        }
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 4;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
        l.life--;
    }
    for (let i = lightnings.length - 1; i >= 0; i--) {
        if (lightnings[i].life <= 0) lightnings.splice(i, 1);
    }

    if (!isGameOver) {
        for (let [id, p] of players) {
            const r = getPlayerRadius(p.score);
            
            ctx.save();
            ctx.translate(p.x, p.y);

            if (p.ghostTimer > 0) {
                ctx.globalAlpha = 0.3;
            } else {
                ctx.globalAlpha = 1.0;
            }

            if (p.magnetTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, r + 40, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                ctx.lineWidth = 5;
                ctx.setLineDash([15, 15]);
                ctx.lineDashOffset = time * 20;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            if (p.tornadoTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, r + 50, time, time + Math.PI);
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
                ctx.lineWidth = 8;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, r + 30, -time, -time + Math.PI);
                ctx.stroke();
            }

            if (p.freezeTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
                ctx.fill();
            }

            if (p.shieldTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
                ctx.strokeStyle = '#00f';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#00f';
                ctx.shadowBlur = 15;
                ctx.stroke();
            }

            if (p.speedTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#ff0';
                ctx.setLineDash([10, 10]);
                ctx.lineDashOffset = -time * 20;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            if (p.sawTimer > 0) {
                ctx.save();
                ctx.rotate(time * 2);
                ctx.beginPath();
                const sawR = r + 15;
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const nextAngle = ((i+0.5) / 12) * Math.PI * 2;
                    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    ctx.lineTo(Math.cos(angle) * sawR, Math.sin(angle) * sawR);
                    ctx.lineTo(Math.cos(nextAngle) * r, Math.sin(nextAngle) * r);
                }
                ctx.closePath();
                ctx.fillStyle = '#aaa';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.restore();
            }

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.save();
            ctx.clip();

            if (p.picImg && p.picImg.complete && p.picImg.naturalWidth > 0) {
                ctx.drawImage(p.picImg, -r, -r, r * 2, r * 2);
            } else {
                ctx.fillStyle = p.color;
                ctx.fill();
            }
            ctx.restore();

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.restore();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px "Cairo", Arial';
            ctx.textAlign = 'center';
            
            let wins = winCounts.get(p.id) || 0;
            let displayName = p.nickname;
            if (wins > 0) displayName = `🏆 ${displayName} (+${wins})`;
            if (p.id === topPlayerId) displayName = '⭐ ' + displayName;
            
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#000';
            ctx.strokeText(displayName, p.x, p.y - r - 15);
            ctx.fillText(displayName, p.x, p.y - r - 15);
            
            ctx.font = 'bold 16px "Cairo", Arial';
            ctx.fillStyle = '#ffd700';
            ctx.strokeText(Math.floor(p.score), p.x, p.y + r + 25);
            ctx.fillText(Math.floor(p.score), p.x, p.y + r + 25);

        }

        for (let m of meteors) {
            drawGlowCircle(m.x, m.y, m.radius, '#ff4b2b', 1.5);
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius, 0, Math.PI*2);
            ctx.fillStyle = '#ff4b2b';
            ctx.fill();
            
            // Tail
            ctx.beginPath();
            ctx.moveTo(m.x - m.radius, m.y);
            ctx.lineTo(m.x + m.radius, m.y);
            ctx.lineTo(m.x, m.y - m.radius * 3);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 75, 43, 0.4)';
            ctx.fill();
        }

        for (let s of spikes) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(Math.atan2(s.vy, s.vx));
            
            drawGlowCircle(0, 0, 5, s.ownerColor || '#fff', 2);
            
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, 5);
            ctx.lineTo(-5, -5);
            ctx.closePath();
            ctx.fillStyle = s.ownerColor || '#fff';
            ctx.fill();
            ctx.restore();
        }

        for (let p of particles) {
            ctx.globalAlpha = p.life / 50;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            let ft = floatingTexts[i];
            ctx.globalAlpha = ft.life / 40;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 5;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
            ft.y += ft.vy;
            ft.life--;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

    } else {
        for (let p of particles) {
            ctx.globalAlpha = p.life / 50;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }
    }
    
    ctx.restore(); // restore from shake
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
