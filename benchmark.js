const fs = require('fs');

// Load necessary files into the Node environment
const wordsCode = fs.readFileSync('./words.js', 'utf8');
const engineCode = fs.readFileSync('./engine.js', 'utf8');

// Evaluate browser variables into the Node context
eval(wordsCode.replace(/const /g, 'var ')); 
eval(engineCode);

console.log("Calculating entropy for all words. This process will take a moment...");

// Use Set to remove any duplicate words from the dictionary
const rawDictionary = typeof ALL_WORDS !== 'undefined' ? ALL_WORDS : ANSWERS;
const dictionary = [...new Set(rawDictionary)];
let topWords = [];

// Calculate entropy for each unique word to find the best starting words
for (let i = 0; i < dictionary.length; i++) {
    let word = dictionary[i];
    let entropy = calculateEntropy(word, ANSWERS);
    topWords.push({ word: word, entropy: entropy });
    
    // Dynamic progress indicator for entropy calculation
    if (i % 50 === 0) {
        process.stdout.write(`\rCalculating entropy: ${((i / dictionary.length) * 100).toFixed(1)}%`);
    }
}
process.stdout.write(`\rCalculating entropy: 100.0%\n`);

// Sort the results by highest entropy and slice the top 10
topWords.sort((a, b) => b.entropy - a.entropy);
const top10 = topWords.slice(0, 10);

// Print the top 10 words immediately after entropy calculation
console.log("\nTop 10 Starting Words (By Entropy):");
for (let i = 0; i < top10.length; i++) {
    console.log(`${i + 1}. ${top10[i].word.toLocaleUpperCase('tr-TR')} -> Entropy: ${top10[i].entropy.toFixed(4)} bits`);
}

console.log("\nStarting benchmark simulation for the top 10 words...");

// Simulate a full game for every possible answer using only the top 10 starting words
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
            
            // Break the loop if the correct word is found
            if (pattern === '22222') break;

            // Eliminate candidates that do not match the returned color pattern
            candidates = candidates.filter(k => getPattern(currentGuess, k) === pattern);
            
            if (candidates.length === 0) {
                fails++;
                break;
            } else if (candidates.length === 1) {
                // If only one candidate remains, use it directly
                currentGuess = candidates[0];
            } else {
                // Use the engine to calculate and find the next best optimal guess
                currentGuess = findBestWord(candidates, dictionary).word;
            }
        }
        
        // Count as a fail if the word is not found within the 6 guess limit
        if (guesses === 6 && currentGuess !== target) {
            fails++;
        }
        
        totalGuesses += guesses;
        
        // Dynamic progress indicator for the benchmark simulation
        if (i % 25 === 0) {
            process.stdout.write(`\rSimulating word ${t + 1}/10 [${startWord.toLocaleUpperCase('tr-TR')}]: ${((i / ANSWERS.length) * 100).toFixed(1)}%`);
        }
    }
    process.stdout.write(`\rSimulating word ${t + 1}/10 [${startWord.toLocaleUpperCase('tr-TR')}]: 100.0%\n`);
    
    // Save the average guesses and fail count for the current starting word
    top10[t].avg = (totalGuesses / ANSWERS.length).toFixed(4);
    top10[t].fails = fails;
}

// Print the final results including both entropy and simulation averages
console.log("\nFinal Benchmark Results for Top 10 Words:");
for (let i = 0; i < top10.length; i++) {
    console.log(`${i + 1}. ${top10[i].word.toLocaleUpperCase('tr-TR')} -> Entropy: ${top10[i].entropy.toFixed(4)} bits | Avg Guesses: ${top10[i].avg} | Fails: ${top10[i].fails}`);
}