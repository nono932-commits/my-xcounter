// --- 状態管理用変数 ---
let currentModeId = 'normal'; // 現在アクティブなモードのID

// 各モード（タブ）のデータを配列で動的管理
let modes = [
    { 
        id: 'normal', 
        name: '通常時', 
        gameItems: [
            { id: 'current', name: '総回転数', value: 0, op: 'add' },
            { id: 'start', name: '打ち始めゲーム数', value: 0, op: 'sub' }
        ],
        totalGames: 0, 
        counters: [] 
    },
    { 
        id: 'bonus', 
        name: 'ボーナス中', 
        gameItems: [
            { id: 'current', name: '総回転数', value: 0, op: 'add' }
        ],
        totalGames: 0, 
        counters: [] 
    },
    { 
        id: 'at', 
        name: 'AT中', 
        gameItems: [
            { id: 'current', name: '総回転数', value: 0, op: 'add' }
        ],
        totalGames: 0, 
        counters: [] 
    }
];

// ショートカットポインタ（現在のアクティブなデータ）
let totalGames = 0;
let counters = [];
let isDecrementMode = false; // trueなら減算モード、falseなら加算モード

// カウントの加算・減算モードを切り替える関数
function setCountMode(mode) {
    const plusBtn = document.getElementById('count-mode-plus-btn');
    const minusBtn = document.getElementById('count-mode-minus-btn');
    
    if (mode === 'minus') {
        isDecrementMode = true;
        if (minusBtn) minusBtn.classList.add('active');
        if (plusBtn) plusBtn.classList.remove('active');
        document.body.classList.add('decrement-mode-active'); // 減算警告用背景クラスを追加
    } else {
        isDecrementMode = false;
        if (plusBtn) plusBtn.classList.add('active');
        if (minusBtn) minusBtn.classList.remove('active');
        document.body.classList.remove('decrement-mode-active'); // 減算警告用背景クラスを削除
    }
}

// --- サウンド再生管理 (Web Audio API) ---
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playSound(type) {
    if (!type || type === 'none') return;
    
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const now = ctx.currentTime;
        
        switch (type) {
            case 'pip': {
                // ピッ (標準的な高音電子音)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1000, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
            case 'pikop': {
                // ピコッ (レトロゲーム風の2段階音)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(1200, now + 0.05);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }
            case 'peen': {
                // ピーン (澄んだ長めの余韻音)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1400, now);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            }
            case 'kyuin': {
                // キュイン！ (パチスロ告知風の上昇電子音)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
                
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.14);
                break;
            }
            case 'gako': {
                // ガコッ！ (告知ランプ点灯風の衝撃音)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
                
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                
                const bufferSize = ctx.sampleRate * 0.08;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.15;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(300, now);
                
                const gainNoise = ctx.createGain();
                gainNoise.gain.setValueAtTime(0.2, now);
                gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                
                noise.connect(filter);
                filter.connect(gainNoise);
                gainNoise.connect(ctx.destination);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(now);
                osc.stop(now + 0.1);
                noise.start(now);
                noise.stop(now + 0.08);
                break;
            }
            case 'coin': {
                // チャリン (金属的な高音2和音)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(1100, now);
                gain1.gain.setValueAtTime(0.04, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.22);
                
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1700, now + 0.03);
                gain2.gain.setValueAtTime(0.04, now + 0.03);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.03);
                osc2.stop(now + 0.28);
                break;
            }
            case 'kachi': {
                // キーボードを叩いたような音 (タッ)
                // 高音のクリック成分
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'triangle';
                osc1.frequency.setValueAtTime(900, now);
                gain1.gain.setValueAtTime(0.12, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.02);
                
                // 低音の胴鳴り成分 (コッ)
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(280, now);
                osc2.frequency.exponentialRampToValueAtTime(140, now + 0.04);
                gain2.gain.setValueAtTime(0.2, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now);
                osc2.stop(now + 0.05);

                // ノイズ成分による摩擦音 (カシャ)
                const bufferSize = ctx.sampleRate * 0.03; // 極小バッファ
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1600, now);
                
                const gainNoise = ctx.createGain();
                gainNoise.gain.setValueAtTime(0.08, now);
                gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
                
                noise.connect(filter);
                filter.connect(gainNoise);
                gainNoise.connect(ctx.destination);
                noise.start(now);
                noise.stop(now + 0.03);
                break;
            }
            case 'typewriter': {
                // タイプライター音 (カチャッという鋭い金属機械音)
                // 鋭い金属打撃（カチャ）
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(2400, now);
                osc1.frequency.exponentialRampToValueAtTime(800, now + 0.02);
                gain1.gain.setValueAtTime(0.12, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.03);
                
                // バネ・レバーの反響（チッ）
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(3200, now);
                gain2.gain.setValueAtTime(0.08, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now);
                osc2.stop(now + 0.015);

                // 金属と紙が当たる高周波ノイズ（シャッ）
                const bufferSize = ctx.sampleRate * 0.06;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[data.length - 1 - i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(2000, now);
                
                const gainNoise = ctx.createGain();
                gainNoise.gain.setValueAtTime(0.12, now);
                gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                
                noise.connect(filter);
                filter.connect(gainNoise);
                gainNoise.connect(ctx.destination);
                noise.start(now);
                noise.stop(now + 0.06);
                break;
            }
            case 'shot': {
                // 銃声 (ホワイトノイズと急降下フィルターによる破裂音)
                const bufferSize = ctx.sampleRate * 0.35; // 0.35秒分
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1200, now);
                filter.frequency.exponentialRampToValueAtTime(80, now + 0.25);
                
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                
                noise.start(now);
                noise.stop(now + 0.35);
                break;
            }
        }
    } catch (e) {
        console.error('Audio playback error:', e);
    }
}

// ユーザーが独自に保存した機種プリセット（localStorageに保存）
let userPresets = {};

// 有効化されている設定段階（デフォルトは設定1〜6まですべて有効）
let enabledSettings = [true, true, true, true, true, true];

// 実践履歴ログ
let historyLogs = [];

// 実践店舗名マスタリスト
let shopList = [];

// 機種テキストメモデータ
let modelMemos = {};

// 配色テーマ (light / dark)
let currentTheme = 'light';

// バイブレーション設定のON/OFF状態 (デフォルトはON)
let isVibrateActive = true;

// カウンター追加時のデフォルト絵文字プール（空文字はアイコンなし）
const SYMBOL_POOL = [
    '', '🔔', '🍒', '🍉', '🍇', '🍋', '🍊', '🍑', '🍍', '🍈', 
    '✨', '🎰', '🪙', '💰', '💎', '👑', '7️⃣', '💥', '🔥', '⚡', 
    '🌈', '🌟', '⭐', '🍀', '🎯', '🎲', '👾', '💀', '❓'
];

