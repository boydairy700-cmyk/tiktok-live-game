const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');
const multer = require('multer');

const session = require('express-session');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://amqgfgzlphoxilolyjyz.supabase.co';
const supabaseKey = 'sb_publishable_pboOGTogx8QfjLSu7lLtxQ_pJ85NLbL';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Multer for media uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '_' + Date.now() + ext);
    }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure UTF-8 charset in all responses
app.use((req, res, next) => {
    res.setHeader('Content-Type-Charset', 'utf-8');
    const originalSend = res.send.bind(res);
    res.send = function(body) {
        const ct = res.getHeader('Content-Type') || '';
        if (ct && !ct.includes('charset') && (ct.includes('text/') || ct.includes('application/json'))) {
            res.setHeader('Content-Type', ct + '; charset=utf-8');
        }
        return originalSend(body);
    };
    next();
});

app.use(session({
    secret: 'tiktok-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ========== MIDDLEWARE ==========
async function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        if (req.session.userId === 'hardcoded-admin') return next();
        try {
            const { data: user } = await supabase.from('users').select('*').eq('id', req.session.userId).single();
            if (user && user.role === 'admin') return next();
            if (user && user.expiry_date) {
                const expiry = new Date(user.expiry_date);
                if (expiry < new Date()) {
                    req.session.destroy();
                    return res.redirect('/expired');
                }
            }
            return next();
        } catch (err) {
            return res.redirect('/login');
        }
    }
    res.redirect('/login');
}

async function isAdmin(req, res, next) {
    if (req.session.userId) {
        if (req.session.userId === 'hardcoded-admin') return next();
        try {
            const { data: user } = await supabase.from('users').select('*').eq('id', req.session.userId).single();
            if (user && user.role === 'admin') return next();
        } catch (err) {}
    }
    res.status(403).send('غير مسموح لك بالدخول');
}

// ========== AUTH ROUTES ==========
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const uname = username ? username.trim().toLowerCase() : '';
    const pwd = password ? password.trim() : '';

    if ((uname === 'admin' || uname === 'ادمن') && (pwd === 'admin123' || pwd === '1234' || pwd === 'admin1234')) {
        req.session.userId = 'hardcoded-admin';
        req.session.role = 'admin';
        return res.redirect('/');
    }

    try {
        const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.role = user.role;
            if (user.role !== 'admin' && user.expiry_date) {
                if (new Date(user.expiry_date) < new Date()) {
                    return res.redirect('/expired');
                }
            }
            res.redirect('/');
        } else {
            res.redirect('/login?error=invalid');
        }
    } catch (err) {
        res.redirect('/login?error=invalid');
    }
});

app.get('/', isAuthenticated, (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/expired', (req, res) => res.sendFile(__dirname + '/public/expired.html'));
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ========== ADMIN ROUTES ==========
app.get('/admin', isAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

app.get('/api/users', isAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase.from('users').select('id, username, role, expiry_date, created_at').neq('role', 'admin');
        if (error) return res.status(500).json({ error: error.message });
        res.json(users || []);
    } catch (err) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/users', isAdmin, async (req, res) => {
    try {
        const { username, password, days } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(days));
        
        const { error } = await supabase.from('users').insert({
            username,
            password: hashedPassword,
            expiry_date: expiryDate.toISOString()
        });
        
        if (error) return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً أو خطأ في البيانات' });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'خطأ أثناء إنشاء المستخدم' });
    }
});

app.delete('/api/users/:id', isAdmin, async (req, res) => {
    try {
        await supabase.from('users').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء الحذف' });
    }
});

app.post('/api/users/:id/renew', isAdmin, async (req, res) => {
    try {
        const { days } = req.body;
        const { data: user } = await supabase.from('users').select('expiry_date').eq('id', req.params.id).single();
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

        let currentExpiry = user.expiry_date ? new Date(user.expiry_date) : new Date();
        if (currentExpiry < new Date()) currentExpiry = new Date();
        currentExpiry.setDate(currentExpiry.getDate() + parseInt(days));
        
        await supabase.from('users').update({ expiry_date: currentExpiry.toISOString() }).eq('id', req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء التجديد' });
    }
});

app.get('/api/me', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'غير مسجل' });
    if (req.session.userId === 'hardcoded-admin') {
        return res.json({ username: 'admin', role: 'admin', expiry_date: null });
    }
    try {
        const { data: user } = await supabase.from('users').select('username, role, expiry_date').eq('id', req.session.userId).single();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'خطأ' });
    }
});

