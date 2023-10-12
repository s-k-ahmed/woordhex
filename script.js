// Initialises global variables
let date = new Date();
let dateUnix = Math.floor((Date.now()-(date.getTimezoneOffset()*1000*60))/(1000*60*60*24)); // Set to change days at midnight in local timezone
let woordhexNumber = dateUnix - 19619;
let WOORDNUMMER;
let WOORD;
let CENTRAALINDEX;
let CENTRAALLETTER;
let WOORDLETTERS = [];
const alphletters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
let GUESSES = [];
let ANTWOORDEN = [];
let scoreHistory = [];
const shuffle = [0, 1, 2, 3, 4, 5, 6];
let answersShown = false;
let answersSeen = false;
let isSortAZ = false;
let minWordCount = 20;
let maxWordCount = 80;
let version = "1.1.3";

if (typeof(Storage) == "undefined") {
    alert("Sorry, je browser ondersteunt lokale webopslag niet, dus er worden tussen sessies geen gegevens opgeslagen.")
}

printFooter();
// Chooses a word and central letter based on the current day
selectWord(dateUnix);
focusInput();


/*
    ***GAME FUNCTIONS***
*/

// Saves today's guesses to local storage
function savetoStorage() {
    localStorage.setItem("date", dateUnix);
    let jsonGuesses = JSON.stringify(GUESSES);
    localStorage.setItem("guesses", jsonGuesses);
    localStorage.setItem("todayScore", calculatePercentage(GUESSES, ANTWOORDEN));
    localStorage.setItem("answersSeen", answersSeen);
}

// Retrieves today's guesses from local storage
function getfromStorage(d) {
    let jsonDate = localStorage.getItem("date");
    let jsonGuesses = localStorage.getItem("guesses");
    let jsonScoreHistory = localStorage.getItem("score-hist");
    let jsonTodayScore = localStorage.getItem("todayScore");
    let jsonAnswersSeen = localStorage.getItem("answersSeen");
    scoreHistory = JSON.parse(jsonScoreHistory);
    answersSeen = JSON.parse(jsonAnswersSeen);

    // Gives default values for GUESSES, scoreHistory and answersSeen if no local storage is already saved
    if (jsonDate == null) {
        openModal("about");
        return;
    }
    if (jsonTodayScore == null) {
        return;
    }
    if (jsonGuesses == null) {
        GUESSES = [];
    }
    if (jsonScoreHistory == null) {
        scoreHistory = [];
    }
    if (jsonAnswersSeen == null || jsonAnswersSeen == "null") {
        answersSeen = false;
    }

    // Only loads and prints guesses if the day is the same as the last session
    if (jsonDate == d) {
        GUESSES = JSON.parse(jsonGuesses);
        return;
    }
    // If the day has changed since the last session...
        // localStorage.removeItem("answers");                  // Removes the cached answers to the previous puzzle
        //openModal("newday");
    scoreHistory.push(JSON.parse(jsonTodayScore));          // Adds the previous day's score to scoreHistory,
    jsonScoreHistory = JSON.stringify(scoreHistory);        // ... then ...
    localStorage.setItem("score-hist", jsonScoreHistory);   // Saves it in local storage
    answersSeen = false;
}

// Uses the day as a seed to select a pangram word and central letter pseudo-randomly
// TO-DO: Tidy up while loops used for word selection
// TO-DO: Split into multiple functions
function selectWord(d) {
    getfromStorage(d);

    // Loops through words until it finds one between the min and max counts
    // TO-DO: Make it so that it picks the one closest to a wordcount of 23?
    let j = 0;
    while (j < 10 && (ANTWOORDEN.length < minWordCount || ANTWOORDEN.length > maxWordCount)) {
        WOORDLETTERS = [];
        ANTWOORDEN = [];

        // Chooses a word pseudo-randomly from the zevens array
        WOORDNUMMER = ((d ** 3) + j) % ZEVENS.length;
        WOORD = ZEVENS[WOORDNUMMER];
        alphletters.forEach((value) => WOORD.indexOf(value) != -1 ? WOORDLETTERS.push(value) : null);   // Goes through the alphabet in order and adds the letters of the chosen word to the array WOORDLETTERS
        
        // Loops through the central indices until it finds one where the witch's wordcount is between the min and max
        let i = 0;
        
        // (Until #23, 23rd power of dateUnix was used, but this lacked precision)
        if (woordhexNumber < 24) {
            CENTRAALINDEX = (d ** 23) % 7;
        }
        while (i < 7 && (ANTWOORDEN.length < minWordCount || ANTWOORDEN.length > maxWordCount)) {
            // localStorage.removeItem("answers");
            ANTWOORDEN = [];
            // Chooses a required letter from the word 
            // (5th power of woordhexNumber gives equal chance for the 7 letters, and is precise)
            if (woordhexNumber < 24) {
                CENTRAALINDEX = (CENTRAALINDEX + 1) % 7;
            } else {
                CENTRAALINDEX = ((woordhexNumber ** 5) + i) % 7;
            }
            CENTRAALLETTER = WOORDLETTERS[CENTRAALINDEX];
            findSols();
            i++;
        }
        if (woordhexNumber < 24) {
            break;
        }
        j++    
    }
    printGuesses();         // Needs to be after findSols() so it can print the %age properly
    updateWordCountScore();
    printText("antwoord-tel", "De woordheks heeft een score van 100 (met ", numberFormat(ANTWOORDEN.length), " woorden).", lineBreak(), "Kun je dat evenaren?");
    

    // Swaps the central letter index to the front so it can be avoided during shuffling
    [shuffle[0], shuffle[CENTRAALINDEX]] = [shuffle[CENTRAALINDEX], shuffle[0]]
    shuffleLetters();
    savetoStorage();
};

