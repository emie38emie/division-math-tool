// 系統狀態
const state = {
    dividend: 0,
    divisor: 0,
    digits: [],
    quotients: [],
    idx: 0,
    step: 'Q',
    rem: 0,
    history: [],
    voiceOn: true,
    targetVoice: null
};

const synth = window.speechSynthesis;

function initVoice() {
    let voices = synth.getVoices();
    if (voices.length === 0) return;
    state.targetVoice = voices.find(v => v.name.includes('Yating') || v.name.includes('雅婷')) ||
                        voices.find(v => v.lang === 'zh-TW') ||
                        voices.find(v => v.lang.includes('zh-')) ||
                        voices[0];
}

if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = initVoice;

function toggleVoice() {
    state.voiceOn = !state.voiceOn;
    const btn = document.getElementById('voice-btn');
    btn.innerHTML = state.voiceOn ? '🔊 <span class="hidden sm:inline">語音</span>開啟' : '🔇 <span class="hidden sm:inline">語音</span>關閉';
    btn.classList.toggle('bg-emerald-800', state.voiceOn);
    btn.classList.toggle('bg-gray-500', !state.voiceOn);
    if (!state.voiceOn) synth.cancel();
}

function speak(text) {
    if (!state.voiceOn) return;
    synth.cancel();
    let u = new SpeechSynthesisUtterance(text);
    if (state.targetVoice) u.voice = state.targetVoice;
    u.lang = 'zh-TW';
    u.rate = 1.05;
    synth.speak(u);
}

function triggerConfetti() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    for(let i=0; i<80; i++) {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = (Math.random() * 100) + 'vw';
        el.style.top = '-10vh';
        el.style.width = (Math.random() * 10 + 6) + 'px';
        el.style.height = (Math.random() * 14 + 8) + 'px';
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(el);
        let y = -50, x = parseFloat(el.style.left), speedY = Math.random() * 4 + 3, speedX = (Math.random() - 0.5) * 3;
        let rot = Math.random() * 360, rotSpeed = (Math.random() - 0.5) * 15;
        function fall() {
            y += speedY; x += speedX; rot += rotSpeed;
            el.style.top = y + 'px';
            el.style.left = x + 'vw';
            el.style.transform = `rotate(${rot}deg)`;
            if(y < window.innerHeight) requestAnimationFrame(fall);
        }
        requestAnimationFrame(fall);
    }
    setTimeout(() => container.remove(), 6000);
}

function randomQuestion() {
    const currentDivStr = document.getElementById('div-in').value || '123';
    const currentSorStr = document.getElementById('sor-in').value || '25';
    const currentDiv = parseInt(currentDivStr);
    const currentSor = parseInt(currentSorStr);
    const targetDivLen = currentDivStr.length;
    const targetSorLen = currentSorStr.length;
    const targetHasRem = (currentDiv % currentSor !== 0);
    let div = 0, sor = 0, attempts = 0, found = false;
    while (attempts < 1000 && !found) {
        attempts++;
        if (targetSorLen === 1) sor = Math.floor(Math.random() * 8) + 2;
        else if (targetSorLen === 2) sor = Math.floor(Math.random() * 89) + 11;
        else {
            let minS = Math.pow(10, targetSorLen - 1), maxS = Math.pow(10, targetSorLen) - 1;
            sor = Math.floor(Math.random() * (maxS - minS + 1)) + minS;
        }
        let minDiv = Math.pow(10, targetDivLen - 1), maxDiv = Math.pow(10, targetDivLen) - 1;
        let minQ = Math.max(0, Math.floor(minDiv / sor)), maxQ = Math.floor(maxDiv / sor);
        if (minQ > maxQ) continue;
        let q = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
        if (!targetHasRem) {
            div = sor * q;
            if (String(div).length === targetDivLen && div !== 0) found = true;
        } else {
            let r = Math.floor(Math.random() * (sor - 1)) + 1;
            div = sor * q + r;
            if (String(div).length === targetDivLen && div % sor !== 0) found = true;
        }
    }
    if (!found) { div = targetHasRem ? 123 : 120; sor = 25; }
    document.getElementById('div-in').value = div;
    document.getElementById('sor-in').value = sor;
    start();
}

function setGuide(title, textOrHtml, speechText) {
    document.getElementById('step-title').innerText = title;
    document.getElementById('msg-text').innerHTML = textOrHtml;
    if (speechText !== undefined) speak(speechText);
    else {
        let temp = document.createElement('div');
        temp.innerHTML = textOrHtml;
        speak(temp.textContent || temp.innerText || '');
    }
    document.getElementById('check-btn-container').classList.remove('hidden');
}

