// ==========================================================================
// STARK INDUSTRIES // J.A.R.V.I.S. OS v10.4 — CLIENT CORE & AUDIO ENGINE
// ==========================================================================

const API = {
    chat: '/api/chat',
    chatHistory: '/api/chat/history',
    chatSessions: '/api/chat/sessions',
    briefing: '/api/briefing',
    tts: '/api/tts',
    stt: '/api/stt',
    telemetry: '/api/telemetry',
    goals: '/api/goals',
    tasks: '/api/tasks',
    dashboard: '/api/dashboard',
};

// Current Active Chat Session ID
let currentSessionId = localStorage.getItem('stark_current_session_id') || 'default';

// User Preferences & Settings (Stored in LocalStorage)
const userSettings = {
    language: 'th', // 'th' | 'en'
    callsign: 'ท่าน',
    userName: 'Ratthanan Chailit',
    voiceModel: 'th-TH-NiwatNeural',
    autoVocalize: true,
    theme: 'cyan', // 'cyan' | 'gold' | 'emerald' | 'purple'
    scanlines: false, // Clean Gemini dark aesthetic
};

// Multilingual Dictionary for HUD
const I18N = {
    th: {
        brandSub: 'J.A.R.V.I.S. <span class="version-tag">OS v10.4</span>',
        systemNominal: 'Pro',
        navDashboard: 'คลัง',
        navGoals: 'นักเรียนนักศึกษา',
        navChat: 'แชท',
        toggleSfx: 'เอฟเฟกต์',
        toggleVoice: 'เสียง AI',
        toggleConfig: 'ตั้งค่าระบบ',
        clockZone: 'ICT // เวลาประจำการ',
        telemetryDirectives: 'ยุทธการหลัก:',
        telemetryTodayOps: "ภารกิจวันนี้:",
        telemetryEfficiency: 'ประสิทธิภาพเตาปฏิกรณ์:',
        telemetryStreak: 'ความต่อเนื่องภารกิจ:',
        telemetryNeural: 'ระบบประมวลผล:',
        telemetryNeuralVal: 'GEMINI FLASH ออนไลน์',
        days: 'วัน',
        active: 'กำลังดำเนินการ',
        briefingBtn: 'โปรโตคอล: รายงานสรุปประจำวัน',
        statusScanBtn: 'สแกนสถานะยุทธการ',
        newDirectiveBtn: 'สร้างยุทธการใหม่',
        strategicAdviceBtn: 'คำแนะนำเชิงกลยุทธ์',
        statusScanPrompt: 'รายงานสถานะ Directives ปัจจุบันและความคืบหน้าครับ จาวิส',
        advicePrompt: 'ขอคำแนะนำเชิงยุทธศาสตร์เพื่อเพิ่มประสิทธิภาพการทำงานวันนี้ครับ',
        terminalPlaceholder: 'ถาม J.A.R.V.I.S.',
        transmitBtn: 'ส่งคำสั่ง',
        directivesPanelTag: '[ยุทธการหลัก]',
        directivesPanelTitle: 'ยุทธการเชิงกลยุทธ์',
        directivesExpandLink: 'ดูผังยุทธการทั้งหมด →',
        operationsPanelTag: '[ภารกิจวันนี้]',
        operationsPanelTitle: 'ปฏิบัติการประจำวัน',
        pendingBadge: 'ภารกิจคงค้าง',
        emptyDirectivesTitle: 'ยังไม่มีการกำหนดยุทธการหลัก',
        emptyDirectivesDesc: "สั่งการ J.A.R.V.I.S. หรือกด 'สร้างยุทธการใหม่' เพื่อเริ่มภารกิจแรก",
        emptyOpsTitle: 'ไม่มีภารกิจคงค้างสำหรับวันนี้',
        emptyOpsDesc: 'ทุกยุทธการพร้อมรับคำสั่งการใหม่จากท่านครับ',
        matrixPanelTag: '[ผังยุทธการ]',
        matrixTitle: 'ภาพรวมยุทธการเชิงกลยุทธ์ทั้งหมด',
        newDirectiveMatrixBtn: '+ เพิ่มยุทธการใหม่',
        matrixEfficiencyLabel: 'ดัชนีความสำเร็จ',
        matrixTasksLabel: 'ภารกิจปฏิบัติการ',
        commsChannelName: 'ช่องทางสื่อสารปลอดภัย // โปรโตคอล STARK-01',
        commsClearBtn: 'ล้างประวัติ',
        reactorStandby: 'สแตนด์บาย // พร้อมรับคำสั่ง',
        reactorClickMic: 'กดไมค์หรือพิมพ์คำสั่งเพื่อสั่งการ',
        reactorListening: 'กำลังรับฟัง // รับสัญญาณเสียง',
        reactorSpeakNow: 'ระบุคำสั่งการของท่านได้เลยครับ',
        reactorComputing: 'กำลังประมวลผล // วิเคราะห์ยุทธการ',
        reactorSimulation: 'กำลังจำลองระบบประสาทเทียม...',
        reactorSpeaking: 'กำลังอ่านออกเสียง // ตอบกลับด้วยเสียง AI',
        reactorVocalizing: 'J.A.R.V.I.S. กำลังตอบกลับคำสั่งการ',
        welcomeMsg: 'สวัสดีครับท่าน ผม J.A.R.V.I.S. ประจำการพร้อมสนับสนุนยุทธการและการวางแผนทั้งหมดของท่านครับ วันนี้มีภารกิจใดให้ผมรับใช้ครับ?',
        modalDirectiveTag: '[โปรโตคอลระบบ STARK]',
        modalDirectiveTitle: 'กำหนดยุทธการเชิงกลยุทธ์ใหม่',
        modalDirectiveTitleLabel: 'รหัสยุทธการ / ชื่อเป้าหมาย *',
        modalDirectiveTitlePh: 'เช่น ยุทธการยกระดับสุขภาพ 90 วัน, สอบใบรับรอง Cloud Architect',
        modalDirectiveDescLabel: 'รายละเอียดเชิงยุทธศาสตร์ / ผลลัพธ์ที่ต้องการ',
        modalDirectiveDescPh: 'ระบุเป้าหมาย ผลลัพธ์ที่ต้องการ และแนวทางปฏิบัติ...',
        modalDirectiveCatLabel: 'หมวดหมู่ภารกิจ',
        modalDirectiveDateLabel: 'วันที่เป้าหมายสำเร็จ',
        modalDirectiveCancel: 'ยกเลิก',
        modalDirectiveConfirm: 'ยืนยันยุทธการ',
        modalSettingsTag: '[STARK SYSTEM CONFIGURATION]',
        modalSettingsTitle: 'การตั้งค่าระบบและโปรโตคอล',
        modalSettingsLangSec: 'ทั่วไป (ภาษา & สรรพนาม)',
        modalSettingsLangSelect: 'ภาษาหน้าจอ (Interface Language)',
        modalSettingsCallsignSelect: 'สรรพนามเรียกขาน (AI Call Sign)',
        modalSettingsVoiceSec: 'เสียง AI & การพูด',
        modalSettingsVoiceModel: 'โมเดลเสียงพากย์สังเคราะห์ (Neural Voice)',
        modalSettingsAutoSpeech: 'พูดตอบกลับด้วยเสียง AI อัตโนมัติ',
        modalSettingsAutoSpeechSub: 'อ่านออกเสียงสังเคราะห์ทุกครั้งที่ J.A.R.V.I.S. ส่งข้อความตอบกลับ',
        modalSettingsThemeSec: 'ธีมและการแสดงผล',
        modalSettingsColorPalette: 'จานสีธีมหน้าจอ (Color Palette)',
        modalSettingsScanlines: 'เส้นสแกนตารางฮอโลแกรม (Hologram Scanlines)',
        modalSettingsDataSec: 'ข้อมูล & ความปลอดภัย',
        modalSettingsPurgeOps: 'ล้างภารกิจที่ทำเสร็จแล้ว',
        modalSettingsPurgeComms: 'ล้างประวัติการสื่อสารทั้งหมด',
        modalSettingsClose: 'ปิด',
        modalSettingsSave: 'บันทึกการตั้งค่า'
    },
    en: {
        brandSub: 'J.A.R.V.I.S. <span class="version-tag">OS v10.4</span>',
        systemNominal: 'Pro',
        navDashboard: 'Library',
        navGoals: 'Students',
        navChat: 'Chat',
        toggleSfx: 'SFX',
        toggleVoice: 'VOICE',
        toggleConfig: 'CONFIG',
        clockZone: 'ICT // STARK TIME',
        telemetryDirectives: 'DIRECTIVES:',
        telemetryTodayOps: "TODAY'S OPS:",
        telemetryEfficiency: 'ARC CORE EFFICIENCY:',
        telemetryStreak: 'STREAK PROTOCOL:',
        telemetryNeural: 'NEURAL ENGINE:',
        telemetryNeuralVal: 'GEMINI FLASH ONLINE',
        days: 'DAYS',
        active: 'ACTIVE',
        briefingBtn: 'PROTOCOL: DAILY BRIEFING',
        statusScanBtn: 'STATUS SCAN',
        newDirectiveBtn: 'NEW DIRECTIVE',
        strategicAdviceBtn: 'STRATEGIC ADVISORY',
        statusScanPrompt: 'Report current status of all active directives and tactical progress, Jarvis.',
        advicePrompt: 'Provide high-level strategic advisory to maximize operational output today, Jarvis.',
        terminalPlaceholder: 'Ask J.A.R.V.I.S.',
        transmitBtn: 'TRANSMIT',
        directivesPanelTag: '[DIRECTIVES]',
        directivesPanelTitle: 'STRATEGIC DIRECTIVES',
        directivesExpandLink: 'EXPAND MATRIX →',
        operationsPanelTag: '[OPERATIONS]',
        operationsPanelTitle: "TODAY'S TACTICAL OPS",
        pendingBadge: 'PENDING',
        emptyDirectivesTitle: 'NO ACTIVE DIRECTIVES INITIALIZED',
        emptyDirectivesDesc: "Transmit a directive to J.A.R.V.I.S. or click 'NEW DIRECTIVE' to begin.",
        emptyOpsTitle: 'NO IMMEDIATE OPERATIONS FOR TODAY',
        emptyOpsDesc: 'All systems standing by for your directive, Sir.',
        matrixPanelTag: '[MISSION MATRIX]',
        matrixTitle: 'STRATEGIC DIRECTIVES OVERVIEW',
        newDirectiveMatrixBtn: '+ INITIALIZE NEW DIRECTIVE',
        matrixEfficiencyLabel: 'TACTICAL EFFICIENCY',
        matrixTasksLabel: 'TACTICAL OPERATIONS',
        commsChannelName: 'SECURE NEURAL COMMS // PROTOCOL STARK-01',
        commsClearBtn: 'CLEAR LOG',
        reactorStandby: 'STANDBY // READY',
        reactorClickMic: 'CLICK MIC OR TRANSMIT COMMAND',
        reactorListening: 'LISTENING // AUDIO INPUT',
        reactorSpeakNow: 'SPEAK YOUR DIRECTIVE NOW, SIR',
        reactorComputing: 'COMPUTING // PROCESSING DIRECTIVE',
        reactorSimulation: 'RUNNING NEURAL SIMULATION...',
        reactorSpeaking: 'SPEAKING // NEURAL AUDIO',
        reactorVocalizing: 'J.A.R.V.I.S. VOCALIZING DIRECTIVE',
        welcomeMsg: 'Good day, Sir. J.A.R.V.I.S. online and standing by. How may I assist your directives today?',
        modalDirectiveTag: '[STARK SYSTEM PROTOCOL]',
        modalDirectiveTitle: 'INITIALIZE STRATEGIC DIRECTIVE',
        modalDirectiveTitleLabel: 'DIRECTIVE CODENAME / TITLE *',
        modalDirectiveTitlePh: 'e.g. 90-Day Athletic Reconditioning, AWS Solutions Architect',
        modalDirectiveDescLabel: 'STRATEGIC DESCRIPTION / OBJECTIVES',
        modalDirectiveDescPh: 'Specify goals, required milestones, and action items...',
        modalDirectiveCatLabel: 'CLASSIFICATION / CATEGORY',
        modalDirectiveDateLabel: 'TARGET COMPLETION DATE',
        modalDirectiveCancel: 'CANCEL',
        modalDirectiveConfirm: 'CONFIRM DIRECTIVE',
        modalSettingsTag: '[STARK SYSTEM CONFIGURATION]',
        modalSettingsTitle: 'System Settings & Protocols',
        modalSettingsLangSec: 'General (Language & Callsign)',
        modalSettingsLangSelect: 'Interface Language',
        modalSettingsCallsignSelect: 'AI Call Sign / Honorific',
        modalSettingsVoiceSec: 'Voice & Audio',
        modalSettingsVoiceModel: 'Neural Voice Synthesis',
        modalSettingsAutoSpeech: 'Auto-Speech Response',
        modalSettingsAutoSpeechSub: 'Automatically speak responses upon message delivery',
        modalSettingsThemeSec: 'Themes & Appearance',
        modalSettingsColorPalette: 'HUD Color Palette',
        modalSettingsScanlines: 'Hologram Scanlines & Grid Overlay',
        modalSettingsDataSec: 'Data & Privacy',
        modalSettingsPurgeOps: 'Purge Completed Ops',
        modalSettingsPurgeComms: 'Clear Communication Logs',
        modalSettingsClose: 'Close',
        modalSettingsSave: 'Save Settings'
    }
};

