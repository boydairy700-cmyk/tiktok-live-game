//  DOM REFS 
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

//  GAME STATE 
let boysScore = 0, girlsScore = 0;
let boysHP = 100, girlsHP = 100;
let timeLeft = 300, gameStarted = false;
let botInterval = null;
let config = {};
let lastComboTime = {};
let comboCounts = { boys: 0, girls: 0 };
let boysTopSupporter = { name: '', pic: '', points: 0 };
let girlsTopSupporter = { name: '', pic: '', points: 0 };
let supporters = { boys: new Map(), girls: new Map() };

// === ROUND / WIN TRACKING ===
let boysWins = 0, girlsWins = 0, roundNumber = 1;

//  CONFIG READERS 
function readConfig() {
    const durationMins = parseInt(document.getElementById('duration-input').value) || 5;
    timeLeft = durationMins * 60;
    const likePts    = parseInt(document.getElementById('like-pts-input').value)    || 1;
    const sharePts   = parseInt(document.getElementById('share-pts-input').value)   || 20;
    const followPts  = parseInt(document.getElementById('follow-pts-input').value)  || 10;
    const followTeam = document.getElementById('follow-team-select').value;

    // Use GiftPicker selections for hint display
    const boysGifts  = GiftPicker.getConfig('boys');
    const girlsGifts = GiftPicker.getConfig('girls');
    const boysEmojis  = [...GiftPicker.selected.boys].map(id => TIKTOK_GIFTS.find(g=>g.id===id)?.emoji||'').join(' ');
    const girlsEmojis = [...GiftPicker.selected.girls].map(id => TIKTOK_GIFTS.find(g=>g.id===id)?.emoji||'').join(' ');
    boysHint.textContent  = ` : ${boysEmojis || ''}`;
    girlsHint.textContent = ` : ${girlsEmojis || ''}`;

    config = { likePts, sharePts, followPts, followTeam, boysGifts, girlsGifts };
}

//  SOCKET 
const socket = io();

connectBtn.addEventListener('click', () => {
    const username = document.getElementById('username-input').value.trim();
    if (!username) { statusMsg.textContent = '   '; return; }
    statusMsg.textContent = ' ...';
    readConfig();
    socket.emit('connectTikTok', username);
});

previewBtn.addEventListener('click', () => {
    readConfig();
    startBattle();
});

socket.on('tiktokConnected', () => {
    statusMsg.textContent = ' ! ';
    setTimeout(startBattle, 800);
});
socket.on('tiktokError', err => { statusMsg.textContent = ' : ' + err; });

//  TIKTOK EVENTS 
socket.on('tiktokLike', data => {
    if (!gameStarted || !config.likePts) return;
    addPoints('boys', config.likePts, data.nickname, data.profilePictureUrl, `  `);
});

socket.on('tiktokShare', data => {
    if (!gameStarted || !config.sharePts) return;
    addPoints('girls', config.sharePts, data.nickname, data.profilePictureUrl, `  `);
});

socket.on('tiktokFollow', data => {
    if (!gameStarted || !config.followPts) return;
    const team = config.followTeam === 'both' ? (Math.random() > 0.5 ? 'boys' : 'girls') : config.followTeam;
    addPoints(team, config.followPts, data.nickname, data.profilePictureUrl, '  ');
});

//  TIKTOK GIFT (uses GiftPicker) 
socket.on('tiktokGift', data => {
    if (!gameStarted) return;
    const match = GiftPicker.matchGift(data);
    if (match) {
        const total = match.pts * (data.repeatCount || 1);
        const gift = match.gift || TIKTOK_GIFTS.find(g => g.nameEn.toLowerCase() === data.giftName.toLowerCase()) || {};
        addPoints(match.team, total, data.nickname, data.profilePictureUrl,
            `${gift.emoji||''} أرسل ${gift.nameAr || data.giftName} (${data.repeatCount||1})`, gift.effect);
    }
});