function start() {
    const divInput = parseInt(document.getElementById('div-in').value);
    const sorInput = parseInt(document.getElementById('sor-in').value);
    if (isNaN(divInput) || isNaN(sorInput) || sorInput === 0) {
        alert('請輸入有效的正整數，且除數不能為0！'); return;
    }
    state.dividend = divInput; state.divisor = sorInput;
    state.digits = String(state.dividend).split('').map(Number);
    state.quotients = new Array(state.digits.length).fill(null);
    state.idx = 0; state.step = 'Q'; state.rem = 0; state.history = [];
    if(!state.targetVoice) initVoice();
    render(); guide();
}

function guide() {
    const units = ['個', '十', '百', '千', '萬', '十萬'];
    const unit = units[state.digits.length - 1 - state.idx] || '位';
    const currentVal = state.rem * 10 + state.digits[state.idx];
    const correctQ = Math.floor(currentVal / state.divisor);
    const isLeading = state.quotients.every(q => q === null || q === '');
    if (state.step === 'Q') {
        let txt = `現在處理${unit}位。`;
        if (state.history.length === 0) txt += `看數字 ${currentVal}。`;
        else if (state.rem > 0) txt += `加上剩下的，總共是 ${currentVal}。`;
        else txt += `看數字 ${currentVal}。`;
        if (correctQ === 0) {
            if (isLeading) txt += `不夠除以 ${state.divisor}。你可以輸入 0，或者直接按「送出」看下一位。`;
            else txt += `不夠除以 ${state.divisor}。請在上方補 0。`;
        } else txt += `${currentVal} 除以 ${state.divisor} 等於多少？請在最上方寫下商。`;
        setGuide(`【找商 (${unit}位)】`, txt);
    } else if (state.step === 'DONE') {
        triggerConfetti();
        const finalQ = parseInt(state.quotients.join('')) || 0;
        const speechText = `太棒了！計算完成。商數是 ${finalQ}，餘數是 ${state.rem}。`;
        const html = `<div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 w-full"><span class="text-sm sm:text-base text-gray-700 font-medium">請試著將滑鼠移到（或點擊）下方數字：</span><div class="flex items-center flex-wrap justify-center gap-1 text-xl sm:text-2xl font-bold bg-emerald-100 px-2 sm:px-3 py-1 rounded-lg shadow-inner border border-emerald-300 font-mono w-full sm:w-auto"><span class="cursor-pointer transition-colors duration-200 hover:text-red-600 active:text-red-600" onmouseenter="speak('被除數')" onclick="speak('被除數')" title="被除數">${state.dividend}</span><span class="text-gray-500 mx-1">÷</span><span class="cursor-pointer transition-colors duration-200 hover:text-red-600 active:text-red-600" onmouseenter="speak('除數')" onclick="speak('除數')" title="除數">${state.divisor}</span><span class="text-gray-500 mx-1">＝</span><span class="text-gray-500">(</span><span class="cursor-pointer transition-colors duration-200 hover:text-red-600 active:text-red-600" onmouseenter="speak('商')" onclick="speak('商')" title="商">${finalQ}</span><span class="text-gray-500">)</span><span class="text-gray-500 mx-1">...</span><span class="text-gray-500">(</span><span class="cursor-pointer transition-colors duration-200 hover:text-red-600 active:text-red-600" onmouseenter="speak('餘數')" onclick="speak('餘數')" title="餘數">${state.rem}</span><span class="text-gray-500">)</span></div></div>`;
        setGuide('🎉 任務完成', html, speechText);
        document.getElementById('check-btn-container').classList.add('hidden');
    }
}

