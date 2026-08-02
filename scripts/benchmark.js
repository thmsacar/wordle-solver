const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const wordsPath = path.join(rootDir, 'data', 'words.js');
const enginePath = path.join(rootDir, 'src', 'engine.js');

const wordsCode = fs.readFileSync(wordsPath, 'utf8');
const engineCode = fs.readFileSync(enginePath, 'utf8');

eval(wordsCode.replace(/const /g, 'var '));
eval(engineCode);

console.log('Calculating entropy for all words. This process will take a moment...');

const rawDictionary = typeof ALL_WORDS !== 'undefined' ? ALL_WORDS : ANSWERS;
const dictionary = [...new Set(rawDictionary)];
let topWords = [];

for (let i = 0; i < dictionary.length; i++) {
    let word = dictionary[i];
    let entropy = calculateEntropy(word, ANSWERS);
    topWords.push({ word: word, entropy: entropy });

    if (i % 50 === 0) {
        process.stdout.write(`\rCalculating entropy: ${((i / dictionary.length) * 100).toFixed(1)}%`);
    }
}
process.stdout.write(`\rCalculating entropy: 100.0%\n`);

topWords.sort((a, b) => b.entropy - a.entropy);
const top10 = topWords.slice(0, 10);

console.log('\nTop 10 Starting Words (By Entropy):');
for (let i = 0; i < top10.length; i++) {
    console.log(`${i + 1}. ${top10[i].word.toLocaleUpperCase('tr-TR')} -> Entropy: ${top10[i].entropy.toFixed(4)} bits`);
}

console.log('\nStarting benchmark simulation for the top 10 words...');

for (let t = 0; t < top10.length; t++) {
    let startWord = top10[t].word;
    let totalGuesses = 0;
    let fails = 0;

    for (let i = 0; i < ANSWERS.length; i++) {
        let target = ANSWERS[i];
        let candidates = [...ANSWERS];
        let guesses = 0;
        let currentGuess = startWord;

        while (guesses < 6) {
            guesses++;
            let pattern = getPattern(currentGuess, target);

            if (pattern === '22222') break;

            candidates = candidates.filter(k => getPattern(currentGuess, k) === pattern);

            if (candidates.length === 0) {
                fails++;
                break;
            } else if (candidates.length === 1) {
                currentGuess = candidates[0];
            } else {
                currentGuess = findBestWord(candidates, dictionary).word;
            }
        }

        if (guesses === 6 && currentGuess !== target) {
            fails++;
        }

        totalGuesses += guesses;

        if (i % 25 === 0) {
            process.stdout.write(`\rSimulating word ${t + 1}/10 [${startWord.toLocaleUpperCase('tr-TR')}]: ${((i / ANSWERS.length) * 100).toFixed(1)}%`);
        }
    }
    process.stdout.write(`\rSimulating word ${t + 1}/10 [${startWord.toLocaleUpperCase('tr-TR')}]: 100.0%\n`);

    top10[t].avg = (totalGuesses / ANSWERS.length).toFixed(4);
    top10[t].fails = fails;
}

console.log('\nFinal Benchmark Results for Top 10 Words:');
for (let i = 0; i < top10.length; i++) {
    console.log(`${i + 1}. ${top10[i].word.toLocaleUpperCase('tr-TR')} -> Entropy: ${top10[i].entropy.toFixed(4)} bits | Avg Guesses: ${top10[i].avg} | Fails: ${top10[i].fails}`);
}
