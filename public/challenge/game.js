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
let lastComboTime = {}; // track combo per team
let comboCounts = { boys: 0, girls: 0 };
let boysTopSupporter = { name: '', pic: '', points: 0 };
let girlsTopSupporter = { name: '', pic: '', points: 0 };
let supporters = { boys: new Map(), girls: new Map() };

//  CONFIG READERS 
function readConfig() {
    const durationMins = parseInt(document.getElementById('duration-input').value) || 5;
    timeLeft = durationMins * 60;
    const likePts    = parseInt(document.getElementById('like-pts-input').value)    || 1;
    const sharePts   = parseInt(document.getElementById('share-pts-input').value)   || 20;
    const followPts  = parseInt(document.getElementById('follow-pts-input').value)  || 10;
    const followTeam = document.getElementById('follow-team-select').value;

    const team1Select = document.getElementById('team1-select');
    const team2Select = document.getElementById('team2-select');
    const team1Name = team1Select ? team1Select.value : 'الهلال';
    const team2Name = team2Select ? team2Select.value : 'النصر';

    // Use GiftPicker selections for hint display
    const boysGifts  = GiftPicker.getConfig('boys');
    const girlsGifts = GiftPicker.getConfig('girls');
    const boysEmojis  = [...GiftPicker.selected.boys].map(id => TIKTOK_GIFTS.find(g=>g.id===id)?.emoji||'').join(' ');
    const girlsEmojis = [...GiftPicker.selected.girls].map(id => TIKTOK_GIFTS.find(g=>g.id===id)?.emoji||'').join(' ');
    boysHint.innerHTML  = `<span style="font-weight: bold; color: #fff;">التكبيس 👍 أو أرسل:</span> <span style="font-size: 18px; margin-right: 5px;">${boysEmojis || ''}</span>`;
    girlsHint.innerHTML = `<span style="font-weight: bold; color: #fff;">الشير 🔗 أو أرسل:</span> <span style="font-size: 18px; margin-right: 5px;">${girlsEmojis || ''}</span>`;

    config = { likePts, sharePts, followPts, followTeam, boysGifts, girlsGifts, team1Name, team2Name };
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
    statusMsg.textContent = 'تم الاتصال بنجاح!';
    setTimeout(startBattle, 800);
});
socket.on('tiktokError', err => { statusMsg.textContent = 'فشل الاتصال: ' + err; });

//  TIKTOK EVENTS 
socket.on('tiktokLike', data => {
    if (!gameStarted || !config.likePts) return;
    addPoints('boys', config.likePts, data.nickname, data.profilePictureUrl, `أرسل إعجابًا 👍`);
});

socket.on('tiktokShare', data => {
    if (!gameStarted || !config.sharePts) return;
    addPoints('girls', config.sharePts, data.nickname, data.profilePictureUrl, `شارك البث 🔗`);
});

socket.on('tiktokFollow', data => {
    if (!gameStarted || !config.followPts) return;
    const team = config.followTeam === 'both' ? (Math.random() > 0.5 ? 'boys' : 'girls') : config.followTeam;
    addPoints(team, config.followPts, data.nickname, data.profilePictureUrl, 'تابع الحساب ➕');
});

//  TIKTOK GIFT (uses GiftPicker) 
socket.on('tiktokGift', data => {
    if (!gameStarted) return;
    let match = GiftPicker.matchGift(data);
    
    // Fallback: If gift isn't in picker, but we still want to receive actual gifts (user requested ANY gift)
    if (!match) {
        const uid = data.uniqueId;
        let team = null;
        if (supporters.boys.has(uid) && !supporters.girls.has(uid)) {
            team = 'boys';
        } else if (supporters.girls.has(uid) && !supporters.boys.has(uid)) {
            team = 'girls';
        } else {
            team = Math.random() > 0.5 ? 'boys' : 'girls';
        }
        
        match = { 
            team: team, 
            pts: (data.diamondCount || 1) * 200, 
            gift: {
                nameAr: data.giftName,
                nameEn: data.giftName,
                emoji: '🎁',
                img: data.giftPictureUrl || '/cm/d9a8abee459b2f6c6acbdfbce911977e.webp',
                diamonds: data.diamondCount || 1,
                pts: (data.diamondCount || 1) * 200,
                rarity: 'common'
            }
        };
    }
    
    if (match) {
        const total = match.pts * (data.repeatCount || 1);
        const gift = match.gift || TIKTOK_GIFTS.find(g => g.nameEn.toLowerCase() === data.giftName.toLowerCase()) || {};
        
        if (data.giftPictureUrl && data.giftPictureUrl !== '') {
            gift.img = data.giftPictureUrl;
        }

        addPoints(match.team, total, data.nickname, data.profilePictureUrl,
            `${gift.emoji||'🎁'} أرسل ${gift.nameAr || data.giftName} (${data.repeatCount||1})`, gift.effect, gift);
    }
});

