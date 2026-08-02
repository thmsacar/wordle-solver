let words = typeof ANSWERS !== 'undefined' ? [...ANSWERS] : []; 

/**
 * Returns 5-tile color pattern (0: gray, 1: yellow, 2: green).
 *
 * @param {string} guess - 5-letter guess word.
 * @param {string} actualAnswer - 5-letter target answer.
 * @returns {string} 5-character pattern string (e.g. "01020").
 */
function getPattern(guess, actualAnswer) {
    let pattern = [0, 0, 0, 0, 0];
    let answerLetters = actualAnswer.split('');
    let guessLetters = guess.split('');

    // Mark exact matches first (green)
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === answerLetters[i]) {
            pattern[i] = 2;
            answerLetters[i] = null;
            guessLetters[i] = null;
        }
    }

    // Mark wrong position matches (yellow)
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] !== null && answerLetters.includes(guessLetters[i])) {
            pattern[i] = 1;
            answerLetters[answerLetters.indexOf(guessLetters[i])] = null;
        }
    }

    return pattern.join('');
}

/**
 * Calculates Shannon Entropy H(g) for a guess over remaining candidate answers.
 *
 * @param {string} guess - Word being evaluated.
 * @param {string[]} wordList - Active candidate answer set.
 * @returns {number} Expected information gain in bits.
 */
function calculateEntropy(guess, wordList) {
    let buckets = {};
    let totalWords = wordList.length;

    // Group candidates into pattern buckets
    for (let answer of wordList) {
        let pattern = getPattern(guess, answer);
        buckets[pattern] = (buckets[pattern] || 0) + 1;
    }

    // entropy = - sum( p_i * log2(p_i) )
    let entropy = 0;
    for (let p in buckets) {
        let probability = buckets[p] / totalWords;
        entropy -= probability * Math.log2(probability);
    }

    return entropy;
}

/**
 * Finds the word in fullDictionary that maximizes Information Gain.
 *
 * @param {string[]} candidateList - Remaining target candidates to eliminate.
 * @param {string[]} [fullDictionary] - Valid guess vocabulary.
 * @returns {{word: string, entropy: number}} Best guess and its entropy score.
 */
function findBestWord(candidateList, fullDictionary = typeof ANSWERS !== 'undefined' ? ANSWERS : candidateList) {
    // If only 1-2 words remain, guess directly from candidates
    if (candidateList.length <= 2) {
        let maxEnt = -1;
        let best = candidateList[0];
        for (let guess of candidateList) {
            let ent = calculateEntropy(guess, candidateList);
            if (ent > maxEnt) {
                maxEnt = ent;
                best = guess;
            }
        }
        return { word: best, entropy: maxEnt };
    }

    let maxScore = -1;
    let bestWord = candidateList[0];
    let bestEntropy = 0;

    // Search full vocabulary for maximum entropy
    for (let guess of fullDictionary) {
        let entropy = calculateEntropy(guess, candidateList);
        let isCandidate = candidateList.includes(guess);
        // If entropy is same, prefer words that can actually be the answer
        let score = entropy + (isCandidate ? 0.0001 : 0);

        if (score > maxScore) {
            maxScore = score;
            bestWord = guess;
            bestEntropy = entropy;
        }
    }

    return { word: bestWord, entropy: bestEntropy };
}