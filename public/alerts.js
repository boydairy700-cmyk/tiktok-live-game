class AlertSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'global-alerts-container';
        document.body.appendChild(this.container);

        // Preload generic sounds
        this.AC = new (window.AudioContext || window.webkitAudioContext)();
    }

    playSound(type) {
        if (this.AC.state === 'suspended') this.AC.resume();
        const o = this.AC.createOscillator(), g = this.AC.createGain();
        o.connect(g); g.connect(this.AC.destination);
        
        if (type === 'follow') {
            o.type = 'sine';
            o.frequency.setValueAtTime(600, this.AC.currentTime);
            o.frequency.exponentialRampToValueAtTime(1200, this.AC.currentTime + 0.3);
            g.gain.setValueAtTime(0.1, this.AC.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.AC.currentTime + 0.5);
            o.start(); o.stop(this.AC.currentTime + 0.5);
        } else if (type === 'gift') {
            o.type = 'square';
            o.frequency.setValueAtTime(400, this.AC.currentTime);
            o.frequency.setValueAtTime(600, this.AC.currentTime + 0.1);
            o.frequency.setValueAtTime(800, this.AC.currentTime + 0.2);
            g.gain.setValueAtTime(0.15, this.AC.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.AC.currentTime + 0.6);
            o.start(); o.stop(this.AC.currentTime + 0.6);
        }
    }

    showAlert(name, picUrl, message, type) {
        this.playSound(type);

        const alertBox = document.createElement('div');
        alertBox.className = 'alert-box';
        
        const img = document.createElement('img');
        img.className = 'alert-img';
        img.src = picUrl || '/images/default_avatar.png'; // Fallback image if none
        
        const content = document.createElement('div');
        content.className = 'alert-content';
        
        const title = document.createElement('div');
        title.className = 'alert-title';
        title.innerText = name;
        
        const msg = document.createElement('div');
        msg.className = 'alert-message';
        msg.innerText = message;
        
        content.appendChild(title);
        content.appendChild(msg);
        
        alertBox.appendChild(img);
        alertBox.appendChild(content);
        
        this.container.appendChild(alertBox);

        // Remove element after animation ends (5 seconds total)
        setTimeout(() => {
            if (alertBox.parentElement) {
                alertBox.remove();
            }
        }, 5000);
    }
}

// Initialize globally
window.TikTokAlerts = new AlertSystem();