// 小役の基本デフォルトデータ
const DEFAULT_COUNTERS_DATA = [
    { id: 'bell', name: 'ベル', symbol: '🔔', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'weak-cherry', name: '弱チェ', symbol: '🍒', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'strong-cherry', name: '強チェ', symbol: '🍒🍒', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'weak-suika', name: '弱スイカ', symbol: '🍉', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'strong-suika', name: '強スイカ', symbol: '🍉🍉', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'chance', name: 'チャンス目', symbol: '✨', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'middle-cherry', name: '中段チェ', symbol: '👑', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'special', name: '確定役', symbol: '🎰', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' },
    { id: 'other', name: 'その他', symbol: '❓', count: 0, manualRate: 0, denominators: [0, 0, 0, 0, 0, 0], sound: 'pip' }
];

// デフォルトゲーム数項目データ
const DEFAULT_GAME_ITEMS = [
    { id: 'current', name: '総回転数', value: 0, op: 'add' },
    { id: 'start', name: '打ち始めゲーム数', value: 0, op: 'sub' }
];

// --- 機種プリセットの設定差データ ---
const MODEL_PRESETS = {
    custom: {
        name: '新規作成',
        denominators: {} // 動的に割り当て
    }
};

let currentModelKey = 'custom';

// --- DOM取得 ---
const totalGamesDisplay = document.getElementById('total-games');
const modelSelect = document.getElementById('model-select');
const deleteModelBtn = document.getElementById('delete-model-btn');
const modelTableHeader = document.getElementById('model-table-header');
const modelTableBody = document.getElementById('model-table-body');
const countersGrid = document.getElementById('counters-grid');
const modeTabsContainer = document.getElementById('mode-tabs-container');
const calculationRowContainer = document.getElementById('calculation-row-container');
const activeSettingsControl = document.getElementById('active-settings-control');

let isEditMode = false; // ボタン編集モードの状態（初期値はOFF）

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('edit-mode-toggle-btn');
    if (btn) {
        if (isEditMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
    renderCounters();
    renderTabs(); // 編集モード切り替え時にタブの削除ボタン表示状態を更新
}

function disableEditMode() {
    isEditMode = false;
    const btn = document.getElementById('edit-mode-toggle-btn');
    if (btn) {
        btn.classList.remove('active');
    }
    setCountMode('plus'); // 機種切り替え時や編集OFF時にカウントモードを加算（＋）にリセット
    renderTabs(); // 編集モードOFF時にタブの削除ボタンを非表示化
}

// --- アプリの初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    // ローカルストレージから復元
    const savedModelKey = localStorage.getItem('bright_counter_model_key');
    const savedUserPresets = localStorage.getItem('bright_counter_user_presets');
    const savedModesData = localStorage.getItem('bright_counter_modes_v4');
    const savedModeDataV3 = localStorage.getItem('bright_counter_mode_data_v3');
    const savedEnabledSettings = localStorage.getItem('bright_counter_enabled_settings');
    
    // 旧データ（互換用）
    const savedCurrentGames = localStorage.getItem('bright_counter_current_games');
    const savedStartGames = localStorage.getItem('bright_counter_start_games');
    const savedCounters = localStorage.getItem('bright_counter_v2_list');
    const savedOldTotal = localStorage.getItem('bright_counter_total_games');
    const savedOldCounts = localStorage.getItem('bright_counter_counts');
    const savedOldManual = localStorage.getItem('bright_counter_manual_rates');
    const savedOldDenoms = localStorage.getItem('bright_counter_denominators');

    if (savedModelKey !== null) {
        currentModelKey = savedModelKey;
    }

    // ユーザー保存プリセットの復元
    if (savedUserPresets !== null) {
        try {
            userPresets = JSON.parse(savedUserPresets);
        } catch (e) {
            console.error('ユーザー機種のロードに失敗しました。', e);
        }
    }

    // 有効設定段階の復元
    if (savedEnabledSettings !== null) {
        try {
            enabledSettings = JSON.parse(savedEnabledSettings);
        } catch (e) {
            console.error('有効設定リストのロードに失敗しました。', e);
        }
    }

    // セレクトボックスの動的生成
    renderModelOptions();

    // モードリストの初期ロード・マイグレーション
    if (savedModesData !== null) {
        try {
            modes = JSON.parse(savedModesData);
            modes.forEach(m => {
                if (!m.gameItems) {
                    m.gameItems = [
                        { id: 'current', name: '総回転数', value: m.currentGames || 0, op: 'add' },
                        { id: 'start', name: '打ち始めゲーム数', value: m.startGames || 0, op: 'sub' }
                    ];
                }
                if (m.totalGames === undefined) {
                    m.totalGames = 0;
                }
            });
        } catch (e) {
            console.error('モードリストの復元に失敗しました。', e);
        }
    } else if (savedModeDataV3 !== null) {
        try {
            const legacyData = JSON.parse(savedModeDataV3);
            modes = [
                { 
                    id: 'normal', 
                    name: '通常時', 
                    gameItems: [
                        { id: 'current', name: '総回転数', value: legacyData.normal.currentGames || 0, op: 'add' },
                        { id: 'start', name: '打ち始めゲーム数', value: legacyData.normal.startGames || 0, op: 'sub' }
                    ],
                    totalGames: legacyData.normal.totalGames || 0,
                    counters: legacyData.normal.counters || []
                },
                { 
                    id: 'bonus', 
                    name: 'ボーナス中', 
                    gameItems: [
                        { id: 'current', name: '総回転数', value: legacyData.bonus.currentGames || 0, op: 'add' }
                    ],
                    totalGames: legacyData.bonus.totalGames || 0,
                    counters: legacyData.bonus.counters || []
                },
                { 
                    id: 'at', 
                    name: 'AT中', 
                    gameItems: [
                        { id: 'current', name: '総回転数', value: legacyData.at.currentGames || 0, op: 'add' }
                    ],
                    totalGames: legacyData.at.totalGames || 0,
                    counters: legacyData.at.counters || []
                }
            ];
        } catch (e) {
            console.error('v3データの変換に失敗しました。', e);
        }
    } else {
        const currentVal = savedCurrentGames !== null ? parseInt(savedCurrentGames, 10) : (savedOldTotal !== null ? parseInt(savedOldTotal, 10) : 0);
        const startVal = savedStartGames !== null ? parseInt(savedStartGames, 10) : 0;
        
        modes[0].gameItems = [
            { id: 'current', name: '総回転数', value: currentVal, op: 'add' },
            { id: 'start', name: '打ち始めゲーム数', value: startVal, op: 'sub' }
        ];
        modes[0].totalGames = currentVal - startVal;
        if (modes[0].totalGames < 0) modes[0].totalGames = 0;

        if (savedCounters !== null) {
            try {
                modes[0].counters = JSON.parse(savedCounters);
            } catch (e) {
                modes[0].counters = JSON.parse(JSON.stringify(DEFAULT_COUNTERS_DATA));
            }
        } else {
            modes[0].counters = JSON.parse(JSON.stringify(DEFAULT_COUNTERS_DATA));
            if (savedOldCounts) {
                try {
                    const oldC = JSON.parse(savedOldCounts);
                    modes[0].counters.forEach(c => {
                        if (oldC[c.id] !== undefined) c.count = oldC[c.id];
                    });
                } catch(e){}
            }
            if (savedOldManual) {
                try {
                    const oldM = JSON.parse(savedOldManual);
                    modes[0].counters.forEach(c => {
                        if (oldM[c.id] !== undefined) c.manualRate = oldM[c.id];
                    });
                } catch(e){}
            }
            if (savedOldDenoms) {
                try {
                    const oldD = JSON.parse(savedOldDenoms);
                    modes[0].counters.forEach(c => {
                        if (oldD[c.id] !== undefined) c.denominators = oldD[c.id];
                    });
                } catch(e){}
            }
        }

        modes[1].counters = JSON.parse(JSON.stringify(DEFAULT_COUNTERS_DATA));
        modes[2].counters = JSON.parse(JSON.stringify(DEFAULT_COUNTERS_DATA));
    }

    const savedActiveModeId = localStorage.getItem('bright_counter_active_mode_id');
    if (savedActiveModeId && modes.some(m => m.id === savedActiveModeId)) {
        currentModeId = savedActiveModeId;
    } else if (modes.length > 0) {
        currentModeId = modes[0].id;
    }

    // 配色テーマのロード・適用
    const savedTheme = localStorage.getItem('bright_counter_theme');
    if (savedTheme === 'dark') {
        currentTheme = 'dark';
        document.body.classList.add('dark-theme');
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.textContent = '🌙';
    } else {
        currentTheme = 'light';
        document.body.classList.remove('dark-theme');
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.textContent = '☀️';
    }

    // バイブレーション設定のロード・適用
    const savedVibrate = localStorage.getItem('bright_counter_vibrate_active');
    isVibrateActive = savedVibrate !== 'false'; // デフォルトは true (ON)
    updateVibrateBtn();

    updateModePointers();
    
    // 合算・当選率の事前計算
    syncCombinedCounts(); 
    
    // 実践履歴のロード
    const savedHistoryLogs = localStorage.getItem('bright_counter_history_logs');
    if (savedHistoryLogs !== null) {
        try {
            historyLogs = JSON.parse(savedHistoryLogs);
        } catch (e) {
            console.error('履歴のロードに失敗しました。', e);
        }
    }

    // 実践店舗名マスタリストのロード
    const savedShopList = localStorage.getItem('bright_counter_shop_list');
    if (savedShopList !== null) {
        try {
            shopList = JSON.parse(savedShopList);
        } catch (e) {
            console.error('店舗リストのロードに失敗しました。', e);
        }
    } else if (historyLogs.length > 0) {
        // 既存の履歴から店舗名を抽出して初期化（マイグレーション）
        shopList = [...new Set(historyLogs.map(log => log.shop).filter(shop => shop && shop !== '未設定'))];
        localStorage.setItem('bright_counter_shop_list', JSON.stringify(shopList));
    }

    // 機種別テキストメモのロード
    const savedModelMemos = localStorage.getItem('bright_counter_model_memos');
    if (savedModelMemos !== null) {
        try {
            modelMemos = JSON.parse(savedModelMemos);
        } catch (e) {
            console.error('メモデータのロードに失敗しました。', e);
        }
    }

    // IndexedDB初期化とギャラリーイベントバインド
    initDB(() => {
        setupDragAndDrop();
        loadModelMemoAndGallery();
    });
    
    renderTabs();
    renderGameItems();
    renderSettingControls();
    renderCounters();
    generateModelTableHeader();
    generateModelTable();
    renderHistoryTable();
    updateUI();
});

// --- カウンターショートカットポインタの同期 ---
function updateModePointers() {
    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (activeMode) {
        totalGames = activeMode.totalGames;
        counters = activeMode.counters;
        currentModeId = activeMode.id;
    }
}

// --- 現在のアクティブな数値をmodes配列へ書き戻し ---
function saveCurrentModeState() {
    const activeMode = modes.find(m => m.id === currentModeId);
    if (activeMode) {
        activeMode.totalGames = totalGames;
        activeMode.counters = counters;
    }
}

// --- 遊技モード（タブ）の切り替え ---
function switchMode(modeId) {
    if (currentModeId === modeId) return;

    saveCurrentModeState();

    currentModeId = modeId;
    updateModePointers();

    renderTabs();

    renderGameItems();
    renderCounters();
    generateModelTableHeader();
    generateModelTable();
    updateUI();
}

// --- モード名の編集ハンドラ ---
function updateModeName(modeId, newName) {
    const targetMode = modes.find(m => m.id === modeId);
    if (!targetMode) return;

    targetMode.name = newName.trim() || '名称未設定';

    switchToCustomMode();
    saveCurrentModeState();
    saveData();
    renderTabs();
}

// --- 新しい遊技状態（タブ）の追加 ---
function addMode() {
    if (modes.length >= 6) {
        alert('状態は最大6つまでしか追加できません。');
        return;
    }
    saveCurrentModeState();

    const newId = 'mode-' + Date.now().toString();
    const newMode = {
        id: newId,
        name: '新規状態',
        gameItems: [
            { id: 'current', name: '総回転数', value: 0, op: 'add' }
        ],
        totalGames: 0,
        counters: [JSON.parse(JSON.stringify(DEFAULT_COUNTERS_DATA[0]))]
    };

    modes.push(newMode);
    
    switchToCustomMode();
    currentModeId = newId;
    updateModePointers();

    saveData();
    renderTabs();
    renderGameItems();
    renderCounters();
    generateModelTableHeader();
    generateModelTable();
    updateUI();
}

// --- 遊技状態（タブ）の削除 ---
function deleteMode(modeId) {
    if (modes.length <= 1) return;

    const targetMode = modes.find(m => m.id === modeId);
    if (!targetMode) return;

    if (confirm(`状態「${targetMode.name}」を削除してもよろしいですか？\nこの状態のゲーム数とカウントデータは完全に消去されます。`)) {
        saveCurrentModeState();

        modes = modes.filter(m => m.id !== modeId);

        if (currentModeId === modeId) {
            currentModeId = modes[0].id;
        }

        updateModePointers();
        switchToCustomMode();
        saveData();

        renderTabs();
        renderGameItems();
        renderCounters();
        generateModelTableHeader();
        generateModelTable();
        updateUI();
    }
}

// --- タブUIのHTML動的レンダリング ---
function renderTabs() {
    if (!modeTabsContainer) return;
    modeTabsContainer.innerHTML = '';

    modes.forEach(m => {
        const tabBtn = document.createElement('div');
        tabBtn.className = `tab-btn ${m.id === currentModeId ? 'active' : ''}`;
        tabBtn.id = `tab-${m.id}`;
        if (isEditMode) {
            tabBtn.classList.add('edit-mode-active');
        }
        tabBtn.onclick = () => switchMode(m.id);
        tabBtn.title = 'ダブルクリックでタブ名を編集';
        tabBtn.ondblclick = (e) => {
            e.stopPropagation();
            const newName = prompt('状態（タブ）の名称を入力してください：', m.name);
            if (newName !== null) {
                const trimmed = newName.trim();
                if (trimmed) {
                    updateModeName(m.id, trimmed);
                }
            }
        };

        const nameLabel = document.createElement('span');
        nameLabel.className = 'tab-name-label';
        nameLabel.textContent = m.name;
        tabBtn.appendChild(nameLabel);

        if (modes.length > 1) {
            const delBtn = document.createElement('span');
            delBtn.className = 'tab-delete-btn';
            delBtn.innerHTML = '&times;';
            delBtn.title = '削除';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteMode(m.id);
            };
            tabBtn.appendChild(delBtn);
        }

        modeTabsContainer.appendChild(tabBtn);
    });

    // 古いモード追加ボタン（tab-add-btn）の残骸があれば削除する
    const wrapper = modeTabsContainer.parentElement;
    if (wrapper && wrapper.classList.contains('mode-tabs-wrapper')) {
        const oldAddBtn = wrapper.querySelector('.tab-add-btn');
        if (oldAddBtn) oldAddBtn.remove();
    }
}

// --- トータルゲーム数の演算処理 ---
function calculateTotalGames() {
    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    let sumAdd = 0;
    let sumSub = 0;
    
    if (activeMode && activeMode.gameItems) {
        activeMode.gameItems.forEach(item => {
            if (item.op === 'add') sumAdd += item.value;
            else if (item.op === 'sub') sumSub += item.value;
        });
    }
    
    totalGames = sumAdd - sumSub;
    if (totalGames < 0) {
        totalGames = 0;
    }
    
    if (activeMode) {
        activeMode.totalGames = totalGames;
    }
}

// --- ゲーム数値変更ハンドラ ---
function handleGameItemValueChange(itemId, value) {
    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (!activeMode || !activeMode.gameItems) return;

    const targetItem = activeMode.gameItems.find(item => item.id === itemId);
    if (!targetItem) return;

    const intVal = parseInt(value, 10);
    targetItem.value = isNaN(intVal) || intVal < 0 ? 0 : intVal;

    calculateTotalGames();
    saveCurrentModeState();
    saveData();
    updateUI();
}