const CATEGORY_NAMES = {
    th: {
        health: 'สุขภาพและการฟิตร่างกาย',
        career: 'การงานและธุรกิจ',
        finance: 'การเงินและการลงทุน',
        education: 'ความรู้และทักษะ',
        personal: 'พัฒนาตนเอง',
    },
    en: {
        health: 'COMBAT & HEALTH',
        career: 'CAREER & VENTURE',
        finance: 'CAPITAL & WEALTH',
        education: 'KNOWLEDGE & INTEL',
        personal: 'PERSONAL PROTOCOL',
    }
};

const CATEGORY_ICONS = {
    health: '💪',
    career: '💼',
    finance: '💰',
    education: '📚',
    personal: '🌟',
};

const FREQ_LABELS = {
    th: {
        daily: 'ประจำวัน',
        weekly: 'ประจำสัปดาห์',
        'one-time': 'เฉพาะกิจ',
    },
    en: {
        daily: 'DAILY OP',
        weekly: 'WEEKLY OP',
        'one-time': 'TACTICAL',
    }
};

function getCategoryName(cat) {
    const lang = userSettings.language || 'th';
    const dict = CATEGORY_NAMES[lang] || CATEGORY_NAMES.th;
    return dict[cat] || cat;
}

function getFrequencyLabel(freq) {
    const lang = userSettings.language || 'th';
    const dict = FREQ_LABELS[lang] || FREQ_LABELS.th;
    return dict[freq] || freq;
}

// System Global State
let currentView = 'chat';
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
    } catch (e) {}
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

    // Dynamic Theme Color Mapping
    const themePalettes = {
        cyan: { primary: '#00f0ff', glow: 'rgba(0, 240, 255, 0.4)' },
        gold: { primary: '#ffaa00', glow: 'rgba(255, 170, 0, 0.45)' },
        emerald: { primary: '#00ff9d', glow: 'rgba(0, 255, 157, 0.45)' },
        purple: { primary: '#c044ff', glow: 'rgba(192, 68, 255, 0.45)' }
    };
    const activePalette = themePalettes[userSettings.theme] || themePalettes.cyan;

    let primaryColor = activePalette.primary;
    let glowColor = activePalette.glow;
    let speed = 0.015;

    if (isListening) {
        primaryColor = '#ffaa00';
        glowColor = 'rgba(255, 170, 0, 0.6)';
        speed = 0.04;
    } else if (isComputing) {
        primaryColor = '#ffffff';
        glowColor = 'rgba(255, 255, 255, 0.8)';
        speed = 0.07;
    } else if (isSpeaking) {
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

    // 4. Power Cells Ring (10 cells)
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

    // 7. Core Energy Reticle
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

// Click reactor to trigger briefing
canvas.addEventListener('click', () => {
    playBeep(1200, 0.05);
    runBriefingProtocol();
});

// ==================== SPEECH RECOGNITION & VOICE INPUT ENGINE ====================

let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;
let speechRecognizedText = '';
let silenceTimeout = null;

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    try {
        const sr = new SpeechRecognition();
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = userSettings.language === 'en' ? 'en-US' : 'th-TH';

        sr.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            const currentText = (final + ' ' + interim).trim();
            if (currentText) {
                speechRecognizedText = currentText;
                const cmdInput = document.getElementById('hud-command-input');
                if (cmdInput) cmdInput.value = currentText;

                // Reset auto-send silence timer (send after 2.5s of silence after speaking)
                clearTimeout(silenceTimeout);
                silenceTimeout = setTimeout(() => {
                    if (isListening && speechRecognizedText.trim()) {
                        stopVoiceInput(true);
                    }
                }, 2500);
            }
        };

        sr.onerror = (event) => {
            console.warn('[SpeechRecognition] error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                showMicErrorToast('⚠️ กรุณากดอนุญาต (Allow) การใช้งานไมโครโฟนบนเบราว์เซอร์ เพื่อใช้งานระบบสั่งการด้วยเสียงครับ');
                stopVoiceInput(false);
            }
            // For network or no-speech errors, we rely on the parallel MediaRecorder + backend STT!
        };

        sr.onend = () => {
            if (isListening && !speechRecognizedText) {
                try { sr.start(); } catch (e) {}
            }
        };

        return sr;
    } catch (e) {
        console.warn('Failed to initialize SpeechRecognition:', e);
        return null;
    }
}

async function toggleVoiceInput() {
    initAudioContext();
    if (isListening) {
        // User clicked again to STOP and TRANSMIT
        await stopVoiceInput(true);
    } else {
        // Start listening
        await startVoiceInput();
    }
}

async function startVoiceInput() {
    speechRecognizedText = '';
    audioChunks = [];
    clearTimeout(silenceTimeout);

    const input = document.getElementById('hud-command-input');
    const micBtn = document.getElementById('btn-mic');
    const t = I18N[userSettings.language] || I18N.th;

    // 1. Request microphone access
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia is not supported on this browser context');
        }
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        console.error('Microphone access failed:', err);
        showMicErrorToast(
            userSettings.language === 'en'
                ? '⚠️ Microphone access denied or unavailable. Please grant microphone permission in your browser URL bar.'
                : '⚠️ ไม่สามารถเข้าถึงไมโครโฟนได้: กรุณากดอนุญาต (Allow) ไมโครโฟนที่แถบ URL ของเบราว์เซอร์ครับ'
        );
        return;
    }

    // 2. Set UI Listening State
    isListening = true;
    if (micBtn) {
        micBtn.classList.add('listening');
        micBtn.title = 'กำลังฟัง... คลิกอีกครั้งเพื่อส่งคำสั่ง (Click to Transmit)';
    }
    if (input) {
        input.placeholder = userSettings.language === 'en'
            ? '🎙️ Listening... (Speak now, click mic again to send)'
            : '🎙️ กำลังฟังเสียงของคุณ... (พูดแล้วคลิกไมค์อีกครั้งเพื่อส่งทันที)';
    }
    setReactorState(t.reactorListening, 'RECORDING AUDIO');
    playBeep(1000, 0.12);

    // 3. Start MediaRecorder (local audio capture for backend AI STT fallback)
    try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');

        mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };
        mediaRecorder.start(250); // collect 250ms chunks
    } catch (recErr) {
        console.warn('MediaRecorder init failed:', recErr);
        mediaRecorder = null;
    }

    // 4. Start Web Speech Recognition in parallel (for live typing feedback)
    if (!recognition) {
        recognition = setupSpeechRecognition();
    }
    if (recognition) {
        try {
            recognition.lang = userSettings.language === 'en' ? 'en-US' : 'th-TH';
            recognition.start();
        } catch (e) {
            console.warn('SpeechRecognition start failed:', e);
        }
    }
}

async function stopVoiceInput(autoSubmit = true) {
    if (!isListening) return;
    isListening = false;
    clearTimeout(silenceTimeout);

    const micBtn = document.getElementById('btn-mic');
    if (micBtn) {
        micBtn.classList.remove('listening');
        micBtn.title = 'สั่งการด้วยเสียง (Voice Command)';
    }

    const t = I18N[userSettings.language] || I18N.th;
    setReactorState(t.reactorStandby, t.reactorClickMic);

    // Stop Web Speech API
    if (recognition) {
        try { recognition.stop(); } catch (e) {}
    }

    // Stop MediaRecorder
    let audioBlob = null;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        const recorderStopPromise = new Promise((resolve) => {
            mediaRecorder.onstop = () => {
                const mime = mediaRecorder.mimeType || 'audio/webm';
                audioBlob = new Blob(audioChunks, { type: mime });
                resolve(audioBlob);
            };
        });
        mediaRecorder.stop();
        await recorderStopPromise;
    }

    // Stop media stream tracks to turn off hardware mic light
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    const input = document.getElementById('hud-command-input');
    if (input) {
        input.placeholder = t.hudInputPlaceholder || 'ป้อนคำสั่งหรือสอบถาม J.A.R.V.I.S....';
    }

    // Determine final transcript
    let finalSpeech = speechRecognizedText.trim();

    // If browser speech recognition failed to produce text, use backend AI STT (Gemini / Groq Whisper)
    if (!finalSpeech && audioBlob && audioBlob.size > 2000) {
        setReactorState(t.reactorComputing, 'TRANSCRIBING SPEECH...');
        showSttProgress(true);
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'command.webm');
            const res = await fetch(API.stt, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success' && data.transcript) {
                finalSpeech = data.transcript.trim();
            }
        } catch (sttErr) {
            console.error('Backend STT failed:', sttErr);
        } finally {
            showSttProgress(false);
            setReactorState(t.reactorStandby, t.reactorClickMic);
        }
    }

    if (finalSpeech) {
        if (input) input.value = finalSpeech;
        playConfirmChime();
        if (autoSubmit) {
            submitCommand();
        }
    } else if (autoSubmit) {
        showMicErrorToast('⚠️ ไม่พบเสียงพูดที่ชัดเจน กรุณาลองใหม่อีกครั้งครับ');
    }
}

