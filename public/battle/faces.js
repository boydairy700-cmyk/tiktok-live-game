const FaceSystem = {
    _current: { boys: 'neutral', girls: 'neutral' },

    // Show/hide SVG groups by class
    _apply(team, expr) {
        const svg = document.getElementById(team + '-face');
        if (!svg) return;
        const allGroups = svg.querySelectorAll('[data-expr]');
        allGroups.forEach(g => g.style.display = 'none');
        const show = svg.querySelectorAll(`[data-expr~="${expr}"]`);
        show.forEach(g => g.style.display = '');
        // tears
        const tears = svg.querySelector('.tears');
        if (tears) tears.style.display = expr === 'crying' ? '' : 'none';
        // blush
        const blush = svg.querySelectorAll('.blush');
        const showBlush = ['happy','excited'].includes(expr);
        blush.forEach(b => b.setAttribute('opacity', showBlush ? '0.55' : '0'));
    },

    updateState(team, state) {
        if (this._current[team] === state) return;
        this._current[team] = state;
        this._apply(team, state);
    },

    createSVG(team) {
        return team === 'boys' ? this._boy() : this._girl();
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

    _boy() {
        return `<svg id="boys-face" viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" width="200" height="200" style="filter:drop-shadow(0 8px 20px rgba(0,200,255,0.3))">
<defs>
  <radialGradient id="bskin" cx="45%" cy="35%"><stop offset="0%" stop-color="#FFD5A0"/><stop offset="100%" stop-color="#E8A055"/></radialGradient>
  <radialGradient id="bhair" cx="50%" cy="20%"><stop offset="0%" stop-color="#4488FF"/><stop offset="100%" stop-color="#1133AA"/></radialGradient>
  <radialGradient id="beye" cx="35%" cy="30%"><stop offset="0%" stop-color="#33AAFF"/><stop offset="100%" stop-color="#003388"/></radialGradient>
</defs>
<!-- Body / Jersey -->
<rect x="25" y="128" width="70" height="52" rx="14" fill="#1155CC"/>
<rect x="42" y="128" width="36" height="12" rx="6" fill="#0033AA"/>
<text x="60" y="158" text-anchor="middle" font-size="11" fill="white" font-weight="bold">⚡ BOY</text>
<!-- Neck -->
<rect x="47" y="118" width="26" height="14" rx="7" fill="url(#bskin)"/>
<!-- Hair back spikes -->
<polygon points="10,60 28,20 35,55" fill="url(#bhair)"/>
<polygon points="28,58 42,12 52,52" fill="url(#bhair)"/>
<polygon points="50,52 60,8 70,52" fill="url(#bhair)"/>
<polygon points="68,52 78,18 88,55" fill="url(#bhair)"/>
<polygon points="85,58 92,24 105,62" fill="url(#bhair)"/>
<!-- Head -->
<ellipse cx="60" cy="72" rx="38" ry="40" fill="url(#bskin)"/>
<!-- Hair top cap -->
<ellipse cx="60" cy="48" rx="36" ry="20" fill="url(#bhair)"/>
<rect x="24" y="48" width="72" height="16" rx="0" fill="url(#bhair)"/>
<!-- Ear -->
<ellipse cx="22" cy="72" rx="6" ry="8" fill="url(#bskin)"/><ellipse cx="98" cy="72" rx="6" ry="8" fill="url(#bskin)"/>
<!-- === EYES === -->
<!-- Normal eyes -->
<g data-expr="neutral happy sad shocked">
  <ellipse class="eye-white" cx="42" cy="72" rx="10" ry="9" fill="white"/><ellipse class="eye-white" cx="78" cy="72" rx="10" ry="9" fill="white"/>
  <ellipse cx="42" cy="73" rx="7" ry="7" fill="url(#beye)"/><ellipse cx="78" cy="73" rx="7" ry="7" fill="url(#beye)"/>
  <ellipse cx="42" cy="73" rx="4" ry="4" fill="#001133"/><ellipse cx="78" cy="73" rx="4" ry="4" fill="#001133"/>
  <ellipse cx="44" cy="70" rx="2" ry="2" fill="white"/><ellipse cx="80" cy="70" rx="2" ry="2" fill="white"/>
</g>
<!-- Excited eyes (star) -->
<g data-expr="excited" style="display:none">
  <ellipse class="eye-white" cx="42" cy="72" rx="11" ry="10" fill="white"/><ellipse class="eye-white" cx="78" cy="72" rx="11" ry="10" fill="white"/>
  <text x="42" y="76" text-anchor="middle" font-size="13">⭐</text><text x="78" y="76" text-anchor="middle" font-size="13">⭐</text>
</g>
<!-- Cry eyes -->
<g data-expr="crying" style="display:none">
  <ellipse class="eye-white" cx="42" cy="74" rx="10" ry="6" fill="white"/><ellipse class="eye-white" cx="78" cy="74" rx="10" ry="6" fill="white"/>
  <ellipse cx="42" cy="74" rx="6" ry="5" fill="url(#beye)"/><ellipse cx="78" cy="74" rx="6" ry="5" fill="url(#beye)"/>
  <ellipse cx="42" cy="74" rx="4" ry="3" fill="#001133"/><ellipse cx="78" cy="74" rx="4" ry="3" fill="#001133"/>
</g>
<!-- === EYEBROWS === -->
<g data-expr="neutral excited">
  <rect x="32" y="59" width="20" height="4" rx="2" fill="#1133AA" transform="rotate(-5,42,61)"/>
  <rect x="68" y="59" width="20" height="4" rx="2" fill="#1133AA" transform="rotate(5,78,61)"/>
</g>
<g data-expr="sad crying" style="display:none">
  <rect x="32" y="61" width="20" height="4" rx="2" fill="#1133AA" transform="rotate(8,42,63)"/>
  <rect x="68" y="61" width="20" height="4" rx="2" fill="#1133AA" transform="rotate(-8,78,63)"/>
</g>
<g data-expr="shocked" style="display:none">
  <rect x="30" y="56" width="22" height="4" rx="2" fill="#1133AA" transform="rotate(-10,42,58)"/>
  <rect x="68" y="56" width="22" height="4" rx="2" fill="#1133AA" transform="rotate(10,78,58)"/>
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
    },

    _girl() {
        return `<svg id="girls-face" viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" width="200" height="200" style="filter:drop-shadow(0 8px 20px rgba(255,100,150,0.35))">
<defs>
  <radialGradient id="gskin" cx="40%" cy="30%"><stop offset="0%" stop-color="#FFF0E0"/><stop offset="100%" stop-color="#F0C090"/></radialGradient>
  <radialGradient id="ghair" cx="50%" cy="20%"><stop offset="0%" stop-color="#FF88CC"/><stop offset="100%" stop-color="#CC2288"/></radialGradient>
  <radialGradient id="geye" cx="35%" cy="30%"><stop offset="0%" stop-color="#AA66FF"/><stop offset="100%" stop-color="#6600CC"/></radialGradient>
</defs>
<!-- Body / Dress -->
<path d="M28,130 Q20,180 35,180 L85,180 Q100,180 92,130 Q76,140 60,138 Q44,140 28,130Z" fill="#FF4488"/>
<ellipse cx="60" cy="134" rx="22" ry="8" fill="#FF2266"/>
<text x="60" y="162" text-anchor="middle" font-size="10" fill="white" font-weight="bold">💖 GIRL</text>
<!-- Neck -->
<rect x="48" y="118" width="24" height="16" rx="8" fill="url(#gskin)"/>
<!-- Hair back (long) -->
<path d="M22,58 Q10,90 14,150 Q18,165 28,160 Q22,120 30,75Z" fill="url(#ghair)"/>
<path d="M98,58 Q110,90 106,150 Q102,165 92,160 Q98,120 90,75Z" fill="url(#ghair)"/>
<!-- Head -->
<ellipse cx="60" cy="72" rx="37" ry="40" fill="url(#gskin)"/>
<!-- Hair top -->
<ellipse cx="60" cy="44" rx="37" ry="18" fill="url(#ghair)"/>
<rect x="23" y="44" width="74" height="20" rx="0" fill="url(#ghair)"/>
<!-- Hair bow -->
<ellipse cx="88" cy="42" rx="12" ry="9" fill="#FF0066" transform="rotate(-20,88,42)"/>
<ellipse cx="100" cy="34" rx="12" ry="9" fill="#FF0066" transform="rotate(20,100,34)"/>
<ellipse cx="94" cy="38" rx="5" ry="5" fill="#FF44AA"/>
<!-- Ear -->
<ellipse cx="23" cy="72" rx="6" ry="8" fill="url(#gskin)"/><ellipse cx="97" cy="72" rx="6" ry="8" fill="url(#gskin)"/>
<!-- Earrings -->
<ellipse cx="23" cy="82" rx="4" ry="4" fill="#FFD700"/><ellipse cx="97" cy="82" rx="4" ry="4" fill="#FFD700"/>
<!-- === EYES === -->
<g data-expr="neutral happy sad shocked">
  <!-- Lashes -->
  <line x1="32" y1="64" x2="29" y2="60" stroke="#330033" stroke-width="2"/><line x1="37" y1="62" x2="35" y2="58" stroke="#330033" stroke-width="2"/><line x1="42" y1="62" x2="41" y2="58" stroke="#330033" stroke-width="2"/>
  <line x1="78" y1="64" x2="81" y2="60" stroke="#330033" stroke-width="2"/><line x1="83" y1="62" x2="85" y2="58" stroke="#330033" stroke-width="2"/><line x1="88" y1="62" x2="89" y2="58" stroke="#330033" stroke-width="2"/>
  <ellipse class="eye-white" cx="40" cy="72" rx="12" ry="11" fill="white"/>
  <ellipse class="eye-white" cx="80" cy="72" rx="12" ry="11" fill="white"/>
  <ellipse cx="40" cy="73" rx="9" ry="9" fill="url(#geye)"/>
  <ellipse cx="80" cy="73" rx="9" ry="9" fill="url(#geye)"/>
  <ellipse cx="40" cy="73" rx="5" ry="5" fill="#1A0033"/>
  <ellipse cx="80" cy="73" rx="5" ry="5" fill="#1A0033"/>
  <ellipse cx="43" cy="69" rx="2.5" ry="2.5" fill="white"/>
  <ellipse cx="83" cy="69" rx="2.5" ry="2.5" fill="white"/>
  <ellipse cx="37" cy="71" rx="1.5" ry="1.5" fill="white"/>
  <ellipse cx="77" cy="71" rx="1.5" ry="1.5" fill="white"/>
</g>
<!-- Excited - star eyes -->
<g data-expr="excited" style="display:none">
  <ellipse class="eye-white" cx="40" cy="72" rx="13" ry="12" fill="white"/>
  <ellipse class="eye-white" cx="80" cy="72" rx="13" ry="12" fill="white"/>
  <text x="40" y="77" text-anchor="middle" font-size="15">⭐</text>
  <text x="80" y="77" text-anchor="middle" font-size="15">⭐</text>
</g>
<!-- Cry eyes -->
<g data-expr="crying" style="display:none">
  <ellipse class="eye-white" cx="40" cy="74" rx="12" ry="7" fill="white"/>
  <ellipse class="eye-white" cx="80" cy="74" rx="12" ry="7" fill="white"/>
  <ellipse cx="40" cy="74" rx="8" ry="6" fill="url(#geye)"/>
  <ellipse cx="80" cy="74" rx="8" ry="6" fill="url(#geye)"/>
  <ellipse cx="40" cy="74" rx="5" ry="4" fill="#1A0033"/>
  <ellipse cx="80" cy="74" rx="5" ry="4" fill="#1A0033"/>
</g>
<!-- === EYEBROWS === -->
<g data-expr="neutral excited">
  <path d="M28,60 Q40,55 52,60" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M68,60 Q80,55 92,60" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>
<g data-expr="sad crying" style="display:none">
  <path d="M28,62 Q40,58 52,64" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M68,64 Q80,58 92,62" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>
<g data-expr="shocked" style="display:none">
  <path d="M26,57 Q40,50 52,57" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M68,57 Q80,50 94,57" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>
<g data-expr="happy" style="display:none">
  <path d="M28,59 Q40,54 52,59" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M68,59 Q80,54 92,59" stroke="#660033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>
<!-- === MOUTH === -->
<g data-expr="neutral"><path d="M46,94 Q60,102 74,94" stroke="#CC3366" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
<g data-expr="happy" style="display:none"><path d="M42,92 Q60,107 78,92" stroke="#CC3366" stroke-width="2.5" fill="white" fill-opacity="0.3"/><path d="M42,92 Q60,107 78,92" stroke="#CC3366" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
<g data-expr="excited" style="display:none"><path d="M38,90 Q60,112 82,90" stroke="#CC3366" stroke-width="3" fill="white" fill-opacity="0.4"/><path d="M38,90 Q60,112 82,90" stroke="#CC3366" stroke-width="3" fill="none" stroke-linecap="round"/></g>
<g data-expr="sad" style="display:none"><path d="M46,100 Q60,91 74,100" stroke="#CC3366" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
<g data-expr="crying" style="display:none"><path d="M46,103 Q60,92 74,103" stroke="#CC3366" stroke-width="3" fill="none" stroke-linecap="round"/></g>
<g data-expr="shocked" style="display:none"><ellipse cx="60" cy="97" rx="9" ry="11" fill="#CC3366" opacity="0.8"/><ellipse cx="60" cy="97" rx="6" ry="8" fill="#440022"/></g>
<!-- Blush -->
<ellipse class="blush" cx="24" cy="80" rx="10" ry="7" fill="#FF6699" opacity="0"/>
<ellipse class="blush" cx="96" cy="80" rx="10" ry="7" fill="#FF6699" opacity="0"/>
<!-- Tears -->
<g class="tears" style="display:none">
  <ellipse cx="33" cy="83" rx="3" ry="5" fill="#AADDFF"><animate attributeName="cy" values="83;116;83" dur="0.9s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="0.9s" repeatCount="indefinite"/></ellipse>
  <ellipse cx="87" cy="83" rx="3" ry="5" fill="#AADDFF"><animate attributeName="cy" values="83;116;83" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="1.1s" repeatCount="indefinite"/></ellipse>
</g>
<!-- Nose -->
<ellipse cx="60" cy="84" rx="3.5" ry="2.5" fill="#E8A060" opacity="0.4"/>
<!-- Sparkles (girl only) -->
<text x="12" y="60" font-size="12" opacity="0.7">✨</text>
<text x="100" y="45" font-size="10" opacity="0.6">💫</text>
</svg>`;
    }
};