// --- ゲーム数項目名の変更ハンドラ ---
function updateGameItemName(itemId, newName) {
    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (!activeMode || !activeMode.gameItems) return;

    const targetItem = activeMode.gameItems.find(item => item.id === itemId);
    if (!targetItem) return;

    targetItem.name = newName.trim() || 'ゲーム数';

    switchToCustomMode();
    saveCurrentModeState();
    saveData();
}

// --- 新しいゲーム数入力項目の追加 ---
function addGameItem() {
    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (!activeMode) return;

    if (!activeMode.gameItems) {
        activeMode.gameItems = [];
    }

    if (activeMode.gameItems.length >= 6) {
        alert('ゲーム数項目は最大6個までです。');
        return;
    }

    const newId = 'game-' + Date.now().toString();
    activeMode.gameItems.push({
        id: newId,
        name: '新規ゲーム数',
        value: 0,
        op: 'add'
    });

    calculateTotalGames();
    switchToCustomMode();
    saveCurrentModeState();
    saveData();
    renderGameItems();
    updateUI();
}

// --- ゲーム数入力項目の削除 ---
function deleteGameItem(itemId) {
    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (!activeMode || !activeMode.gameItems) return;

    if (activeMode.gameItems.length <= 1) {
        alert('ゲーム数項目は最低 1 つ必要です。');
        return;
    }

    const targetItem = activeMode.gameItems.find(item => item.id === itemId);
    const name = targetItem ? targetItem.name : 'この項目';

    if (confirm(`ゲーム数項目「${name}」を削除してもよろしいですか？`)) {
        activeMode.gameItems = activeMode.gameItems.filter(item => item.id !== itemId);
        
        calculateTotalGames();
        switchToCustomMode();
        saveCurrentModeState();
        saveData();
        renderGameItems();
        updateUI();
    }
}

// --- ゲーム数項目の演算トグル（＋/－） ---
function toggleGameItemOp(itemId) {
    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (!activeMode || !activeMode.gameItems) return;

    const targetItem = activeMode.gameItems.find(item => item.id === itemId);
    if (!targetItem) return;

    targetItem.op = targetItem.op === 'add' ? 'sub' : 'add';

    calculateTotalGames();
    switchToCustomMode();
    saveCurrentModeState();
    saveData();
    renderGameItems();
    updateUI();
}

// --- ゲーム数入力エリアの動的描画 ---
function renderGameItems() {
    if (!calculationRowContainer) return;
    calculationRowContainer.innerHTML = '';

    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (!activeMode || !activeMode.gameItems) return;

    activeMode.gameItems.forEach(item => {
        const groupDiv = document.createElement('div');
        groupDiv.className = `calc-group ${item.id}`;

        if (activeMode.gameItems.length > 1) {
            const delBtn = document.createElement('button');
            delBtn.className = 'game-item-delete-btn';
            delBtn.innerHTML = '&times;';
            delBtn.title = '削除';
            delBtn.onclick = () => deleteGameItem(item.id);
            groupDiv.appendChild(delBtn);
        }

        const labelWrapper = document.createElement('div');
        labelWrapper.className = 'calc-label-wrapper';

        const opBtn = document.createElement('button');
        opBtn.className = `op-toggle-btn ${item.op === 'add' ? 'op-add' : 'op-sub'}`;
        opBtn.textContent = item.op === 'add' ? '＋' : '－';
        opBtn.title = item.op === 'add' ? '現在：トータルGに加算' : '現在：トータルGから減算';
        opBtn.onclick = () => toggleGameItemOp(item.id);
        labelWrapper.appendChild(opBtn);

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.className = 'calc-label-input';
        labelInput.value = item.name;
        labelInput.title = 'クリックして項目名を変更';
        labelInput.oninput = (e) => updateGameItemName(item.id, e.target.value);
        labelWrapper.appendChild(labelInput);

        groupDiv.appendChild(labelWrapper);

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'calc-input-wrapper';

        const numInput = document.createElement('input');
        numInput.type = 'number';
        numInput.value = item.value;
        numInput.min = '0';
        numInput.oninput = (e) => handleGameItemValueChange(item.id, e.target.value);
        inputWrapper.appendChild(numInput);

        const unitOverlay = document.createElement('span');
        unitOverlay.className = 'unit-overlay';
        unitOverlay.textContent = 'G';
        inputWrapper.appendChild(unitOverlay);

        groupDiv.appendChild(inputWrapper);

        calculationRowContainer.appendChild(groupDiv);
    });
}

// --- 使用設定（設定トグル）の動的描画 ---
function renderSettingControls() {
    if (!activeSettingsControl) return;
    activeSettingsControl.innerHTML = '';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'control-label';
    labelSpan.textContent = '設定：';
    activeSettingsControl.appendChild(labelSpan);

    for (let s = 0; s < 6; s++) {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = enabledSettings[s];
        checkbox.onchange = (e) => toggleSettingEnabled(s, e.target.checked);
        label.appendChild(checkbox);

        const text = document.createTextNode(` 設定${s+1}`);
        label.appendChild(text);

        activeSettingsControl.appendChild(label);
    }
}

// --- 使用設定トグルのオン・オフ切り替え ---
function toggleSettingEnabled(index, checked) {
    const activeCount = enabledSettings.filter(v => v).length;
    if (activeCount <= 1 && !checked) {
        alert('設定は最低でも1つ以上有効にしてください。');
        renderSettingControls();
        return;
    }

    enabledSettings[index] = checked;
    
    switchToCustomMode();
    saveCurrentModeState();
    saveData();

    generateModelTableHeader();
    generateModelTable();
    updateUI();
}

// --- 設定差テーブルの動的ヘッダー生成 ---
function generateModelTableHeader() {
    if (!modelTableHeader) return;
    modelTableHeader.innerHTML = '';

    const tr = document.createElement('tr');

    const firstTh = document.createElement('th');
    firstTh.textContent = '小役';
    tr.appendChild(firstTh);

    for (let s = 0; s < 6; s++) {
        if (enabledSettings[s]) {
            const th = document.createElement('th');
            th.textContent = `設定${s+1}`;
            tr.appendChild(th);
        }
    }

    modelTableHeader.appendChild(tr);
}

// --- 機種セレクトボックスの動的生成 ---
function renderModelOptions() {
    if (!modelSelect) return;
    
    modelSelect.innerHTML = '';

    const optCustom = document.createElement('option');
    optCustom.value = 'custom';
    optCustom.textContent = MODEL_PRESETS.custom.name;
    modelSelect.appendChild(optCustom);

    for (const key in MODEL_PRESETS) {
        if (key === 'custom') continue;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = MODEL_PRESETS[key].name;
        modelSelect.appendChild(opt);
    }

    for (const key in userPresets) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = userPresets[key].name;
        modelSelect.appendChild(opt);
    }

    modelSelect.value = currentModelKey;

    if (deleteModelBtn) {
        if (currentModelKey.startsWith('user-preset-')) {
            deleteModelBtn.removeAttribute('disabled');
        } else {
            deleteModelBtn.setAttribute('disabled', 'true');
        }
    }
}

// --- カウンターの動的追加 ---
function addCounter() {
    const symbolIndex = counters.length % SYMBOL_POOL.length;
    const symbol = SYMBOL_POOL[symbolIndex];
    const newId = 'custom-' + Date.now().toString();
    
    // 現在アクティブなモードの counters にのみ追加
    counters.push({
        id: newId,
        name: '新規小役',
        symbol: symbol,
        count: 0,
        manualRate: 0,
        color: '#FF9100',
        denominators: [0, 0, 0, 0, 0, 0],
        sound: 'pip'
    });

    saveCurrentModeState(); // 変更をアクティブモードオブジェクトへ書き戻す
    switchToCustomMode();
    updateModePointers();
    
    saveData();
    renderCounters();
    generateModelTable();
    updateUI();
}

// --- 合算小役の動的追加 ---
function addCombinedCounter() {
    const newId = 'combined-' + Date.now().toString();
    
    // 現在アクティブなモードの counters にのみ追加
    counters.push({
        id: newId,
        name: '新規合算',
        symbol: '➕',
        count: 0,
        manualRate: 0,
        isCombined: true,
        combinedIds: [],
        color: '#E65100',
        denominators: [0, 0, 0, 0, 0, 0],
        sound: 'pip'
    });

    saveCurrentModeState(); // 変更をアクティブモードオブジェクトへ書き戻す
    switchToCustomMode();
    updateModePointers();
    
    saveData();
    renderCounters();
    generateModelTable();
    updateUI();
}

// --- 当選率カウンターの動的追加 ---
function addRateCounter() {
    const newId = 'rate-' + Date.now().toString();
    
    // 現在アクティブなモードの counters にのみ追加
    counters.push({
        id: newId,
        name: '新規当選率',
        symbol: '🎯',
        count: 0,
        manualRate: 0,
        isRate: true,
        rateNumeratorId: '',   // 分子カウンターID
        rateDenominatorId: '', // 分母カウンターID
        denominators: [0, 0, 0, 0, 0, 0],
        sound: 'pip'
    });

    saveCurrentModeState(); // 変更をアクティブモードオブジェクトへ書き戻す
    switchToCustomMode();
    updateModePointers();
    
    saveData();
    renderCounters();
    generateModelTable();
    updateUI();
}

// --- カウンターの削除 ---
function deleteCounter(id) {
    const target = counters.find(c => c.id === id);
    if (!target) return;

    if (confirm(`項目「${target.name}」を削除してもよろしいですか？`)) {
        // 現在アクティブなモードの counters からのみ削除
        counters = counters.filter(c => c.id !== id);

        // 現在アクティブなモード内の合算および当選率の紐付けを解除
        counters.forEach(c => {
            if (c.isCombined && c.combinedIds) {
                c.combinedIds = c.combinedIds.filter(tid => tid !== id);
            }
            if (c.isRate) {
                if (c.rateNumeratorId === id) c.rateNumeratorId = '';
                if (c.rateDenominatorId === id) c.rateDenominatorId = '';
            }
        });

        // 変更した counters をアクティブなモードに書き戻す
        saveCurrentModeState();

        switchToCustomMode();
        updateModePointers();

        saveData();
        renderCounters();
        generateModelTable();
        updateUI();
    }
}



// --- カウンター名称の編集 ---
function updateCounterName(id, newName) {
    const target = counters.find(c => c.id === id);
    if (!target) return;

    target.name = newName.trim() || '名称未設定';
    
    switchToCustomMode();
    saveCurrentModeState();

    saveData();
    generateModelTable();
    updateUI();
}

// --- カウンターカウントボタン色の編集 ---
function updateCounterColor(id, newColor) {
    // 全状態タブの同ID小役のボタン色を同期して更新
    modes.forEach(m => {
        const target = m.counters.find(c => c.id === id);
        if (target) {
            target.color = newColor;
        }
    });

    const target = counters.find(c => c.id === id);
    if (target) {
        target.color = newColor;
    }
    
    switchToCustomMode();
    saveCurrentModeState();
    saveData();
    renderCounters();
    updateUI();
}

// --- カウンター絵文字の編集 ---
function updateCounterSymbol(id, newSymbol) {
    // 全状態タブの同ID小役の絵文字を同期して更新
    modes.forEach(m => {
        const target = m.counters.find(c => c.id === id);
        if (target) {
            target.symbol = newSymbol;
        }
    });

    const target = counters.find(c => c.id === id);
    if (target) {
        target.symbol = newSymbol;
    }
    
    switchToCustomMode();
    saveCurrentModeState();
    saveData();
    renderCounters();
    updateUI();
}

