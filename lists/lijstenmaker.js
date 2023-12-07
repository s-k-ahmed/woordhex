let GEFILT = [];
const alphletters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

WOORDEN3.forEach((w) => (isPangram(w)) ? GEFILT.push(w) : null);
console.log(GEFILT);

// Checks to see if the input w is a valid guess (that isn't already in arr)
// Returns  TRUE if all conditions are met
//          "tooShort" if the guess has less than 4 letters
//          "invalidLetter" if the guess contains at least one invalid character
//          "tooManyUniques" if the guess has more than 7 unique letters
function isValidWord(w) {
    // Does it have 4+ letters?
    let hasEnoughLetters = (w.length > 3);
    if (hasEnoughLetters == false) {
        return "tooShort";
    }

    // Does it have capitals/diacritics?
    for (i = 0; i < w.length; i++) {
        let letter = w.slice(i, i+1);
        if (alphletters.indexOf(letter) == -1) {
            return "invalidLetter";
        }
    }

    // Are there more than 7 unique letters?
    let wordAZLetters = [];
    alphletters.forEach((value) => w.indexOf(value) != -1 ? wordAZLetters.push(value) : null);   // Creates array of letters in the guess
    if (wordAZLetters.length > 7) {
        return "tooManyUniques";
    }

    return true;
};

function isPangram(w) {
    let guessLetters = [];
    alphletters.forEach((value) => w.indexOf(value) != -1 ? guessLetters.push(value) : null);   // Creates array of letters in the guess
    return (guessLetters.length == 7);
};