// ==========================================================================
// STARK INDUSTRIES // J.A.R.V.I.S. OS v10.4 — CLIENT CORE & AUDIO ENGINE
// ==========================================================================

const API = {
    chat: '/api/chat',
    chatHistory: '/api/chat/history',
    briefing: '/api/briefing',
    tts: '/api/tts',
    telemetry: '/api/telemetry',
    goals: '/api/goals',
    tasks: '/api/tasks',
    dashboard: '/api/dashboard',
};

const CATEGORY_NAMES = {
    health: 'COMBAT & HEALTH',
    career: 'CAREER & VENTURE',
    finance: 'CAPITAL & WEALTH',
    education: 'KNOWLEDGE & INTEL',
    personal: 'PERSONAL PROTOCOL',
};

const CATEGORY_ICONS = {
    health: '💪',
    career: '💼',
    finance: '💰',
    education: '📚',
    personal: '🌟',
};

const FREQ_LABELS = {
    daily: 'DAILY OP',
    weekly: 'WEEKLY OP',
    'one-time': 'TACTICAL',
};

// System Global State
let currentView = 'dashboard';
let isComputing = false;
let isSpeaking = false;
let isListening = false;
let sfxEnabled = true;
let voiceEnabled = true;

// Web Audio API Context & Analyser
let audioCtx = null;
let audioAnalyser = null;
let audioSourceNode = null;
let recognition = null;

// ==================== WEB AUDIO & SFX SYNTHESIZER ====================

function initAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
            audioAnalyser = audioCtx.createAnalyser();
            audioAnalyser.fftSize = 64;
            audioAnalyser.connect(audioCtx.destination);
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBeep(freq = 880, duration = 0.08, type = 'sine') {
    if (!sfxEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // Audio policy ignore
    }
}

function playTacticalSweep() {
    if (!sfxEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.28);
    } catch (e) {}
}

function playConfirmChime() {
    if (!sfxEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        // Two-tone high tech chime
        [987.77, 1318.51].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);
            gain.gain.setValueAtTime(0.08, now + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.18);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.18);
        });
    } catch (e) {}
}

function playOpCompleteSound() {
    if (!sfxEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.06, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.15);
        });
    } catch (e) {}
}

// ==================== ARC REACTOR CANVAS ENGINE ====================

const canvas = document.getElementById('arc-reactor-canvas');
const ctx = canvas.getContext('2d');
let reactorAngle = 0;
let reactorPulse = 0;

function drawArcReactor() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Get real-time audio frequency data if speaking
    let audioEnergy = 0;
    if (isSpeaking && audioAnalyser) {
        const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
        audioAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        audioEnergy = (sum / dataArray.length) / 255;
    }

    // State Colors
    let primaryColor = '#00f0ff';
    let glowColor = 'rgba(0, 240, 255, 0.4)';
    let speed = 0.015;

    if (isListening) {
        primaryColor = '#ffaa00';
        glowColor = 'rgba(255, 170, 0, 0.6)';
        speed = 0.04;
    } else if (isComputing) {
        primaryColor = '#00ffff';
        glowColor = 'rgba(0, 255, 255, 0.8)';
        speed = 0.07;
    } else if (isSpeaking) {
        primaryColor = '#00e1ff';
        glowColor = `rgba(0, 240, 255, ${0.4 + audioEnergy * 0.5})`;
        speed = 0.02 + audioEnergy * 0.04;
    }

    reactorAngle += speed;
    reactorPulse += 0.04;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Outermost telemetry ring
    ctx.beginPath();
    ctx.arc(0, 0, 135, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Outer segmented tech ring (Ticks)
    ctx.save();
    ctx.rotate(reactorAngle * 0.4);
    const tickCount = 60;
    for (let i = 0; i < tickCount; i++) {
        const angle = (i * Math.PI * 2) / tickCount;
        const len = i % 5 === 0 ? 8 : 4;
        const x1 = Math.cos(angle) * 124;
        const y1 = Math.sin(angle) * 124;
        const x2 = Math.cos(angle) * (124 - len);
        const y2 = Math.sin(angle) * (124 - len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 5 === 0 ? primaryColor : 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.stroke();
    }
    ctx.restore();

    // 3. Middle Rotating Arc Panels (Opposite Rotation)
    ctx.save();
    ctx.rotate(-reactorAngle * 0.8);
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 105, i * Math.PI / 2 + 0.15, (i + 1) * Math.PI / 2 - 0.15);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.stroke();
    }
    ctx.restore();

    // 4. Power Cells Ring (10 Triangular/Trapezoid cells of the Arc Reactor)
    ctx.save();
    ctx.rotate(reactorAngle);
    const cells = 10;
    const cellRadius = 78;
    for (let i = 0; i < cells; i++) {
        const angle = (i * Math.PI * 2) / cells;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(cellRadius, 0);
        ctx.beginPath();
        ctx.rect(-6, -10, 12, 20);
        ctx.fillStyle = 'rgba(2, 14, 34, 0.85)';
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.stroke();

        // Inner glowing copper/cyan coil
        ctx.beginPath();
        ctx.rect(-3, -7, 6, 14);
        ctx.fillStyle = primaryColor;
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    // 5. Inner Core Ring
    const pulseFactor = Math.sin(reactorPulse) * 0.05 + 1 + audioEnergy * 0.3;
    const innerRadius = 45 * pulseFactor;

    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // 6. Central Core Glow (Radial Gradient)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, innerRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.35, primaryColor);
    gradient.addColorStop(0.8, 'rgba(0, 119, 255, 0.5)');
    gradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 25;
    ctx.fill();

    // 7. Core Energy Crosshair / Reticle
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
    ctx.moveTo(0, -15); ctx.lineTo(0, 15);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
    requestAnimationFrame(drawArcReactor);
}