// --- 当選率カウンターの分子の更新ハンドラ（全モードで同期） ---
function updateRateNumerator(rateId, numeratorId) {
    modes.forEach(m => {
        const target = m.counters.find(c => c.id === rateId);
        if (target) {
            target.rateNumeratorId = numeratorId;
        }
    });

    switchToCustomMode();
    syncCombinedCounts();
    saveCurrentModeState();
    saveData();
    renderCounters();
    updateUI();
}

// --- 当選率カウンターの分母の更新ハンドラ（全モードで同期） ---
function updateRateDenominator(rateId, denominatorId) {
    modes.forEach(m => {
        const target = m.counters.find(c => c.id === rateId);
        if (target) {
            target.rateDenominatorId = denominatorId;
        }
    });

    switchToCustomMode();
    syncCombinedCounts();
    saveCurrentModeState();
    saveData();
    renderCounters();
    updateUI();
}

// --- 合算対象小役のトグル処理 ---
function toggleCombinedTarget(combinedId, targetId, checked) {
    const combinedCounter = counters.find(c => c.id === combinedId);
    if (!combinedCounter) return;

    if (checked) {
        if (!combinedCounter.combinedIds.includes(targetId)) {
            combinedCounter.combinedIds.push(targetId);
        }
    } else {
        combinedCounter.combinedIds = combinedCounter.combinedIds.filter(id => id !== targetId);
    }

    syncCombinedCounts();
    saveCurrentModeState();
    saveData();
    updateUI();
}

// --- 合算・当選率カウンターの集計処理 ---
function syncCombinedCounts() {
    modes.forEach(m => {
        // 通常の合算集計
        m.counters.forEach(c => {
            if (c.isCombined) {
                c.count = m.counters
                    .filter(x => !x.isCombined && !x.isRate && c.combinedIds.includes(x.id))
                    .reduce((sum, x) => sum + x.count, 0);
            }
        });
        
        // 当選率集計
        m.counters.forEach(c => {
            if (c.isRate) {
                const numer = m.counters.find(x => x.id === c.rateNumeratorId);
                const denom = m.counters.find(x => x.id === c.rateDenominatorId);
                const numerCount = numer ? numer.count : 0;
                const denomCount = denom ? denom.count : 0;
                
                c.count = numerCount;
                c.calculatedPercent = denomCount > 0 ? (numerCount / denomCount) * 100 : 0;
                c.calculatedDenominator = numerCount > 0 ? denomCount / numerCount : 0;
            }
        });
    });

    const activeMode = modes.find(m => m.id === currentModeId);
    if (activeMode) {
        counters = activeMode.counters;
    }
}

// 機種をカスタムに変更する処理
function switchToCustomMode() {
    if (currentModelKey !== 'custom') {
        currentModelKey = 'custom';
        modelSelect.value = 'custom';
        if (deleteModelBtn) {
            deleteModelBtn.setAttribute('disabled', 'true');
        }
    }
}

// --- 小役のカウント増減 ---
function countUp(id, amount) {
    if (isEditMode) return; // ボタン編集モードONの時はカウント操作を無効化
    const target = counters.find(c => c.id === id);
    if (!target) return;

    // タップ操作時にバイブレーションを実行
    triggerVibrate();

    target.count += amount;
    if (target.count < 0) {
        target.count = 0;
    } else if (amount > 0) {
        // カウント加算時のみ効果音を再生
        playSound(target.sound || 'pip');
    }

    syncCombinedCounts();
    saveCurrentModeState();
    saveData();
    updateUI();
}

// --- 機種の切り替え ---
function handleModelChange(value) {
    disableEditMode();
    currentModelKey = value;

    if (value === 'custom') {
        // カスタムの場合は現在のリストを維持
    } else if (value.startsWith('user-preset-')) {
        if (userPresets[value] && userPresets[value].presetModeData) {
            modes = JSON.parse(JSON.stringify(userPresets[value].presetModeData));
        }
        if (userPresets[value] && userPresets[value].enabledSettings) {
            enabledSettings = JSON.parse(JSON.stringify(userPresets[value].enabledSettings));
        } else {
            enabledSettings = [true, true, true, true, true, true];
        }
    } else {
        if (MODEL_PRESETS[value] && MODEL_PRESETS[value].presetCounters) {
            modes.forEach(m => {
                m.counters = JSON.parse(JSON.stringify(MODEL_PRESETS[value].presetCounters));
            });
        }
        enabledSettings = [true, true, true, true, true, true];
    }

    if (!modes.some(m => m.id === currentModeId)) {
        currentModeId = modes[0].id;
    }

    updateModePointers();

    if (deleteModelBtn) {
        if (value.startsWith('user-preset-')) {
            deleteModelBtn.removeAttribute('disabled');
        } else {
            deleteModelBtn.setAttribute('disabled', 'true');
        }
    }
    
    syncCombinedCounts();
    saveData();
    renderTabs();
    renderGameItems();
    renderSettingControls();
    renderCounters();
    generateModelTableHeader();
    generateModelTable();
    updateUI();
    loadModelMemoAndGallery();
}

// --- 機種の新規保存アクション ---
function saveCurrentModelAsPreset() {
    const presetName = prompt('現在のすべての状態タブの構成と設定差を新規機種として保存します。\n機種名を入力してください：');
    if (!presetName || !presetName.trim()) return;

    saveCurrentModeState();

    const presetId = 'user-preset-' + Date.now().toString();
    userPresets[presetId] = {
        name: presetName.trim(),
        presetModeData: JSON.parse(JSON.stringify(modes)),
        enabledSettings: JSON.parse(JSON.stringify(enabledSettings))
    };

    currentModelKey = presetId;
    saveData();
    
    renderModelOptions();
    handleModelChange(presetId);
}

// --- 機種の削除アクション ---
function deleteCurrentModelPreset() {
    if (!currentModelKey.startsWith('user-preset-')) return;

    const presetName = userPresets[currentModelKey]?.name || 'この機種';
    if (confirm(`保存された機種「${presetName}」を削除してもよろしいですか？`)) {
        delete userPresets[currentModelKey];
        
        currentModelKey = 'custom';
        saveData();
        renderModelOptions();
        handleModelChange('custom');
    }
}