//  START BATTLE 
function startBattle() {
    setupPanel.style.display = 'none';
    battleScreen.style.display = 'block';

    
    const applyTeamStyle = (teamKey, teamName) => {
        const data = teamsData[teamName] || teamsData['الهلال'];
        const isBoys = teamKey === 'boys';
        
        const nameDisplay = document.getElementById(teamKey + '-name-display');
        if(nameDisplay) {
            nameDisplay.textContent = teamName;
            nameDisplay.style.color = data.color;
            nameDisplay.style.textShadow = data.shadow;
        }
        
        const ptsDisplay = document.getElementById(teamKey + '-pts');
        if(ptsDisplay) {
            ptsDisplay.style.color = data.color;
            ptsDisplay.style.textShadow = data.shadow;
        }

        const scoreLabel = document.getElementById(teamKey + '-score-label');
        if(scoreLabel) scoreLabel.style.color = data.color;

        const bg = document.querySelector('.bg-' + teamKey);
        if(bg) bg.style.background = data.gradient;

        const hpBar = document.getElementById(teamKey + '-hp-bar');
        if(hpBar) hpBar.style.background = data.barGradient;

        const scoreBar = document.getElementById(teamKey + '-bar');
        if(scoreBar) scoreBar.style.background = data.barGradient;

        const endLabel = document.getElementById(teamKey + '-end-label');
        if(endLabel) endLabel.textContent = teamName;

        const winCountEl = document.getElementById(teamKey + '-win-count');
        if(winCountEl) {
            const wins = localStorage.getItem('teamsBattle_wins_' + teamName) || 0;
            winCountEl.textContent = wins;
            winCountEl.style.color = data.color;
        }
    };

    if (config.team1Name) applyTeamStyle('boys', config.team1Name);
    if (config.team2Name) applyTeamStyle('girls', config.team2Name);


    // Show visual hint for 4 seconds
    const inst = document.getElementById('start-instruct');
    inst.style.display = 'block';
    setTimeout(() => { inst.style.display = 'none'; }, 4000);

    // Render faces
    document.getElementById('boys-face-container').innerHTML = FaceSystem.createSVG('boys', config.team1Name);
    document.getElementById('girls-face-container').innerHTML = FaceSystem.createSVG('girls', config.team2Name);
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
function addPoints(team, amount, name, pic, action, effect = null, gift = null) {
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

    //  WAR EFFECTS & EXPONENTIAL DAMAGE SCALING
    let actualDmg = 1; // Default for likes
    if (finalAmount > 1) {
        actualDmg = Math.max(1, Math.min(85, Math.floor(5 * Math.log2(finalAmount / 100 + 1))));
    }
    
    if (effect === 'steal_points') {
        const steal = Math.floor(finalAmount * 0.5);
        if (opTeam === 'boys') { 
            const realSteal = Math.min(boysScore, steal);
            boysScore -= realSteal; girlsScore += realSteal; 
            action += ` (سرقة ${realSteal.toLocaleString()} نقطة!)`;
        } else {
            const realSteal = Math.min(girlsScore, steal);
            girlsScore -= realSteal; boysScore += realSteal;
            action += ` (سرقة ${realSteal.toLocaleString()} نقطة!)`;
        }
        actualDmg = 25; // High dmg for steal
    } else if (effect === 'heavy_dmg') {
        actualDmg = 45;
        action += ` (ضربة ثقيلة!)`;
    } else if (effect === 'steal_all_hp') {
        actualDmg = 80;
        action += ` (ضربة قاضية!)`;
    }

    // HP damage to opponent
    if (opTeam === 'boys') { boysHP = Math.max(0, boysHP - actualDmg); document.getElementById('boys-hp-bar').style.width = boysHP + '%'; }
    else { girlsHP = Math.max(0, girlsHP - actualDmg); document.getElementById('girls-hp-bar').style.width = girlsHP + '%'; }

    updateBars();
    updateFaceExpressions();
    addEvent(name, pic, action, team, finalAmount);
    floatPoints(team, finalAmount);
    spawnEmojiRain(team, finalAmount, gift);
    triggerVSHit();

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
    else if (effect === 'tornado' || (gift && gift.id === 'tornado')) triggerTornadoEffect(team);
    else launchRocket(team, gift);
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
function launchRocket(attackTeam, gift = null) {
    const rocket = document.createElement('div');
    rocket.className = 'rocket ' + (attackTeam === 'boys' ? 'boys-to-girls' : 'girls-to-boys');
    
    let emoji = '';
    if (gift && gift.emoji) {
        emoji = gift.emoji;
    } else {
        const boysEmojis = ['⚽', '⚡', '🚀', '🔥', '🔵', '👊'];
        const girlsEmojis = ['🌹', '💖', '⭐', '✨', '🎀', '👑'];
        const emojis = attackTeam === 'boys' ? boysEmojis : girlsEmojis;
        emoji = emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    if (emoji === '🌹') {
        rocket.classList.add('rose-proj');
    }
    
    rocket.textContent = emoji;
    document.body.appendChild(rocket);
    
    setTimeout(() => {
        rocket.remove();
        spawnExplosion(attackTeam, emoji);
    }, 870);
}

function spawnExplosion(attackTeam, projectileEmoji = '💥') {
    const exp = document.createElement('div');
    exp.className = 'explosion';
    exp.textContent = projectileEmoji + '💥';
    exp.style.left  = attackTeam === 'boys' ? '73%' : '23%';
    exp.style.top   = '43%';
    document.body.appendChild(exp);
    shakeScreen();
    
    // Spawn gorgeous flying shards matching the hit emoji
    for (let i = 0; i < 8; i++) {
        const shard = document.createElement('div');
        shard.className = 'exp-shard';
        shard.textContent = projectileEmoji === '💥' ? '✨' : projectileEmoji;
        shard.style.position = 'fixed';
        shard.style.left = (attackTeam === 'boys' ? 73 : 23) + '%';
        shard.style.top = '43%';
        shard.style.fontSize = '22px';
        shard.style.pointerEvents = 'none';
        shard.style.zIndex = '150';
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 120;
        const tx = Math.cos(angle) * speed;
        const ty = Math.sin(angle) * speed - 60;
        
        shard.style.transition = 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        document.body.appendChild(shard);
        
        setTimeout(() => {
            shard.style.transform = `translate(${tx}px, ${ty}px) scale(0) rotate(${Math.random()*360}deg)`;
            shard.style.opacity = '0';
        }, 15);
        
        setTimeout(() => shard.remove(), 750);
    }
    
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
    const colors = { boys: teamsData[config.team1Name]?.color || '#00f2fe', girls: teamsData[config.team2Name]?.color || '#e94560' };
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
    el.style.color = team === 'boys' ? (teamsData[config.team1Name]?.color || '#00f2fe') : (teamsData[config.team2Name]?.color || '#ffcc00');
    el.style.left  = (rect.left + rect.width / 2 - 30) + 'px';
    el.style.top   = (rect.top  + rect.height / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
}

//  FLYING EMOJI RAIN
function spawnEmojiRain(team, amount, gift = null) {
    const teamColor = team === 'boys' ? (teamsData[config.team1Name]?.color || '#00f2fe') : (teamsData[config.team2Name]?.color || '#ffcc00');
    const area   = document.getElementById(team + '-area');
    if (!area) return;
    const rect   = area.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;

    // choose emojis based on gift/team
    const rainEmojis = gift?.emoji
        ? [gift.emoji, gift.emoji, '⭐', '✨', '💫', '🎉', gift.emoji]
        : (team === 'boys'
            ? ['⚽','🔵','💙','⭐','✨','🎉','🏆']
            : ['🌹','🌟','💛','⭐','✨','🎊','🏆']);

    const count = amount >= 10000 ? 14 : amount >= 2500 ? 9 : 5;
    const size  = amount >= 10000 ? 44 : 32;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'emoji-rain';
        el.textContent = rainEmojis[Math.floor(Math.random() * rainEmojis.length)];
        el.style.fontSize = size + 'px';
        el.style.left = cx + 'px';
        el.style.top  = cy + 'px';

        const tx1 = (Math.random() - 0.5) * 200;
        const ty1 = (Math.random() - 0.5) * 200 - 80;
        const tx2 = (Math.random() - 0.5) * 420;
        const ty2 = (Math.random() - 0.5) * 420 - 120;
        const rot1 = (Math.random() * 360 - 180) + 'deg';
        const rot2 = (Math.random() * 720 - 360) + 'deg';
        const dur  = (1.2 + Math.random() * 0.8) + 's';

        el.style.setProperty('--tx1', tx1 + 'px');
        el.style.setProperty('--ty1', ty1 + 'px');
        el.style.setProperty('--tx2', tx2 + 'px');
        el.style.setProperty('--ty2', ty2 + 'px');
        el.style.setProperty('--rot1', rot1);
        el.style.setProperty('--rot2', rot2);
        el.style.setProperty('--dur', dur);
        el.style.animationDelay = (i * 0.05) + 's';

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2500);
    }

    // If big gift: show a giant gift image explosion in center
    if (amount >= 5000 && gift?.img) {
        const exp = document.createElement('img');
        exp.className = 'gift-explosion';
        exp.src = gift.img;
        exp.style.width = '120px';
        exp.style.height = '120px';
        exp.style.objectFit = 'contain';
        exp.style.left = cx + 'px';
        exp.style.top  = cy + 'px';
        exp.style.setProperty('--gdur', '1.3s');
        document.body.appendChild(exp);
        setTimeout(() => exp.remove(), 1400);
    }
}

//  SUPER POWER 
function triggerSuperPower(team) {
    const icons = { boys: ['⚡','🚀','🔥','💥','👑'], girls: ['⭐','💖','👑','🦄','🎉'] };
    const texts = { 
        boys: [`قوة ${config.team1Name || 'الهلال'} الخارقة!`, `${config.team1Name || 'الهلال'} يدمر!`, `سوبر ${config.team1Name || 'الهلال'}!`], 
        girls: [`قوة ${config.team2Name || 'النصر'} الخارقة!`, `${config.team2Name || 'النصر'} يكتسح!`, `سوبر ${config.team2Name || 'النصر'}!`] 
    };
    const teamIcons = icons[team];
    const teamTexts = texts[team];

    superText.textContent = teamTexts[Math.floor(Math.random() * teamTexts.length)];
    superText.style.color = team === 'boys' ? (teamsData[config.team1Name]?.color || '#00f2fe') : (teamsData[config.team2Name]?.color || '#ffcc00');
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
    const color = team === 'boys' ? (teamsData[config.team1Name]?.color || '#00f2fe') : (teamsData[config.team2Name]?.color || '#e94560');
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
    const color = team === 'boys' ? (teamsData[config.team1Name]?.color || '#00f2fe') : (teamsData[config.team2Name]?.color || '#e94560');
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

//  END GAME — EPIC WINNER SCREEN 
function endGame() {
    gameStarted = false;
    clearInterval(botInterval);

    const winTeam = boysScore >= girlsScore ? 'boys' : 'girls';
    const loseTeam = winTeam === 'boys' ? 'girls' : 'boys';
    const winName  = winTeam  === 'boys' ? config.team1Name : config.team2Name;
    const loseName = loseTeam === 'boys' ? config.team1Name : config.team2Name;
    const winColor = teamsData[winName]?.color  || (winTeam === 'boys' ? '#00f2fe' : '#ffcc00');
    const loseColor= teamsData[loseName]?.color || (winTeam === 'boys' ? '#ffcc00' : '#00f2fe');
    const isDraw   = boysScore === girlsScore;

    // Big confetti for winner
    spawnConfetti(winTeam, 120);
    setTimeout(() => spawnConfetti(winTeam, 80), 700);

    const wsEl = document.getElementById('winner-screen');
    wsEl.classList.remove('boys-win', 'girls-win');
    if (!isDraw) {
        wsEl.classList.add(winTeam === 'boys' ? 'boys-win' : 'girls-win');
    }

    const wsBeams = document.getElementById('ws-beams');
    wsBeams.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const beam = document.createElement('div');
        beam.className = 'ws-beam';
        beam.style.left = (i * 4) + '%';
        beam.style.height = (35 + Math.random() * 65) + '%';
        beam.style.background = `linear-gradient(to top, ${isDraw ? 'rgba(255,255,255,0.15)' : winColor + '33'}, transparent)`;
        beam.style.animationDelay = (Math.random() * 1.5) + 's';
        beam.style.animationDuration = (1.2 + Math.random() * 1.2) + 's';
        wsBeams.appendChild(beam);
    }

    const cardBoys = document.getElementById('ws-card-boys');
    const cardGirls = document.getElementById('ws-card-girls');
    const nameB = document.getElementById('ws-name-boys');
    const nameG = document.getElementById('ws-name-girls');
    const ptsB = document.getElementById('ws-pts-boys');
    const ptsG = document.getElementById('ws-pts-girls');
    const tagB = document.getElementById('ws-tag-boys');
    const tagG = document.getElementById('ws-tag-girls');

    ptsB.textContent  = Math.floor(boysScore).toLocaleString();
    ptsG.textContent  = Math.floor(girlsScore).toLocaleString();

    document.getElementById('ws-face-boys').innerHTML = FaceSystem.createSVG('boys', config.team1Name);
    document.getElementById('ws-face-girls').innerHTML = FaceSystem.createSVG('girls', config.team2Name);

    // Fetch fresh wins from localStorage
    let winsB = parseInt(localStorage.getItem('teamsBattle_wins_' + config.team1Name) || 0);
    let winsG = parseInt(localStorage.getItem('teamsBattle_wins_' + config.team2Name) || 0);

    cardBoys.className = 'ws-team-card';
    cardGirls.className = 'ws-team-card';

    if (isDraw) {
        tagB.textContent = '🤝 تعادل';
        tagG.textContent = '🤝 تعادل';
        FaceSystem.updateState('boys', 'happy');
        FaceSystem.updateState('girls', 'happy');
    } else {
        const winCard = winTeam === 'boys' ? cardBoys : cardGirls;
        const loseCard = winTeam === 'boys' ? cardGirls : cardBoys;
        const winTag = winTeam === 'boys' ? tagB : tagG;
        const loseTag = winTeam === 'boys' ? tagG : tagB;

        winCard.classList.add('winner');
        loseCard.classList.add('loser');

        winTag.textContent = '🏆 فائز!';
        loseTag.textContent = '❌ خسر';

        FaceSystem.updateState(winTeam, 'excited');
        FaceSystem.updateState(loseTeam, 'crying');

        // Increment wins for the winner
        if (winTeam === 'boys') {
            winsB++;
            localStorage.setItem('teamsBattle_wins_' + config.team1Name, winsB);
            const winCountEl = document.getElementById('boys-win-count');
            if (winCountEl) winCountEl.textContent = winsB;
        } else {
            winsG++;
            localStorage.setItem('teamsBattle_wins_' + config.team2Name, winsG);
            const winCountEl = document.getElementById('girls-win-count');
            if (winCountEl) winCountEl.textContent = winsG;
        }
    }

    // Set names with the gorgeous golden wins badge next to them
    nameB.innerHTML = `${config.team1Name} <span class="ws-wins-badge">🏆 ${winsB}</span>`;
    nameG.innerHTML = `${config.team2Name} <span class="ws-wins-badge">🏆 ${winsG}</span>`;

    wsEl.style.display = 'flex';

    // Shoot burst of emoji rain celebration
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                const emojis = ['🎉','🏆','⭐','✨','🌟','💥','🎊','👑'];
                for (let j = 0; j < 8; j++) {
                    const el = document.createElement('div');
                    el.className = 'emoji-rain';
                    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                    el.style.fontSize = '40px';
                    el.style.left = (cx + (Math.random()-0.5)*400) + 'px';
                    el.style.top  = cy + 'px';
                    const tx2 = (Math.random()-0.5)*600;
                    const ty2 = -200 - Math.random()*400;
                    el.style.setProperty('--tx1', ((Math.random()-0.5)*200)+'px');
                    el.style.setProperty('--ty1', (-100-Math.random()*100)+'px');
                    el.style.setProperty('--tx2', tx2+'px');
                    el.style.setProperty('--ty2', ty2+'px');
                    el.style.setProperty('--rot1', (Math.random()*360)+'deg');
                    el.style.setProperty('--rot2', (Math.random()*720)+'deg');
                    el.style.setProperty('--dur', '2s');
                    document.body.appendChild(el);
                    setTimeout(() => el.remove(), 2200);
                }
            }, i * 300);
        }
    }, 400);
}