// Finds all solutions to today's puzzle and saves them in the array ANTWOORDEN
function findSols() {
    /*
        let jsonAnswers = localStorage.getItem("answers");
        // Imports answers from cache and escapes if there is cached content
        // (FYI: cached answers data is removed for new puzzles in getfromStorage())
        if (jsonAnswers != null) {
            ANTWOORDEN = JSON.parse(jsonAnswers);
            return;
        }
        // If there is no cached data...
    */
    BASISWOORDEN.forEach(x => isValidWord(x, ANTWOORDEN) === true ? ANTWOORDEN.push(x) : null); // Checks each word in the smaller list to see if it is a valid answer
    ANTWOORDEN.sort();                                              // Sorts them alphabetically
        //jsonAnswers = JSON.stringify(ANTWOORDEN);                       // ... then ...
        //localStorage.setItem("answers", jsonAnswers);                   // Saves the valid answers in local storage
}

// Takes guess, checks if it is valid, then prints it/an error message and saves it to local storage.
function submitWord() {
    let guess = document.getElementById("woord-input").innerText.toLowerCase();
    document.getElementById("woord-input").textContent = "";
    if (answersSeen == true) {
        printError("Antwoorden al gezien");
        return;
    }
    let error = isValidWord(guess, GUESSES);
    if (error != true) {
        let errorMessage = (
            error == "tooShort" ? "Te kort" :
            error == "wrongLetters" ? "Letter(s) niet toegestaan" :
            error == "noCentral" ? "Geen centrale letter" :
            error == "repeat" ? "Woord al gevonden" : null
            );
        printError(errorMessage);
        return;
    }
    if (isWord(guess) == false) {
        printError("Woord niet herkend");
        return;
    }
    GUESSES.push(guess);
    printGuesses();
    savetoStorage();
    focusInput();
}

// Checks to see if the input is a part of the long wordlist WOORDEN (TRUE/FALSE)
function isWord(w) {
    return WOORDEN.some(x => x === w);
}

// Checks to see if the input w is a valid guess (that isn't already in arr)
// Returns  TRUE if all conditions are met
//          "wrongLetters" if the guess has an invalid letter
//          "noCentral" if the guess does not contain the central letter
//          "repeat" if the guess has already been made in the array arr
function isValidWord(w, arr) {
    // Does it have 4+ letters?
    let hasEnoughLetters = (w.length > 3);
    if (hasEnoughLetters == false) {
        return "tooShort";
    }
    // Does it only contain the letters given in the puzzle? Does it contain the central letter?
    let guessLetters = [];
    alphletters.forEach((value) => w.indexOf(value) != -1 ? guessLetters.push(value) : null);   // Creates array of letters in the guess
    let hasValidLetters = guessLetters.every((value) => WOORDLETTERS.indexOf(value) != -1);     // Returns FALSE if any letter in the guess is not in the pangram
    if (hasValidLetters == false) {
        return "wrongLetters";
    }
    let hasCentral = (guessLetters.indexOf(CENTRAALLETTER) != -1);                              // Returns FALSE if the central letter is missing
    if (hasCentral == false) {
        return "noCentral";
    }
    // Has this word already been found in the given array?
    let newguess = arr.reduce((total, current) => current == w ? total + 1 : total, 0);     // Counts how many times this guess has been made already (incl. this time)
    let isNew = (newguess == 0);
    if (isNew == false) {
        return "repeat";
    }
    return true;
};

// Calculates the score (1 for 4-letter words, etc.) for an array arr
function calculateScore(arr) {
    return arr.reduce((total, current) => isPangram(current) ? total + current.length + 7 : current.length > 4 ? total + current.length : current.length == 4 ? total + 1 : total, 0)
}

function calculatePercentage(g, a) {
    return Math.round(calculateScore(g)*100/calculateScore(a));
}