function showMicErrorToast(msg) {
    appendCommsEntry('system', msg);
    playBeep(400, 0.2);
}

function showSttProgress(loading) {
    const input = document.getElementById('hud-command-input');
    if (!input) return;
    if (loading) {
        input.value = '⚡ กำลังแปลงเสียงพูดเป็นข้อความผ่าน AI (Speech-to-Text)...';
    }
}

// ==================== SPEECH SYNTHESIS (VOICE OUTPUT) ====================

const audioElement = document.getElementById('jarvis-audio-player');

async function speakJarvis(text) {
    if (!voiceEnabled || !text || userSettings.autoVocalize === false) return;

    try {
        initAudioContext();
        const t = I18N[userSettings.language] || I18N.th;
        setReactorState(t.reactorSpeaking, t.reactorVocalizing);
        isSpeaking = true;

        const voiceModel = userSettings.voiceModel || (userSettings.language === 'en' ? 'en-GB-RyanNeural' : 'th-TH-NiwatNeural');

        // Call backend high-fidelity Edge-TTS Neural Voice
        const res = await fetch(API.tts, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, voice: voiceModel })
        });

        if (res.ok) {
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            audioElement.src = audioUrl;

            // Connect to Web Audio Analyser if not connected
            if (audioCtx && !audioSourceNode) {
                try {
                    audioSourceNode = audioCtx.createMediaElementSource(audioElement);
                    audioSourceNode.connect(audioAnalyser);
                } catch (e) {}
            }

            audioElement.onended = () => {
                isSpeaking = false;
                setReactorState(t.reactorStandby, t.systemNominal);
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
        console.warn('Backend TTS failed, using browser fallback:', err);
        fallbackSpeechSynthesis(text);
    }
}

function fallbackSpeechSynthesis(text) {
    if (!('speechSynthesis' in window)) {
        isSpeaking = false;
        const t = I18N[userSettings.language] || I18N.th;
        setReactorState(t.reactorStandby, 'READY');
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = userSettings.language === 'en' ? 'en-GB' : 'th-TH';
    utterance.rate = 1.02;
    utterance.pitch = 0.95;

    utterance.onstart = () => {
        isSpeaking = true;
    };

    utterance.onend = () => {
        isSpeaking = false;
        const t = I18N[userSettings.language] || I18N.th;
        setReactorState(t.reactorStandby, t.systemNominal);
    };

    utterance.onerror = () => {
        isSpeaking = false;
        const t = I18N[userSettings.language] || I18N.th;
        setReactorState(t.reactorStandby, 'READY');
    };

    window.speechSynthesis.speak(utterance);
}

function setReactorState(title, subtitle) {
    const titleEl = document.getElementById('reactor-state-text');
    const subEl = document.getElementById('reactor-sub-text');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
}

// ==================== SETTINGS & I18N ENGINE ====================

function loadSettingsFromStorage() {
    try {
        const stored = localStorage.getItem('stark_hud_settings');
        if (stored) {
            Object.assign(userSettings, JSON.parse(stored));
        }
    } catch (e) {}
    applySettingsToDOM();
}

function applySettingsToDOM() {
    // 1. Theme
    document.body.setAttribute('data-theme', userSettings.theme || 'cyan');
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === userSettings.theme);
    });

    // 2. Scanlines
    toggleScanlines(userSettings.scanlines !== false);
    const scanlineCheckbox = document.getElementById('setting-scanlines');
    if (scanlineCheckbox) scanlineCheckbox.checked = userSettings.scanlines !== false;

    // 3. Settings controls
    const langSelect = document.getElementById('setting-lang');
    if (langSelect) langSelect.value = userSettings.language || 'th';

    const callsignSelect = document.getElementById('setting-callsign');
    if (callsignSelect) callsignSelect.value = userSettings.callsign || 'ท่าน';

    const voiceSelect = document.getElementById('setting-voice-model');
    if (voiceSelect) voiceSelect.value = userSettings.voiceModel || (userSettings.language === 'en' ? 'en-GB-RyanNeural' : 'th-TH-NiwatNeural');

    const autoVocalize = document.getElementById('setting-auto-vocalize');
    if (autoVocalize) autoVocalize.checked = userSettings.autoVocalize !== false;

    // 4. Update UI Language labels
    updateUILanguage(userSettings.language || 'th');

    // 5. Update Sidebar user profile
    const sidebarUser = document.getElementById('sidebar-user-callsign');
    if (sidebarUser) sidebarUser.textContent = userSettings.userName || 'Ratthanan Chailit';
    const statusText = document.getElementById('system-status-text');
    if (statusText) statusText.textContent = 'Pro';

    // 6. Restore sidebar state (Default: collapsed 68px rail)
    try {
        const isExpanded = localStorage.getItem('jarvis_sidebar_collapsed') === 'false';
        const container = document.getElementById('app-container');
        if (container) {
            if (isExpanded) {
                container.classList.remove('sidebar-collapsed');
                container.classList.add('sidebar-expanded');
            } else {
                container.classList.add('sidebar-collapsed');
                container.classList.remove('sidebar-expanded');
            }
        }
    } catch (e) {}
}

