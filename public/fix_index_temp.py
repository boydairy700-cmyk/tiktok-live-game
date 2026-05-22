import re

with open('d:/tiktok/public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix CSS for game-grid
content = re.sub(
    r'grid-template-columns: repeat\(auto-fit, minmax\(400px, 1fr\)\);',
    r'grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));',
    content
)

# Add Animations and Mute Button CSS
css_addition = '''
        /* ANIMATIONS */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px) translateZ(0); }
            to { opacity: 1; transform: translateY(0) translateZ(0); }
        }
        .cyber-card {
            animation: fadeInUp 0.6s ease-out backwards;
        }
        .cyber-card:nth-child(1) { animation-delay: 0.1s; }
        .cyber-card:nth-child(2) { animation-delay: 0.2s; }
        .cyber-card:nth-child(3) { animation-delay: 0.3s; }
        .cyber-card:nth-child(4) { animation-delay: 0.4s; }
        .cyber-card:nth-child(5) { animation-delay: 0.5s; }
        .cyber-card:nth-child(6) { animation-delay: 0.6s; }
        .cyber-card:nth-child(7) { animation-delay: 0.7s; }
        .cyber-card:nth-child(8) { animation-delay: 0.8s; }
        .cyber-card:nth-child(9) { animation-delay: 0.9s; }
        .cyber-card:nth-child(10) { animation-delay: 1.0s; }
        .cyber-card:nth-child(11) { animation-delay: 1.1s; }
        .cyber-card:nth-child(12) { animation-delay: 1.2s; }

        /* MUTE BUTTON */
        .mute-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: rgba(0,0,0,0.7);
            border: 2px solid var(--neon-cyan);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
            transition: 0.3s;
        }
        .mute-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 0 25px var(--neon-cyan);
        }
'''

content = content.replace('/*  MOBILE RESPONSIVENESS  */', css_addition + '\n        /*  MOBILE RESPONSIVENESS  */')

# Adjust Mobile Responsiveness block
content = re.sub(
    r'\.glitch-text \{ font-size: 45px; \}',
    r'.glitch-text { font-size: 35px; }',
    content
)
content = re.sub(
    r'\.game-grid \{ grid-template-columns: 1fr; padding: 0 20px 50px; \}',
    r'.game-grid { grid-template-columns: 1fr; padding: 0 20px 50px; gap: 20px; }\n            .mute-btn { bottom: 20px; right: 20px; width: 50px; height: 50px; font-size: 22px; }',
    content
)

# Fix HTML typos (data-tilt-scale="1.05" ")
content = content.replace('data-tilt-scale="1.05" "', 'data-tilt-scale="1.05"')

# Fix closing div of game-grid to include the Mario Games
# The Mario games are currently after </div> of game-grid
# We can find "<!-- Mario Game -->" and move the closing div of game-grid to the end of the last Mario game

mario_block = '''        <!-- Mario Game -->
        <div class="cyber-card" data-tilt data-tilt-glare data-tilt-max-glare="0.5" data-tilt-scale="1.05" style="border-color:#e30a17;">
            <div class="img-box" style="overflow:hidden;"><img src="/images/mario_game.png" style="width:100%;height:100%;object-fit:cover;" alt="Mario Game"></div>
            <div class="card-content">
                <h2>🍄 المساعدين ضد المخربين</h2>
                <p>كتب "مساعد" أو "مخرب" في الشات للانضمام للفريق!</p>
                
                <div style="display: flex; gap: 10px; width: 100%; margin-top:15px;">
                    <button class="cyber-btn" style="flex:1; padding:10px 5px; font-size:16px; font-weight:bold; background: linear-gradient(45deg, #e30a17, #ff0044); border:none; color:white; border-radius: 8px; box-shadow: 0 4px 15px rgba(227,10,23,0.5);" onclick="startGame('/mario_game/index.html')">▶️ بدء (للبث)</button>
                    <button class="cyber-btn" style="flex:1; padding:10px 5px; border:none; color: #fff; font-size:16px; font-weight:bold; background: linear-gradient(45deg, #11998e, #38ef7d); border-radius: 8px; box-shadow: 0 4px 15px rgba(56,239,125,0.5);" onclick="window.location.href='/mario_game/index.html?test=true'">🧪 تجربة</button>
                </div>
            </div>
        </div>

        <!-- Mario Game -->
        <div class="cyber-card" data-tilt data-tilt-glare data-tilt-max-glare="0.5" data-tilt-scale="1.05" style="border-color:#e30a17;">
            <div class="img-box" style="overflow:hidden;"><img src="/images/mario_game.png" style="width:100%;height:100%;object-fit:cover;" alt="Mario Game"></div>
            <div class="card-content">
                <h2>🍄 المساعدين ضد المخربين</h2>
                <p>كتب "مساعد" أو "مخرب" في الشات للانضمام للفريق!</p>
                
                <div style="display: flex; gap: 10px; width: 100%; margin-top:15px;">
                    <button class="cyber-btn" style="flex:1; padding:10px 5px; font-size:16px; font-weight:bold; background: linear-gradient(45deg, #e30a17, #ff0044); border:none; color:white; border-radius: 8px; box-shadow: 0 4px 15px rgba(227,10,23,0.5);" onclick="startGame('/mario_game/index.html')">▶️ بدء (للبث)</button>
                    <button class="cyber-btn" style="flex:1; padding:10px 5px; border:none; color: #fff; font-size:16px; font-weight:bold; background: linear-gradient(45deg, #11998e, #38ef7d); border-radius: 8px; box-shadow: 0 4px 15px rgba(56,239,125,0.5);" onclick="window.location.href='/mario_game/index.html?test=true'">🧪 تجربة</button>
                </div>
            </div>
        </div>'''

single_mario_block = '''        <!-- Mario Game -->
        <div class="cyber-card" data-tilt data-tilt-glare data-tilt-max-glare="0.5" data-tilt-scale="1.05" style="border-color:#e30a17;">
            <div class="img-box" style="overflow:hidden;"><img src="/images/mario_game.png" style="width:100%;height:100%;object-fit:cover;" alt="Mario Game"></div>
            <div class="card-content">
                <h2>🍄 المساعدين ضد المخربين</h2>
                <p>كتب "مساعد" أو "مخرب" في الشات للانضمام للفريق!</p>
                
                <div style="display: flex; gap: 10px; width: 100%; margin-top:15px;">
                    <button class="cyber-btn" style="flex:1; padding:10px 5px; font-size:16px; font-weight:bold; background: linear-gradient(45deg, #e30a17, #ff0044); border:none; color:white; border-radius: 8px; box-shadow: 0 4px 15px rgba(227,10,23,0.5);" onclick="startGame('/mario_game/index.html')">▶️ بدء (للبث)</button>
                    <button class="cyber-btn" style="flex:1; padding:10px 5px; border:none; color: #fff; font-size:16px; font-weight:bold; background: linear-gradient(45deg, #11998e, #38ef7d); border-radius: 8px; box-shadow: 0 4px 15px rgba(56,239,125,0.5);" onclick="window.location.href='/mario_game/index.html?test=true'">🧪 تجربة</button>
                </div>
            </div>
        </div>'''

if mario_block in content:
    content = content.replace(mario_block, '')
    # Insert one Mario game inside game-grid before it closes
    content = content.replace('    </div>\n\n    <!-- 3D Tilt Library -->', single_mario_block + '\n\n    </div>\n\n    <!-- 3D Tilt Library -->')


# Add mute button HTML and audio config
audio_html_old = '''    <!-- RELAXING BACKGROUND AUDIO -->
    <audio id="bg-audio" loop>
        <source src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=relaxing-mountains-rivers-streams-running-water-18178.mp3" type="audio/mpeg">
    </audio>'''

audio_html_new = '''    <!-- MUTE BUTTON -->
    <button id="mute-btn" class="mute-btn" onclick="toggleMute()">🔊</button>

    <!-- RELAXING BACKGROUND AUDIO -->
    <audio id="bg-audio" loop>
        <source src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=relaxing-mountains-rivers-streams-running-water-18178.mp3" type="audio/mpeg">
    </audio>'''

content = content.replace(audio_html_old, audio_html_new)

js_addition = '''
        function toggleMute() {
            const audio = document.getElementById('bg-audio');
            const btn = document.getElementById('mute-btn');
            if (audio.muted) {
                audio.muted = false;
                btn.innerHTML = '🔊';
            } else {
                audio.muted = true;
                btn.innerHTML = '🔇';
            }
        }
'''

content = content.replace('// Init 3D Tilt', js_addition + '\n        // Init 3D Tilt')

with open('d:/tiktok/public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