//  START BATTLE 
function startBattle() {
    setupPanel.style.display = 'none';
    battleScreen.style.display = 'block';

    // Show visual hint for 4 seconds
    const inst = document.getElementById('start-instruct');
    inst.style.display = 'block';
    setTimeout(() => { inst.style.display = 'none'; }, 4000);

    // Render faces
    document.getElementById('boys-face-container').innerHTML = FaceSystem.createSVG('boys', 'neutral');
    document.getElementById('girls-face-container').innerHTML = FaceSystem.createSVG('girls', 'neutral');
    FaceSystem.startBlinking('boys');
    FaceSystem.startBlinking('girls');

    gameStarted = true;
    startTimer();
    updateBars();
    confettiLoop();
}

//  TIMER 
function startTimer() {
    const iv = setInterval(() => {
        if (!gameStarted) { clearInterval(iv); return; }
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if (timeLeft <= 30) timerEl.classList.add('urgent');
        if (timeLeft <= 0) { clearInterval(iv); endGame(); }
    }, 1000);
}

//  POINTS & COMBAT 
function addPoints(team, amount, name, pic, action, effect = null) {
    if (!gameStarted) return;

    // Combo system
    const now = Date.now();
    const lastT = lastComboTime[team] || 0;
    if (now - lastT < 3000) {
        comboCounts[team] = (comboCounts[team] || 1) + 1;
    } else {
        comboCounts[team] = 1;
    }
    lastComboTime[team] = now;
    const multiplier = Math.min(comboCounts[team], 5);
    const finalAmount = amount * (multiplier > 1 ? multiplier : 1);

    const isSuper = finalAmount >= 200;
    const isBig   = finalAmount >= 100;
    const opTeam  = team === 'boys' ? 'girls' : 'boys';

    if (team === 'boys') boysScore += finalAmount;
    else girlsScore += finalAmount;

    // Track supporters
    let teamSupporters = supporters[team];
    let currentPts = teamSupporters.get(name) || { points: 0, pic: pic };
    currentPts.points += finalAmount;
    teamSupporters.set(name, currentPts);

    let topSupporter = team === 'boys' ? boysTopSupporter : girlsTopSupporter;
    if (currentPts.points > topSupporter.points) {
        topSupporter.name = name;
        topSupporter.pic = pic;
        topSupporter.points = currentPts.points;
        
        if (team === 'boys') {
            document.getElementById('boys-king').style.display = 'block';
            document.getElementById('boys-king-img').src = pic || 'https://i.pravatar.cc/40?u='+name;
            document.getElementById('boys-king-name').textContent = name;
        } else {
            document.getElementById('girls-queen').style.display = 'block';
            document.getElementById('girls-queen-img').src = pic || 'https://i.pravatar.cc/40?u='+name;
            document.getElementById('girls-queen-name').textContent = name;
        }
    }

    //  WAR EFFECTS 
    let actualDmg = Math.min(15, Math.floor(finalAmount / 30));
    
    if (effect === 'steal_points') {
        const steal = Math.floor(finalAmount * 0.5);
        if (opTeam === 'boys') { 
            const realSteal = Math.min(boysScore, steal);
            boysScore -= realSteal; girlsScore += realSteal; 
            action += ` ( ${realSteal} ! )`;
        } else {
            const realSteal = Math.min(girlsScore, steal);
            girlsScore -= realSteal; boysScore += realSteal;
            action += ` ( ${realSteal} ! )`;
        }
        actualDmg = 20; // Fixed high dmg for steal
    } else if (effect === 'heavy_dmg') {
        actualDmg = 35;
        action += ` ( ! )`;
    } else if (effect === 'steal_all_hp') {
        actualDmg = 100;
        action += ` ( ! )`;
    }

    // HP damage to opponent
    if (opTeam === 'boys') { boysHP = Math.max(0, boysHP - actualDmg); document.getElementById('boys-hp-bar').style.width = boysHP + '%'; }
    else { girlsHP = Math.max(0, girlsHP - actualDmg); document.getElementById('girls-hp-bar').style.width = girlsHP + '%'; }

    updateBars();
    updateFaceExpressions();
    addEvent(name, pic, action, team, finalAmount);
    floatPoints(team, finalAmount);
    spawnShapes(team, finalAmount);
    triggerVSHit();
    launchRocket(team);

    // Combo display
    if (multiplier > 1) showCombo(team, multiplier);

    // Celebrate / hit
    triggerFaceAnim(team, 'celebrate');
    triggerFaceAnim(opTeam, 'hit');

    if (isSuper) triggerSuperPower(team);
    else if (isBig) { shakeScreen(); spawnConfetti(team); }

    //  UNIQUE COMBAT VISUALS
    if (effect === 'steal_points') triggerLaserEffect(team);
    else if (effect === 'heavy_dmg') triggerSawEffect(team);
    else if (name.includes('')) triggerTornadoEffect(team);
    else launchRocket(team);
}

