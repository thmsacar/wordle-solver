# Information-Theoretic Wordle Solver

A fast, fully client-side Wordle solver based on **Information Theory and Shannon Entropy**. It mathematically calculates the optimal next guess to eliminate the maximum number of possible answers.

**Note on the Algorithm:** If you are curious about the math and logic behind this solver, please read the [docs/wordle_solver_algorithm.pdf](docs/wordle_solver_algorithm.pdf) file included in this repository. It provides a straightforward analysis of the Shannon Entropy calculations and the exact algorithm used to narrow down the candidate words.

## How to Adapt for Another Language

This solver uses a Turkish word list.

Want to use this solver for a different language or a custom Wordle clone? You only need to swap out the word data.

1. **Fork the repository.**
2. **Swap the Word Lists:** Open the `words.js` file and replace the two main arrays:
   - `ANSWERS`: The curated list of words that can actually be the correct solution.
   - `ALLOWED`: The broader list of valid words that can be used as guesses to narrow down options (but will never be the final answer).
   *(Note: If your target game only uses one giant list for both, just make both arrays identical).*
3. **Update the Locale:** Open `engine.js`, `index.html`, and `benchmark.js`. Search for the locale strings `.toLocaleLowerCase('tr-TR')` and `.toLocaleUpperCase('tr-TR')`. Change `'tr-TR'` to your target language code like `'en-US'` or `'fr-FR'` to avoid character conversion bugs across the UI and the CLI tools.

That's it! The entropy engine calculates everything dynamically, so it will instantly adapt to your new dictionary.

## Dictionary Toggle (Large List Feature)

Some Wordle clones use heavily expanded or alternative dictionaries. The UI includes a dictionary toggle button to dynamically switch word lists on the fly without losing your current game progress.

To set up your own alternative dictionary:
1. Create or replace the file named `words-wordleplay.js` in the root directory.
2. Define your alternative arrays inside it as `WORDLEPLAY_ANSWERS` and `WORDLEPLAY_ALL_WORDS`.
3. When the user clicks the toggle button, the engine will fetch this file, swap the active dictionaries, and instantly recalculate the entropy and next best guess for the current board state.

## Benchmarking

You can run a full simulation to find the best starting words and calculate the average solve rate for your specific dictionary. 

1. Ensure you have Node.js installed.
2. Run the benchmark script from your terminal:
   ```bash
   node benchmark.js
   ```