// ========== SIMULATION / TEST MODE API ==========
// Emit fake TikTok events to all connected sockets for testing
app.post('/api/simulate', isAuthenticated, (req, res) => {
    const { type, data } = req.body;
    
    const fakeBase = {
        uniqueId: 'test_user',
        nickname: 'مشاهد تجريبي 🧪',
        profilePictureUrl: 'https://placehold.co/100x100/ff0055/fff?text=TEST'
    };

    switch(type) {
        case 'gift':
            io.emit('tiktokGift', {
                ...fakeBase,
                giftName: data?.giftName || 'Rose',
                giftId: 5655,
                diamondCount: data?.diamonds || 1,
                repeatCount: data?.count || 1,
                repeatEnd: true
            });
            break;
        case 'like':
            io.emit('tiktokLike', {
                ...fakeBase,
                likeCount: data?.count || 100,
                totalLikeCount: data?.total || 1000
            });
            break;
        case 'chat':
            io.emit('tiktokChat', {
                ...fakeBase,
                comment: data?.text || 'السعودية'
            });
            break;
        case 'follow':
            io.emit('tiktokFollow', { ...fakeBase });
            break;
        case 'share':
            io.emit('tiktokShare', { ...fakeBase });
            break;
        case 'subscribe':
            io.emit('tiktokSubscribe', { ...fakeBase });
            break;
        case 'member':
            io.emit('tiktokMember', { ...fakeBase });
            break;
    }
    res.json({ success: true, type });
});

// ========== MEDIA UPLOAD API ==========
app.post('/api/upload-media', isAuthenticated, upload.single('media'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع ملف' });
    res.json({ success: true, url: '/uploads/' + req.file.filename });
});

// ========== STATIC FILES ==========
// Public routes (no login needed)
app.use('/battle', express.static('public/battle'));
app.use('/hilal_nassr', express.static('public/hilal_nassr'));
app.use('/challenge', express.static('public/challenge'));
app.use('/falling_drops', express.static('public/falling_drops'));
app.use('/flag_race', express.static('public/flag_race'));
app.use('/alerts', express.static('public/alerts'));
app.use('/screen_king', express.static('public/screen_king'));
app.use('/boys_vs_girls', express.static('public/boys_vs_girls'));
app.use('/tug_of_war', express.static('public/tug_of_war'));

// Protected routes
app.use(isAuthenticated);
app.use(express.static('public'));

// ========== GLOBAL TIKTOK CONNECTION ==========
// Store active TikTok connections per socket
const globalConnections = new Map();

io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');
    
    let tiktokLiveConnection = null;

    socket.on('connectTikTok', (data) => {
        let username, sessionId;
        if (typeof data === 'string') {
            username = data;
        } else {
            username = data.username;
            sessionId = data.sessionId;
        }

        if (tiktokLiveConnection) {
            tiktokLiveConnection.disconnect();
        }

        console.log(`Connecting to TikTok Live: ${username}`);
        let options = {};
        if (sessionId && sessionId.trim() !== '') {
            options.sessionId = sessionId.trim();
            options.clientParams = { 'tt-target-idc': 'alisg' };
        }
        
        try {
            tiktokLiveConnection = new WebcastPushConnection(username, options);
        } catch (err) {
            console.error('Failed to initialize connection', err);
            socket.emit('tiktokError', err.toString());
            return;
        }

        tiktokLiveConnection.connect().then(state => {
            console.info(`Connected to roomId ${state.roomId}`);
            socket.emit('tiktokConnected', { roomId: state.roomId });
        }).catch(err => {
            console.error('Failed to connect', err);
            socket.emit('tiktokError', err.toString());
        });

        tiktokLiveConnection.on('chat', data => {
            socket.emit('tiktokChat', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                comment: data.comment
            });
        });

        tiktokLiveConnection.on('gift', data => {
            socket.emit('tiktokGift', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                giftName: data.giftName,
                giftId: data.giftId,
                diamondCount: data.diamondCount,
                repeatCount: data.repeatCount,
                repeatEnd: data.repeatEnd,
                giftPictureUrl: data.giftPictureUrl || data.pictureUrl || ''
            });
        });

        tiktokLiveConnection.on('like', data => {
            socket.emit('tiktokLike', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                likeCount: data.likeCount,
                totalLikeCount: data.totalLikeCount
            });
        });

        tiktokLiveConnection.on('follow', data => {
            socket.emit('tiktokFollow', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl
            });
        });

        tiktokLiveConnection.on('share', data => {
            socket.emit('tiktokShare', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl
            });
        });

        tiktokLiveConnection.on('member', data => {
            socket.emit('tiktokMember', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl
            });
        });

        tiktokLiveConnection.on('subscribe', data => {
            socket.emit('tiktokSubscribe', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl
            });
        });

        tiktokLiveConnection.on('streamEnd', () => {
            socket.emit('tiktokDisconnected');
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        if (tiktokLiveConnection) {
            tiktokLiveConnection.disconnect();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