//  BARS 
function updateBars() {
    const total = boysScore + girlsScore;
    const bPct = total === 0 ? 50 : (boysScore / total) * 100;
    const gPct = 100 - bPct;

    boysBar.style.width  = bPct + '%';
    girlsBar.style.width = gPct + '%';

    boysLabel.textContent = Math.floor(boysScore);
    girlsLabel.textContent = Math.floor(girlsScore);
    boysPts.textContent   = Math.floor(boysScore);
    girlsPts.textContent  = Math.floor(girlsScore);
}

//  FACE EXPRESSIONS 
function updateFaceExpressions() {
    const total = boysScore + girlsScore;
    if (total === 0) return;
    const bPct = boysScore / total;
    const gPct = girlsScore / total;

    let bState = 'neutral', gState = 'neutral';

    if (bPct > 0.65) { 
        bState = 'excited'; 
        gState = girlsHP < 30 ? 'crying' : 'sad'; 
    } else if (bPct > 0.52) { 
        bState = 'happy'; 
        gState = 'neutral'; 
    } else if (gPct > 0.65) { 
        gState = 'excited'; 
        bState = boysHP < 30 ? 'crying' : 'sad'; 
    } else if (gPct > 0.52) { 
        gState = 'happy'; 
        bState = 'neutral'; 
    }

    FaceSystem.updateState('boys', bState);
    FaceSystem.updateState('girls', gState);
}

//  FACE ANIMATION TRIGGERS 
function triggerFaceAnim(team, type) {
    const wrapper = document.getElementById(team + '-face-wrapper');
    if (!wrapper) return;
    wrapper.classList.remove('celebrate', 'hit');
    void wrapper.offsetWidth; // reflow
    wrapper.classList.add(type);
    setTimeout(() => wrapper.classList.remove(type), 700);
}

//  COMBAT VISUALS 
function launchRocket(attackTeam) {
    const rocket = document.createElement('div');
    rocket.className = 'rocket ' + (attackTeam === 'boys' ? 'boys-to-girls' : 'girls-to-boys');
    const icons = ['','','','','',''];
    rocket.textContent = icons[Math.floor(Math.random() * icons.length)];
    document.body.appendChild(rocket);
    
    setTimeout(() => {
        rocket.remove();
        spawnExplosion(attackTeam);
    }, 870);
}

function spawnExplosion(attackTeam) {
    const exp = document.createElement('div');
    exp.className = 'explosion';
    exp.textContent = '';
    exp.style.left  = attackTeam === 'boys' ? '75%' : '20%';
    exp.style.top   = '40%';
    document.body.appendChild(exp);
    shakeScreen();
    setTimeout(() => exp.remove(), 650);
}

function triggerLaserEffect(team) {
    const laser = document.createElement('div');
    laser.className = 'laser-beam ' + (team === 'boys' ? 'l-to-r' : 'r-to-l');
    document.body.appendChild(laser);
    setTimeout(() => {
        laser.remove();
        spawnExplosion(team);
    }, 600);
}

function triggerSawEffect(team) {
    const saw = document.createElement('div');
    saw.className = 'saw-anim ' + (team === 'boys' ? 's-to-r' : 's-to-l');
    saw.textContent = '';
    document.body.appendChild(saw);
    setTimeout(() => {
        saw.remove();
        spawnExplosion(team);
    }, 800);
}

function triggerTornadoEffect(team) {
    const t = document.createElement('div');
    t.className = 'tornado-anim ' + (team === 'boys' ? 't-to-r' : 't-to-l');
    t.textContent = '';
    document.body.appendChild(t);
    setTimeout(() => {
        t.remove();
        spawnExplosion(team);
    }, 1000);
}

