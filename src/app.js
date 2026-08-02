let solutionTargets = [];
let validDictionary = [];
let guessChain = [];

window.onload = () => {
    const defaultAnswers = typeof ANSWERS !== 'undefined' ? [...ANSWERS] : [];
    const defaultValid = typeof ALL_WORDS !== 'undefined' ? ALL_WORDS : ANSWERS;
    window._defaultAnswers = defaultAnswers;
    window._defaultValid = defaultValid;

    solutionTargets = [...defaultAnswers];
    validDictionary = defaultValid;
    window._usingLargeList = false;
    window._dictLoading = false;
    initTheme();
};

/**
 * Starts session with initial starter word.
 *
 * @param {string} initialWord - Chosen starter word.
 */
function startSession(initialWord) {
    document.getElementById('suggestions').style.display = 'none';
    let word = initialWord.toLocaleLowerCase('tr-TR');
    let initialEntropy = calculateEntropy(word, solutionTargets);

    guessChain = [{
        word: word,
        colors: [0, 0, 0, 0, 0],
        hasUserInteracted: false,
        remainingCount: solutionTargets.length,
        entropy: initialEntropy
    }];

    processEngine();
}

/**
 * Toggles tile color (0: Gray -> 1: Yellow -> 2: Green).
 *
 * @param {number} rowIndex - Target row index.
 * @param {number} letterIndex - Tile index (0..4).
 */
function toggleColor(rowIndex, letterIndex) {
    guessChain = guessChain.slice(0, rowIndex + 1);
    let currentColor = guessChain[rowIndex].colors[letterIndex];
    guessChain[rowIndex].colors[letterIndex] = (currentColor + 1) % 3;
    guessChain[rowIndex].hasUserInteracted = true;
    guessChain[rowIndex].isFinal = false;

    processEngine();
}

/**
 * Renders board rows and step info lines.
 */
function renderBoard() {
    let html = '';
    for (let i = 0; i < guessChain.length; i++) {
        let step = guessChain[i];
        html += '<div class="step-block">';
        html += '  <div class="row">';
        for (let j = 0; j < 5; j++) {
            let rClass = 'c' + step.colors[j];
            const clickAttr = step.isFinal ? '' : ` onclick="toggleColor(${i}, ${j})"`;
            html += `<div class="box clickable ${rClass}"${clickAttr}>${step.word[j].toLocaleUpperCase('tr-TR')}</div>`;
        }
        html += '  </div>';

        let entropyVal = (step.entropy !== null && step.entropy !== undefined) ? step.entropy.toFixed(2) : '-';
        let remainingVal = (step.remainingCount !== null && step.remainingCount !== undefined) ? step.remainingCount : '-';
        if (!step.isFinal) {
            html += `  <div class="step-info-line">Kalan Kelime: <b>${remainingVal}</b> | Tahmin Entropisi: <b>${entropyVal}</b></div>`;
        } else {
            html += '  <div class="final-solution-line">Çözüm Bulundu</div>';
        }
        html += '</div>';
    }
    document.getElementById('board').innerHTML = html;
}

/**
 * Filters candidate list and calculates next best move.
 */
function processEngine() {
    guessChain = guessChain.filter(step => !step.isFinal);

    let candidateList = [...solutionTargets];
    let infoDiv = document.getElementById('info');
    infoDiv.innerHTML = '';

    for (let i = 0; i < guessChain.length; i++) {
        let step = guessChain[i];
        if (step.hasUserInteracted) {
            let colorCode = step.colors.join('');
            candidateList = candidateList.filter(k => getPattern(step.word, k) === colorCode);
            step.remainingCount = candidateList.length;
        }
    }

    if (guessChain.length === 0) {
        renderBoard();
        return;
    }

    renderBoard();

    if (candidateList.length === 0) {
        infoDiv.innerHTML = '<div class="error-line">Eşleşen kelime bulunamadı. Lütfen renk seçimlerinizi kontrol ediniz.</div>';
        return;
    }

    if (candidateList.length === 1) {
        const solutionWord = candidateList[0];
        const existingIndex = guessChain.map(step => step.word).lastIndexOf(solutionWord);
        if (existingIndex !== -1) {
            guessChain = guessChain.slice(0, existingIndex + 1);
            const solutionStep = guessChain[existingIndex];
            solutionStep.colors = [2, 2, 2, 2, 2];
            solutionStep.hasUserInteracted = true;
            solutionStep.remainingCount = 1;
            solutionStep.entropy = 0;
            solutionStep.isFinal = true;
        } else {
            guessChain.push({
                word: solutionWord,
                colors: [2, 2, 2, 2, 2],
                hasUserInteracted: true,
                remainingCount: 1,
                entropy: 0,
                isFinal: true
            });
        }
        renderBoard();
        return;
    }

    let activeRow = guessChain[guessChain.length - 1];
    if (!activeRow.hasUserInteracted) {
        return;
    }

    setTimeout(() => {
        let result = findBestWord(candidateList, validDictionary);

        guessChain.push({
            word: result.word,
            colors: [0, 0, 0, 0, 0],
            hasUserInteracted: false,
            remainingCount: candidateList.length,
            entropy: result.entropy
        });

        processEngine();
    }, 50);
}