function updateUILanguage(lang) {
    const t = I18N[lang] || I18N.th;

    // 1. Navigation
    const navDash = document.querySelector('#nav-dashboard .nav-label');
    if (navDash) navDash.textContent = t.navDashboard;

    const navGoals = document.querySelector('#nav-goals .nav-label');
    if (navGoals) navGoals.textContent = t.navGoals;

    const navChat = document.querySelector('#nav-chat .nav-label');
    if (navChat) navChat.textContent = t.navChat;

    // Brand titles (Always J.A.R.V.I.S.)
    const drawerBrand = document.getElementById('lbl-drawer-brand');
    if (drawerBrand) drawerBrand.textContent = 'J.A.R.V.I.S.';
    const topbarBrand = document.getElementById('lbl-topbar-brand');
    if (topbarBrand) topbarBrand.textContent = 'J.A.R.V.I.S.';

    // 2. System Status Badge
    const statusText = document.getElementById('system-status-text');
    if (statusText) statusText.textContent = t.systemNominal;

    const systemBadge = document.getElementById('system-badge');
    if (systemBadge) systemBadge.title = lang === 'en' ? 'All Systems Nominal' : 'สถานะระบบปกติ';

    // 3. Controls & Clock
    const sfxBtnText = document.querySelector('#btn-toggle-sfx .toggle-text');
    if (sfxBtnText) sfxBtnText.textContent = t.toggleSfx;
    document.getElementById('btn-toggle-sfx')?.removeAttribute('title');

    const voiceBtnText = document.querySelector('#btn-toggle-voice .toggle-text');
    if (voiceBtnText) voiceBtnText.textContent = t.toggleVoice;
    document.getElementById('btn-toggle-voice')?.removeAttribute('title');

    const configBtnText = document.querySelector('#btn-open-settings .toggle-text');
    if (configBtnText) configBtnText.textContent = t.toggleConfig;
    document.getElementById('btn-open-settings')?.removeAttribute('title');

    const clockZone = document.querySelector('.clock-display .time-zone');
    if (clockZone) clockZone.textContent = t.clockZone;

    // 4. Telemetry Bar Labels
    const lblTDirectives = document.getElementById('lbl-t-directives');
    if (lblTDirectives) lblTDirectives.textContent = t.telemetryDirectives;

    const lblTTodayOps = document.getElementById('lbl-t-today-ops');
    if (lblTTodayOps) lblTTodayOps.textContent = t.telemetryTodayOps;

    const lblTEfficiency = document.getElementById('lbl-t-efficiency');
    if (lblTEfficiency) lblTEfficiency.textContent = t.telemetryEfficiency;

    const lblTStreak = document.getElementById('lbl-t-streak');
    if (lblTStreak) lblTStreak.textContent = t.telemetryStreak;

    const lblTNeural = document.getElementById('lbl-t-neural');
    if (lblTNeural) lblTNeural.textContent = t.telemetryNeural;

    const valTNeural = document.getElementById('t-neural');
    if (valTNeural) valTNeural.textContent = lang === 'en' ? 'GEMINI-FLASH ACTIVE' : 'GEMINI-FLASH พร้อมใช้งาน';

    // 5. Quick Protocol Chips
    const briefingChip = document.querySelector('#btn-protocol-briefing .chip-text');
    if (briefingChip) briefingChip.textContent = t.briefingBtn;

    const scanChip = document.getElementById('chip-scan-text');
    if (scanChip) scanChip.textContent = t.statusScanBtn;

    const newDirectiveChip = document.getElementById('chip-new-text');
    if (newDirectiveChip) newDirectiveChip.textContent = t.newDirectiveBtn;

    const adviceChip = document.getElementById('chip-advice-text');
    if (adviceChip) adviceChip.textContent = t.strategicAdviceBtn;

    // 6. Command Input & Transmit Button
    const micBtn = document.getElementById('btn-mic');
    if (micBtn) micBtn.title = lang === 'en' ? 'Speech Recognition Transmission' : 'กดเพื่อสั่งงานด้วยเสียง (Speech Input)';

    const commandInput = document.getElementById('hud-command-input');
    if (commandInput) commandInput.placeholder = t.terminalPlaceholder;

    const transmitBtnText = document.getElementById('lbl-btn-transmit') || document.querySelector('#btn-transmit span');
    if (transmitBtnText) transmitBtnText.textContent = t.transmitBtn;

    // 7. Dashboard Panels
    const panelDirectivesTag = document.getElementById('lbl-panel-directives-tag');
    if (panelDirectivesTag) panelDirectivesTag.textContent = t.directivesPanelTag;

    const panelDirectivesTitle = document.getElementById('lbl-panel-directives-title') || document.querySelector('#panel-directives h2');
    if (panelDirectivesTitle) panelDirectivesTitle.textContent = t.directivesPanelTitle;

    const expandLink = document.getElementById('lbl-panel-directives-link');
    if (expandLink) expandLink.textContent = t.directivesExpandLink;

    const panelOpsTag = document.getElementById('lbl-panel-ops-tag');
    if (panelOpsTag) panelOpsTag.textContent = t.operationsPanelTag;

    const panelOpsTitle = document.getElementById('lbl-panel-ops-title') || document.querySelector('#panel-operations h2');
    if (panelOpsTitle) panelOpsTitle.textContent = t.operationsPanelTitle;

    // Empty state update if present
    const emptyDirectivesTitle = document.querySelector('#panel-directives .empty-title');
    if (emptyDirectivesTitle) emptyDirectivesTitle.textContent = t.emptyDirectivesTitle;
    const emptyDirectivesDesc = document.querySelector('#panel-directives .empty-desc');
    if (emptyDirectivesDesc) emptyDirectivesDesc.textContent = t.emptyDirectivesDesc;

    const emptyOpsTitle = document.querySelector('#panel-operations .empty-title');
    if (emptyOpsTitle) emptyOpsTitle.textContent = t.emptyOpsTitle;
    const emptyOpsDesc = document.querySelector('#panel-operations .empty-desc');
    if (emptyOpsDesc) emptyOpsDesc.textContent = t.emptyOpsDesc;

    // 8. Directives Matrix (Tab 2)
    const matrixTag = document.getElementById('lbl-matrix-tag');
    if (matrixTag) matrixTag.textContent = t.matrixPanelTag;

    const matrixHeaderTitle = document.getElementById('lbl-matrix-title');
    if (matrixHeaderTitle) matrixHeaderTitle.textContent = t.matrixTitle;

    const btnMatrixNew = document.getElementById('lbl-btn-matrix-new');
    if (btnMatrixNew) btnMatrixNew.textContent = t.newDirectiveMatrixBtn;

    // 9. Comms Log (Tab 3)
    const commsChannel = document.getElementById('lbl-comms-channel');
    if (commsChannel) commsChannel.textContent = t.commsChannelName;

    const commsClearBtn = document.getElementById('lbl-btn-comms-clear');
    if (commsClearBtn) commsClearBtn.textContent = t.commsClearBtn;

    // 10. Reactor Standby State
    if (!isListening && !isComputing && !isSpeaking) {
        setReactorState(t.reactorStandby, t.reactorClickMic);
    }

    // 11. Modal: New Directive
    const lblModalDirectiveTag = document.getElementById('lbl-modal-directive-tag');
    if (lblModalDirectiveTag) lblModalDirectiveTag.textContent = t.modalDirectiveTag;

    const lblModalDirectiveTitle = document.getElementById('lbl-modal-directive-title');
    if (lblModalDirectiveTitle) lblModalDirectiveTitle.textContent = t.modalDirectiveTitle;

    const lblModalGoalTitle = document.getElementById('lbl-modal-goal-title');
    if (lblModalGoalTitle) lblModalGoalTitle.textContent = t.modalDirectiveTitleLabel;

    const goalTitleInput = document.getElementById('goal-title');
    if (goalTitleInput) goalTitleInput.placeholder = t.modalDirectiveTitlePh;

    const lblModalGoalDesc = document.getElementById('lbl-modal-goal-desc');
    if (lblModalGoalDesc) lblModalGoalDesc.textContent = t.modalDirectiveDescLabel;

    const goalDescInput = document.getElementById('goal-desc');
    if (goalDescInput) goalDescInput.placeholder = t.modalDirectiveDescPh;

    const lblModalGoalCategory = document.getElementById('lbl-modal-goal-category');
    if (lblModalGoalCategory) lblModalGoalCategory.textContent = t.modalDirectiveCatLabel;

    const catSelect = document.getElementById('goal-category');
    if (catSelect) {
        const curCat = catSelect.value;
        catSelect.innerHTML = lang === 'en' ? `
            <option value="career">💼 CAREER & VENTURE</option>
            <option value="health">💪 PHYSICAL & COMBAT READY</option>
            <option value="finance">💰 CAPITAL & WEALTH</option>
            <option value="education">📚 KNOWLEDGE & INTEL</option>
            <option value="personal">🌟 PERSONAL PROTOCOL</option>
        ` : `
            <option value="career">💼 การงานและธุรกิจ</option>
            <option value="health">💪 สุขภาพและการฟิตร่างกาย</option>
            <option value="finance">💰 การเงินและการลงทุน</option>
            <option value="education">📚 ความรู้และทักษะ</option>
            <option value="personal">🌟 พัฒนาตนเอง</option>
        `;
        if (curCat) catSelect.value = curCat;
    }

    const lblModalGoalDate = document.getElementById('lbl-modal-goal-date');
    if (lblModalGoalDate) lblModalGoalDate.textContent = t.modalDirectiveDateLabel;

    const btnModalGoalCancel = document.getElementById('btn-modal-goal-cancel');
    if (btnModalGoalCancel) btnModalGoalCancel.textContent = t.modalDirectiveCancel;

    const btnModalGoalConfirm = document.getElementById('btn-modal-goal-confirm');
    if (btnModalGoalConfirm) btnModalGoalConfirm.textContent = t.modalDirectiveConfirm;

    // 12. Modal: Settings
    const lblSettingsTag = document.getElementById('lbl-settings-tag');
    if (lblSettingsTag) lblSettingsTag.textContent = t.modalSettingsTag;

    const settingsTitleText = document.getElementById('settings-title-text');
    if (settingsTitleText) settingsTitleText.textContent = t.modalSettingsTitle;

    const lblLangSec = document.getElementById('label-lang-sec');
    if (lblLangSec) lblLangSec.textContent = t.modalSettingsLangSec;

    const lblLangSelect = document.getElementById('label-lang-select');
    if (lblLangSelect) lblLangSelect.textContent = t.modalSettingsLangSelect;

    const lblCallsignSelect = document.getElementById('label-callsign-select');
    if (lblCallsignSelect) lblCallsignSelect.textContent = t.modalSettingsCallsignSelect;

    const callsignSelect = document.getElementById('setting-callsign');
    if (callsignSelect) {
        const curCallsign = callsignSelect.value;
        callsignSelect.innerHTML = lang === 'en' ? `
            <option value="Sir">Sir (British Formal)</option>
            <option value="Tony">Tony (Stark Direct)</option>
            <option value="Boss">Boss (Executive)</option>
            <option value="ท่าน">ท่าน (Sir - Thai)</option>
        ` : `
            <option value="ท่าน">ท่าน (Sir - ค่าเริ่มต้น)</option>
            <option value="Sir">Sir (อังกฤษทางการ)</option>
            <option value="บอส">บอส (Boss)</option>
            <option value="นายท่าน">นายท่าน (Master)</option>
            <option value="Tony">Tony (Stark Direct)</option>
        `;
        if (curCallsign) callsignSelect.value = curCallsign;
    }

    const lblVoiceSec = document.getElementById('label-voice-sec');
    if (lblVoiceSec) lblVoiceSec.textContent = t.modalSettingsVoiceSec;

    const lblVoiceModel = document.getElementById('label-voice-model');
    if (lblVoiceModel) lblVoiceModel.textContent = t.modalSettingsVoiceModel;

    const voiceSelect = document.getElementById('setting-voice-model');
    if (voiceSelect) {
        const curVoice = voiceSelect.value;
        voiceSelect.innerHTML = lang === 'en' ? `
            <option value="en-GB-RyanNeural">en-GB Ryan Neural (English Butler - Paul Bettany style)</option>
            <option value="en-GB-ThomasNeural">en-GB Thomas Neural (English Formal Male)</option>
            <option value="th-TH-NiwatNeural">th-TH Niwat Neural (Thai Male - Calm & Deep)</option>
            <option value="th-TH-PremwadeeNeural">th-TH Premwadee Neural (Thai Female - Clear & Polite)</option>
        ` : `
            <option value="th-TH-NiwatNeural">th-TH Niwat Neural (ชาย - สุขุม นุ่มลึก)</option>
            <option value="th-TH-PremwadeeNeural">th-TH Premwadee Neural (หญิง - สุภาพ ชัดเจน)</option>
            <option value="en-GB-RyanNeural">en-GB Ryan Neural (English Butler - สไตล์พอล เบ็ตตานีย์)</option>
            <option value="en-GB-ThomasNeural">en-GB Thomas Neural (English Formal Male)</option>
        `;
        if (curVoice) voiceSelect.value = curVoice;
    }

    const lblAutoSpeech = document.getElementById('label-auto-speech');
    if (lblAutoSpeech) lblAutoSpeech.textContent = t.modalSettingsAutoSpeech;

    const lblAutoVocalizeSub = document.getElementById('label-auto-vocalize-sub');
    if (lblAutoVocalizeSub) lblAutoVocalizeSub.textContent = t.modalSettingsAutoSpeechSub;

    const lblThemeSec = document.getElementById('label-theme-sec');
    if (lblThemeSec) lblThemeSec.textContent = t.modalSettingsThemeSec;

    const lblColorPalette = document.getElementById('label-color-palette');
    if (lblColorPalette) lblColorPalette.textContent = t.modalSettingsColorPalette;

    const lblScanlinesSub = document.getElementById('label-scanlines-sub');
    if (lblScanlinesSub) lblScanlinesSub.textContent = t.modalSettingsScanlines;

    const lblDataSec = document.getElementById('label-data-sec');
    if (lblDataSec) lblDataSec.textContent = t.modalSettingsDataSec;

    const btnPurgeOps = document.getElementById('btn-purge-ops');
    if (btnPurgeOps) btnPurgeOps.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:6px;"><path d="M18 3l3 3-10 10H8v-3L18 3z"></path><path d="M3 21h18"></path></svg><span>${t.modalSettingsPurgeOps}</span>`;

    const btnPurgeComms = document.getElementById('btn-purge-comms');
    if (btnPurgeComms) btnPurgeComms.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:6px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg><span>${t.modalSettingsPurgeComms}</span>`;

    const btnSettingsCancel = document.getElementById('btn-settings-cancel');
    if (btnSettingsCancel) btnSettingsCancel.textContent = t.modalSettingsClose;

    const btnSettingsSave = document.getElementById('btn-settings-save');
    if (btnSettingsSave) btnSettingsSave.textContent = t.modalSettingsSave;
}

function switchSettingsTab(tabName) {
    document.querySelectorAll('.gemini-settings-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.gemini-settings-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `pane-settings-${tabName}`);
    });
}

function openSettingsModal(defaultTab = 'general') {
    playBeep(1100, 0.05);
    applySettingsToDOM();
    loadApiKeysSettings();
    switchSettingsTab(defaultTab);
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettingsModal() {
    playBeep(700, 0.05);
    document.getElementById('settings-modal').style.display = 'none';
}

function saveSettings() {
    userSettings.language = document.getElementById('setting-lang').value;
    userSettings.callsign = document.getElementById('setting-callsign').value;
    userSettings.voiceModel = document.getElementById('setting-voice-model').value;
    userSettings.autoVocalize = document.getElementById('setting-auto-vocalize').checked;
    userSettings.scanlines = document.getElementById('setting-scanlines').checked;

    try {
        localStorage.setItem('stark_hud_settings', JSON.stringify(userSettings));
    } catch (e) {}

    // Save API keys if entered
    const groqKeyInput = document.getElementById('setting-groq-key')?.value.trim();
    const geminiKeyInput = document.getElementById('setting-gemini-key')?.value.trim();
    if (groqKeyInput || geminiKeyInput) {
        fetch('/api/settings/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groq_api_key: groqKeyInput || null,
                gemini_api_key: geminiKeyInput || null
            })
        }).then(() => {
            const inputG = document.getElementById('setting-groq-key');
            if (inputG) inputG.value = '';
            const inputGem = document.getElementById('setting-gemini-key');
            if (inputGem) inputGem.value = '';
            loadApiKeysSettings();
            loadAvailableModels();
        });
    }

    playConfirmChime();
    closeSettingsModal();
    applySettingsToDOM();
    loadDashboard();
    loadGoals();
    loadTelemetry();

    const confirmMsg = userSettings.language === 'en'
        ? `Configuration calibrated, ${userSettings.callsign || 'Sir'}. All subsystems synchronized.`
        : `บันทึกการตั้งค่าระบบเรียบร้อยแล้วครับ${userSettings.callsign || 'ท่าน'}`;
    
    speakJarvis(confirmMsg);
}

function onSettingLanguageChange() {
    const lang = document.getElementById('setting-lang').value;
    const callsignSelect = document.getElementById('setting-callsign');
    const voiceSelect = document.getElementById('setting-voice-model');

    if (lang === 'en') {
        if (callsignSelect) callsignSelect.value = 'Sir';
        if (voiceSelect) voiceSelect.value = 'en-GB-RyanNeural';
    } else {
        if (callsignSelect) callsignSelect.value = 'ท่าน';
        if (voiceSelect) voiceSelect.value = 'th-TH-NiwatNeural';
    }

    userSettings.language = lang;
    updateUILanguage(lang);
    loadTelemetry();
    if (currentView === 'dashboard') loadDashboard();
    if (currentView === 'goals') loadGoals();
}

function setHUDTheme(theme) {
    userSettings.theme = theme;
    document.body.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    playBeep(1400, 0.05);
    try {
        localStorage.setItem('stark_hud_settings', JSON.stringify(userSettings));
    } catch (e) {}
}

function toggleScanlines(enabled) {
    const scanlineEl = document.querySelector('.hud-scanlines');
    if (scanlineEl) {
        scanlineEl.style.display = enabled ? 'block' : 'none';
    }
}

async function purgeCompletedOps() {
    const confirmPrompt = userSettings.language === 'en'
        ? 'Purge all completed tactical operations, Sir?'
        : 'ยืนยันการล้างภารกิจที่ทำเสร็จแล้วใช่หรือไม่ครับท่าน?';
    if (!confirm(confirmPrompt)) return;

    try {
        playBeep(400, 0.1);
        await fetch('/api/tasks/completed', { method: 'DELETE' });
        loadDashboard();
        loadGoals();
        loadTelemetry();
        playConfirmChime();
        const msg = userSettings.language === 'en' ? 'Completed operations purged, Sir.' : 'ล้างภารกิจที่เสร็จแล้วเรียบร้อยครับท่าน';
        speakJarvis(msg);
    } catch (e) {}
}

async function purgeChatComms() {
    const confirmPrompt = userSettings.language === 'en'
        ? 'Clear communication log for this conversation, Sir?'
        : 'ยืนยันการล้างประวัติการสื่อสารในห้องนี้ใช่หรือไม่ครับท่าน?';
    if (!confirm(confirmPrompt)) return;

    try {
        playBeep(400, 0.1);
        await fetch(`/api/chat/history?session_id=${encodeURIComponent(currentSessionId || 'default')}`, { method: 'DELETE' });
        loadChatHistory(currentSessionId);
        loadChatSessions();
        playConfirmChime();
        const msg = userSettings.language === 'en' ? 'Communication log purged, Sir.' : 'ล้างประวัติการสื่อสารเรียบร้อยครับท่าน';
        speakJarvis(msg);
    } catch (e) {}
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    loadSettingsFromStorage();
    setupNavigation();
    setupCommandInput();
    setupControls();
    setupSpeechRecognition();
    
    updateClock();
    setInterval(updateClock, 1000);

    loadDashboard();
    loadTelemetry();
    loadChatSessions();
    loadChatHistory();
    setInterval(loadTelemetry, 5000);

    // Load available AI models & API Keys
    loadAvailableModels();
    loadApiKeysSettings();

    // Audio context initialization on click
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

    sfxBtn?.addEventListener('click', () => {
        sfxEnabled = !sfxEnabled;
        sfxBtn.classList.toggle('active', sfxEnabled);
        if (sfxEnabled) playBeep(1200, 0.05);
    });

    voiceBtn?.addEventListener('click', () => {
        voiceEnabled = !voiceEnabled;
        voiceBtn.classList.toggle('active', voiceEnabled);
        if (!voiceEnabled && isSpeaking) {
            audioElement.pause();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            isSpeaking = false;
            const t = I18N[userSettings.language] || I18N.th;
            setReactorState(t.reactorStandby, userSettings.language === 'en' ? 'VOICE MODULE MUTED' : 'ปิดระบบเสียงตอบกลับแล้ว');
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

    // Auto-collapse sidebar on view change if expanded
    if (typeof collapseSidebar === 'function') {
        collapseSidebar();
    }

    document.querySelectorAll('.hud-nav-btn, .gemini-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    document.querySelectorAll('.hud-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    // Synchronize Gemini segmented tabs (แชท / งาน)
    const segChat = document.getElementById('seg-pill-chat');
    const segWork = document.getElementById('seg-pill-work');
    if (segChat) segChat.classList.toggle('active', viewName === 'chat');
    if (segWork) segWork.classList.toggle('active', viewName === 'dashboard' || viewName === 'goals');

    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'goals') loadGoals();
    if (viewName === 'chat') {
        document.getElementById('chat-dot')?.style.setProperty('display', 'none');
        scrollChatToBottom();
        document.getElementById('hud-command-input')?.focus();
    }
}

// ==================== TELEMETRY ====================

async function loadTelemetry() {
    try {
        const res = await fetch(API.telemetry);
        const data = await res.json();
        const t = I18N[userSettings.language] || I18N.th;

        const directivesEl = document.getElementById('t-directives');
        if (directivesEl) directivesEl.textContent = `${data.active_directives} ${t.active}`;

        const opsEl = document.getElementById('t-today-ops');
        if (opsEl) opsEl.textContent = `${data.tactical_ops_completed} / ${data.tactical_ops_total}`;

        const effEl = document.getElementById('t-efficiency');
        if (effEl) effEl.textContent = `${data.core_efficiency}%`;

        const effBar = document.getElementById('t-efficiency-bar');
        if (effBar) effBar.style.width = `${data.core_efficiency}%`;

        const streakEl = document.getElementById('t-streak');
        if (streakEl) streakEl.textContent = `${data.streak_days} ${t.days}`;

        const neuralEl = document.getElementById('t-neural');
        if (neuralEl) {
            neuralEl.textContent = userSettings.language === 'en' ? data.neural_link : 'GEMINI-FLASH พร้อมใช้งาน';
        }
    } catch (e) {}
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
    const t = I18N[userSettings.language] || I18N.th;

    // Update sidebar directives list
    const sidebarList = document.getElementById('sidebar-directives-list');
    const sidebarCount = document.getElementById('sidebar-directives-count');
    if (sidebarCount) sidebarCount.textContent = goals ? goals.length : '0';
    if (sidebarList) {
        if (!goals || goals.length === 0) {
            sidebarList.innerHTML = `<div class="sidebar-empty-hint">${userSettings.language === 'en' ? 'No active directives' : 'ยังไม่มีรายการยุทธการ'}</div>`;
        } else {
            sidebarList.innerHTML = goals.slice(0, 8).map(g => `
                <div class="sidebar-directive-pill" onclick="switchView('goals')">
                    <div class="sidebar-directive-pill-title">${escapeHtml(g.title)}</div>
                    <div class="sidebar-directive-pill-meta">
                        <span>${getCategoryName(g.category)}</span>
                        <span style="color:var(--accent-primary)">${g.progress}%</span>
                    </div>
                </div>
            `).join('');
        }
    }

    if (!goals || goals.length === 0) {
        container.innerHTML = `
            <div class="hud-empty-state">
                <div class="empty-reticle"></div>
                <p class="empty-title">${t.emptyDirectivesTitle}</p>
                <p class="empty-desc">${t.emptyDirectivesDesc}</p>
            </div>`;
        return;
    }

    const opsUnit = userSettings.language === 'en' ? 'OPS' : 'ภารกิจ';
    container.innerHTML = goals.map(goal => `
        <div class="hud-directive-item" onclick="switchView('goals')">
            <div class="directive-icon">${CATEGORY_ICONS[goal.category] || '🎯'}</div>
            <div class="directive-meta">
                <div class="directive-title">${escapeHtml(goal.title)}</div>
                <div class="directive-sub">${goal.tasks.length} ${opsUnit} // ${getCategoryName(goal.category)}</div>
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
    const t = I18N[userSettings.language] || I18N.th;
    
    const pendingCount = tasks ? tasks.filter(task => !task.is_completed).length : 0;
    if (badge) badge.textContent = `${pendingCount} ${t.pendingBadge}`;

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="hud-empty-state">
                <div class="empty-reticle"></div>
                <p class="empty-title">${t.emptyOpsTitle}</p>
                <p class="empty-desc">${t.emptyOpsDesc}</p>
            </div>`;
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="hud-op-item" onclick="toggleTask(${task.id})">
            <div class="op-checkbox ${task.is_completed ? 'checked' : ''}">
                ${task.is_completed ? '✓' : ''}
            </div>
            <span class="op-text ${task.is_completed ? 'completed' : ''}">${escapeHtml(task.title)}</span>
            <span class="op-tag">${getFrequencyLabel(task.frequency)}</span>
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
    const t = I18N[userSettings.language] || I18N.th;

    if (!goals || goals.length === 0) {
        container.innerHTML = `
            <div class="hud-empty-state" style="grid-column: 1 / -1; padding: 60px 0;">
                <div class="empty-reticle"></div>
                <p class="empty-title">${t.emptyDirectivesTitle}</p>
                <p class="empty-desc">${t.emptyDirectivesDesc}</p>
            </div>`;
        return;
    }

    const delTitle = userSettings.language === 'en' ? 'Cancel Directive' : 'ยกเลิกยุทธการ';

    container.innerHTML = goals.map(goal => `
        <div class="matrix-card">
            <div class="matrix-card-header">
                <div>
                    <span class="matrix-card-cat">${getCategoryName(goal.category)}</span>
                    <h3 class="matrix-card-title">${escapeHtml(goal.title)}</h3>
                </div>
                <button class="matrix-card-delete" onclick="deleteGoal(${goal.id})" title="${delTitle}">✕</button>
            </div>
            ${goal.description ? `<p class="matrix-card-desc">${escapeHtml(goal.description)}</p>` : ''}
            
            <div class="matrix-card-progress">
                <div class="matrix-progress-labels">
                    <span style="color:var(--text-muted)">${t.matrixEfficiencyLabel}</span>
                    <span style="color:var(--stark-cyan); font-weight:700">${goal.progress}%</span>
                </div>
                <div class="directive-bar">
                    <div class="directive-bar-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>

            ${goal.tasks.length > 0 ? `
                <div class="matrix-tasks-section">
                    <span class="matrix-tasks-title">${t.matrixTasksLabel} (${goal.tasks.filter(task => task.is_completed).length}/${goal.tasks.length})</span>
                    ${goal.tasks.map(task => `
                        <div class="hud-op-item" style="padding:8px 10px;" onclick="toggleTask(${task.id})">
                            <div class="op-checkbox ${task.is_completed ? 'checked' : ''}" style="width:16px;height:16px;font-size:10px;">
                                ${task.is_completed ? '✓' : ''}
                            </div>
                            <span class="op-text ${task.is_completed ? 'completed' : ''}" style="font-size:12px;">${escapeHtml(task.title)}</span>
                            ${task.frequency !== 'one-time' ? `<span class="op-tag">${getFrequencyLabel(task.frequency)}</span>` : ''}
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
    const confirmPrompt = userSettings.language === 'en'
        ? 'Confirm aborting this strategic directive, Sir?'
        : 'ยืนยันการยกเลิกยุทธการนี้ใช่หรือไม่ครับท่าน?';
    if (!confirm(confirmPrompt)) return;

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

    const t = I18N[userSettings.language] || I18N.th;
    setReactorState(t.reactorComputing, userSettings.language === 'en' ? 'ANALYZING STARK DIRECTIVES...' : 'กำลังวิเคราะห์ยุทธการ...');
    isComputing = true;

    appendCommsEntry('user', t.briefingBtn);
    showTypingComms();

    try {
        const res = await fetch(API.briefing, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: userSettings.language,
                callsign: userSettings.callsign
            })
        });
        const data = await res.json();

        removeTypingComms();
        appendCommsEntry('assistant', data.message, data.created_goals);
        playConfirmChime();

        if (data.speech_text) {
            speakJarvis(data.speech_text);
        } else {
            speakJarvis(data.message);
        }

        loadDashboard();
        loadTelemetry();
    } catch (err) {
        removeTypingComms();
        appendCommsEntry('assistant', userSettings.language === 'en' ? 'Apologies, Sir. An error occurred compiling the tactical briefing.' : 'ขออภัยครับท่าน เกิดข้อขัดข้องในการรวบรวมข้อมูลยุทธการประจำวัน');
        setReactorState(t.reactorStandby, t.systemNominal);
    } finally {
        isComputing = false;
    }
}