// --- 小役カードのHTML動的レンダリング ---
function renderCounters() {
    if (!countersGrid) return;
    
    countersGrid.innerHTML = '';

    const defaultColors = {
        bell: '#FFA000',
        'weak-cherry': '#FF5252',
        'strong-cherry': '#D32F2F',
        'middle-cherry': '#E040FB',
        'weak-suika': '#81C784',
        'strong-suika': '#2E7D32',
        chance: '#FF4081',
        special: '#FFD700',
        other: '#90A4AE'
    };

    counters.forEach(c => {
        const card = document.createElement('div');
        let cardClass = 'counter-card ' + c.id;
        if (c.isCombined) cardClass += ' combined-counter';
        if (c.isRate) cardClass += ' rate-counter';
        card.className = cardClass;

        // 各小役カードのカスタムカラー（枠線用）を適用
        const currentBtnColor = c.color || defaultColors[c.id] || (c.isRate ? '#90A4AE' : '#FF9100');
        card.style.setProperty('border-color', currentBtnColor, 'important');

        // 各カードに data-id 属性を設定（ドラッグ後の順番同期用）
        card.setAttribute('data-id', c.id);

        // カード全体をクリックまたはタップした際のカウント処理
        card.onclick = (e) => {
            // セレクトボックス（🎨や🎵、🍒など）、入力欄、削除ボタンなどがクリックされた時はカウント処理を行わない
            if (e.target.tagName === 'SELECT' || e.target.closest('select') || 
                e.target.tagName === 'INPUT' || e.target.closest('input') || 
                e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            if (isEditMode) return; // 編集モード時はカウントをガード
            if (c.isRate || c.isCombined) return; // 当選率・合算カードはカウント対象外
            
            // 現在のモード（加算 / 減算）に応じて増減
            if (isDecrementMode) {
                countUp(c.id, -1);
            } else {
                countUp(c.id, 1);
            }
        };

        // ドラッグ＆ドロップ属性とイベント設定
        card.setAttribute('draggable', isEditMode ? 'true' : 'false');
        if (isEditMode) {
            card.classList.add('draggable-card');
            card.classList.add('edit-mode-active');
        }

        card.addEventListener('dragstart', (e) => {
            if (!isEditMode) {
                e.preventDefault();
                return;
            }
            card.classList.add('dragging');
            const grid = document.getElementById('counters-grid');
            if (grid) {
                grid.classList.add('grid-dragging');
            }
            e.dataTransfer.setData('text/plain', c.id);
            // ドラッグ開始時の視覚効果（少し透明にする）
            setTimeout(() => {
                card.style.opacity = '0.4';
            }, 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            card.style.opacity = '1';
            const grid = document.getElementById('counters-grid');
            if (grid) {
                grid.classList.remove('grid-dragging');
            }
            // 全てのカードからホバー用のハイライトクラスを削除
            document.querySelectorAll('.counter-card').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        card.addEventListener('dragenter', (e) => {
            if (!isEditMode) return;
            e.preventDefault();
            // 自分自身（ドラッグ中のカード）でなければ、重ねた時にハイライトする
            if (!card.classList.contains('dragging')) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragover', (e) => {
            if (!isEditMode) return;
            e.preventDefault();
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            if (!isEditMode) return;
            e.preventDefault();
            card.classList.remove('drag-over');

            const draggingCard = document.querySelector('.counter-card.dragging');
            if (draggingCard && draggingCard !== card) {
                // ドラッグ中カードをドロップした位置に挿入する
                insertElement(draggingCard, card);
                
                // ドロップ完了時に順序を同期して保存
                saveCountersOrder();
            }
        });

        // スマートフォン（タッチデバイス）向けのドラッグ＆ドロップサポート（誤作動防止のための1秒長押し移動化）
        let dragTimeout = null;
        let startX = 0;
        let startY = 0;
        let isLongPressed = false;

        card.addEventListener('touchstart', (e) => {
            if (!isEditMode) return;
            // 各種設定ボタンやアコーディオン、選択セレクト上でのタッチ時はドラッグを開始しない（誤操作防止・スマホ時スクロール可能化）
            if (e.target.closest('.card-delete-btn') || 
                e.target.closest('.color-select') || 
                e.target.closest('.sound-select-wrapper') || 
                e.target.closest('.combined-targets') || 
                e.target.closest('.rate-select-group') || 
                e.target.tagName === 'SELECT' || 
                e.target.closest('select')) {
                return;
            }

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isLongPressed = false;

            if (dragTimeout) clearTimeout(dragTimeout);

            // 1秒（1000ms）長押し後に初めてドラッグを開始
            dragTimeout = setTimeout(() => {
                isLongPressed = true;
                card.classList.add('dragging');
                const grid = document.getElementById('counters-grid');
                if (grid) {
                    grid.classList.add('grid-dragging');
                }
                card.style.opacity = '0.5';

                // 長押し成功を知らせる短いバイブレーション
                if (navigator.vibrate) {
                    navigator.vibrate(40);
                }
            }, 1000);
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (!isEditMode) return;

            const touch = e.touches[0];
            const diffX = Math.abs(touch.clientX - startX);
            const diffY = Math.abs(touch.clientY - startY);

            // 1秒経過前に指が10px以上動いた場合は、スクロール目的と判断して長押しタイマーを解除
            if (!isLongPressed) {
                if (diffX > 10 || diffY > 10) {
                    if (dragTimeout) {
                        clearTimeout(dragTimeout);
                        dragTimeout = null;
                    }
                }
                return;
            }

            // 1秒経過後のドラッグ処理（画面スクロールを防止）
            if (e.cancelable) {
                e.preventDefault();
            }
            const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!targetEl) return;

            const targetCard = targetEl.closest('.counter-card');
            
            // 全てのカードから一旦ホバークラスを除去
            document.querySelectorAll('.counter-card').forEach(el => {
                if (el !== targetCard) el.classList.remove('drag-over');
            });

            if (targetCard && targetCard !== card) {
                targetCard.classList.add('drag-over');
            }
        }, { passive: false });

        const endDragHandler = (e) => {
            if (dragTimeout) {
                clearTimeout(dragTimeout);
                dragTimeout = null;
            }

            if (!isEditMode || !isLongPressed || !card.classList.contains('dragging')) return;

            card.classList.remove('dragging');
            card.style.opacity = '1';
            const grid = document.getElementById('counters-grid');
            if (grid) {
                grid.classList.remove('grid-dragging');
            }

            const targetCard = document.querySelector('.counter-card.drag-over');
            if (targetCard && targetCard !== card) {
                // 指を離した位置にドラッグ中カードを挿入する
                insertElement(card, targetCard);
                saveCountersOrder();
            }

            // 全てのカードからハイライトを確実に消去
            document.querySelectorAll('.counter-card').forEach(el => {
                el.classList.remove('drag-over');
            });
            isLongPressed = false;
        };

        card.addEventListener('touchend', endDragHandler);
        card.addEventListener('touchcancel', endDragHandler);

        // 編集モードON時の長押し操作によるPC・スマホブラウザの右クリックメニュー（コンテキストメニュー）表示を防止
        card.addEventListener('contextmenu', (e) => {
            if (isEditMode) {
                e.preventDefault();
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'card-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = '削除';
        deleteBtn.style.display = isEditMode ? 'flex' : 'none';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteCounter(c.id);
        };
        card.appendChild(deleteBtn);

        const header = document.createElement('div');
        header.className = 'card-header';
        
        // カラー選択（全てのカード）を配置
        const colorSelect = document.createElement('select');
        colorSelect.className = 'color-select';
        colorSelect.title = 'ボタンの色を変更';
        colorSelect.style.display = isEditMode ? 'inline-flex' : 'none';
        colorSelect.onclick = (e) => e.stopPropagation();
        colorSelect.ontouchstart = (e) => e.stopPropagation();
        colorSelect.ontouchend = (e) => e.stopPropagation();
        colorSelect.onchange = (e) => {
            if (e.target.value) {
                updateCounterColor(c.id, e.target.value);
            }
        };

        const optPlaceholder = document.createElement('option');
        optPlaceholder.value = '';
        optPlaceholder.textContent = '🎨';
        optPlaceholder.selected = true;
        colorSelect.appendChild(optPlaceholder);

        // ユーザー指定 of 11色＋被らない3色（明るい配色バージョン、スマホでも認識できるようにカラー名を付与）
        const PALETTE_COLORS = [
            { code: '#FFFFFF', name: '白' },
            { code: '#2196F3', name: '青' },
            { code: '#FFEB3B', name: '黄' },
            { code: '#2E7D32', name: '緑' },
            { code: '#FF5252', name: '赤' },
            { code: '#FF4081', name: 'ピンク' },
            { code: '#E040FB', name: '紫' },
            { code: '#B0BEC5', name: '灰' },
            { code: '#00E5FF', name: '水色' },
            { code: '#8BC34A', name: '黄緑' },
            { code: '#FF9100', name: 'オレンジ' },
            { code: '#333333', name: '黒' },
            { code: '#8D6E63', name: '茶色' },
            { code: '#5C6BC0', name: '紺色' }
        ];

        PALETTE_COLORS.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.code;
            opt.textContent = `■ ${p.name}`; // スマホのOS標準ピッカー対策として「■ 色の名前」の形式に変更
            opt.style.color = p.code;
            opt.style.backgroundColor = 'var(--input-bg)';
            colorSelect.appendChild(opt);
        });

        header.appendChild(colorSelect);

        // サウンド選択セレクト（当選率カードおよび合算カード以外のみ生成）
        if (!c.isRate && !c.isCombined) {
            const soundWrapper = document.createElement('div');
            soundWrapper.className = 'sound-select-wrapper';
            soundWrapper.style.display = isEditMode ? 'inline-flex' : 'none';
            soundWrapper.style.position = 'relative';
            soundWrapper.style.width = '18px';
            soundWrapper.style.height = '18px';
            soundWrapper.style.alignItems = 'center';
            soundWrapper.style.justifyContent = 'center';
            soundWrapper.style.cursor = 'pointer';
            soundWrapper.style.transition = 'var(--transition)';
            soundWrapper.onclick = (e) => e.stopPropagation();
            soundWrapper.ontouchstart = (e) => e.stopPropagation();
            soundWrapper.ontouchend = (e) => e.stopPropagation();
            
            const noteIcon = document.createElement('span');
            noteIcon.className = 'sound-note-icon';
            noteIcon.textContent = '🎵';
            noteIcon.style.fontSize = '12px';
            noteIcon.style.color = 'var(--text-muted)';
            noteIcon.style.pointerEvents = 'none';
            soundWrapper.appendChild(noteIcon);

            const soundSelect = document.createElement('select');
            soundSelect.className = 'sound-select';
            soundSelect.title = '加算時の効果音を変更';
            soundSelect.onclick = (e) => e.stopPropagation();
            soundSelect.ontouchstart = (e) => e.stopPropagation();
            soundSelect.ontouchend = (e) => e.stopPropagation();
            soundSelect.style.position = 'absolute';
            soundSelect.style.top = '0';
            soundSelect.style.left = '0';
            soundSelect.style.width = '100%';
            soundSelect.style.height = '100%';
            soundSelect.style.opacity = '0'; // 完全に透明にして重ねる
            soundSelect.style.cursor = 'pointer';
            
            const soundOptions = [
                { value: 'none', label: 'なし' },
                { value: 'pip', label: '1' },
                { value: 'pikop', label: '2' },
                { value: 'peen', label: '3' },
                { value: 'coin', label: '4' },
                { value: 'kachi', label: '5' },
                { value: 'typewriter', label: '6' },
                { value: 'kyuin', label: '7' },
                { value: 'gako', label: '8' },
                { value: 'shot', label: '9' }
            ];
            
            soundOptions.forEach(optData => {
                const opt = document.createElement('option');
                opt.value = optData.value;
                opt.textContent = optData.label;
                if (c.sound === optData.value || (!c.sound && optData.value === 'pip')) {
                    opt.selected = true;
                }
                soundSelect.appendChild(opt);
            });
            
            soundSelect.onchange = (e) => {
                const newSound = e.target.value;
                c.sound = newSound;
                // 他の状態（モード）の同IDのカウンターにも同期する
                modes.forEach(m => {
                    const targetC = m.counters.find(tc => tc.id === c.id);
                    if (targetC) targetC.sound = newSound;
                });
                saveData();
                playSound(newSound); // その場でテスト再生
            };
            
            soundWrapper.appendChild(soundSelect);
            header.appendChild(soundWrapper);
        }

        const symbolSelect = document.createElement('select');
        symbolSelect.className = 'symbol-select';
        if (c.symbol === '') {
            symbolSelect.classList.add('empty');
        }
        symbolSelect.disabled = !isEditMode;
        
        // 編集時のクリック・タッチ伝播を遮断し、親要素のドラッグ挙動等との干渉バグを解消
        symbolSelect.onclick = (e) => e.stopPropagation();
        symbolSelect.ontouchstart = (e) => e.stopPropagation();
        symbolSelect.ontouchend = (e) => e.stopPropagation();
        
        symbolSelect.onchange = (e) => updateCounterSymbol(c.id, e.target.value);
        
        SYMBOL_POOL.forEach(sym => {
            const opt = document.createElement('option');
            opt.value = sym;
            opt.textContent = sym === '' ? 'なし' : sym;
            if (sym === c.symbol) {
                opt.selected = true;
            }
            symbolSelect.appendChild(opt);
        });
        symbolSelect.value = c.symbol || ''; // 明示的に選択値を同期
        header.appendChild(symbolSelect);

        if (isEditMode) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'name-input';
            nameInput.value = c.name;
            nameInput.maxLength = 12; // 最大12文字に制限
            if (c.name && c.name.length > 6) {
                nameInput.classList.add('long-name');
            }
            nameInput.oninput = (e) => {
                const val = e.target.value;
                if (val.length > 6) {
                    e.target.classList.add('long-name');
                } else {
                    e.target.classList.remove('long-name');
                }
                updateCounterName(c.id, val);
            };
            header.appendChild(nameInput);
        } else {
            const nameSpan = document.createElement('span');
            nameSpan.className = 'name-text';
            if (c.name && c.name.length > 6) {
                nameSpan.classList.add('long-name');
                // 6文字を超えたら6文字目で強制的に改行を挿入して表示（XSS対策のため安全なテキストノード生成を使用）
                const part1 = document.createTextNode(c.name.slice(0, 6));
                const part2 = document.createTextNode(c.name.slice(6));
                const br = document.createElement('br');
                nameSpan.appendChild(part1);
                nameSpan.appendChild(br);
                nameSpan.appendChild(part2);
            } else {
                nameSpan.textContent = c.name;
            }
            header.appendChild(nameSpan);
        }

        card.appendChild(header);

        // コンテンツ描画の分岐（当選率カードかそれ以外か）
        if (c.isRate) {
            const numerItem = counters.find(x => x.id === c.rateNumeratorId);
            const denomItem = counters.find(x => x.id === c.rateDenominatorId);
            const numVal = numerItem ? numerItem.count : 0;
            const denVal = denomItem ? denomItem.count : 0;

            const rateHeaderDiv = document.createElement('div');
            rateHeaderDiv.className = 'rate-header-display';

            const ratioSpan = document.createElement('span');
            ratioSpan.id = `${c.id}-rate-ratio`;
            ratioSpan.className = 'rate-ratio-text';
            ratioSpan.textContent = `${numVal} / ${denVal}`;
            rateHeaderDiv.appendChild(ratioSpan);

            const rightContainer = document.createElement('div');
            rightContainer.className = 'rate-right-container';

            const percentSpan = document.createElement('span');
            percentSpan.id = `${c.id}-rate-percent`;
            percentSpan.className = 'rate-percent-text';
            percentSpan.textContent = (c.calculatedPercent || 0).toFixed(2) + ' %';
            rightContainer.appendChild(percentSpan);

            const rateSpan = document.createElement('span');
            rateSpan.id = `${c.id}-rate-text`;
            rateSpan.className = 'count-rate-text';
            rateSpan.textContent = '1/ -';
            rightContainer.appendChild(rateSpan);

            rateHeaderDiv.appendChild(rightContainer);
            card.appendChild(rateHeaderDiv);
        } else {
            const display = document.createElement('div');
            display.className = 'count-display';
            
            const leftContainer = document.createElement('div');
            leftContainer.className = 'count-left-container';

            const numSpan = document.createElement('span');
            numSpan.id = `${c.id}-count`;
            numSpan.className = 'digital-number';
            numSpan.textContent = c.count;
            leftContainer.appendChild(numSpan);

            display.appendChild(leftContainer);

            // 確率（分母）表示を回数の右側に統合して配置
            const rateSpan = document.createElement('span');
            rateSpan.id = `${c.id}-rate-text`;
            rateSpan.className = 'count-rate-text';
            rateSpan.textContent = '1/ -';
            display.appendChild(rateSpan);

            card.appendChild(display);
        }

        // 操作部分の生成（通常・合算・当選率で分岐）
        if (c.isCombined) {
            const details = document.createElement('details');
            details.className = 'combined-targets';
            details.style.display = isEditMode ? 'block' : 'none'; // 編集モード時のみ表示
            
            const summary = document.createElement('summary');
            summary.textContent = `合算対象 (${c.combinedIds ? c.combinedIds.length : 0})`;
            details.appendChild(summary);

            const checkboxesDiv = document.createElement('div');
            checkboxesDiv.className = 'target-checkboxes';

            const normalCounters = counters.filter(x => !x.isCombined && !x.isRate);
            if (normalCounters.length === 0) {
                const emptyMsg = document.createElement('span');
                emptyMsg.style.fontSize = '8px';
                emptyMsg.style.color = 'var(--text-muted)';
                emptyMsg.textContent = '通常小役がありません';
                checkboxesDiv.appendChild(emptyMsg);
            } else {
                normalCounters.forEach(nc => {
                    const itemLabel = document.createElement('label');
                    itemLabel.className = 'target-checkbox-item';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = c.combinedIds && c.combinedIds.includes(nc.id);
                    checkbox.onchange = (e) => toggleCombinedTarget(c.id, nc.id, e.target.checked);
                    itemLabel.appendChild(checkbox);

                    const nameText = document.createTextNode(` ${nc.symbol} ${nc.name}`);
                    itemLabel.appendChild(nameText);

                    checkboxesDiv.appendChild(itemLabel);
                });
            }

            // 一番下にOKボタンを配置
            const okBtn = document.createElement('button');
            okBtn.className = 'combined-ok-btn';
            okBtn.textContent = 'OK';
            okBtn.onclick = () => {
                details.open = false;
            };
            checkboxesDiv.appendChild(okBtn);

            details.appendChild(checkboxesDiv);
            card.appendChild(details);
        } else if (c.isRate) {
            const selectGroup = document.createElement('div');
            selectGroup.className = 'rate-select-group';
            selectGroup.style.display = isEditMode ? 'flex' : 'none'; // 編集モード時のみ表示

            // 分子・分母の選択肢として、当選率カード自身を除いた「通常小役」および「合算小役」を選択可能にする
            const selectableCounters = counters.filter(x => !x.isRate && x.id !== c.id);

            // 分子セレクト行
            const numerRow = document.createElement('div');
            numerRow.className = 'rate-select-row';
            
            const numerLabel = document.createElement('span');
            numerLabel.textContent = '分子';
            numerRow.appendChild(numerLabel);

            const numerSelect = document.createElement('select');
            const optNumerEmpty = document.createElement('option');
            optNumerEmpty.value = '';
            optNumerEmpty.textContent = '未選択';
            numerSelect.appendChild(optNumerEmpty);

            selectableCounters.forEach(nc => {
                const opt = document.createElement('option');
                opt.value = nc.id;
                opt.textContent = `${nc.symbol} ${nc.name}`;
                if (nc.id === c.rateNumeratorId) opt.selected = true;
                numerSelect.appendChild(opt);
            });
            numerSelect.onchange = (e) => updateRateNumerator(c.id, e.target.value);
            numerRow.appendChild(numerSelect);
            selectGroup.appendChild(numerRow);

            // 分母セレクト行
            const denomRow = document.createElement('div');
            denomRow.className = 'rate-select-row';

            const denomLabel = document.createElement('span');
            denomLabel.textContent = '分母';
            denomRow.appendChild(denomLabel);

            const denomSelect = document.createElement('select');
            const optDenomEmpty = document.createElement('option');
            optDenomEmpty.value = '';
            optDenomEmpty.textContent = '未選択';
            denomSelect.appendChild(optDenomEmpty);

            selectableCounters.forEach(nc => {
                const opt = document.createElement('option');
                opt.value = nc.id;
                opt.textContent = `${nc.symbol} ${nc.name}`;
                if (nc.id === c.rateDenominatorId) opt.selected = true;
                denomSelect.appendChild(opt);
            });
            denomSelect.onchange = (e) => updateRateDenominator(c.id, e.target.value);
            denomRow.appendChild(denomSelect);
            selectGroup.appendChild(denomRow);

            card.appendChild(selectGroup);
        } else {
            // カウントの増減は小役カード全体のクリックイベント（card.onclick）で処理するため、
            // カード内部の「+1」ボタンおよび「-1」減算ボタンは完全に廃止しました。
        }

        countersGrid.appendChild(card);
    });
}

// --- 設定差データテーブルの動的生成 ---
function generateModelTable() {
    if (!modelTableBody) return;
    modelTableBody.innerHTML = '';

    counters.forEach(c => {
        const row = document.createElement('tr');
        if (c.useInEstimation === false) {
            row.classList.add('excluded-row');
        }
        
        const labelTd = document.createElement('td');
        labelTd.className = 'row-label';
        
        // 推測使用の有無を切り替えるチェックボックスを追加
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'table-use-checkbox';
        checkbox.checked = c.useInEstimation !== false;
        checkbox.onchange = (e) => {
            const isChecked = e.target.checked;
            c.useInEstimation = isChecked;
            
            // 全遊技状態（モードタブ）の同じ小役 ID の状態を同期
            modes.forEach(m => {
                const targetCounter = m.counters.find(x => x.id === c.id);
                if (targetCounter) {
                    targetCounter.useInEstimation = isChecked;
                }
            });
            
            if (isChecked) {
                row.classList.remove('excluded-row');
            } else {
                row.classList.add('excluded-row');
            }
            
            switchToCustomMode();
            saveCurrentModeState();
            saveData();
            updateUI();
        };
        labelTd.appendChild(checkbox);

        // 名称のアイコン（シンボル）を表示
        if (c.symbol) {
            const symbolSpan = document.createElement('span');
            symbolSpan.className = 'table-row-symbol';
            symbolSpan.textContent = c.symbol;
            labelTd.appendChild(symbolSpan);
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'table-row-name';
        nameSpan.textContent = c.name;
        labelTd.appendChild(nameSpan);
        
        row.appendChild(labelTd);

        for (let s = 0; s < 6; s++) {
            if (enabledSettings[s]) {
                const td = document.createElement('td');
                const wrapper = document.createElement('div');
                wrapper.className = c.isRate ? 'table-rate-input-wrapper' : 'table-denom-input-wrapper';

                if (!c.isRate) {
                    const unitSpan = document.createElement('span');
                    unitSpan.className = 'table-unit';
                    unitSpan.textContent = '1/';
                    wrapper.appendChild(unitSpan);
                }

                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.value = c.denominators[s] ? c.denominators[s].toFixed(2) : '';
                input.placeholder = '-';
                
                input.oninput = (e) => {
                    const val = parseFloat(e.target.value);
                    c.denominators[s] = isNaN(val) || val <= 0 ? 0 : val;
                    
                    switchToCustomMode();
                    saveCurrentModeState();
                    saveData();
                    updateUI();
                };

                input.onchange = (e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                        e.target.value = val.toFixed(2);
                    }
                };
                wrapper.appendChild(input);

                if (c.isRate) {
                    const unitSpan = document.createElement('span');
                    unitSpan.className = 'table-unit';
                    unitSpan.textContent = '%';
                    wrapper.appendChild(unitSpan);
                }

                td.appendChild(wrapper);
                row.appendChild(td);
            }
        }

        modelTableBody.appendChild(row);
    });
}

// --- 設定推測（総合ベイズ推定）の計算 ---
function calculateEstimation() {
    const logLikelihoods = [0, 0, 0, 0, 0, 0];
    let hasValidData = false;

    syncCombinedCounts();

    modes.forEach(m => {
        const N_default = m.totalGames;
        if (N_default <= 0 && !m.counters.some(x => x.isRate)) return;
        if (m.counters.length === 0) return;

        m.counters.forEach(c => {
            if (c.useInEstimation === false) return; // 設定推測から除外されている小役はスキップ

            let k = c.count;
            let N = N_default;

            if (c.isRate) {
                const denomCounter = m.counters.find(x => x.id === c.rateDenominatorId);
                const numerCounter = m.counters.find(x => x.id === c.rateNumeratorId);
                const denomCount = denomCounter ? denomCounter.count : 0;
                const numerCount = numerCounter ? numerCounter.count : 0;
                
                k = numerCount;
                N = denomCount;
            }

            if (N <= 0) return;

            for (let s = 0; s < 6; s++) {
                if (enabledSettings[s]) {
                    const denom = c.denominators[s];
                    
                    if (denom > 0) {
                        hasValidData = true;
                        const p = c.isRate ? denom / 100 : 1 / denom;
                        
                        let logL = 0;
                        if (p > 0 && p < 1) {
                            const safeP = Math.max(0.00001, Math.min(0.99999, p));
                            logL = k * Math.log(safeP) + (N - k) * Math.log(1 - safeP);
                        }
                        logLikelihoods[s] += logL;
                    }
                }
            }
        });
    });

    if (!hasValidData) {
        const activeCount = enabledSettings.filter(v => v).length;
        const uniformVal = 100 / activeCount;
        return enabledSettings.map(v => v ? uniformVal : 0);
    }

    const likelihoods = logLikelihoods.map((l, s) => {
        if (!enabledSettings[s]) return 0;
        return l;
    });

    const activeLogL = logLikelihoods.filter((_, s) => enabledSettings[s]);
    const maxLogL = Math.max(...activeLogL);
    
    const expLikelihoods = logLikelihoods.map((l, s) => {
        if (!enabledSettings[s]) return 0;
        return Math.exp(l - maxLogL);
    });

    const sumLikelihoods = expLikelihoods.reduce((a, b) => a + b, 0);

    if (sumLikelihoods === 0) {
        const activeCount = enabledSettings.filter(v => v).length;
        const uniformVal = 100 / activeCount;
        return enabledSettings.map(v => v ? uniformVal : 0);
    }

    return expLikelihoods.map(l => (l / sumLikelihoods) * 100);
}

// --- UIの全体的な更新 ---
function updateUI() {
    updateDisplay();

    const probabilities = calculateEstimation();
    const activeProbabilities = probabilities.filter((_, s) => enabledSettings[s]);
    const maxProb = Math.max(...activeProbabilities);

    for (let s = 1; s <= 6; s++) {
        const bar = document.getElementById('bar-s' + s);
        const percentEl = document.getElementById('percent-s' + s);
        const row = document.getElementById('result-s' + s);
        const isEnabled = enabledSettings[s - 1];

        if (row) {
            if (isEnabled) {
                row.style.display = 'flex';
                
                const prob = probabilities[s - 1];
                if (bar) {
                    bar.style.width = prob + '%';
                }
                if (percentEl) {
                    percentEl.textContent = prob.toFixed(2) + '%';
                }
                
                if (prob === maxProb && maxProb > (100 / enabledSettings.filter(v => v).length)) {
                    row.classList.add('highlight');
                } else {
                    row.classList.remove('highlight');
                }
            } else {
                row.style.display = 'none';
                row.classList.remove('highlight');
            }
        }
    }
}

// --- 基本的な画面表示更新 ---
function updateDisplay() {
    if (totalGamesDisplay) {
        totalGamesDisplay.textContent = totalGames;
    }

    const activeMode = modes.find(m => m.id === currentModeId) || modes[0];
    if (activeMode && activeMode.gameItems) {
        activeMode.gameItems.forEach(item => {
            const itemInput = document.querySelector(`.calc-group.${item.id} input[type="number"]`);
            if (itemInput) {
                itemInput.value = item.value;
            }
        });
    }

    counters.forEach(c => {
        const countEl = document.getElementById(c.id + '-count');
        const rateTextEl = document.getElementById(c.id + '-rate-text');
        const rateRatioEl = document.getElementById(c.id + '-rate-ratio');
        const ratePercentEl = document.getElementById(c.id + '-rate-percent');

        if (countEl) {
            countEl.textContent = c.count;
        }

        // 分数表示・当選率表示のリアルタイム同期（当選率カードの場合）
        if (c.isRate) {
            const numerItem = counters.find(x => x.id === c.rateNumeratorId);
            const denomItem = counters.find(x => x.id === c.rateDenominatorId);
            const numVal = numerItem ? numerItem.count : 0;
            const denVal = denomItem ? denomItem.count : 0;

            if (rateRatioEl) {
                rateRatioEl.textContent = `${numVal} / ${denVal}`;
            }
            if (ratePercentEl) {
                ratePercentEl.textContent = (c.calculatedPercent || 0).toFixed(2) + ' %';
            }
        }

        if (rateTextEl) {
            let baseText = '1/ -';
            if (c.isRate) {
                if (c.calculatedDenominator > 0) {
                    baseText = '1/ ' + c.calculatedDenominator.toFixed(2);
                }
            } else {
                if (totalGames > 0 && c.count > 0) {
                    const autoDenominator = totalGames / c.count;
                    baseText = '1/ ' + autoDenominator.toFixed(2);
                }
            }

            if (c.useInEstimation === false) {
                rateTextEl.innerHTML = `${baseText} <span class="excluded-chip">除外</span>`;
            } else {
                rateTextEl.textContent = baseText;
            }
        }
    });
}

// --- データの保存 ---
function saveData() {
    localStorage.setItem('bright_counter_model_key', currentModelKey);
    localStorage.setItem('bright_counter_user_presets', JSON.stringify(userPresets));
    localStorage.setItem('bright_counter_modes_v4', JSON.stringify(modes));
    localStorage.setItem('bright_counter_active_mode_id', currentModeId);
    localStorage.setItem('bright_counter_enabled_settings', JSON.stringify(enabledSettings));
    localStorage.setItem('bright_counter_history_logs', JSON.stringify(historyLogs));
    localStorage.setItem('bright_counter_shop_list', JSON.stringify(shopList));
    localStorage.setItem('bright_counter_model_memos', JSON.stringify(modelMemos));
}

// --- すべてリセット ---
function resetAll() {
    if (confirm('登録されているすべての状態のゲーム数項目と小役カウントを完全にリセットします。よろしいですか？')) {
        disableEditMode();
        modes.forEach(m => {
            if (m.gameItems) {
                m.gameItems.forEach(item => {
                    item.value = 0;
                });
            }
            m.totalGames = 0;
            m.counters.forEach(c => {
                c.count = 0;
                c.manualRate = 0;
            });
        });

        updateModePointers();

        localStorage.removeItem('bright_counter_current_games');
        localStorage.removeItem('bright_counter_start_games');
        localStorage.removeItem('bright_counter_total_games');
        localStorage.removeItem('bright_counter_v2_list');
        
        saveData();
        
        syncCombinedCounts();
        renderModelOptions();
        renderTabs();
        renderGameItems();
        renderSettingControls();
        renderCounters();
        generateModelTableHeader();
        generateModelTable();
        updateUI();
    }
}

// --- 実践履歴パネルへのスクロール・日付初期化 ---
function toggleHistoryForm() {
    const panel = document.getElementById('history-accordion');
    if (panel) {
        if (!panel.classList.contains('is-open')) {
            panel.classList.add('is-open');
        }
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    }
    
    const dateInput = document.getElementById('history-date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

// --- 新規実践履歴の保存 ---
function saveHistoryLog() {
    const dateInput = document.getElementById('history-date');
    const shopInput = document.getElementById('history-shop');
    const diffInput = document.getElementById('history-diff');

    if (!dateInput || !dateInput.value) {
        alert('実践日付を入力してください。');
        return;
    }

    const date = dateInput.value;
    const shop = shopInput ? shopInput.value.trim() || '未設定' : '未設定';
    const diffChips = diffInput && diffInput.value !== '' ? parseInt(diffInput.value, 10) : 0;

    // 店舗名が未登録の場合はマスタに自動追加
    if (shop !== '未設定' && !shopList.includes(shop)) {
        shopList.push(shop);
    }

    // 現在の機種名取得
    let modelName = 'カスタム';
    if (currentModelKey.startsWith('user-preset-')) {
        modelName = userPresets[currentModelKey]?.name || 'ユーザーカスタム';
    }

    // 全状態タブの総ゲーム数の合算値
    const totalG = modes.reduce((sum, m) => sum + m.totalGames, 0);

    // 現在の設定推測（最大期待値の設定段階と％）を取得
    const probs = calculateEstimation();
    const activeProbs = probs.filter((_, s) => enabledSettings[s]);
    const maxProb = Math.max(...activeProbs);
    const maxIdx = probs.indexOf(maxProb);
    
    let estimationText = '推測不可';
    const activeCount = enabledSettings.filter(v => v).length;
    const uniformVal = 100 / activeCount;
    
    if (maxProb > uniformVal) {
        estimationText = `設定${maxIdx + 1} (${maxProb.toFixed(2)}%)`;
    } else {
        estimationText = '推測データなし';
    }

    const newLog = {
        id: 'log-' + Date.now().toString(),
        date: date,
        shop: shop,
        modelName: modelName,
        totalGames: totalG,
        diffChips: diffChips,
        estimation: estimationText,
        appData: {
            counters: JSON.parse(JSON.stringify(counters)),
            modes: JSON.parse(JSON.stringify(modes)),
            currentModelKey: currentModelKey,
            enabledSettings: [...enabledSettings]
        }
    };

    historyLogs.unshift(newLog); // 最新を先頭に追加
    saveData();
    renderHistoryTable();

    if (shopInput) shopInput.value = '';
    if (diffInput) diffInput.value = '';
    
    alert('実践履歴を登録しました。');
}

// --- 実践履歴の削除 ---
function deleteHistoryLog(logId) {
    if (confirm('この実践履歴を完全に削除してもよろしいですか？')) {
        historyLogs = historyLogs.filter(log => log.id !== logId);
        saveData();
        renderHistoryTable();
    }
}

// --- 履歴テーブルの動的レンダリング ---
function renderHistoryTable() {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (historyLogs.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8;
        td.style.textAlign = 'center';
        td.style.color = 'var(--text-muted)';
        td.style.fontSize = '9px';
        td.style.padding = '12px';
        td.textContent = '保存された実践履歴はありません。';
        tr.appendChild(td);
        tableBody.appendChild(tr);
        
        updateShopDatalist();
        return;
    }

    historyLogs.forEach(log => {
        const tr = document.createElement('tr');

        // 日付
        const dateTd = document.createElement('td');
        dateTd.textContent = log.date;
        tr.appendChild(dateTd);

        // 店舗名
        const shopTd = document.createElement('td');
        shopTd.textContent = log.shop || '未設定';
        tr.appendChild(shopTd);

        // 機種名
        const modelTd = document.createElement('td');
        modelTd.textContent = log.modelName;
        tr.appendChild(modelTd);

        // 総ゲーム数
        const gamesTd = document.createElement('td');
        gamesTd.style.fontFamily = "'Outfit', sans-serif";
        gamesTd.textContent = (log.totalGames || 0).toLocaleString() + ' G';
        tr.appendChild(gamesTd);

        // 差枚数 (プラスは赤、マイナスは青)
        const diffTd = document.createElement('td');
        const diffVal = log.diffChips || 0;
        if (diffVal > 0) {
            diffTd.className = 'diff-plus';
            diffTd.textContent = '+' + diffVal.toLocaleString() + ' 枚';
        } else if (diffVal < 0) {
            diffTd.className = 'diff-minus';
            diffTd.textContent = diffVal.toLocaleString() + ' 枚';
        } else {
            diffTd.textContent = '±0 枚';
        }
        tr.appendChild(diffTd);

        // 推測結果
        const estTd = document.createElement('td');
        estTd.textContent = log.estimation;
        tr.appendChild(estTd);

        // 操作 (呼出)
        const loadTd = document.createElement('td');
        const loadBtn = document.createElement('button');
        loadBtn.className = 'history-load-btn';
        loadBtn.innerHTML = '📥';
        loadBtn.title = '履歴を呼び出す';
        if (!log.appData) {
            loadBtn.style.opacity = '0.3';
            loadBtn.style.cursor = 'not-allowed';
            loadBtn.title = '呼出用データがありません';
        } else {
            loadBtn.onclick = () => loadHistoryLog(log.id);
        }
        loadTd.appendChild(loadBtn);
        tr.appendChild(loadTd);

        // 操作 (削除)
        const optTd = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.className = 'history-delete-btn';
        delBtn.innerHTML = '🗑️';
        delBtn.title = '履歴を削除';
        delBtn.onclick = () => deleteHistoryLog(log.id);
        optTd.appendChild(delBtn);
        tr.appendChild(optTd);

        tableBody.appendChild(tr);
    });

    updateShopDatalist();
}

// --- 実践履歴のロード（呼び出し） ---
function loadHistoryLog(logId) {
    const log = historyLogs.find(x => x.id === logId);
    if (!log) return;
    if (!log.appData) {
        alert('この実践履歴には復元用のカウンターデータが含まれていません。');
        return;
    }

    // カウント数値消去に関する警告ダイアログの表示
    if (!confirm('履歴データを呼び出すと、現在カウントしている数値や状態が上書きされて消えてしまいます。現在のデータを保存してから呼び出ししてください。よろしいですか？')) {
        return;
    }

    // データのロード（ディープコピー）
    counters = JSON.parse(JSON.stringify(log.appData.counters));
    modes = JSON.parse(JSON.stringify(log.appData.modes));
    currentModelKey = log.appData.currentModelKey;
    enabledSettings = [...log.appData.enabledSettings];

    // アクティブな状態（モード）を最初の通常モードにリセット
    currentModeIndex = 0;

    // 機種選択プルダウン（model-select）の値を更新
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        modelSelect.value = currentModelKey;
    }

    // データの永続化
    saveCurrentModeState();
    saveData();

    // UIパーツの再構成と全体の再描画
    renderTabs();
    renderSettingControls();
    generateModelTableHeader();
    generateModelTable();
    updateUI();

    alert('実践履歴からデータを正常に呼び出しました。');
}

// --- 店舗名入力補完用 datalist の更新 ---
function updateShopDatalist() {
    const datalist = document.getElementById('shop-datalist');
    if (!datalist) return;
    datalist.innerHTML = '';

    shopList.forEach(shop => {
        const option = document.createElement('option');
        option.value = shop;
        datalist.appendChild(option);
    });
}

// --- 店舗マスタ管理エリアの表示トグル ---
function toggleShopManager() {
    const area = document.getElementById('shop-manager-area');
    if (!area) return;
    
    if (area.style.display === 'none') {
        area.style.display = 'block';
        renderShopManagerList();
    } else {
        area.style.display = 'none';
    }
}

// --- 店舗管理リストのレンダリング ---
function renderShopManagerList() {
    const container = document.getElementById('shop-manager-list');
    if (!container) return;
    container.innerHTML = '';

    if (shopList.length === 0) {
        container.style.color = 'var(--text-muted)';
        container.style.fontSize = '9px';
        container.textContent = '登録されている店舗名はありません。';
        return;
    }

    shopList.forEach(shop => {
        const item = document.createElement('div');
        item.className = 'shop-manager-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = shop;
        nameSpan.title = shop;
        item.appendChild(nameSpan);

        // 訂正ボタン
        const editBtn = document.createElement('button');
        editBtn.className = 'shop-edit-btn';
        editBtn.innerHTML = '✏️';
        editBtn.title = '店舗名を訂正（過去の履歴も一括更新されます）';
        editBtn.onclick = () => editShopName(shop);
        item.appendChild(editBtn);

        // 削除ボタン
        const delBtn = document.createElement('button');
        delBtn.className = 'shop-delete-btn';
        delBtn.innerHTML = '❌';
        delBtn.title = 'この店舗名をプルダウン候補から削除';
        delBtn.onclick = () => deleteShopName(shop);
        item.appendChild(delBtn);

        container.appendChild(item);
    });
}

// --- 店舗名の訂正（過去の履歴データも置換） ---
function editShopName(oldName) {
    const newName = prompt('店舗名を訂正してください。', oldName);
    if (newName === null) return;
    
    const trimmed = newName.trim();
    if (!trimmed) {
        alert('店舗名を入力してください。');
        return;
    }

    if (trimmed === oldName) return;

    if (shopList.includes(trimmed)) {
        alert('すでに同じ店舗名が存在します。');
        return;
    }

    // マスタリスト内の店舗名を書き換え
    const idx = shopList.indexOf(oldName);
    if (idx !== -1) {
        shopList[idx] = trimmed;
    }

    // 過去の実践履歴に紐づく店舗名もすべて一括訂正
    historyLogs.forEach(log => {
        if (log.shop === oldName) {
            log.shop = trimmed;
        }
    });

    saveData();
    renderHistoryTable();
    renderShopManagerList();
    updateShopDatalist();
    alert('店舗名を訂正しました（過去の履歴も更新されました）。');
}

// --- 店舗名の削除（プルダウン候補から除外） ---
function deleteShopName(name) {
    if (confirm(`店舗名「${name}」をプルダウン候補から削除しますか？\n（※過去の実践履歴データはそのまま保持されます）`)) {
        shopList = shopList.filter(s => s !== name);
        saveData();
        renderShopManagerList();
        updateShopDatalist();
    }
}

// --- 機種別メモ帳 ＆ 画像保管庫（IndexedDB）のロジック ---

let db;

// IndexedDBの初期化
function initDB(callback) {
    const request = indexedDB.open("BrightCounterGalleryDB", 1);
    request.onupgradeneeded = function(e) {
        const database = e.target.result;
        if (!database.objectStoreNames.contains("images")) {
            const store = database.createObjectStore("images", { keyPath: "id", autoIncrement: true });
            store.createIndex("modelKey", "modelKey", { unique: false });
        }
    };
    request.onsuccess = function(e) {
        db = e.target.result;
        if (callback) callback();
    };
    request.onerror = function(e) {
        console.error("IndexedDBの初期化に失敗しました。", e);
    };
}

// 機種テキストメモの自動保存
let memoSaveTimeout;
function saveModelMemo() {
    const textarea = document.getElementById('model-memo-textarea');
    if (!textarea) return;
    
    const statusSpan = document.getElementById('memo-status');
    if (statusSpan) {
        statusSpan.textContent = '保存中...';
        statusSpan.classList.add('saved');
    }

    modelMemos[currentModelKey] = textarea.value;
    
    clearTimeout(memoSaveTimeout);
    memoSaveTimeout = setTimeout(() => {
        localStorage.setItem('bright_counter_model_memos', JSON.stringify(modelMemos));
        if (statusSpan) {
            statusSpan.textContent = '自動保存済み';
        }
    }, 800);
}

// 機種変更時のメモ＆画像ロード
function loadModelMemoAndGallery() {
    // メモ帳の読み込み
    const textarea = document.getElementById('model-memo-textarea');
    if (textarea) {
        textarea.value = modelMemos[currentModelKey] || "";
    }
    const statusSpan = document.getElementById('memo-status');
    if (statusSpan) {
        statusSpan.textContent = '';
        statusSpan.classList.remove('saved');
    }

    // ギャラリー画像の描画
    renderGallery();
}

// ファイル選択トリガー
function triggerFileSelect() {
    const fileInput = document.getElementById('image-file-input');
    if (fileInput) {
        fileInput.click();
    }
}

// ドラッグ＆ドロップイベントの登録
function setupDragAndDrop() {
    const zone = document.getElementById('image-upload-zone');
    if (!zone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'dragend', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dragover');
        }, false);
    });

    zone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);
}