/**
 * Toggle between default and larger word list (`words-wordleplay.js`).
 * If the large list isn't loaded, dynamically load it and swap the arrays.
 */
function toggleDictionary() {
    const btn = document.getElementById('dictToggle');
    if (window._dictLoading) {
        return;
    }
    if (!window._usingLargeList) {
        window._dictLoading = true;
        if (btn) btn.textContent = 'Yükleniyor...';
        guessChain = guessChain.filter(step => !step.isFinal);

        const finishLoad = (answers, allWords) => {
            solutionTargets = [...answers];
            validDictionary = allWords;
            window._usingLargeList = true;
            window._dictLoading = false;
            if (btn) btn.textContent = 'Varsayılan Liste';
            updateGuessChainCounts();
            processEngine();
        };

        const failLoad = () => {
            window._dictLoading = false;
            if (btn) btn.textContent = 'Büyük Liste';
            alert('Büyük kelime listesi yüklenemedi.');
        };

        const tryScriptLoad = () => {
            const script = document.createElement('script');
            script.src = 'data/words-wordleplay.js';
            script.onload = () => {
                if (typeof WORDLEPLAY_ANSWERS !== 'undefined' && Array.isArray(WORDLEPLAY_ANSWERS) && WORDLEPLAY_ANSWERS.length > 0) {
                    finishLoad(WORDLEPLAY_ANSWERS, (typeof WORDLEPLAY_ALL_WORDS !== 'undefined' && Array.isArray(WORDLEPLAY_ALL_WORDS)) ? WORDLEPLAY_ALL_WORDS : WORDLEPLAY_ANSWERS);
                } else if (typeof ANSWERS !== 'undefined' && Array.isArray(ANSWERS) && ANSWERS.length > 0) {
                    finishLoad(ANSWERS, (typeof ALL_WORDS !== 'undefined' && Array.isArray(ALL_WORDS)) ? ALL_WORDS : ANSWERS);
                } else {
                    failLoad();
                }
            };
            script.onerror = failLoad;
            document.head.appendChild(script);
        };

        const tryFetchParse = () => {
            fetch('data/words-wordleplay.js').then(r => r.text()).then(text => {
                const re = /['"]([^'"\n\r]+)['"]/g;
                let match;
                const words = [];
                while ((match = re.exec(text)) !== null) {
                    words.push(match[1]);
                }
                if (words.length > 0) {
                    finishLoad(words, words);
                    return;
                }
                tryScriptLoad();
            }).catch(() => {
                tryScriptLoad();
            });
        };

        tryFetchParse();
    } else {
        solutionTargets = window._defaultAnswers ? [...window._defaultAnswers] : [];
        validDictionary = window._defaultValid ? window._defaultValid : (typeof ANSWERS !== 'undefined' ? ANSWERS : []);
        window._usingLargeList = false;
        if (btn) btn.textContent = 'Büyük Liste';
        updateGuessChainCounts();
        processEngine();
    }
}

/**
 * Recompute remaining counts and entropy for each guessChain step
 * after swapping the solutionTargets array.
 */
function updateGuessChainCounts() {
    if (!Array.isArray(solutionTargets)) return;
    let runningCandidates = [...solutionTargets];
    for (let i = 0; i < guessChain.length; i++) {
        const step = guessChain[i];
        if (step.hasUserInteracted) {
            const colorCode = step.colors.join('');
            runningCandidates = runningCandidates.filter(k => getPattern(step.word, k) === colorCode);
        }
        step.remainingCount = runningCandidates.length;
        step.entropy = calculateEntropy(step.word, runningCandidates);
    }
    renderBoard();
}

/* Theme initialization and toggle */
function initTheme() {
    const pref = localStorage.getItem('theme') || 'dark';
    if (pref === 'light') {
        document.body.classList.add('light-mode');
        const btn = document.getElementById('themeToggle'); if (btn) btn.textContent = 'Karanlık Tema';
    } else {
        document.body.classList.remove('light-mode');
        const btn = document.getElementById('themeToggle'); if (btn) btn.textContent = 'Açık Tema';
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('themeToggle'); if (btn) btn.textContent = isLight ? 'Karanlık Tema' : 'Açık Tema';
}
