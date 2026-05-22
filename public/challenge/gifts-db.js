// 🎁 TikTok Gifts Database — Local Images from /cm/ + Points = diamonds × 500
const TIKTOK_GIFTS = [
    // ─────────── عامة (Common) ───────────
    {
        id: 'rose',
        nameAr: 'وردة', nameEn: 'rose', emoji: '🌹',
        img: '/cm/eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp',
        diamonds: 1, pts: 200, rarity: 'common', color: '#FF4466'
    },
    {
        id: 'rose2',
        nameAr: 'وردة حمراء', nameEn: 'red rose', emoji: '🌹',
        img: '/cm/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp',
        diamonds: 1, pts: 200, rarity: 'common', color: '#FF2244'
    },
    {
        id: 'heart',
        nameAr: 'القلب مع اليدين', nameEn: 'heart with hands', emoji: '💗',
        img: '/cm/6cd022271dc4669d182cad856384870f~tplv-obj.webp',
        diamonds: 100, pts: 70000, rarity: 'common', color: '#FF6699'
    },
    {
        id: 'heart_king',
        nameAr: 'قلب الملك', nameEn: 'heart king', emoji: '❤️',
        img: '/cm/d56945782445b0b8c8658ed44f894c7b~tplv-obj.webp',
        diamonds: 5, pts: 2500, rarity: 'common', color: '#FF2244'
    },
    {
        id: 'bear',
        nameAr: 'دبدوب', nameEn: 'teddy bear', emoji: '🐻',
        img: '/cm/d78ed6496fd57286b42ac033acbee299.png~tplv-obj.webp',
        diamonds: 5, pts: 2500, rarity: 'common', color: '#CC8855'
    },
    {
        id: 'tiktok_sign',
        nameAr: 'علامة تيك توك', nameEn: 'tiktok sign', emoji: '🎵',
        img: '/cm/802a21ae29f9fae5abe3693de9f874bd~tplv-obj.webp',
        diamonds: 1, pts: 200, rarity: 'common', color: '#010101'
    },
    {
        id: 'tiktok_box',
        nameAr: 'صندوق تيك توك', nameEn: 'tiktok box', emoji: '📦',
        img: '/cm/d9a8abee459b2f6c6acbdfbce911977e.webp',
        diamonds: 1, pts: 500, rarity: 'common', color: '#FF0050'
    },

    // ─────────── غير شائعة (Uncommon) ───────────
    {
        id: 'donut',
        nameAr: 'دونات', nameEn: 'donut', emoji: '🍩',
        img: '/cm/267bb0cf3e5503555b78b4c8ac976e5e.png',
        diamonds: 30, pts: 30000, rarity: 'uncommon', color: '#CC5500'
    },
    {
        id: 'boxing',
        nameAr: 'قفازات ملاكمة', nameEn: 'boxing gloves', emoji: '🥊',
        img: '/cm/2fbb331b9697c6515c9bb1a4487153a6.png',
        diamonds: 10, pts: 5000, rarity: 'uncommon', color: '#CC2200'
    },
    {
        id: 'corgi',
        nameAr: 'كلب كوركي', nameEn: 'corgi', emoji: '🐶',
        img: '/cm/2fe60d73a96b698efc61a1a434b4f3ed.png',
        diamonds: 10, pts: 5000, rarity: 'uncommon', color: '#FF8844'
    },
    {
        id: 'cap',
        nameAr: 'الكاب', nameEn: 'tiktok cap', emoji: '🧢',
        img: '/cm/7a65e6037be114fa888bf04177a62f6a.png',
        diamonds: 99, pts: 70000, rarity: 'uncommon', color: '#1155DD'
    },
    {
        id: 'cowboy',
        nameAr: 'الكاب / قبعة كاوبوي', nameEn: 'cowboy hat', emoji: '🤠',
        img: '/cm/b5ba8728531da2e0e52e23b9479c246a.png',
        diamonds: 20, pts: 70000, rarity: 'uncommon', color: '#AA7700'
    },
    {
        id: 'cat_witch',
        nameAr: 'الخفاش', nameEn: 'witch cat', emoji: '🐱',
        img: '/cm/0d6afd7934d363dba4a747f8c0bec66b.webp',
        diamonds: 50, pts: 30000, rarity: 'uncommon', color: '#8833FF'
    },
    {
        id: 'gg',
        nameAr: 'GG', nameEn: 'GG', emoji: '🎮',
        img: '/cm/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.webp',
        diamonds: 5, pts: 2500, rarity: 'uncommon', color: '#FF6622'
    },
    {
        id: 'party',
        nameAr: 'قبعة حفلة', nameEn: 'party hat', emoji: '🎉',
        img: '/cm/cb4e11b3834e149f08e1cdcc93870b26~tplv-obj.webp',
        diamonds: 10, pts: 5000, rarity: 'uncommon', color: '#FF66CC'
    },

    // ─────────── نادرة (Rare) ───────────
    {
        id: 'scepter',
        nameAr: 'صولجان ملكي', nameEn: 'royal scepter', emoji: '👑',
        img: '/cm/bcb44a039dfa4d148af6cde9f233ea13.webp',
        diamonds: 200, pts: 100000, rarity: 'rare', color: '#FFD700',
        effect: 'steal_points'
    },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🎨 Gift Picker UI — مختار الهدايا
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GiftPicker = {
    selected: { boys: new Set(), girls: new Set() },

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = `
        <div class="gift-picker-header">
            <div class="gift-picker-tabs">
                <button class="gpick-tab active" onclick="GiftPicker.filterRarity('all',this)">الكل</button>
                <button class="gpick-tab" onclick="GiftPicker.filterRarity('common',this)">🌟 عادي</button>
                <button class="gpick-tab" onclick="GiftPicker.filterRarity('uncommon',this)">💎 غير شائع</button>
                <button class="gpick-tab" onclick="GiftPicker.filterRarity('rare',this)">🔥 نادر</button>
            </div>
            <div class="gpick-legend">
                <span class="gpick-legend-boys">🔵 فريق 1</span>
                <span class="gpick-legend-girls">🟡 فريق 2</span>
                <span style="color:#888;font-size:11px">اضغط على الصورة لاختيار الفريق</span>
            </div>
        </div>
        <div class="gift-grid" id="gift-grid">`;

        TIKTOK_GIFTS.forEach(g => {
            const ptsDisplay = g.pts >= 1000 
                ? (g.pts / 1000) + 'K نقطة' 
                : g.pts + ' نقطة';
            html += `
            <div class="gift-card-v2" id="gc-${g.id}" data-id="${g.id}" data-rarity="${g.rarity}">
                <div class="gc-image-area" onclick="GiftPicker.cycleAssign('${g.id}')">
                    <img src="${g.img}" class="gc-real-img" loading="lazy"
                         onerror="this.onerror=null; this.style.fontSize='40px'; this.src=''; this.alt='${g.emoji}';">
                    <div class="gc-team-badge" id="badge-${g.id}"></div>
                </div>
                <div class="gc-info">
                    <div class="gc-name">${g.nameAr}</div>
                    <div class="gc-diamonds">💎 ${g.diamonds}</div>
                    <div class="gc-pts-row">
                        <div class="gc-pts boys-pts" onclick="GiftPicker.assign('${g.id}','boys')" title="اضغط لتعيين لفريق 1">
                            <span class="gc-pts-icon">🔵</span>
                            <span class="gc-pts-val">${ptsDisplay}</span>
                        </div>
                        <div class="gc-pts girls-pts" onclick="GiftPicker.assign('${g.id}','girls')" title="اضغط لتعيين لفريق 2">
                            <span class="gc-pts-icon">🟡</span>
                            <span class="gc-pts-val">${ptsDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        });

        html += `</div>
        <div class="gift-picker-footer">
            <div class="team-sel-preview boys-preview">
                <div class="p-label">🔵 فريق 1 — هداياه:</div>
                <div id="boys-sel-list" class="p-list">لا يوجد</div>
            </div>
            <div class="team-sel-preview girls-preview">
                <div class="p-label">🟡 فريق 2 — هداياه:</div>
                <div id="girls-sel-list" class="p-list">لا يوجد</div>
            </div>
        </div>`;

        container.innerHTML = html;
        this._updateSummary();
    },

    // دورة: بدون → فريق1 → فريق2 → بدون
    cycleAssign(giftId) {
        if (this.selected.boys.has(giftId)) {
            this.selected.boys.delete(giftId);
            this.selected.girls.add(giftId);
        } else if (this.selected.girls.has(giftId)) {
            this.selected.girls.delete(giftId);
        } else {
            this.selected.boys.add(giftId);
        }
        this._applyCardState(giftId);
        this._updateSummary();
    },

    assign(giftId, team) {
        const opTeam = team === 'boys' ? 'girls' : 'boys';
        if (this.selected[team].has(giftId)) {
            this.selected[team].delete(giftId);
        } else {
            this.selected[opTeam].delete(giftId);
            this.selected[team].add(giftId);
        }
        this._applyCardState(giftId);
        this._updateSummary();
    },

    _applyCardState(giftId) {
        const card  = document.getElementById('gc-' + giftId);
        const badge = document.getElementById('badge-' + giftId);
        if (!card || !badge) return;

        card.classList.remove('active-boys', 'active-girls');
        if (this.selected.boys.has(giftId)) {
            card.classList.add('active-boys');
            badge.innerHTML = '🔵';
            badge.style.display = 'flex';
        } else if (this.selected.girls.has(giftId)) {
            card.classList.add('active-girls');
            badge.innerHTML = '🟡';
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
            badge.innerHTML = '';
        }
    },

    filterRarity(rarity, btn) {
        document.querySelectorAll('.gpick-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.gift-card-v2').forEach(card => {
            card.style.display = (rarity === 'all' || card.dataset.rarity === rarity) ? '' : 'none';
        });
    },

    _updateSummary() {
        const fmt = team => {
            const items = [...this.selected[team]].map(id => {
                const g = TIKTOK_GIFTS.find(x => x.id === id);
                return g ? (g.emoji + ' ' + g.nameAr) : id;
            });
            return items.length ? items.join('  •  ') : 'لا يوجد';
        };
        const boysList  = document.getElementById('boys-sel-list');
        const girlsList = document.getElementById('girls-sel-list');
        if (boysList)  boysList.textContent  = fmt('boys');
        if (girlsList) girlsList.textContent = fmt('girls');
    },

    getConfig(team) {
        return [...this.selected[team]].map(id => {
            const g = TIKTOK_GIFTS.find(x => x.id === id);
            return g ? { name: g.nameEn, pts: g.pts, emoji: g.emoji, diamonds: g.diamonds } : null;
        }).filter(Boolean);
    },

    matchGift(data) {
        if (!data) return null;
        const giftNameRaw = typeof data === 'string' ? data : data.giftName;
        const diamonds = (typeof data === 'object' && data.diamondCount !== undefined) ? data.diamondCount : null;
        if (!giftNameRaw) return null;

        const lower = giftNameRaw.toLowerCase().trim();

        for (const g of TIKTOK_GIFTS) {
            // تحقق صارم من عدد العملات لتجنب الخلط تماماً
            if (diamonds !== null && g.diamonds !== undefined && diamonds !== g.diamonds) {
                continue;
            }

            const enNames = g.nameEn.toLowerCase().split('/').map(s => s.trim());
            const arNames = (g.nameAr || '').toLowerCase().split('/').map(s => s.trim());
            const allNames = [...enNames, ...arNames, g.id.toLowerCase()];

            // تطابق تام مع أي من الأسماء
            let matched = false;
            for (const n of allNames) {
                if (!n) continue;
                if (lower === n) {
                    matched = true;
                    break;
                }
                // تطابق جزئي آمن إذا كانت العملات متطابقة (مثل قبعة كاوبوي تتطابق مع الكاب / قبعة كاوبوي)
                if (lower.includes(n) || n.includes(lower)) {
                    matched = true;
                    break;
                }
            }

            if (matched) {
                if (this.selected.boys.has(g.id))  return { team: 'boys',  pts: g.pts, gift: g };
                if (this.selected.girls.has(g.id)) return { team: 'girls', pts: g.pts, gift: g };
            }
        }
        return null;
    }
};