// Start Reactor animation loop
requestAnimationFrame(drawArcReactor);

// Click reactor to trigger briefing or voice
canvas.addEventListener('click', () => {
    playBeep(1200, 0.05);
    runBriefingProtocol();
});

// ==================== SPEECH RECOGNITION (VOICE INPUT) ====================

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('SpeechRecognition API is not supported in this browser.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'th-TH';

    recognition.onstart = () => {
        isListening = true;
        document.getElementById('btn-mic')?.classList.add('listening');
        setReactorState('LISTENING // AUDIO INPUT', 'SPEAK YOUR DIRECTIVE NOW, SIR');
        playBeep(1000, 0.1);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
            document.getElementById('hud-command-input').value = transcript;
            playConfirmChime();
            submitCommand();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
    };

    recognition.onend = () => {
        stopListening();
    };
}

function toggleVoiceInput() {
    initAudioContext();
    if (!recognition) {
        setupSpeechRecognition();
    }
    if (!recognition) {
        alert('เบราว์เซอร์ของคุณยังไม่รองรับ Speech Recognition ครับท่าน แนะนำให้พิมพ์คำสั่งแทนครับ');
        return;
    }

    if (isListening) {
        recognition.stop();
        stopListening();
    } else {
        try {
            recognition.start();
        } catch (e) {
            recognition.stop();
        }
    }
}

function stopListening() {
    isListening = false;
    document.getElementById('btn-mic')?.classList.remove('listening');
    setReactorState('STANDBY // READY', 'CLICK MIC OR TRANSMIT COMMAND');
}

// ==================== SPEECH SYNTHESIS (VOICE OUTPUT) ====================

const audioElement = document.getElementById('jarvis-audio-player');