// ==================== COMMAND & CHAT EXECUTION ====================

function setupCommandInput() {
    const input = document.getElementById('hud-command-input');
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitCommand();
        }
    });
}

function quickSend(type) {
    const t = I18N[userSettings.language] || I18N.th;
    if (type === 'scan') {
        document.getElementById('hud-command-input').value = t.statusScanPrompt;
    } else if (type === 'advice') {
        document.getElementById('hud-command-input').value = t.advicePrompt;
    } else {
        document.getElementById('hud-command-input').value = type;
    }
    submitCommand();
}

async function submitCommand() {
    if (isComputing) return;

    const input = document.getElementById('hud-command-input');
    const message = input.value.trim();
    if (!message) return;

    // Command shortcuts
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
    const t = I18N[userSettings.language] || I18N.th;
    setReactorState(t.reactorComputing, t.reactorSimulation);

    try {
        const res = await fetch(API.chat, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                model: currentModel || 'gemini-2.5-flash',
                language: userSettings.language,
                callsign: userSettings.callsign,
                session_id: currentSessionId || 'default'
            }),
        });
        const data = await res.json();

        removeTypingComms();
        appendCommsEntry('assistant', data.message, data.created_goals, data.agent_actions);
        playConfirmChime();

        if (data.speech_text) {
            speakJarvis(data.speech_text);
        } else {
            speakJarvis(data.message);
        }

        if (data.created_goals && data.created_goals.length > 0) {
            loadDashboard();
            loadTelemetry();
        }

        // Refresh sessions list to display updated thread title and ordering
        loadChatSessions();
    } catch (err) {
        removeTypingComms();
        appendCommsEntry('assistant', userSettings.language === 'en' ? 'Apologies, Sir. Neural comms link encountered an anomaly.' : 'ขออภัยครับท่าน ระบบเครือข่ายขัดข้อง กรุณาลองสั่งการใหม่อีกครั้งครับ');
        setReactorState(t.reactorStandby, t.systemNominal);
    } finally {
        isComputing = false;
        if (!isSpeaking) {
            setReactorState(t.reactorStandby, t.reactorClickMic);
        }
    }
}