//  COMBO DISPLAY 
function showCombo(team, count) {
    const el = document.createElement('div');
    el.className = 'combo-display';
    const colors = { boys: '#00f2fe', girls: '#e94560' };
    el.style.color = colors[team];
    el.style.left = team === 'boys' ? '20%' : '65%';
    el.style.top  = '30%';
    el.textContent = `COMBO ${count}! `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
}

//  TIMER EDIT (click timer during game) 
window.toggleTimerEdit = function() {
    const panel = document.getElementById('timer-edit-panel');
    panel.classList.toggle('show');
};

window.applyTimerEdit = function() {
    const mins = parseInt(document.getElementById('timer-edit-input').value) || 5;
    timeLeft = mins * 60;
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    timerEl.classList.remove('urgent');
    document.getElementById('timer-edit-panel').classList.remove('show');
};

//  VS HIT 
function triggerVSHit() {
    vsLogo.classList.remove('hit');
    void vsLogo.offsetWidth;
    vsLogo.classList.add('hit');
    setTimeout(() => vsLogo.classList.remove('hit'), 400);
}

//  FLOATING POINTS 
function floatPoints(team, amount) {
    const area = document.getElementById(team + '-area');
    const rect = area.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'float-pts';
    el.textContent = '+' + Math.floor(amount);
    el.style.color = team === 'boys' ? '#00f2fe' : '#e94560';
    el.style.left  = (rect.left + rect.width / 2 - 30) + 'px';
    el.style.top   = (rect.top  + rect.height / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
}

//  FLYING SHAPES 
function spawnShapes(team, amount) {
    const shapes = ['','','','','','',''];
    const count  = amount >= 100 ? 8 : amount >= 50 ? 5 : 3;
    const area   = document.getElementById(team + '-area');
    const rect   = area.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'fly-shape';
        el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        el.style.left  = (rect.left + rect.width / 2) + 'px';
        el.style.top   = (rect.top  + rect.height / 2) + 'px';
        const tx = (Math.random() - 0.5) * 350;
        const ty = (Math.random() - 0.5) * 350;
        el.style.setProperty('--tx', tx + 'px');
        el.style.setProperty('--ty', ty + 'px');
        el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1600);
    }
}

//  SUPER POWER 
function triggerSuperPower(team) {
    const icons = { boys: ['','','','',''], girls: ['','','','',''] };
    const texts = { boys: [' ! ',' ! ','! '], girls: [' ! ',' ! ',' ! '] };
    const teamIcons = icons[team];
    const teamTexts = texts[team];

    superText.textContent = teamTexts[Math.floor(Math.random() * teamTexts.length)];
    superText.style.color = team === 'boys' ? '#00f2fe' : '#e94560';
    superIcon.textContent = teamIcons[Math.floor(Math.random() * teamIcons.length)];

    superOverlay.style.display = 'flex';
    shakeScreen(true);
    spawnConfetti(team, 60);

    setTimeout(() => { superOverlay.style.display = 'none'; }, 2200);

    // Shocked face on opponent
    const opTeam = team === 'boys' ? 'girls' : 'boys';
    FaceSystem.updateState(opTeam, 'shocked');
    setTimeout(() => updateFaceExpressions(), 2500);
}

//  SCREEN SHAKE 
function shakeScreen(hard = false) {
    document.body.style.animation = 'none';
    void document.body.offsetWidth;
    document.body.style.animation = hard ? 'shake 0.6s' : 'shake 0.3s';
}

//  EVENT FEED 
function addEvent(name, pic, action, team, pts) {
    document.getElementById('battle-screen').style.display = 'block';
    const color = team === 'boys' ? '#00f2fe' : '#e94560';
    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `
        <img src="${pic || 'https://i.pravatar.cc/30?u='+name}" class="event-avatar">
        <span style="color:${color};font-weight:700">${name}</span>
        <span style="color:#bbb;flex:1">${action}</span>
        <span style="color:${color};font-weight:700">+${Math.floor(pts)}</span>`;
    eventFeed.prepend(item);
    while (eventFeed.children.length > 8) eventFeed.removeChild(eventFeed.lastChild);
}