async function speakJarvis(text) {
    if (!voiceEnabled || !text) return;

    try {
        initAudioContext();
        setReactorState('SPEAKING // NEURAL AUDIO', 'J.A.R.V.I.S. VOCALIZING DIRECTIVE');
        isSpeaking = true;

        // Try backend high-fidelity Edge-TTS Niwat Neural voice
        const res = await fetch(API.tts, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (res.ok) {
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            audioElement.src = audioUrl;

            // Connect to Web Audio Analyser if not already connected
            if (audioCtx && !audioSourceNode) {
                try {
                    audioSourceNode = audioCtx.createMediaElementSource(audioElement);
                    audioSourceNode.connect(audioAnalyser);
                } catch (e) {
                    // Node already connected
                }
            }

            audioElement.onended = () => {
                isSpeaking = false;
                setReactorState('STANDBY // READY', 'ALL SYSTEMS NOMINAL');
                URL.revokeObjectURL(audioUrl);
            };

            audioElement.onerror = () => {
                fallbackSpeechSynthesis(text);
            };

            await audioElement.play();
            return;
        } else {
            fallbackSpeechSynthesis(text);
        }
    } catch (err) {
        console.warn('Backend TTS failed, trying browser fallback:', err);
        fallbackSpeechSynthesis(text);
    }
}

function fallbackSpeechSynthesis(text) {
    if (!('speechSynthesis' in window)) {
        isSpeaking = false;
        setReactorState('STANDBY // READY', 'READY');
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onstart = () => {
        isSpeaking = true;
    };

    utterance.onend = () => {
        isSpeaking = false;
        setReactorState('STANDBY // READY', 'ALL SYSTEMS NOMINAL');
    };

    utterance.onerror = () => {
        isSpeaking = false;
        setReactorState('STANDBY // READY', 'READY');
    };

    window.speechSynthesis.speak(utterance);
}

function setReactorState(title, subtitle) {
    const titleEl = document.getElementById('reactor-state-text');
    const subEl = document.getElementById('reactor-sub-text');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupCommandInput();
    setupControls();
    setupSpeechRecognition();
    
    updateClock();
    setInterval(updateClock, 1000);

    loadDashboard();
    loadTelemetry();
    loadChatHistory();
    setInterval(loadTelemetry, 5000);

    // Boot Chime on first user interaction
    document.body.addEventListener('click', () => {
        initAudioContext();
    }, { once: true });
});

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const clockEl = document.getElementById('time-main');
    if (clockEl) {
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// ==================== CONTROLS (SFX & VOICE TOGGLES) ====================

function setupControls() {
    const sfxBtn = document.getElementById('btn-toggle-sfx');
    const voiceBtn = document.getElementById('btn-toggle-voice');

    sfxBtn.addEventListener('click', () => {
        sfxEnabled = !sfxEnabled;
        sfxBtn.classList.toggle('active', sfxEnabled);
        if (sfxEnabled) playBeep(1200, 0.05);
    });

    voiceBtn.addEventListener('click', () => {
        voiceEnabled = !voiceEnabled;
        voiceBtn.classList.toggle('active', voiceEnabled);
        if (!voiceEnabled && isSpeaking) {
            audioElement.pause();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            isSpeaking = false;
            setReactorState('STANDBY // READY', 'VOICE MODULE MUTED');
        }
        playBeep(900, 0.05);
    });
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    document.querySelectorAll('.hud-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            playBeep(1100, 0.04);
        });
    });
}

function switchView(viewName) {
    currentView = viewName;

    document.querySelectorAll('.hud-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    document.querySelectorAll('.hud-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'goals') loadGoals();
    if (viewName === 'chat') {
        document.getElementById('chat-dot')?.style.setProperty('display', 'none');
        scrollChatToBottom();
    }
}

// ==================== TELEMETRY ====================

async function loadTelemetry() {
    try {
        const res = await fetch(API.telemetry);
        const data = await res.json();

        document.getElementById('t-directives').textContent = `${data.active_directives} ACTIVE`;
        document.getElementById('t-today-ops').textContent = `${data.tactical_ops_completed} / ${data.tactical_ops_total}`;
        document.getElementById('t-efficiency').textContent = `${data.core_efficiency}%`;
        document.getElementById('t-streak').textContent = `${data.streak_days} DAYS`;
        document.getElementById('t-neural').textContent = data.neural_link;
    } catch (e) {
        // Silently keep cached
    }
}

// ==================== DASHBOARD (MISSION CONTROL) ====================

async function loadDashboard() {
    try {
        const res = await fetch(API.dashboard);
        const data = await res.json();

        renderDashboardGoals(data.goals);
        renderTodayTasks(data.today_tasks);
        loadTelemetry();
    } catch (err) {
        console.error('Failed to load dashboard:', err);
    }
}

