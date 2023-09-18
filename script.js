// Initialises global variables
let date = new Date();
let dateUnix = Math.floor((Date.now()-(date.getTimezoneOffset()*1000*60))/(1000*60*60*24)); // Set to change days at midnight in local timezone
let WOORD;
let CENTRAALINDEX;
let CENTRAALLETTER;
const WOORDLETTERS = [];
const alphletters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
let GUESSES = [];
let ANTWOORDEN = [];
let scoreHistory = [];
const shuffle = [0, 1, 2, 3, 4, 5, 6];
let answersShown = false;
let answersSeen = false;

if (typeof(Storage) == "undefined") {
    alert("Sorry, je browser ondersteunt lokale webopslag niet, dus er worden tussen sessies geen gegevens opgeslagen.")
}

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
    localStorage.removeItem("centralIndex");
    scoreHistory.push(JSON.parse(jsonTodayScore));          // Adds the previous day's score to scoreHistory,
    jsonScoreHistory = JSON.stringify(scoreHistory);        // ... then ...
    localStorage.setItem("score-hist", jsonScoreHistory);   // Saves it in local storage
    answersSeen = false;
}

// Uses the day as a seed to select a pangram word and central letter pseudo-randomly
function selectWord(d) {
    getfromStorage(d);

    // Chooses a word pseudo-randomly from the zevens array
    let woordnummer = (d ** 3) % ZEVENS.length;
    WOORD = ZEVENS[woordnummer];
    alphletters.forEach((value) => WOORD.indexOf(value) != -1 ? WOORDLETTERS.push(value) : null);   // Goes through the alphabet in order and adds the letters of the chosen word to the array WOORDLETTERS
    
    // Chooses a required letter from the word 
    // (23rd power gives equal probability for each of the 7 letters)
    CENTRAALINDEX = ((d ** 23) % 7);
    CENTRAALLETTER = WOORDLETTERS[CENTRAALINDEX];
    findSols();
    // Loops through the central indices until it finds one where the witch's score is 80 or higher
    let i = 0;
    while (i < 7 && calculateScore(ANTWOORDEN) < 80) {
        CENTRAALINDEX = (CENTRAALINDEX + 1) % 7;
        CENTRAALLETTER = WOORDLETTERS[CENTRAALINDEX];
        ANTWOORDEN = [];
        localStorage.removeItem("answers");
        findSols();
        i++;
    }
    GUESSES.forEach(g => printOutput(g));   // Needs to be after findSols() so it can print the %age properly
    updateWordCountScore();
    printText("antwoord-tel", "De woordheks heeft <b>" + ANTWOORDEN.length + "</b> woorden gevonden" + /*"(score = " + calculateScore(ANTWOORDEN) + ")*/ ". Kun je dat evenaren?");
    
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
    BASISWOORDEN.forEach(x => isValidWord(x) === true ? ANTWOORDEN.push(x) : null); // Checks each word in the smaller list to see if it is a valid answer
    ANTWOORDEN.sort();                                              // Sorts them alphabetically
        //jsonAnswers = JSON.stringify(ANTWOORDEN);                       // ... then ...
        //localStorage.setItem("answers", jsonAnswers);                   // Saves the valid answers in local storage
}

// Takes guess, checks if it is valid, then prints it/an error message and saves it to local storage.
function submitWord() {
    let guess = document.getElementById("woord-input").value.toLowerCase();
    document.getElementById("woord-input").value = "";
    if (answersSeen == true) {
        printError("Antwoorden al gezien");
        return;
    }
    if (isValidWord(guess) != true) {
        let error = isValidWord(guess);
        let errorMessage = (
            error == "wrongLetters" ? "Niet toegestaan letter(s)" :
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
    printError("<br>");     // Preserves the vertical shape of the page
    GUESSES.push(guess);
    printOutput(guess);
    savetoStorage();
    focusInput();
}

// Checks to see if the input is a part of the long wordlist WOORDEN (TRUE/FALSE)
function isWord(w) {
    return WOORDEN.some(x => x === w);
}

// Checks to see if the input is a valid guess
// Returns  TRUE if all conditions are met
//          "wrongLetters" if the guess has an invalid letter
//          "noCentral" if the guess does not contain the central letter
//          "repeat" if the guess has already been made
function isValidWord(w) {
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
    // Has this word already been guessed?
    let newguess = GUESSES.reduce((total, current) => current == w ? total + 1 : total, 0);     // Counts how many times this guess has been made already (incl. this time)
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

/*
    ***DISPLAY FUNCTIONS***
*/

// HTML TEXT

function appendText(id, text) {
    document.getElementById(id).innerHTML += text;
}

function printText(id, text) {
    document.getElementById(id).innerHTML = text;
}

// Prints the variable x on the HTML page (used for testing/debugging)
function testOutput(x) {
    appendText("test", x + "<br>");
}

// Prints the variable x in the output section and word count + score in the wordcount section
function printOutput(x) {
    let currentOutput = document.getElementById("output").innerHTML;
    if (isPangram(x)) {
        printText("output", "<b>" + x + "</b><br>" + currentOutput);
    } else {
        printText("output", x + "<br>" + currentOutput);
    }
    updateWordCountScore();
}

// Prints the variable x as an invalid error message
function printError(x) {
    printText("invalid-guess", "<i>" + x + "</i>");
}

// Prints/updates the word count and score
// TO-DO: Check that scoreHistory works as intended, then implement some way to access it (maybe compare with average score?)
function updateWordCountScore() {
    printText("wordcount", "Woorden: <b>" + GUESSES.length + "</b><br>Score: <b>" + calculatePercentage(GUESSES, ANTWOORDEN) + "</b>");
}

if (date.getHours() > 17) {
    document.getElementById("answers").style.display = "inline";
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
        if (isPangram(x)) {
            appendText("antwoorden", "<b>" + x + "</b><br>");
        } else {
            appendText("antwoorden", x + "<br>");
        }
    });
    answersShown = true;
    answersSeen = true;
    savetoStorage();
}; 

// HTML INPUT

// Sets up word submission on pressing Enter and shuffle on pressing Space
document.getElementById("woord-input").addEventListener("keydown", function(event){
    if (event.key === "Enter") {
        submitWord();
    }
    if (event.code === "Space") {
        event.preventDefault();
        shuffleLetters();
    }
});

// Selects the word input box if the screen is presented horizontally
function focusInput() {
    screen.orientation.type == "landscape-primary" ? document.getElementById("woord-input").focus() : null;
}

// Adds letters to input on button press
function buttonPress(l) {
    document.getElementById("woord-input").value += WOORDLETTERS[shuffle[l]].toUpperCase();
};

// Delete the last letter inputted
function backspace() {
    let inputbox = document.getElementById("woord-input");
    inputbox.value = inputbox.value.slice(0, inputbox.value.length - 1);
}

// HTML BUTTON FORMATTING

// Labels a button with the appropriate letter in the shuffle array
function assignLetter(l) {
    document.getElementById("letter"+l).value = WOORDLETTERS[shuffle[l]].toUpperCase();
}

// Shuffles the shuffle array, excluding the first/central letter, and assigns them to the buttons
function shuffleLetters(){
    shuffle.shift();                    // Removes first/central letter
    for (let i = shuffle.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
    }
    shuffle.unshift(CENTRAALINDEX);     // Replaces first/central letter
    shuffle.forEach((value) => assignLetter(value));
}

// MODALS

function openModal(id) {
    let modal = document.getElementById(id);
    modal.style.display = "block";
}

function closeModal(id) {
    let modal = document.getElementById(id);
    modal.style.display = "none";
}