//  CONFETTI 
let confParticles = [];
function spawnConfetti(team, count = 30) {
    const color = team === 'boys' ? '#00f2fe' : '#e94560';
    const colors = [color, '#fff', '#ffd700'];
    for (let i = 0; i < count; i++) {
        confParticles.push({
            x: Math.random() * confCanvas.width,
            y: -10,
            size: Math.random() * 9 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 6 + 2,
            angle: Math.random() * 6.28,
            spin: (Math.random() - 0.5) * 0.2
        });
    }
}
function confettiLoop() {
    confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
    confParticles.forEach((p, i) => {
        p.y += p.speed; p.x += Math.sin(p.angle) * 2; p.angle += p.spin;
        confCtx.save();
        confCtx.fillStyle = p.color;
        confCtx.translate(p.x, p.y);
        confCtx.rotate(p.angle);
        confCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5);
        confCtx.restore();
        if (p.y > confCanvas.height) confParticles.splice(i, 1);
    });
    requestAnimationFrame(confettiLoop);
}

//  END GAME 
function endGame() {
    gameStarted = false;
    clearInterval(botInterval);
    spawnConfetti(boysScore >= girlsScore ? 'boys' : 'girls', 100);

    const boysEnd = document.getElementById('end-boys');
    const girlsEnd = document.getElementById('end-girls');
    const boysCrown = document.getElementById('boys-crown-end');
    const girlsCrown = document.getElementById('girls-crown-end');
    const boysStatus = document.getElementById('boys-end-status');
    const girlsStatus = document.getElementById('girls-end-status');

    boysEnd.className = 'end-char'; girlsEnd.className = 'end-char';
    boysCrown.style.display = 'none'; girlsCrown.style.display = 'none';
    
    document.getElementById('boys-end-img-container').innerHTML = FaceSystem.createSVG('boys');
    document.getElementById('girls-end-img-container').innerHTML = FaceSystem.createSVG('girls');
    document.getElementById('boys-end-img-container').querySelector('svg').id = 'boys-face-end';
    document.getElementById('girls-end-img-container').querySelector('svg').id = 'girls-face-end';

    function updateSVG(team, state) {
        const svg = document.getElementById(team + '-face-end');
        if (!svg) return;
        svg.querySelectorAll('[data-expr]').forEach(g => g.style.display = 'none');
        svg.querySelectorAll(`[data-expr~="${state}"]`).forEach(g => g.style.display = '');
        const tears = svg.querySelector('.tears');
        if (tears) tears.style.display = state === 'crying' ? '' : 'none';
        const showBlush = ['happy','excited'].includes(state);
        svg.querySelectorAll('.blush').forEach(b => b.setAttribute('opacity', showBlush ? '0.55' : '0'));
    }

    let winTeam;
    if (boysScore > girlsScore) {
        boysWins++;
        winTeam = '🏆 الأولاد فازوا!';
        FaceSystem.updateState('boys','excited'); FaceSystem.updateState('girls','sad');
        updateSVG('boys', 'excited'); updateSVG('girls', 'crying');
        boysEnd.classList.add('winner-char'); girlsEnd.classList.add('loser-char');
        boysCrown.style.display = 'block';
        boysStatus.innerHTML = '🎉'; girlsStatus.innerHTML = '<div class="loser-x">💀</div>';
    } else if (girlsScore > boysScore) {
        girlsWins++;
        winTeam = '🏆 البنات فازوا!';
        FaceSystem.updateState('girls','excited'); FaceSystem.updateState('boys','sad');
        updateSVG('girls', 'excited'); updateSVG('boys', 'crying');
        girlsEnd.classList.add('winner-char'); boysEnd.classList.add('loser-char');
        girlsCrown.style.display = 'block';
        girlsStatus.innerHTML = '🎉'; boysStatus.innerHTML = '<div class="loser-x">💀</div>';
    } else {
        winTeam = '🤝 تعادل!';
        updateSVG('boys', 'happy'); updateSVG('girls', 'happy');
        boysStatus.innerHTML = ''; girlsStatus.innerHTML = '';
    }

    updateWinsDisplay();

    winnerTitle.textContent = winTeam;
    winnerFinal.textContent = `الأولاد: ${Math.floor(boysScore)} نقطة | البنات: ${Math.floor(girlsScore)} نقطة`;
    const roundInfo = document.getElementById('round-info');
    if (roundInfo) roundInfo.textContent = `الجولة ${roundNumber} انتهت`;
    roundNumber++;
    winnerScreen.style.display = 'flex';
}