function renderDashboardGoals(goals) {
    const container = document.getElementById('dashboard-goals-list');
    if (!goals || goals.length === 0) {
        container.innerHTML = `
            <div class="hud-empty-state">
                <div class="empty-reticle"></div>
                <p class="empty-title">NO ACTIVE DIRECTIVES INITIALIZED</p>
                <p class="empty-desc">สั่งการ J.A.R.V.I.S. หรือกด 'NEW DIRECTIVE' เพื่อเริ่มยุทธการแรก</p>
            </div>`;
        return;
    }

    container.innerHTML = goals.map(goal => `
        <div class="hud-directive-item" onclick="switchView('goals')">
            <div class="directive-icon">${CATEGORY_ICONS[goal.category] || '🎯'}</div>
            <div class="directive-meta">
                <div class="directive-title">${escapeHtml(goal.title)}</div>
                <div class="directive-sub">${goal.tasks.length} OPS // ${CATEGORY_NAMES[goal.category] || goal.category}</div>
            </div>
            <div class="directive-progress-col">
                <div class="directive-progress-val">${goal.progress}%</div>
                <div class="directive-bar">
                    <div class="directive-bar-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderTodayTasks(tasks) {
    const container = document.getElementById('dashboard-today-list');
    const badge = document.getElementById('today-count-badge');
    
    const pendingCount = tasks ? tasks.filter(t => !t.is_completed).length : 0;
    if (badge) badge.textContent = `${pendingCount} PENDING`;

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="hud-empty-state">
                <div class="empty-reticle"></div>
                <p class="empty-title">NO IMMEDIATE OPERATIONS FOR TODAY</p>
                <p class="empty-desc">ยุทธการทั้งหมดพร้อมรับคำสั่งการใหม่จากท่านครับ</p>
            </div>`;
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="hud-op-item" onclick="toggleTask(${task.id})">
            <div class="op-checkbox ${task.is_completed ? 'checked' : ''}">
                ${task.is_completed ? '✓' : ''}
            </div>
            <span class="op-text ${task.is_completed ? 'completed' : ''}">${escapeHtml(task.title)}</span>
            <span class="op-tag">${FREQ_LABELS[task.frequency] || task.frequency}</span>
        </div>
    `).join('');
}

// ==================== DIRECTIVES MATRIX (GOALS) ====================

async function loadGoals() {
    try {
        const res = await fetch(API.goals);
        const data = await res.json();
        renderGoalsGrid(data.goals);
    } catch (err) {
        console.error('Failed to load goals:', err);
    }
}

function renderGoalsGrid(goals) {
    const container = document.getElementById('goals-grid');
    if (!goals || goals.length === 0) {
        container.innerHTML = `
            <div class="hud-empty-state" style="grid-column: 1 / -1; padding: 60px 0;">
                <div class="empty-reticle"></div>
                <p class="empty-title">NO DIRECTIVES REGISTERED</p>
                <p class="empty-desc">ส่งคำสั่งให้ J.A.R.V.I.S. วางแผน หรือคลิกปุ่ม 'INITIALIZE NEW DIRECTIVE' ด้านบน</p>
            </div>`;
        return;
    }

    container.innerHTML = goals.map(goal => `
        <div class="matrix-card">
            <div class="matrix-card-header">
                <div>
                    <span class="matrix-card-cat">${CATEGORY_NAMES[goal.category] || goal.category}</span>
                    <h3 class="matrix-card-title">${escapeHtml(goal.title)}</h3>
                </div>
                <button class="matrix-card-delete" onclick="deleteGoal(${goal.id})" title="ยกเลิกยุทธการ">✕</button>
            </div>
            ${goal.description ? `<p class="matrix-card-desc">${escapeHtml(goal.description)}</p>` : ''}
            
            <div class="matrix-card-progress">
                <div class="matrix-progress-labels">
                    <span style="color:var(--text-muted)">TACTICAL EFFICIENCY</span>
                    <span style="color:var(--stark-cyan); font-weight:700">${goal.progress}%</span>
                </div>
                <div class="directive-bar">
                    <div class="directive-bar-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>

            ${goal.tasks.length > 0 ? `
                <div class="matrix-tasks-section">
                    <span class="matrix-tasks-title">TACTICAL OPERATIONS (${goal.tasks.filter(t => t.is_completed).length}/${goal.tasks.length})</span>
                    ${goal.tasks.map(task => `
                        <div class="hud-op-item" style="padding:8px 10px;" onclick="toggleTask(${task.id})">
                            <div class="op-checkbox ${task.is_completed ? 'checked' : ''}" style="width:16px;height:16px;font-size:10px;">
                                ${task.is_completed ? '✓' : ''}
                            </div>
                            <span class="op-text ${task.is_completed ? 'completed' : ''}" style="font-size:12px;">${escapeHtml(task.title)}</span>
                            ${task.frequency !== 'one-time' ? `<span class="op-tag">${FREQ_LABELS[task.frequency]}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function toggleTask(taskId) {
    try {
        playBeep(1400, 0.05);
        const res = await fetch(`${API.tasks}/${taskId}/toggle`, { method: 'PUT' });
        const data = await res.json();
        
        if (data.is_completed) {
            playOpCompleteSound();
        }

        if (currentView === 'dashboard') loadDashboard();
        if (currentView === 'goals') loadGoals();
        loadTelemetry();
    } catch (err) {
        console.error('Failed to toggle task:', err);
    }
}

async function deleteGoal(goalId) {
    if (!confirm('ยืนยันการยกเลิกยุทธการนี้ใช่หรือไม่ครับท่าน?')) return;
    try {
        playBeep(400, 0.1);
        await fetch(`${API.goals}/${goalId}`, { method: 'DELETE' });
        loadGoals();
        loadDashboard();
        loadTelemetry();
    } catch (err) {
        console.error('Failed to delete goal:', err);
    }
}

// ==================== PROTOCOL: DAILY BRIEFING ====================

async function runBriefingProtocol() {
    if (isComputing) return;
    playTacticalSweep();

    setReactorState('COMPUTING // BRIEFING PROTOCOL', 'ANALYZING STARK DIRECTIVES...');
    isComputing = true;

    // Show indicator in chat
    appendCommsEntry('user', '⚡ PROTOCOL: DAILY BRIEFING');
    showTypingComms();

    try {
        const res = await fetch(API.briefing, { method: 'POST' });
        const data = await res.json();

        removeTypingComms();
        appendCommsEntry('assistant', data.message, data.created_goals);
        playConfirmChime();

        // Speak briefing aloud
        if (data.speech_text) {
            speakJarvis(data.speech_text);
        } else {
            speakJarvis(data.message);
        }

        loadDashboard();
        loadTelemetry();
    } catch (err) {
        removeTypingComms();
        appendCommsEntry('assistant', 'ขออภัยครับท่าน เกิดข้อขัดข้องในการรวบรวมข้อมูลยุทธการประจำวัน');
        setReactorState('STANDBY // READY', 'ALL SYSTEMS NOMINAL');
    } finally {
        isComputing = false;
    }
}

// ==================== COMMAND & CHAT EXECUTION ====================

function setupCommandInput() {
    const input = document.getElementById('hud-command-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitCommand();
        }
    });
}

function quickSend(message) {
    document.getElementById('hud-command-input').value = message;
    submitCommand();
}

async function submitCommand() {
    if (isComputing) return;

    const input = document.getElementById('hud-command-input');
    const message = input.value.trim();
    if (!message) return;

    // Command protocol shortcuts
    if (message.toLowerCase() === '/briefing' || message.toLowerCase() === 'briefing') {
        input.value = '';
        runBriefingProtocol();
        return;
    }

    playBeep(1200, 0.05);
    input.value = '';

    appendCommsEntry('user', message);
    showTypingComms();
    
    isComputing = true;
    setReactorState('COMPUTING // PROCESSING DIRECTIVE', 'RUNNING NEURAL SIMULATION...');

    try {
        const res = await fetch(API.chat, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        const data = await res.json();

        removeTypingComms();
        appendCommsEntry('assistant', data.message, data.created_goals);
        playConfirmChime();

        // Vocalize response
        if (data.speech_text) {
            speakJarvis(data.speech_text);
        } else {
            speakJarvis(data.message);
        }

        if (data.created_goals && data.created_goals.length > 0) {
            loadDashboard();
            loadTelemetry();
        }
    } catch (err) {
        removeTypingComms();
        appendCommsEntry('assistant', 'ขออภัยครับท่าน ระบบเครือข่ายขัดข้อง กรุณาลองสั่งการใหม่อีกครั้งครับ');
        setReactorState('STANDBY // READY', 'ALL SYSTEMS NOMINAL');
    } finally {
        isComputing = false;
        if (!isSpeaking) {
            setReactorState('STANDBY // READY', 'CLICK MIC OR TRANSMIT COMMAND');
        }
    }
}

async function loadChatHistory() {
    try {
        const res = await fetch(API.chatHistory);
        const data = await res.json();
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                appendCommsEntry(
                    msg.role === 'user' ? 'user' : 'assistant',
                    msg.content
                );
            });
        } else {
            appendCommsEntry('assistant', 'สวัสดีครับท่าน ผม J.A.R.V.I.S. ประจำการพร้อมสนับสนุนยุทธการและการวางแผนทั้งหมดของท่านครับ วันนี้มีภารกิจใดให้ผมรับใช้ครับ?');
        }
    } catch (err) {
        console.error('Failed to load chat history:', err);
    }
}

function appendCommsEntry(role, message, createdGoals = []) {
    const container = document.getElementById('chat-messages');
    const entry = document.createElement('div');
    entry.className = `comms-entry ${role}`;

    const avatarText = role === 'user' ? 'YOU' : 'JARVIS';
    const formatted = formatChatMessage(message);

    let goalsHtml = '';
    if (createdGoals && createdGoals.length > 0) {
        goalsHtml = createdGoals.map(goal => `
            <div style="margin-top:10px; padding:10px; background:rgba(0, 240, 255, 0.08); border:1px solid var(--stark-cyan); border-radius:2px;">
                <div style="font-family:var(--font-mono); font-size:11px; color:var(--stark-cyan);">⚡ INITIALIZED STRATEGIC DIRECTIVE</div>
                <div style="font-weight:700; color:#fff; margin:4px 0;">${escapeHtml(goal.title)}</div>
                ${goal.tasks.map(t => `<div style="font-size:12px; color:var(--text-secondary);">✓ ${escapeHtml(t.title)} (${FREQ_LABELS[t.frequency] || t.frequency})</div>`).join('')}
            </div>
        `).join('');
    }

    const replayBtnHtml = role === 'assistant' ? `
        <div class="comms-actions">
            <button class="btn-replay-voice" onclick="speakJarvis('${escapeForJsString(message)}')">
                <span>🔊 REPLAY VOICE</span>
            </button>
        </div>
    ` : '';

    entry.innerHTML = `
        <div class="comms-avatar">${avatarText}</div>
        <div class="comms-bubble">
            <div>${formatted}</div>
            ${goalsHtml}
            ${replayBtnHtml}
        </div>
    `;

    container.appendChild(entry);
    scrollChatToBottom();
}

function showTypingComms() {
    const container = document.getElementById('chat-messages');
    const typing = document.createElement('div');
    typing.className = 'comms-entry assistant';
    typing.id = 'comms-typing';
    typing.innerHTML = `
        <div class="comms-avatar">JARVIS</div>
        <div class="comms-bubble" style="font-family:var(--font-mono); font-size:12px; color:var(--stark-cyan);">
            COMPUTING DIRECTIVE... // PROCESSING
        </div>
    `;
    container.appendChild(typing);
    scrollChatToBottom();
}

function removeTypingComms() {
    const typing = document.getElementById('comms-typing');
    if (typing) typing.remove();
}

function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
    }
}

function clearLocalChat() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    appendCommsEntry('assistant', 'Comms log cleared, Sir. All systems standing by.');
}

// ==================== MANUAL MODAL ====================

function showAddGoalModal() {
    playBeep(1000, 0.05);
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('goal-title').focus();
}

function closeModal() {
    playBeep(700, 0.05);
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('goal-title').value = '';
    document.getElementById('goal-desc').value = '';
    document.getElementById('goal-category').value = 'career';
    document.getElementById('goal-date').value = '';
}

async function createGoalManual() {
    const title = document.getElementById('goal-title').value.trim();
    if (!title) {
        document.getElementById('goal-title').focus();
        return;
    }

    const data = {
        title: title,
        description: document.getElementById('goal-desc').value.trim(),
        category: document.getElementById('goal-category').value,
        target_date: document.getElementById('goal-date').value || null,
    };

    try {
        playConfirmChime();
        await fetch(API.goals, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        closeModal();
        loadGoals();
        loadDashboard();
        loadTelemetry();
        speakJarvis(`รับทราบครับท่าน ยุทธการ ${title} ได้รับการบันทึกเข้าสู่ระบบเรียบร้อยแล้วครับ`);
    } catch (err) {
        console.error('Failed to create goal:', err);
    }
}

// ==================== FORMATTING & UTILITIES ====================

function formatChatMessage(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--stark-cyan)">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeForJsString(text) {
    if (!text) return '';
    return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ');
}
