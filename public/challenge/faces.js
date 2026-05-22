const FaceSystem = {
    _current: { boys: 'neutral', girls: 'neutral' },

    _apply(team, expr) {
        const svg = document.getElementById(team + '-face');
        if (!svg) return;
        const allGroups = svg.querySelectorAll('[data-expr]');
        allGroups.forEach(g => g.style.display = 'none');
        const show = svg.querySelectorAll(`[data-expr~="${expr}"]`);
        show.forEach(g => g.style.display = '');
        const tears = svg.querySelector('.tears');
        if (tears) tears.style.display = expr === 'crying' ? '' : 'none';
        const blush = svg.querySelectorAll('.blush');
        const showBlush = ['happy','excited'].includes(expr);
        blush.forEach(b => b.setAttribute('opacity', showBlush ? '0.55' : '0'));
    },

    updateState(team, state) {
        if (this._current[team] === state) return;
        this._current[team] = state;
        this._apply(team, state);
    },

    createSVG(teamKey, teamName) {
        const data = (typeof teamsData !== 'undefined' ? teamsData[teamName] : null) || {
            shirtPrimary: "#0033AA", shirtSecondary: "#001155", number: "9", numColor: "white",
            hairStyle: "spikes", hairColor: ["#222222", "#000000"], eyeColor: ["#33AAFF", "#003388"], skin: ["#FFD5A0", "#E8A055"]
        };
        return this._generateFace(teamKey, data, teamName);
    },

    startBlinking(team) {
        const blink = () => {
            const svg = document.getElementById(team + '-face');
            if (!svg) return;
            const eyes = svg.querySelectorAll('.eye-white');
            eyes.forEach(e => {
                const orig = e.getAttribute('ry') || e.getAttribute('r') || '9';
                e.setAttribute('ry', '1');
                setTimeout(() => e.setAttribute('ry', orig), 120);
            });
            setTimeout(blink, 2500 + Math.random() * 2500);
        };
        setTimeout(blink, 1000 + Math.random() * 1500);
    },

    _generateFace(teamKey, data, teamName = '') {
        const tId = teamKey + '-face';
        
        let hairSVG = '';
        let extraSVG = '';
        
        const isHilal = teamName === 'الهلال' || (!teamName && teamKey === 'boys');
        const isNasr = teamName === 'النصر' || (!teamName && teamKey === 'girls');

        if (isHilal) {
            // Hilal: Just hair, mustache, and goatee (NO Ghutra, NO Agal, NO Crown)
            hairSVG = `
                <polygon points="10,60 28,20 35,55" fill="url(#${tId}_hair)"/>
                <polygon points="28,58 42,12 52,52" fill="url(#${tId}_hair)"/>
                <polygon points="50,52 60,8 70,52" fill="url(#${tId}_hair)"/>
                <polygon points="68,52 78,18 88,55" fill="url(#${tId}_hair)"/>
                <polygon points="85,58 92,24 105,62" fill="url(#${tId}_hair)"/>
                <ellipse cx="60" cy="48" rx="36" ry="20" fill="url(#${tId}_hair)"/>
                <rect x="24" y="48" width="72" height="16" fill="url(#${tId}_hair)"/>
            `;
            extraSVG = `
                <!-- Front spikes to overlay and blend nicely on the forehead -->
                <polygon points="24,48 32,25 40,48" fill="url(#${tId}_hair)"/>
                <polygon points="38,48 48,22 58,48" fill="url(#${tId}_hair)"/>
                <polygon points="54,48 64,18 74,48" fill="url(#${tId}_hair)"/>
                <polygon points="70,48 80,22 90,48" fill="url(#${tId}_hair)"/>
                <polygon points="85,48 94,25 102,48" fill="url(#${tId}_hair)"/>
                <rect x="24" y="44" width="72" height="8" fill="url(#${tId}_hair)"/>
                <!-- Mustache & Goatee -->
                <path d="M 44,92 Q 60,84 76,92 Q 60,96 44,92 Z" fill="#1a1a1a"/>
                <path d="M 52,100 L 68,100 L 60,110 Z" fill="#1a1a1a"/>
            `;
        } else if (isNasr) {
            // Nasr: Curly hair overlay covering the forehead (NO crown, NO baldness)
            hairSVG = `
                <ellipse cx="60" cy="48" rx="42" ry="30" fill="url(#${tId}_hair)"/>
                <circle cx="28" cy="54" r="14" fill="url(#${tId}_hair)"/>
                <circle cx="92" cy="54" r="14" fill="url(#${tId}_hair)"/>
                <circle cx="22" cy="70" r="12" fill="url(#${tId}_hair)"/>
                <circle cx="98" cy="70" r="12" fill="url(#${tId}_hair)"/>
            `;
            extraSVG = `
                <!-- Curls on top of head covering the bald spot -->
                <circle cx="34" cy="42" r="14" fill="url(#${tId}_hair)"/>
                <circle cx="60" cy="38" r="16" fill="url(#${tId}_hair)"/>
                <circle cx="86" cy="42" r="14" fill="url(#${tId}_hair)"/>
                <circle cx="46" cy="36" r="12" fill="url(#${tId}_hair)"/>
                <circle cx="74" cy="36" r="12" fill="url(#${tId}_hair)"/>
                <!-- Locks framing the face -->
                <circle cx="24" cy="65" r="10" fill="url(#${tId}_hair)"/>
                <circle cx="96" cy="65" r="10" fill="url(#${tId}_hair)"/>
            `;
        } else {
            // Fallback to standard hair styles
            if (data.hairStyle === 'spikes') {
                hairSVG = `
                    <polygon points="10,60 28,20 35,55" fill="url(#${tId}_hair)"/>
                    <polygon points="28,58 42,12 52,52" fill="url(#${tId}_hair)"/>
                    <polygon points="50,52 60,8 70,52" fill="url(#${tId}_hair)"/>
                    <polygon points="68,52 78,18 88,55" fill="url(#${tId}_hair)"/>
                    <polygon points="85,58 92,24 105,62" fill="url(#${tId}_hair)"/>
                    <ellipse cx="60" cy="48" rx="36" ry="20" fill="url(#${tId}_hair)"/>
                    <rect x="24" y="48" width="72" height="16" fill="url(#${tId}_hair)"/>
                `;
            } else if (data.hairStyle === 'curly') {
                hairSVG = `
                    <ellipse cx="60" cy="40" rx="42" ry="30" fill="url(#${tId}_hair)"/>
                    <circle cx="30" cy="50" r="15" fill="url(#${tId}_hair)"/>
                    <circle cx="90" cy="50" r="15" fill="url(#${tId}_hair)"/>
                    <circle cx="20" cy="65" r="12" fill="url(#${tId}_hair)"/>
                    <circle cx="100" cy="65" r="12" fill="url(#${tId}_hair)"/>
                    <circle cx="45" cy="45" r="12" fill="url(#${tId}_hair)"/>
                    <circle cx="75" cy="45" r="12" fill="url(#${tId}_hair)"/>
                    <circle cx="60" cy="48" r="14" fill="url(#${tId}_hair)"/>
                `;
            } else if (data.hairStyle === 'short') {
                hairSVG = `
                    <path d="M22,70 C20,30 40,20 60,20 C80,20 100,30 98,70" fill="url(#${tId}_hair)"/>
                    <rect x="23" y="50" width="74" height="20" fill="url(#${tId}_hair)"/>
                `;
            } else if (data.hairStyle === 'slick') {
                hairSVG = `
                    <path d="M22,70 C15,30 50,15 90,35 C100,50 98,70 98,70 Z" fill="url(#${tId}_hair)"/>
                    <path d="M22,70 C40,40 80,40 98,70 Z" fill="url(#${tId}_hair)"/>
                `;
            } else {
                hairSVG = `
                    <path d="M25,65 C25,30 50,10 95,65" fill="url(#${tId}_hair)"/>
                `;
            }
        }

        return `<svg id="${tId}" viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" width="200" height="200" style="filter:drop-shadow(0 8px 20px rgba(0,0,0,0.4))">
<defs>
  <radialGradient id="${tId}_skin" cx="45%" cy="35%"><stop offset="0%" stop-color="${data.skin[0]}"/><stop offset="100%" stop-color="${data.skin[1]}"/></radialGradient>
  <radialGradient id="${tId}_hair" cx="50%" cy="20%"><stop offset="0%" stop-color="${data.hairColor[0]}"/><stop offset="100%" stop-color="${data.hairColor[1]}"/></radialGradient>
  <radialGradient id="${tId}_eye" cx="35%" cy="30%"><stop offset="0%" stop-color="${data.eyeColor[0]}"/><stop offset="100%" stop-color="${data.eyeColor[1]}"/></radialGradient>
</defs>
<!-- Body / Jersey -->
<rect x="25" y="128" width="70" height="52" rx="14" fill="${data.shirtPrimary}"/>
<rect x="42" y="128" width="36" height="12" rx="6" fill="${data.shirtSecondary}"/>
<!-- T-shirt Number -->
<text x="60" y="165" text-anchor="middle" font-size="24" fill="${data.numColor}" font-weight="bold">${data.number}</text>
<!-- Neck -->
<rect x="47" y="118" width="26" height="14" rx="7" fill="url(#${tId}_skin)"/>
<!-- Hair Back -->
${hairSVG}
<!-- Head -->
<ellipse cx="60" cy="72" rx="38" ry="40" fill="url(#${tId}_skin)"/>
<!-- Accessories / Crown / Ghutra Front -->
${extraSVG}
<!-- Ear -->
<ellipse cx="22" cy="72" rx="6" ry="8" fill="url(#${tId}_skin)"/><ellipse cx="98" cy="72" rx="6" ry="8" fill="url(#${tId}_skin)"/>
<!-- === EYES === -->
<g data-expr="neutral happy sad shocked">
  <ellipse class="eye-white" cx="42" cy="72" rx="10" ry="9" fill="white"/><ellipse class="eye-white" cx="78" cy="72" rx="10" ry="9" fill="white"/>
  <ellipse cx="42" cy="73" rx="7" ry="7" fill="url(#${tId}_eye)"/><ellipse cx="78" cy="73" rx="7" ry="7" fill="url(#${tId}_eye)"/>
  <ellipse cx="42" cy="73" rx="4" ry="4" fill="#001133"/><ellipse cx="78" cy="73" rx="4" ry="4" fill="#001133"/>
  <ellipse cx="44" cy="70" rx="2" ry="2" fill="white"/><ellipse cx="80" cy="70" rx="2" ry="2" fill="white"/>
</g>
<g data-expr="excited" style="display:none">
  <ellipse class="eye-white" cx="42" cy="72" rx="11" ry="10" fill="white"/><ellipse class="eye-white" cx="78" cy="72" rx="11" ry="10" fill="white"/>
  <text x="42" y="76" text-anchor="middle" font-size="13">⭐</text><text x="78" y="76" text-anchor="middle" font-size="13">⭐</text>
</g>
<g data-expr="crying" style="display:none">
  <ellipse class="eye-white" cx="42" cy="74" rx="10" ry="6" fill="white"/><ellipse class="eye-white" cx="78" cy="74" rx="10" ry="6" fill="white"/>
  <ellipse cx="42" cy="74" rx="6" ry="5" fill="url(#${tId}_eye)"/><ellipse cx="78" cy="74" rx="6" ry="5" fill="url(#${tId}_eye)"/>
  <ellipse cx="42" cy="74" rx="4" ry="3" fill="#001133"/><ellipse cx="78" cy="74" rx="4" ry="3" fill="#001133"/>
</g>
<!-- === EYEBROWS === -->
<g data-expr="neutral excited">
  <rect x="32" y="59" width="20" height="4" rx="2" fill="#222" transform="rotate(-5,42,61)"/>
  <rect x="68" y="59" width="20" height="4" rx="2" fill="#222" transform="rotate(5,78,61)"/>
</g>
<g data-expr="sad crying" style="display:none">
  <rect x="32" y="61" width="20" height="4" rx="2" fill="#222" transform="rotate(8,42,63)"/>
  <rect x="68" y="61" width="20" height="4" rx="2" fill="#222" transform="rotate(-8,78,63)"/>
</g>
<g data-expr="shocked" style="display:none">
  <rect x="30" y="56" width="22" height="4" rx="2" fill="#222" transform="rotate(-10,42,58)"/>
  <rect x="68" y="56" width="22" height="4" rx="2" fill="#222" transform="rotate(10,78,58)"/>
</g>
<!-- === MOUTH === -->
<g data-expr="neutral"><path d="M44,94 Q60,102 76,94" stroke="#CC6600" stroke-width="3" fill="none" stroke-linecap="round"/></g>
<g data-expr="happy excited" style="display:none"><path d="M38,92 Q60,108 82,92" stroke="#CC6600" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="98" rx="16" ry="8" fill="white" opacity="0.3"/></g>
<g data-expr="sad" style="display:none"><path d="M44,100 Q60,90 76,100" stroke="#CC6600" stroke-width="3" fill="none" stroke-linecap="round"/></g>
<g data-expr="crying" style="display:none"><path d="M44,102 Q60,91 76,102" stroke="#CC6600" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
<g data-expr="shocked" style="display:none"><ellipse cx="60" cy="96" rx="10" ry="12" fill="#CC6600" opacity="0.8"/><ellipse cx="60" cy="96" rx="7" ry="9" fill="#1A0000"/></g>
<!-- Blush -->
<ellipse class="blush" cx="25" cy="80" rx="9" ry="6" fill="#FF6633" opacity="0"/>
<ellipse class="blush" cx="95" cy="80" rx="9" ry="6" fill="#FF6633" opacity="0"/>
<!-- Tears -->
<g class="tears" style="display:none">
  <ellipse cx="35" cy="83" rx="3" ry="4" fill="#88CCFF" opacity="0.9"><animate attributeName="cy" values="83;110;83" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="1s" repeatCount="indefinite"/></ellipse>
  <ellipse cx="85" cy="83" rx="3" ry="4" fill="#88CCFF" opacity="0.9"><animate attributeName="cy" values="83;110;83" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="1.2s" repeatCount="indefinite"/></ellipse>
</g>
<!-- Nose -->
<ellipse cx="60" cy="84" rx="4" ry="3" fill="#D8904A" opacity="0.5"/>
</svg>`;
    }
};