//  UPDATE WINS DISPLAY
function updateWinsDisplay() {
    const bw = document.getElementById('boys-wins-count');
    const gw = document.getElementById('girls-wins-count');
    if (bw) bw.textContent = boysWins;
    if (gw) gw.textContent = girlsWins;
    const ri = document.getElementById('round-number-display');
    if (ri) ri.textContent = roundNumber;
}

//  RESTART NEW ROUND 
window.startNewRound = function() {
    boysScore = 0;
    girlsScore = 0;
    boysHP = 100;
    girlsHP = 100;
    gameStarted = true;
    comboCounts = { boys: 0, girls: 0 };
    lastComboTime = {};
    
    readConfig();
    updateBars();
    eventFeed.innerHTML = '';
    winnerScreen.style.display = 'none';
    
    FaceSystem.updateState('boys', 'neutral');
    FaceSystem.updateState('girls', 'neutral');
    
    startTimer();
    confParticles = [];
    updateWinsDisplay();
};

//  BOT MODE 
window.toggleBotMode = function() {
    const btn = document.getElementById('bot-btn');
    if (botInterval) {
        clearInterval(botInterval); botInterval = null;
        btn.textContent = '  '; btn.classList.remove('active');
    } else {
        if (!gameStarted) startBattle();
        btn.textContent = '  '; btn.classList.add('active');
        const names = ['','','','','','','',''];
        const teamList = ['boys','girls'];
        botInterval = setInterval(() => {
            const team = teamList[Math.floor(Math.random() * 2)];
            const name = names[Math.floor(Math.random() * names.length)];
            const r = Math.random();
            if (r < 0.35)      addPoints('boys', config.likePts || 10,   name, `https://i.pravatar.cc/30?u=${name}`, '  ');
            else if (r < 0.50) addPoints('girls', config.sharePts || 10, name, `https://i.pravatar.cc/30?u=${name}`, '  ');
            else if (r < 0.70) {
                const fTeam = config.followTeam === 'both' ? team : config.followTeam;
                addPoints(fTeam, config.followPts || 10, name, `https://i.pravatar.cc/30?u=${name}`, ' ');
            }
            else {
                const pts = Math.random() < 0.15 ? 200 : Math.random() < 0.4 ? 100 : 50;
                addPoints(team, pts, name, `https://i.pravatar.cc/30?u=${name}`, pts >= 200 ? '  ' : '  ');
            }
        }, 700);
    }
};

//  ADMIN CONTROLS 
window.adminAdjust = function(team, type, amount) {
    if (type === 'score') {
        if (team === 'boys') boysScore = Math.max(0, boysScore + amount);
        else girlsScore = Math.max(0, girlsScore + amount);
    } else if (type === 'hp') {
        if (team === 'boys') {
            boysHP = Math.min(100, Math.max(0, boysHP + amount));
            document.getElementById('boys-hp-bar').style.width = boysHP + '%';
        } else {
            girlsHP = Math.min(100, Math.max(0, girlsHP + amount));
            document.getElementById('girls-hp-bar').style.width = girlsHP + '%';
        }
    }
    updateBars();
    updateFaceExpressions();
    addEvent('ADMIN', '', `  (${amount})`, team, 0);
};

//  MANUAL SIM 
window.simEvent = function(type, team) {
    const name = '';
    const pic  = 'https://i.pravatar.cc/30?u=test';
    if (type === 'like')  addPoints('boys',  config.likePts || 1,   name, pic, ' ');
    if (type === 'gift')  addPoints(team,    50,  name, pic, ' ');
    if (type === 'super') addPoints(team,    200, name, pic, '  ');
};

//  CSS shake keyframe 
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes shake {
    0%,100%{transform:translate(0)}
    15%{transform:translate(-8px,-4px)}
    30%{transform:translate(8px,4px)}
    45%{transform:translate(-6px,6px)}
    60%{transform:translate(6px,-6px)}
    75%{transform:translate(-4px,2px)}
    90%{transform:translate(4px,-2px)}
}`;
document.head.appendChild(styleSheet);