// ファイルアップロードハンドラ
function handleImageUpload(e) {
    const files = e.target.files;
    handleFiles(files);
    e.target.value = ''; // ファイル入力をクリアして重複登録やイベント保持を防止
}

// ファイル読み込み処理
function handleFiles(files) {
    if (!files || files.length === 0) return;

    let processedCount = 0;
    const validFiles = Array.from(files).filter(file => {
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください。');
            return false;
        }
        return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            saveImageToDB(currentModelKey, dataUrl, () => {
                processedCount++;
                // すべての画像の保存が完了したタイミングで1回だけレンダリングを実行（非同期描画の競合による多重描画を防止）
                if (processedCount === validFiles.length) {
                    renderGallery();
                }
            });
        };
        reader.readAsDataURL(file);
    });
}

// --- IndexedDB データ操作 ---

function saveImageToDB(modelKey, dataUrl, callback) {
    if (!db) return;
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");
    const item = {
        modelKey: modelKey,
        dataUrl: dataUrl,
        memo: "",
        timestamp: Date.now()
    };
    const request = store.add(item);
    request.onsuccess = function() {
        if (callback) callback();
    };
}

function renderGallery() {
    const grid = document.getElementById('image-gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!db) return;

    const transaction = db.transaction(["images"], "readonly");
    const store = transaction.objectStore("images");
    const index = store.index("modelKey");
    const request = index.getAll(IDBKeyRange.only(currentModelKey));

    request.onsuccess = function(e) {
        const list = e.target.result;
        
        // タイムスタンプ降順（新しい順）に並べ替え
        list.sort((a, b) => b.timestamp - a.timestamp);

        if (list.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 10px; padding: 20px;">この機種に保存されている画像はありません。</div>';
            return;
        }

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'image-card';

            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            wrapper.onclick = () => openLightbox(item.dataUrl);

            const img = document.createElement('img');
            img.src = item.dataUrl;
            img.alt = item.memo || '画像';
            wrapper.appendChild(img);

            // 画像右上の削除ボタンを絶対配置で生成（×印）
            const delBtn = document.createElement('button');
            delBtn.className = 'image-card-delete-btn';
            delBtn.innerHTML = '×';
            delBtn.title = '削除';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('この画像を削除してもよろしいですか？')) {
                    deleteImageFromDB(item.id, () => renderGallery());
                }
            };
            wrapper.appendChild(delBtn);
            card.appendChild(wrapper);

            // メモ入力エリア
            const memoArea = document.createElement('div');
            memoArea.className = 'image-card-memo-area';

            const memoInput = document.createElement('input');
            memoInput.type = 'text';
            memoInput.className = 'image-card-memo-input';
            memoInput.placeholder = 'メモを入力...';
            memoInput.value = item.memo || '';
            memoInput.onchange = (e) => {
                updateImageMemoInDB(item.id, e.target.value);
            };
            memoArea.appendChild(memoInput);
            card.appendChild(memoArea);

            grid.appendChild(card);
        });
    };
}