// Returns TRUE if w has 7 unique letters
function isPangram(w) {
    let guessLetters = [];
    alphletters.forEach((value) => w.indexOf(value) != -1 ? guessLetters.push(value) : null);   // Creates array of letters in the guess
    return (guessLetters.length == 7);
};

function woordheksDidNotFind(w) {
    return (GUESSES.indexOf(w) != -1 && ANTWOORDEN.indexOf(w) == -1);
}

function userDidNotFind(w) {
    return (GUESSES.indexOf(w) == -1 && ANTWOORDEN.indexOf(w) != -1);
}

/*
    ***DISPLAY FUNCTIONS***
*/

// HTML PRINTING TEXT

function appendText(id, ...text) {
    let element = document.getElementById(id);
    text.forEach(value => element.append(value));
}

function printText(id, ...text) {
    let element = document.getElementById(id);
    element.textContent = "";
    text.forEach(value => element.append(value));
}

// Prints the variable x on the HTML page (used for testing/debugging)
function testOutput(x) {
    appendText("test", x, lineBreak());
}

// Prints the variable x in the output section and word count + score in the wordcount section
function printGuesses() {
    printText("guesses", "");
    if (isSortAZ) {
        GUESSES.slice().sort().forEach((guess) => {
            let guessOutput = guess;
            if (woordheksDidNotFind(guess)) {
                guessOutput = woordheksDidNotFindFormat(guessOutput);
            }
            if (isPangram(guess)) {
                guessOutput = pangramFormat(guessOutput);
            }
            appendText("guesses", guessOutput, lineBreak());
            updateWordCountScore();
        })
        return;
    }
    GUESSES.slice().reverse().forEach((guess) => {
        let guessOutput = guess;
        if (woordheksDidNotFind(guess)) {
            guessOutput = woordheksDidNotFindFormat(guessOutput);
        }
        if (isPangram(guess)) {
            guessOutput = pangramFormat(guessOutput);
        }
        appendText("guesses", guessOutput, lineBreak());
        updateWordCountScore();
    })
}

// Prints the variable x as an invalid error message
function printError(x) {
    printText("invalid-guess", errorFormat(x));
    document.getElementById("invalid-guess").style.opacity = 0.8;
    setTimeout(() => {
        document.getElementById("invalid-guess").style.opacity = 0;
    }, 1000)
}

function printFooter() {
    appendText("footer-woordhex-nummer", woordhexNumber);
    appendText("footer-version", version);
}

// Prints/updates the word count and score
// TO-DO v1.2+: Check that scoreHistory works as intended, then implement a stats modal
function updateWordCountScore() {
    printText("wordcount", "Woorden: ", numberFormat(GUESSES.length), lineBreak());
    appendText("wordcount", "Score: ", numberFormat(calculatePercentage(GUESSES, ANTWOORDEN)), "/100");
}

// HTML DISPLAY ELEMENTS

if (date.getHours() > 17) {
    document.getElementById("pmdiv").style.display = "inline";
}

// Toggles the order of the guesses
function toggleGuessSort() {
    isSortAZ = !isSortAZ;
    isSortAZ ? printText("sort-guesses", "Sorteren: A-Z") : printText("sort-guesses", "Sorteren: Tijd");
    printGuesses();
}

// Toggles the printing of the list of possible answers
function toggleAnswers() {
    printText("antwoorden", "");        // Clears answer HTML paragraph
    // If answers were already showing, then escapes
    if (answersShown) {
        printText("show-answers", "Antwoorden tonen");
        answersShown = false;
        return;
    }
    // If answers were hidden, then shows answers
    printText("show-answers", "Antwoorden verbergen");
    ANTWOORDEN.forEach(x => {
        // If an answer is a pangram, then print it bold
        let antOutput = x;
        if (isPangram(x)) {
            antOutput = pangramFormat(antOutput);
        }
        if (userDidNotFind(x)) {
            antOutput = userDidNotFindFormat(antOutput);
        }
        appendText("antwoorden", antOutput, lineBreak());
    });
    answersShown = true;
    answersSeen = true;
    savetoStorage();
}; 