function render() {
    const paper = document.getElementById('paper');
    const divLen = String(state.divisor).length;
    const len = state.digits.length;
    const totalCols = divLen + 1 + len;
    paper.style.gridTemplateColumns = `repeat(${totalCols}, var(--cell-size))`;
    let html = '';
    for (let i = 0; i < len; i++) {
        let col = divLen + 2 + i;
        if (state.quotients[i] !== undefined && state.quotients[i] !== null) {
            if (state.quotients[i] !== '') html += `<div class="cell text-blue-600 fade-in" style="grid-column: ${col}; grid-row: 1">${state.quotients[i]}</div>`;
        } else if (i === state.idx && state.step === 'Q') {
            html += `<div class="cell" style="grid-column: ${col}; grid-row: 1; padding: 0.15rem;"><input id="active-input" aria-label="輸入當前商數" type="text" inputmode="numeric" oninput="this.value=this.value.replace(/[^0-9]/g,'');" class="input-box w-full h-full text-center" autocomplete="off"></div>`;
        }
    }
    const divisorStr = String(state.divisor);
    for(let i = 0; i < divLen; i++) html += `<div class="cell text-indigo-900" style="grid-column: ${i+1}; grid-row: 2">${divisorStr[i]}</div>`;
    html += `<div class="cell symbol-cell" style="grid-column: ${divLen + 1}; grid-row: 2"></div>`;
    for (let i = 0; i < len; i++) html += `<div class="cell dividend-cell text-gray-900" style="grid-column: ${divLen + 2 + i}; grid-row: 2">${state.digits[i]}</div>`;
    let rowNum = 3;
    for (let i = 0; i < state.history.length; i++) {
        const item = state.history[i]; const isMStep = item.type === 'M';
        if (item.type === 'APPEND_BRING_DOWN') {
            let prevRow = rowNum - 1;
            html += `<div class="cell text-green-600 fade-in" style="grid-column: ${item.colEnd + 1}; grid-row: ${prevRow}">${item.bringDown}</div>`; continue;
        }
        let str = (item.type === 'R' && item.val === 0 && item.bringDown !== undefined) ? '' : String(item.val);
        if (isMStep) {
            html += `<div class="cell text-gray-400 font-bold" style="grid-column: ${divLen + 1}; grid-row: ${rowNum};">-</div>`;
            let startCol = divLen + 2; let span = item.colEnd - startCol + 1;
            html += `<div style="grid-column: ${startCol} / span ${span}; grid-row: ${rowNum}; position: relative;"><div class="subtraction-line"></div></div>`;
        }
        for (let j = 0; j < str.length; j++) {
            let digit = str[str.length - 1 - j], col = item.colEnd - j, colorClass = isMStep ? 'text-red-600' : 'text-green-600';
            html += `<div class="cell fade-in ${colorClass}" style="grid-column: ${col}; grid-row: ${rowNum};">${digit}</div>`;
        }
        if (item.type === 'R' && item.bringDown !== undefined) html += `<div class="cell text-green-600 fade-in" style="grid-column: ${item.colEnd + 1}; grid-row: ${rowNum}">${item.bringDown}</div>`;
        rowNum++;
    }
    paper.innerHTML = html;
    const activeIn = document.getElementById('active-input');
    if (activeIn) {
        setTimeout(() => activeIn.focus(), 50);
        activeIn.addEventListener('keydown', e => { if(e.key === 'Enter') checkLogic(); });
    }
}

function checkLogic() {
    const inputEl = document.getElementById('active-input');
    const currentVal = state.rem * 10 + state.digits[state.idx];
    const divLen = String(state.divisor).length;
    const colEnd = divLen + 2 + state.idx;
    const correctQ = Math.floor(currentVal / state.divisor);
    const isLeading = state.quotients.every(q => q === null || q === '');
    if (!inputEl || inputEl.value === '') {
        if (state.step === 'Q' && correctQ === 0 && isLeading) {
            state.quotients[state.idx] = ''; state.rem = currentVal;
            if (state.idx < state.digits.length - 1) { state.idx++; state.step = 'Q'; }
            else state.step = 'DONE';
            render(); guide(); return;
        }
        speak('請輸入正確的數字喔！'); return;
    }
    const val = parseInt(inputEl.value);
    if (state.step === 'Q') {
        if (val === correctQ) {
            state.quotients[state.idx] = val;
            const skipZero = document.getElementById('skip-zero-btn').checked;
            if (skipZero && correctQ === 0) {
                state.rem = currentVal;
                if (state.idx < state.digits.length - 1) {
                    if (!isLeading) state.history.push({ type: 'APPEND_BRING_DOWN', bringDown: state.digits[state.idx + 1], colEnd });
                    state.idx++; state.step = 'Q';
                } else state.step = 'DONE';
                render(); guide(); return;
            }
            const correctM = val * state.divisor;
            state.history.push({ type: 'M', val: correctM, colEnd });
            const correctR = currentVal - correctM; state.rem = correctR;
            if (state.idx < state.digits.length - 1) {
                state.history.push({ type: 'R', val: correctR, colEnd, bringDown: state.digits[state.idx + 1] });
                state.idx++; state.step = 'Q';
            } else {
                state.history.push({ type: 'R', val: correctR, colEnd }); state.step = 'DONE';
            }
            render(); guide();
        } else {
            const hint = `不對喔，想想看 ${state.divisor} 乘以多少最接近 ${currentVal} 且不超過它？`;
            speak(hint);
            document.getElementById('msg-text').innerHTML = `<span class="text-red-600 font-bold">${hint}</span>`;
            inputEl.value = ''; inputEl.focus();
        }
    }
}

window.onload = () => { initVoice(); render(); };