async function loadChatHistory(sessionId) {
    const targetSessionId = sessionId || currentSessionId || 'default';
    try {
        const res = await fetch(`${API.chatHistory}?session_id=${encodeURIComponent(targetSessionId)}`);
        const data = await res.json();
        const container = document.getElementById('chat-messages');
        const t = I18N[userSettings.language] || I18N.th;
        container.innerHTML = '';

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                appendCommsEntry(
                    msg.role === 'user' ? 'user' : 'assistant',
                    msg.content
                );
            });
        }
        updateWelcomeHeroVisibility();
    } catch (err) {
        console.error('Failed to load chat history:', err);
    }
}

function appendCommsEntry(role, message, createdGoals = [], agentActions = []) {
    const container = document.getElementById('chat-messages');
    const entry = document.createElement('div');
    entry.className = `comms-entry ${role}`;

    const avatarText = role === 'user' ? (userSettings.language === 'en' ? 'YOU' : 'ท่าน') : 'JARVIS';
    const formatted = formatChatMessage(message);

    let actionsHtml = '';
    if (agentActions && agentActions.length > 0) {
        actionsHtml = `
            <div class="agent-actions-ribbon" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
                ${agentActions.map(act => {
                    const icon = act.tool.includes('browser') ? '🌐' : '📁';
                    return `<span style="font-family:var(--font-mono); font-size:10px; padding:3px 8px; background:rgba(0,240,255,0.08); border:1px solid rgba(0,240,255,0.35); border-radius:3px; color:var(--stark-cyan); box-shadow:0 0 8px rgba(0,240,255,0.15);">
                        ${icon} <strong>${escapeHtml(act.tool)}</strong>: ${escapeHtml(act.details)}
                    </span>`;
                }).join('')}
            </div>
        `;
    }

    let goalsHtml = '';
    if (createdGoals && createdGoals.length > 0) {
        const directiveTitle = userSettings.language === 'en' ? '⚡ INITIALIZED STRATEGIC DIRECTIVE' : '⚡ บันทึกยุทธการเชิงกลยุทธ์แล้ว';
        goalsHtml = createdGoals.map(goal => `
            <div style="margin-top:10px; padding:10px; background:rgba(0, 240, 255, 0.08); border:1px solid var(--stark-cyan); border-radius:2px;">
                <div style="font-family:var(--font-mono); font-size:11px; color:var(--stark-cyan);">${directiveTitle}</div>
                <div style="font-weight:700; color:#fff; margin:4px 0;">${escapeHtml(goal.title)}</div>
                ${goal.tasks.map(task => `<div style="font-size:12px; color:var(--text-secondary);">✓ ${escapeHtml(task.title)} (${getFrequencyLabel(task.frequency)})</div>`).join('')}
            </div>
        `).join('');
    }

    const replayBtnText = userSettings.language === 'en' ? '🔊 REPLAY VOICE' : '🔊 ฟังเสียงซ้ำ';
    const copyBtnText = userSettings.language === 'en' ? '📋 COPY' : '📋 คัดลอก';
    const replayBtnHtml = role === 'assistant' ? `
        <div class="comms-actions">
            <button class="btn-replay-voice" onclick="speakJarvis('${escapeForJsString(message)}')">
                <span>${replayBtnText}</span>
            </button>
            <button class="btn-replay-voice" onclick="copyMessageText(this, '${escapeForJsString(message)}')">
                <span>${copyBtnText}</span>
            </button>
        </div>
    ` : '';

    entry.innerHTML = `
        <div class="comms-avatar">${avatarText}</div>
        <div class="comms-bubble">
            ${actionsHtml}
            <div>${formatted}</div>
            ${goalsHtml}
            ${replayBtnHtml}
        </div>
    `;

    container.appendChild(entry);
    updateWelcomeHeroVisibility();
    scrollChatToBottom();
}