function shareResult() {
    let score = calculatePercentage(GUESSES, ANTWOORDEN);
    // let scoreGroup = Math.floor(score / 20);
    let yourWords = GUESSES.length;
    let heksWords = ANTWOORDEN.length;
    let yourPangrams = GUESSES.reduce((total, current) => ZEVENSLANG.indexOf(current) != -1 ? total + 1 : total, 0);
    let pangramText = yourPangrams;
    yourPangrams == 1 ? pangramText += " pangram" : pangramText += " pangrammen";
    // let youWon = (score > 100);
    // let scoreEmojis = ["✨", "🔮", "🛡", "🏰", "⚔", "🏆"];
    // let youEmoji = "🏇";
    // let heksEmoji = "🧙‍♀️";
    /*
    youWon ? youEmoji += "👑" : heksEmoji += "👑";
    let emojiText = scoreEmojis.filter((value, index) => index <= scoreGroup).join("");
    */
    let emojiText = "🏇⚔✨🧙‍♀️";
    let resultText = "WOORDHEX #" + woordhexNumber + "\n" + emojiText + "\n" + score + " 🆚 100 punten\n" + yourWords + " 🆚 " + heksWords + " woorden\n" + pangramText + "\nhttps://s-k-ahmed.github.io/woordhex/";
    navigator.clipboard.writeText(resultText);
    printText("result-shared", "Resultaat gekopieerd naar klembord");
    document.getElementById("result-shared").style.opacity = 0.8;
    setTimeout(() => {
        document.getElementById("result-shared").style.opacity = 0;
    }, 1000)
}

// MODALS

function openModal(id) {
    let modal = document.getElementById(id);
    modal.style.display = "flex";
}

function closeModal(id) {
    let modal = document.getElementById(id);
    modal.style.display = "none";
    focusInput();
}

// HTML INPUT

// Sets up word submission on pressing Enter and shuffle on pressing Space
document.getElementById("woord-input").addEventListener("keydown", function(event){
    if (event.ctrlKey) {
        return;
    }
    let key = event.key;
    let keyUpperCase = key.toUpperCase();
    if (key === "Enter") {
        event.preventDefault();
        submitWord();
    }
    if (key === " ") {
        event.preventDefault();
        shuffleLetters();
    }
    if (key === "Backspace") {
        event.preventDefault();
        backspace();
    }
    if (key.toLowerCase() === CENTRAALLETTER) {
        event.preventDefault();
        keyUpperCase = centralLetterFormat(keyUpperCase);
    }
    if (alphletters.indexOf(event.key.toLowerCase()) != -1) {
        event.preventDefault();
        document.getElementById("woord-input").append(keyUpperCase);
    }
});

// Selects the word input box if the screen is presented horizontally
function focusInput() {
    screen.orientation.type == "landscape-primary" ? document.getElementById("woord-input").focus() : null;
}

// Adds letters to input on button press
function buttonPress(l) {
    let letter = WOORDLETTERS[shuffle[l]];
    let upperCaseLetter = letter.toUpperCase();
    if (letter == CENTRAALLETTER) {
        upperCaseLetter = centralLetterFormat(upperCaseLetter);
    }
    document.getElementById("woord-input").append(upperCaseLetter);
};

// Delete the last letter inputted
function backspace() {
    let inputbox = document.getElementById("woord-input");
    inputbox.lastChild.remove();
}

// HTML TEXT FORMATTING

function lineBreak() {
    return document.createElement("br");
}

function numberFormat(x) {
    let numberSpan = document.createElement("span");
    numberSpan.classList.add("number");
    numberSpan.append(x);
    return numberSpan;
}

function errorFormat(x) {
    let errorSpan = document.createElement("span");
    errorSpan.classList.add("error");
    errorSpan.append(x);
    return errorSpan;
}

function pangramFormat(x) {
    let pangramSpan = document.createElement("span");
    pangramSpan.classList.add("pangram");
    pangramSpan.append(x);
    return pangramSpan;
}

function centralLetterFormat(x) {
    let centralLetterSpan = document.createElement("span");
    centralLetterSpan.classList.add("central-letter");
    centralLetterSpan.append(x);
    return centralLetterSpan;
}

function woordheksDidNotFindFormat(x) {
    let whDNFSpan = document.createElement("span");
    whDNFSpan.classList.add("woordheks-didnotfind");
    whDNFSpan.append(x);
    return whDNFSpan;
}

function userDidNotFindFormat(x) {
    let userDNFSpan = document.createElement("span");
    userDNFSpan.classList.add("user-didnotfind");
    userDNFSpan.append(x);
    return userDNFSpan;
}

// HTML BUTTON SETUP

// Labels a button with the appropriate letter in the shuffle array
function assignLetter(l) {
    document.getElementById("letter"+l).value = WOORDLETTERS[shuffle[l]].toUpperCase();
}

// Shuffles the shuffle array, excluding the first/central letter, and assigns them to the buttons
function shuffleLetters(){
    shuffle.forEach((v, i) => i > 0 ? document.getElementById("letter"+i).style.color = "transparent" : null);
    shuffle.shift();                    // Removes first/central letter
    for (let i = shuffle.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
    }
    shuffle.unshift(CENTRAALINDEX);     // Replaces first/central letter
    setTimeout(() => {
        shuffle.forEach((value) => assignLetter(value));
        shuffle.forEach((v, i) => i > 0 ? document.getElementById("letter"+i).style.color = "white" : null);
    }, 300)
}