function updateImageMemoInDB(id, memo) {
    if (!db) return;
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");
    const getReq = store.get(id);

    getReq.onsuccess = function(e) {
        const item = e.target.result;
        if (item) {
            item.memo = memo;
            store.put(item);
        }
    };
}

// --- IndexedDBの該当レコードを削除 ---
function deleteImageFromDB(id, callback) {
    if (!db) return;
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");
    const request = store.delete(id);
    request.onsuccess = function() {
        if (callback) callback();
    };
}

// --- ライトボックス操作 ---

function openLightbox(dataUrl) {
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    if (modal && modalImg) {
        modal.style.display = 'flex';
        modalImg.src = dataUrl;
    }
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// --- 配色テーマ（ライト・ダーク）の切り替えトグル ---
function toggleTheme() {
    const btn = document.getElementById('theme-toggle-btn');
    if (currentTheme === 'light') {
        currentTheme = 'dark';
        document.body.classList.add('dark-theme');
        if (btn) btn.textContent = '🌙';
    } else {
        currentTheme = 'light';
        document.body.classList.remove('dark-theme');
        if (btn) btn.textContent = '☀️';
    }
    localStorage.setItem('bright_counter_theme', currentTheme);
}

// スマホのバイブレーションをトリガーする関数
function triggerVibrate() {
    if (isVibrateActive && navigator.vibrate) {
        navigator.vibrate(35); // 35msの短いカチッとした振動
    }
}

// バイブレーション設定の切り替え
function toggleVibrateSetting() {
    isVibrateActive = !isVibrateActive;
    localStorage.setItem('bright_counter_vibrate_active', isVibrateActive);
    updateVibrateBtn();
    
    // 切り替えた瞬間に動作テストを兼ねてバイブをトリガー
    if (isVibrateActive) {
        triggerVibrate();
    }
}

// バイブレーションボタンの表示状態更新
function updateVibrateBtn() {
    const btn = document.getElementById('vibrate-toggle-btn');
    if (!btn) return;
    if (isVibrateActive) {
        btn.textContent = '📳';
        btn.classList.add('active');
        btn.title = 'バイブレーション: ON';
    } else {
        btn.textContent = '📴';
        btn.classList.remove('active');
        btn.title = 'バイブレーション: OFF';
    }
}

// --- アコーディオンの開閉トグル ---
function toggleAccordion(id) {
    const accordion = document.getElementById(id);
    if (accordion) {
        accordion.classList.toggle('is-open');
    }
}

// --- ボタンのドラッグ＆ドロップ入れ替え処理および設定差テーブルスクロール連動 ---
document.addEventListener('DOMContentLoaded', () => {
    const countersGrid = document.getElementById('counters-grid');
    if (countersGrid) {
        countersGrid.addEventListener('dragover', (e) => {
            if (!isEditMode) return;
            e.preventDefault();
        });
    }


});

// DOM の並び順に従って配列データを同期して保存
function saveCountersOrder() {
    if (!currentModel || !currentModel.counters) return;
    const cards = [...document.querySelectorAll('#counters-grid .counter-card')];
    const newCounters = [];
    cards.forEach(card => {
        const id = card.getAttribute('data-id');
        const counter = currentModel.counters.find(c => c.id === id);
        if (counter) {
            newCounters.push(counter);
        }
    });
    // 設定を更新して保存
    currentModel.counters = newCounters;
    saveData();
}

// ドラッグされたDOM要素ノードを指定した位置（前または後ろ）に挿入する関数
function insertElement(dragging, target) {
    const parent = target.parentNode;
    if (!parent) return;
    const positionCompare = dragging.compareDocumentPosition(target);
    if (positionCompare & Node.DOCUMENT_POSITION_FOLLOWING) {
        // targetはdraggingより後ろにあるため、targetの後ろに挿入
        parent.insertBefore(dragging, target.nextSibling);
    } else {
        // targetはdraggingより前にあるため、targetの前に挿入
        parent.insertBefore(dragging, target);
    }
}