function showTypingComms() {
    const container = document.getElementById('chat-messages');
    const typing = document.createElement('div');
    typing.className = 'comms-entry assistant';
    typing.id = 'comms-typing';
    const typingText = userSettings.language === 'en' ? 'COMPUTING DIRECTIVE... // PROCESSING' : 'กำลังประมวลผลคำสั่งการ... // กำลังวิเคราะห์';
    typing.innerHTML = `
        <div class="comms-avatar">JARVIS</div>
        <div class="comms-bubble" style="font-family:var(--font-mono); font-size:12px; color:var(--stark-cyan);">
            ${typingText}
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
    const t = I18N[userSettings.language] || I18N.th;
    appendCommsEntry('assistant', userSettings.language === 'en' ? 'Comms log cleared, Sir. All systems standing by.' : 'ล้างประวัติการสื่อสารเรียบร้อยครับท่าน ระบบพร้อมรับคำสั่งการครับ');
    updateWelcomeHeroVisibility();
}

// ==================== GEMINI SIDEBAR & AUTO-COLLAPSE HELPERS ====================

function isSidebarExpanded() {
    const container = document.getElementById('app-container');
    return container && container.classList.contains('sidebar-expanded');
}

function collapseSidebar(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const container = document.getElementById('app-container');
    if (!container) return;
    container.classList.remove('sidebar-expanded');
    container.classList.add('sidebar-collapsed');
    playBeep(950, 0.02);
    try {
        localStorage.setItem('jarvis_sidebar_collapsed', 'true');
    } catch (err) {}
}

function expandSidebar(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const container = document.getElementById('app-container');
    if (!container) return;
    container.classList.remove('sidebar-collapsed');
    container.classList.add('sidebar-expanded');
    playBeep(1200, 0.03);
    try {
        localStorage.setItem('jarvis_sidebar_collapsed', 'false');
    } catch (err) {}
}

function toggleSidebar(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isSidebarExpanded()) {
        collapseSidebar(e);
    } else {
        expandSidebar(e);
    }
}

function handleStageClick(event) {
    // User requirement: When clicking anywhere on the stage while drawer is open, auto-collapse!
    if (isSidebarExpanded()) {
        collapseSidebar(event);
    }
}

// Global outside click listener: automatically collapse sidebar whenever user clicks outside
document.addEventListener('click', (event) => {
    if (!isSidebarExpanded()) return;
    const target = event.target;

    // Check if clicked element or any ancestor is inside the sidebar or toggle buttons
    if (target.closest && (
        target.closest('#chatgpt-sidebar') ||
        target.closest('#btn-topbar-sidebar') ||
        target.closest('.rail-brand') ||
        target.closest('#btn-sidebar-toggle')
    )) {
        return;
    }

    collapseSidebar(event);
});

async function loadChatSessions() {
    try {
        const res = await fetch(API.chatSessions);
        const data = await res.json();
        const container = document.getElementById('sidebar-chat-sessions-list');
        if (!container) return;

        const sessions = data.sessions || [];
        if (sessions.length === 0) {
            container.innerHTML = `<div class="sidebar-empty-hint">${userSettings.language === 'en' ? 'No chat sessions' : 'ยังไม่มีประวัติการสนทนา'}</div>`;
            return;
        }

        // ตรวจสอบว่า currentSessionId ยังคงมีอยู่ในรายการหรือไม่
        const sessionExists = sessions.some(s => s.id === currentSessionId);
        if (!sessionExists && sessions.length > 0) {
            currentSessionId = sessions[0].id;
            localStorage.setItem('stark_current_session_id', currentSessionId);
        }

        container.innerHTML = sessions.map(s => {
            const isActive = s.id === currentSessionId;
            const title = escapeHtml(s.title || (userSettings.language === 'en' ? 'New Chat' : 'บทสนทนาใหม่'));
            return `
                <div class="chat-session-pill ${isActive ? 'active' : ''}" 
                     data-session-id="${escapeHtml(s.id)}" 
                     onclick="switchChatSession('${escapeHtml(s.id)}')" 
                     title="${title}">
                    <div class="session-info">
                        <span class="session-icon">💬</span>
                        <span class="session-title">${title}</span>
                    </div>
                    <button class="session-delete-btn" 
                            onclick="deleteChatSession('${escapeHtml(s.id)}', event)" 
                            title="${userSettings.language === 'en' ? 'Delete Chat' : 'ลบการสนทนานี้'}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Failed to load chat sessions:', err);
    }
}

async function switchChatSession(sessionId) {
    if (!sessionId) return;
    currentSessionId = sessionId;
    localStorage.setItem('stark_current_session_id', sessionId);
    playBeep(1100, 0.04);
    switchView('chat');
    
    // ไฮไลต์ session ที่เลือกใน sidebar
    document.querySelectorAll('.chat-session-pill').forEach(el => {
        if (el.getAttribute('data-session-id') === sessionId) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    await loadChatHistory(sessionId);
    document.getElementById('hud-command-input')?.focus();
}

async function handleNewMissionClick() {
    playBeep(1300, 0.05);
    try {
        const res = await fetch(API.chatSessions, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: userSettings.language === 'en' ? 'New Chat' : 'บทสนทนาใหม่'
            })
        });
        const data = await res.json();
        if (data.session && data.session.id) {
            currentSessionId = data.session.id;
            localStorage.setItem('stark_current_session_id', currentSessionId);
            await loadChatSessions();
            
            // ล้างหน้าจอแชทและแสดง welcome hero
            const container = document.getElementById('chat-messages');
            if (container) container.innerHTML = '';
            updateWelcomeHeroVisibility();
            
            switchView('chat');
            document.getElementById('hud-command-input')?.focus();
        }
    } catch (err) {
        console.error('Failed to create new chat session:', err);
    }
}

async function deleteChatSession(sessionId, event) {
    if (event) event.stopPropagation();
    
    const confirmMsg = userSettings.language === 'en'
        ? 'Delete this chat conversation, Sir?'
        : 'ท่านต้องการลบประวัติการสนทนานี้ใช่หรือไม่ครับ?';
    if (!confirm(confirmMsg)) return;

    playBeep(600, 0.08);
    try {
        await fetch(`${API.chatSessions}/${encodeURIComponent(sessionId)}`, {
            method: 'DELETE'
        });
        
        // ถ้าลบ session ปัจจุบัน ให้สลับไปยัง session แรกที่เหลือ
        if (currentSessionId === sessionId) {
            const sessionsRes = await fetch(API.chatSessions);
            const sessionsData = await sessionsRes.json();
            const remaining = sessionsData.sessions || [];
            if (remaining.length > 0) {
                currentSessionId = remaining[0].id;
            } else {
                currentSessionId = 'default';
            }
            localStorage.setItem('stark_current_session_id', currentSessionId);
            await loadChatHistory(currentSessionId);
        }
        await loadChatSessions();
    } catch (err) {
        console.error('Failed to delete chat session:', err);
    }
}

function copyMessageText(btn, text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = userSettings.language === 'en' ? '<span>✓ COPIED</span>' : '<span>✓ คัดลอกแล้ว</span>';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        });
    }
}

function updateWelcomeHeroVisibility() {
    const hero = document.getElementById('chat-welcome-hero');
    const container = document.getElementById('chat-messages');
    if (hero && container) {
        if (container.children.length > 0) {
            hero.style.display = 'none';
        } else {
            hero.style.display = 'flex';
        }
    }
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
        const ackMsg = userSettings.language === 'en'
            ? `Understood, ${userSettings.callsign || 'Sir'}. Directive ${title} has been registered.`
            : `รับทราบครับท่าน ยุทธการ ${title} ได้รับการบันทึกเข้าสู่ระบบเรียบร้อยแล้วครับ`;
        speakJarvis(ackMsg);
    } catch (err) {
        console.error('Failed to create goal:', err);
    }
}

// ==================== FORMATTING & UTILITIES ====================