//  RESTART NEW ROUND 
window.startNewRound = function() {
    boysScore = 0;
    girlsScore = 0;
    boysHP = 100;
    girlsHP = 100;
    gameStarted = true;
    
    // Read config again to get timer and settings
    readConfig(); 
    
    updateBars();
    eventFeed.innerHTML = '';
    
    // Reset cards and screen classes
    const wsEl = document.getElementById('winner-screen');
    wsEl.style.display = 'none';
    wsEl.classList.remove('boys-win', 'girls-win');
    
    document.getElementById('ws-card-boys').className = 'ws-team-card';
    document.getElementById('ws-card-girls').className = 'ws-team-card';
    
    FaceSystem.updateState('boys', 'neutral');
    FaceSystem.updateState('girls', 'neutral');
    
    // Restart timer
    startTimer();
    
    // Clear confetti
    confParticles = [];
};

//  BOT MODE 
window.toggleBotMode = function() {
    const btn = document.getElementById('bot-btn');
    if (botInterval) {
        clearInterval(botInterval); botInterval = null;
        btn.textContent = 'تشغيل البوت'; btn.classList.remove('active');
    } else {
        if (!gameStarted) startBattle();
        btn.textContent = 'إيقاف البوت'; btn.classList.add('active');
        const names = ['أبو فهد', 'سلمان', 'ماجد', 'ياسر', 'أحمد', 'عبدالله', 'خالد', 'سعد'];
        const teamList = ['boys','girls'];
        botInterval = setInterval(() => {
            const team = teamList[Math.floor(Math.random() * 2)];
            const name = names[Math.floor(Math.random() * names.length)];
            const r = Math.random();
            if (r < 0.35)      addPoints('boys', config.likePts || 10,   name, `https://i.pravatar.cc/30?u=${name}`, 'تكبيس 👍');
            else if (r < 0.50) addPoints('girls', config.sharePts || 10, name, `https://i.pravatar.cc/30?u=${name}`, 'مشاركة 🔗');
            else if (r < 0.70) {
                const fTeam = config.followTeam === 'both' ? team : config.followTeam;
                addPoints(fTeam, config.followPts || 10, name, `https://i.pravatar.cc/30?u=${name}`, 'متابعة ➕');
            }
            else {
                const pts = Math.random() < 0.15 ? 200 : Math.random() < 0.4 ? 100 : 50;
                addPoints(team, pts, name, `https://i.pravatar.cc/30?u=${name}`, pts >= 200 ? 'هدية مميزة 🔥' : 'هدية 🎁');
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
    addEvent('ADMIN', '', `تعديل النقاط (${amount})`, team, 0);
};

//  MANUAL SIM 
window.simEvent = function(type, team) {
    const name = 'داعم';
    const pic  = 'https://i.pravatar.cc/30?u=test';
    if (type === 'like')  addPoints('boys',  config.likePts || 1,   name, pic, 'تكبيس 👍');
    if (type === 'gift')  addPoints(team,    50,  name, pic, 'هدية 🎁');
    if (type === 'super') addPoints(team,    200, name, pic, 'هدية مميزة 🔥');
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


//  THROW BALL EFFECT 
function throwBallEffect(attackerTeam) {
    if (gameState !== 'playing') return;
    const isBoys = attackerTeam === 'boys';
    const ball = document.createElement('div');
    
    // Create the ball element
    ball.style.position = 'fixed';
    ball.style.width = '25px';
    ball.style.height = '25px';
    ball.style.borderRadius = '50%';
    ball.style.zIndex = '9999';
    ball.style.pointerEvents = 'none';
    
    // Ball colors: Hilal (Blue), Nassr (Yellow)
    if (isBoys) {
        ball.style.background = 'radial-gradient(circle, #fff 0%, #0055ff 70%, #0022aa 100%)';
        ball.style.boxShadow = '0 0 15px #0055ff, 0 0 30px #0055ff';
    } else {
        ball.style.background = 'radial-gradient(circle, #fff 0%, #ffcc00 70%, #aa8800 100%)';
        ball.style.boxShadow = '0 0 15px #ffcc00, 0 0 30px #ffcc00';
    }
    
    document.body.appendChild(ball);
    
    // Get positions
    const boysFace = document.getElementById('boys-face');
    const girlsFace = document.getElementById('girls-face');
    if (!boysFace || !girlsFace) {
        ball.remove();
        return;
    }
    
    const bRect = boysFace.getBoundingClientRect();
    const gRect = girlsFace.getBoundingClientRect();
    
    // Start and End coordinates
    const startX = isBoys ? (bRect.left + bRect.width/2) : (gRect.left + gRect.width/2);
    const startY = isBoys ? (bRect.top + bRect.height/2) : (gRect.top + gRect.height/2);
    const endX = isBoys ? (gRect.left + gRect.width/2) : (bRect.left + bRect.width/2);
    const endY = isBoys ? (gRect.top + gRect.height/2) : (bRect.top + bRect.height/2);
    
    // Set initial position
    ball.style.left = (startX - 12.5) + 'px';
    ball.style.top = (startY - 12.5) + 'px';
    
    // Animate
    ball.animate([
        { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        { transform: `translate(${endX - startX}px, ${endY - startY - 50}px) scale(1.5) rotate(180deg)`, offset: 0.5 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1) rotate(360deg)` }
    ], {
        duration: 400,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => {
        ball.remove();
        // Create impact flash
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.left = (endX - 50) + 'px';
        flash.style.top = (endY - 50) + 'px';
        flash.style.width = '100px';
        flash.style.height = '100px';
        flash.style.borderRadius = '50%';
        flash.style.background = isBoys ? 'rgba(0,85,255,0.8)' : 'rgba(255,204,0,0.8)';
        flash.style.boxShadow = isBoys ? '0 0 50px #0055ff' : '0 0 50px #ffcc00';
        flash.style.zIndex = '9998';
        flash.style.pointerEvents = 'none';
        document.body.appendChild(flash);
        
        flash.animate([
            { transform: 'scale(0.5)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], { duration: 300, easing: 'ease-out' }).onfinish = () => flash.remove();
        
        // Change opponent face to shocked/sad briefly
        const targetTeam = isBoys ? 'girls' : 'boys';
        FaceSystem.updateState(targetTeam, 'shocked');
        setTimeout(() => {
            if (gameState === 'playing') FaceSystem.updateState(targetTeam, 'neutral');
        }, 500);
    };
}

function shootConfetti(count, winTeam) {
    const colors = winTeam === 'boys' ? [teamsData[config.team1Name]?.color || '#0055ff', '#ffffff'] : [teamsData[config.team2Name]?.color || '#ffcc00', '#ffffff'];
    const particles = [];
    for(let i=0; i<count; i++) {
        particles.push({
            x: window.innerWidth/2,
            y: window.innerHeight/2 + 100,
            vx: (Math.random()-0.5)*25,
            vy: (Math.random()-1)*25,
            size: Math.random()*15+5,
            color: colors[Math.floor(Math.random()*colors.length)],
            rot: Math.random()*360,
            rotS: (Math.random()-0.5)*10
        });
    }
    function draw() {
        confCtx.clearRect(0,0,confCanvas.width,confCanvas.height);
        let active = false;
        particles.forEach(p => {
            p.vy += 0.5; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.rotS;
            if(p.y < confCanvas.height) active = true;
            
            confCtx.save();
            confCtx.translate(p.x, p.y);
            confCtx.rotate(p.rot * Math.PI/180);
            confCtx.fillStyle = p.color;
            confCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            confCtx.restore();
        });
        if(active && gameState === 'ended') requestAnimationFrame(draw);
    }
    draw();
}