function formatChatMessage(text) {
    if (!text) return '';
    
    // Extract images first so html escaping doesn't mangle tags
    const images = [];
    let processed = text.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
        const placeholder = `__IMG_TOKEN_${images.length}__`;
        images.push({ alt, src });
        return placeholder;
    });

    // Escape basic html
    processed = processed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks
    processed = processed.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,10,20,0.8); border:1px solid rgba(0,240,255,0.3); padding:10px; border-radius:4px; font-family:var(--font-mono); font-size:12px; overflow-x:auto; margin:8px 0;"><code>$1</code></pre>');

    // Inline code
    processed = processed.replace(/`([^`]+)`/g, '<code style="background:rgba(0,240,255,0.1); color:var(--stark-cyan); padding:2px 6px; border-radius:3px; font-family:var(--font-mono); font-size:11px;">$1</code>');

    // Markdown bold & italic & links
    processed = processed
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--stark-cyan)">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--stark-cyan); text-decoration:underline;">$1</a>')
        .replace(/\n/g, '<br>');

    // Reinsert images
    images.forEach((img, idx) => {
        const imgHtml = `
            <div class="agent-screenshot-card" style="margin:10px 0; background:rgba(0,20,35,0.6); border:1px solid rgba(0,240,255,0.3); border-radius:6px; padding:8px;">
                <a href="${escapeHtml(img.src)}" target="_blank" title="คลิกเพื่อขยายดูภาพหลักฐาน">
                    <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" style="max-width:100%; max-height:360px; border-radius:4px; border:1px solid rgba(0,240,255,0.4); display:block; transition:transform 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'" />
                </a>
                <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-secondary); margin-top:4px; display:flex; justify-content:space-between;">
                    <span>📸 ${escapeHtml(img.alt || 'หลักฐานภาพหน้าจอ')}</span>
                    <a href="${escapeHtml(img.src)}" target="_blank" style="color:var(--stark-cyan); text-decoration:none;">↗ เปิดดูภาพเต็ม</a>
                </div>
            </div>
        `;
        processed = processed.replace(`__IMG_TOKEN_${idx}__`, imgHtml);
    });

    return processed;
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

// ==================== MULTI-MODEL AI ROUTING & GROQ API ====================
let currentModel = localStorage.getItem('jarvis_active_model') || 'gemini-2.5-flash';
let cachedModelsList = [];
let hasGroqKeyConfigured = false;

async function loadAvailableModels() {
    try {
        const res = await fetch('/api/models');
        const data = await res.json();
        cachedModelsList = data.models || [];
        hasGroqKeyConfigured = data.has_groq_key;
        renderModelPickerPopup(cachedModelsList, data.has_groq_key);
        updateActiveModelPills();
    } catch (e) {
        console.error('Error loading AI models:', e);
    }
}

function renderModelPickerPopup(models, hasGroqKey) {
    const listEl = document.getElementById('model-picker-list');
    if (!listEl) return;
    
    const googleModels = models.filter(m => m.provider === 'Google');
    const groqModels = models.filter(m => m.provider === 'Groq');
    
    let html = '';
    
    if (googleModels.length > 0) {
        html += `<div class="model-group-divider"><span>GOOGLE GEMINI</span></div>`;
        googleModels.forEach(m => {
            const isActive = m.id === currentModel;
            const badgeClass = m.badge === 'แนะนำ' ? 'badge-rec' : 'badge-gemini';
            html += `
                <div class="model-item-row ${isActive ? 'active' : ''}" onclick="selectModel('${m.id}', '${m.short_name}')" data-model="${m.id}">
                    <div class="model-item-left">
                        <div class="model-item-title-row">
                            <span class="model-item-title">${m.name}</span>
                            <span class="${badgeClass}">${m.badge}</span>
                        </div>
                        <span class="model-item-desc">${m.description}</span>
                    </div>
                    <div class="model-item-check">✓</div>
                </div>
            `;
        });
    }

    if (groqModels.length > 0) {
        html += `<div class="model-group-divider"><span>GROQ LPU (ULTRA FAST INFERENCE)</span> ${hasGroqKey ? '<span style="color:#34a853;font-size:10px;">● CONNECTED</span>' : '<span style="color:#fbbc04;font-size:10px;">● KEY NEEDED</span>'}</div>`;
        groqModels.forEach(m => {
            const isActive = m.id === currentModel;
            html += `
                <div class="model-item-row ${isActive ? 'active' : ''}" onclick="selectModel('${m.id}', '${m.short_name}')" data-model="${m.id}">
                    <div class="model-item-left">
                        <div class="model-item-title-row">
                            <span class="model-item-title">${m.name}</span>
                            <span class="badge-groq">${m.badge}</span>
                        </div>
                        <span class="model-item-desc">${m.description}</span>
                    </div>
                    <div class="model-item-check">✓</div>
                </div>
            `;
        });
    }
    
    listEl.innerHTML = html;
}

function updateActiveModelPills() {
    const activeObj = cachedModelsList.find(m => m.id === currentModel);
    const shortName = activeObj ? activeObj.short_name : (currentModel.includes('flash') ? '2.5 Flash' : (currentModel.includes('llama') ? 'Llama 3.3' : 'Pro'));
    
    const capsuleNameEl = document.getElementById('capsule-model-name');
    if (capsuleNameEl) capsuleNameEl.textContent = shortName;
    
    const topbarNameEl = document.getElementById('topbar-model-name');
    if (topbarNameEl) topbarNameEl.textContent = shortName;

    document.querySelectorAll('.model-item-row').forEach(row => {
        row.classList.toggle('active', row.dataset.model === currentModel);
    });
}

function selectModel(modelId, shortName) {
    currentModel = modelId;
    try {
        localStorage.setItem('jarvis_active_model', modelId);
    } catch(e) {}
    
    updateActiveModelPills();
    toggleModelPicker(false);
    playConfirmChime();
}

function toggleModelPicker(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const popup = document.getElementById('model-picker-popup');
    if (!popup) return;

    if (e === false || popup.style.display === 'flex') {
        popup.style.display = 'none';
        return;
    }

    let trigger = null;
    if (e && e.currentTarget) {
        trigger = e.currentTarget;
    } else {
        trigger = document.getElementById('capsule-model-pill') || document.getElementById('topbar-model-selector');
    }

    if (trigger) {
        const rect = trigger.getBoundingClientRect();
        if (rect.top > window.innerHeight / 2) {
            popup.style.bottom = `${window.innerHeight - rect.top + 10}px`;
            popup.style.top = 'auto';
            const rightOffset = Math.max(16, window.innerWidth - rect.right);
            popup.style.right = `${rightOffset}px`;
            popup.style.left = 'auto';
        } else {
            popup.style.top = `${rect.bottom + 10}px`;
            popup.style.bottom = 'auto';
            popup.style.left = `${Math.max(16, rect.left)}px`;
            popup.style.right = 'auto';
        }
    } else {
        popup.style.bottom = '88px';
        popup.style.right = '24px';
    }

    popup.style.display = 'flex';
    playBeep(1200, 0.04);
}

// Global click to close model picker popup
document.addEventListener('click', (e) => {
    const popup = document.getElementById('model-picker-popup');
    if (!popup || popup.style.display === 'none') return;
    if (!popup.contains(e.target) && !e.target.closest('#capsule-model-pill') && !e.target.closest('#topbar-model-selector')) {
        popup.style.display = 'none';
    }
});

async function loadApiKeysSettings() {
    try {
        const res = await fetch('/api/settings/keys');
        const data = await res.json();
        hasGroqKeyConfigured = data.has_groq;
        
        // 1. Groq Keys Rendering
        const tagGroq = document.getElementById('status-tag-groq');
        if (tagGroq) {
            if (data.has_groq && data.groq_count > 0) {
                const activeCount = (data.groq_keys || []).filter(k => k.status === 'active').length;
                const rateLimitedCount = (data.groq_keys || []).filter(k => k.status === 'rate_limited').length;
                if (rateLimitedCount > 0 && activeCount === 0) {
                    tagGroq.textContent = `ติด Rate Limit (${rateLimitedCount} คีย์)`;
                    tagGroq.className = 'api-status-tag status-warning';
                } else {
                    tagGroq.textContent = `พร้อมใช้งาน ${activeCount}/${data.groq_count} คีย์ ✓`;
                    tagGroq.className = 'api-status-tag connected';
                }
            } else {
                tagGroq.textContent = 'ยังไม่ได้เชื่อมต่อ';
                tagGroq.className = 'api-status-tag';
            }
        }
        
        const inputGroq = document.getElementById('setting-groq-key');
        if (inputGroq) {
            inputGroq.placeholder = (data.groq_count > 0) 
                ? `${data.groq_count} คีย์ใน Pool (ใส่คีย์ใหม่คั่นด้วยคอมม่าเพื่อเพิ่มหรือแทนที่)`
                : 'gsk_key1, gsk_key2 (ใส่ทีเดียวหลายคีย์ คั่นด้วยคอมม่า)';
        }

        const groqPool = document.getElementById('groq-keys-pool');
        if (groqPool) {
            groqPool.innerHTML = '';
            if (data.groq_keys && data.groq_keys.length > 0) {
                data.groq_keys.forEach(k => {
                    const chip = document.createElement('div');
                    chip.className = `key-chip status-${k.status}`;
                    chip.title = `${k.message} | ใช้งานแล้ว ${k.usage} ครั้ง`;
                    chip.innerHTML = `
                        <span class="status-dot"></span>
                        <span>#${k.index} ${k.masked}</span>
                        <span class="key-usage-count">${k.usage > 0 ? `(ใช้ ${k.usage})` : ''}</span>
                    `;
                    groqPool.appendChild(chip);
                });
            }
        }
        
        // 2. Gemini Keys Rendering
        const tagGemini = document.getElementById('status-tag-gemini');
        if (tagGemini) {
            if (data.has_gemini && data.gemini_count > 0) {
                const activeCount = (data.gemini_keys || []).filter(k => k.status === 'active').length;
                const rateLimitedCount = (data.gemini_keys || []).filter(k => k.status === 'rate_limited').length;
                if (rateLimitedCount > 0 && activeCount === 0) {
                    tagGemini.textContent = `ติด Rate Limit (${rateLimitedCount} คีย์)`;
                    tagGemini.className = 'api-status-tag status-warning';
                } else {
                    tagGemini.textContent = `พร้อมใช้งาน ${activeCount}/${data.gemini_count} คีย์ ✓`;
                    tagGemini.className = 'api-status-tag connected';
                }
            } else {
                tagGemini.textContent = 'ยังไม่ได้เชื่อมต่อ';
                tagGemini.className = 'api-status-tag';
            }
        }
        
        const inputGemini = document.getElementById('setting-gemini-key');
        if (inputGemini) {
            inputGemini.placeholder = (data.gemini_count > 0)
                ? `${data.gemini_count} คีย์ใน Pool (ใส่คีย์ใหม่คั่นด้วยคอมม่าเพื่อเพิ่มหรือแทนที่)`
                : 'AIzaSy_key1, AIzaSy_key2 (ใส่ทีเดียวหลายคีย์ คั่นด้วยคอมม่า)';
        }

        const geminiPool = document.getElementById('gemini-keys-pool');
        if (geminiPool) {
            geminiPool.innerHTML = '';
            if (data.gemini_keys && data.gemini_keys.length > 0) {
                data.gemini_keys.forEach(k => {
                    const chip = document.createElement('div');
                    chip.className = `key-chip status-${k.status}`;
                    chip.title = `${k.message} | ใช้งานแล้ว ${k.usage} ครั้ง`;
                    chip.innerHTML = `
                        <span class="status-dot"></span>
                        <span>#${k.index} ${k.masked}</span>
                        <span class="key-usage-count">${k.usage > 0 ? `(ใช้ ${k.usage})` : ''}</span>
                    `;
                    geminiPool.appendChild(chip);
                });
            }
        }
    } catch (e) {
        console.error('Error fetching API keys:', e);
    }
}

function toggleKeyVisibility(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    if (el.tagName.toLowerCase() === 'textarea') {
        const current = el.style.webkitTextSecurity || 'disc';
        el.style.webkitTextSecurity = (current === 'disc') ? 'none' : 'disc';
    } else {
        el.type = el.type === 'password' ? 'text' : 'password';
    }
}

async function validateAndPruneKeys(prune = true) {
    const btn = document.getElementById('btn-validate-keys');
    const feedbackBox = document.getElementById('validation-feedback-box');
    const originalText = btn ? btn.innerHTML : '';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⟳</span> กำลังตรวจสอบคีย์และวัด Latency...`;
    }
    if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.innerHTML = '⚡ กำลังส่งสัญญาณ Ping ทดสอบ Groq LPU และ Google Gemini API ทุกคีย์...';
    }
    
    const groqKeyInput = document.getElementById('setting-groq-key')?.value.trim();
    const geminiKeyInput = document.getElementById('setting-gemini-key')?.value.trim();
    
    try {
        const res = await fetch('/api/settings/keys/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groq_api_key: groqKeyInput || null,
                gemini_api_key: geminiKeyInput || null,
                prune_invalid: prune
            })
        });
        const data = await res.json();
        
        if (feedbackBox) {
            feedbackBox.innerHTML = `<strong>${data.message || 'ตรวจสอบเสร็จสิ้น'}</strong>`;
            const details = data.details || {};
            let detailsHtml = '';
            if (details.groq) {
                const pruned = details.groq.pruned || [];
                const rl = details.groq.rate_limited || [];
                if (pruned.length > 0) detailsHtml += `<br>• ตัด Groq คีย์เสียทิ้ง: ${pruned.map(p => p.masked + ' (' + p.message + ')').join(', ')}`;
                if (rl.length > 0) detailsHtml += `<br>• Groq ติด Rate Limit: ${rl.map(p => p.masked + ' (' + p.message + ')').join(', ')}`;
            }
            if (details.gemini) {
                const pruned = details.gemini.pruned || [];
                const rl = details.gemini.rate_limited || [];
                if (pruned.length > 0) detailsHtml += `<br>• ตัด Gemini คีย์เสียทิ้ง: ${pruned.map(p => p.masked + ' (' + p.message + ')').join(', ')}`;
                if (rl.length > 0) detailsHtml += `<br>• Gemini ติด Rate Limit: ${rl.map(p => p.masked + ' (' + p.message + ')').join(', ')}`;
            }
            if (detailsHtml) feedbackBox.innerHTML += detailsHtml;
        }
        
        if (groqKeyInput && document.getElementById('setting-groq-key')) {
            document.getElementById('setting-groq-key').value = '';
        }
        if (geminiKeyInput && document.getElementById('setting-gemini-key')) {
            document.getElementById('setting-gemini-key').value = '';
        }

        await loadApiKeysSettings();
        await loadAvailableModels();
    } catch (err) {
        if (feedbackBox) {
            feedbackBox.innerHTML = `เกิดข้อผิดพลาดในการตรวจสอบ: ${err.message}`;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

