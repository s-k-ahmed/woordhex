// Initialises global variables
let date = new Date();
let dateUnix = Math.floor((Date.now()-(date.getTimezoneOffset()*1000*60))/(1000*60*60*24)); // Set to change days at midnight in local timezone
let todayWoordhexNumber = dateUnix - 19619;
let hashNumber = parseInt(location.hash.substring(1));
let isHashPuzzle = (hashNumber < todayWoordhexNumber && hashNumber != NaN)
let woordhexNumber = isHashPuzzle ? hashNumber : todayWoordhexNumber;
let WOORDNUMMER;
let WOORD;
let CENTRAALINDEX;
let CENTRAALLETTER;
let WOORDLETTERS = [];
const alphletters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
const hekscolors = ["grey", "green", "orangered", "purple"];
let GUESSES = [];
let HASHGUESSES = [];
let currentGuesses = [];
let ANTWOORDEN1 = [];
let ANTWOORDEN2 = [];
let ANTWOORDEN3 = [];
let ANTWOORDEN = [];
let ANTWOORDENGROEP = [ANTWOORDEN1, ANTWOORDEN2, ANTWOORDEN3, ANTWOORDEN3];
let LEVEL = -1;
let HASHLEVEL = -1;
let currentLevel;
let scoreHistory = [];
let scoreHistoryv2 = [];
let levelHistory = [];
const shuffle = [0, 1, 2, 3, 4, 5, 6];
let answersShown = false;
let answersSeen = false;
let isSortAZ = false;
let minWordCount = 20;
let maxWordCount = 80;
let version = "2.0.5";

if (typeof(Storage) == "undefined") {
    alert("Sorry, je browser ondersteunt lokale webopslag niet, dus er worden tussen sessies geen gegevens opgeslagen.")
}

displayPM();
printFooter();
setUpEventListeners();
// Chooses a word and central letter based on the current day
selectPuzzle(woordhexNumber + 19619);
updateStats();
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
    localStorage.setItem("todayLevel", LEVEL);
    localStorage.setItem("answersSeen", answersSeen);
}

// Retrieves today's guesses from local storage
function getfromStorage() {
    let jsonDate = localStorage.getItem("date");
    let jsonGuesses = localStorage.getItem("guesses");
    let jsonScoreHistory = localStorage.getItem("score-hist");
    let jsonScoreHistoryv2 = localStorage.getItem("score-hist-v2");
    let jsonLevelHistory = localStorage.getItem("level-hist");
    let jsonTodayScore = localStorage.getItem("todayScore");
    let jsonTodayLevel = localStorage.getItem("todayLevel");
    let jsonAnswersSeen = localStorage.getItem("answersSeen");
    scoreHistory = JSON.parse(jsonScoreHistory);
    scoreHistoryv2 = JSON.parse(jsonScoreHistoryv2);
    levelHistory = JSON.parse(jsonLevelHistory);
    answersSeen = JSON.parse(jsonAnswersSeen);


    // Gives default values for GUESSES, scoreHistory, levelHistory and answersSeen if no local storage is already saved
    if (jsonDate == null) {
        openModal("v2-intro");
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
    if (jsonScoreHistoryv2 == null) {
        scoreHistoryv2 = [];
    }
    if (jsonLevelHistory == null) {
        levelHistory = [];
    }
    if (jsonAnswersSeen == null || jsonAnswersSeen == "null") {
        answersSeen = false;
    }

    // Only loads and prints guesses if the day is the same as the last session
    if (jsonDate == dateUnix) {
        GUESSES = JSON.parse(jsonGuesses);
        return;
    }
    // If the day has changed since the last session...
    newDay(jsonTodayScore, jsonScoreHistoryv2, jsonTodayLevel, jsonLevelHistory);
}

// Makes relevant changes for a new day
// Takes json variables as inputs to avoid defining them globally
// * scoreHistory: sets cookie
// * levelHistory: sets cookie
// * answersSeen: set to false
// * LEVEL: sets to -1
function newDay(jsonTodayScore, jsonScoreHistoryv2, jsonTodayLevel, jsonLevelHistory) {
    scoreHistoryv2.push(JSON.parse(jsonTodayScore));          // Adds the previous day's score to scoreHistory,
    jsonScoreHistoryv2 = JSON.stringify(scoreHistoryv2);        // ... then ...
    localStorage.setItem("score-hist-v2", jsonScoreHistoryv2);   // Saves it in local storage

    levelHistory.push(JSON.parse(jsonTodayLevel));          // Adds the previous day's level to levelHistory,
    jsonLevelHistory = JSON.stringify(levelHistory);        // ... then ...
    localStorage.setItem("level-hist", jsonLevelHistory);   // Saves it in local storage

    answersSeen = false;
    LEVEL = -1;
}

// TO-DO v2: new intro modal
function v2update() {
    if (localStorage.getItem("score-hist-v2")) {
        return;
    }
    if (scoreHistory == null) {
        return;
    }
    scoreHistoryv2 = scoreHistory.map((value) => 10 * value);
    let jsonScoreHistoryv2 = JSON.stringify(scoreHistoryv2);
    localStorage.setItem("score-hist-v2", jsonScoreHistoryv2);
    //localStorage.removeItem("score-hist");
}

function setLevel() {
    currentGuesses = isHashPuzzle ? HASHGUESSES : GUESSES;
    let percent1 = calculatePercentage(currentGuesses, ANTWOORDEN1);
    let percent2 = calculatePercentage(currentGuesses, ANTWOORDEN2);
    let percent3 = calculatePercentage(currentGuesses, ANTWOORDEN3);

    let previousLevel = isHashPuzzle ? HASHLEVEL : LEVEL;

    if (isHashPuzzle) {
        HASHLEVEL = (percent3 > 1000) ? 3 :
                    (percent2 > 1000) ? 2 :
                    (percent1 > 1000) ? 1 :
                    0;
    } else {
        LEVEL = (percent3 > 1000) ? 3 :
                (percent2 > 1000) ? 2 :
                (percent1 > 1000) ? 1 :
                0;
    }

    currentLevel = isHashPuzzle ? HASHLEVEL : LEVEL;

    if (previousLevel - currentLevel > 1) {
        // TO-DO v2: what happens if you level up more than once with a single word?
    }

    if (previousLevel != currentLevel && previousLevel != -1) {
        //testOutput("Level up!");
        //let witch = currentLevel + 1;
        //openModal("level" + witch + "-intro");
        document.getElementById("level-up-popup").style.opacity = 0.8;
        setTimeout(() => {
            document.getElementById("level-up-popup").style.opacity = 0;
        }, 1000)
    }

    document.getElementById("heks-node-1").style.display = "block";
    if (currentLevel > 0) {
        document.getElementById("heks-node-2").style.display = "block";
    }
    if (currentLevel > 1) {
        document.getElementById("heks-node-3").style.display = "block";
    }
}

function selectPuzzle(d) {
    getfromStorage();
    v2update();
    selectWord(d);
    ANTWOORDEN.forEach(x => ANTWOORDEN3.push(x));
    findSols(WOORDEN1, ANTWOORDEN1);
    findSols(WOORDEN2, ANTWOORDEN2);
    findSols(WOORDEN3, ANTWOORDEN3);
    setLevel();
    printGuesses();         // Needs to be after findSols() -- in selectWord() -- so it can print the %age properly
    updateWordCountScore();

    // Swaps the central letter index to the front so it can be avoided during shuffling
    [shuffle[0], shuffle[CENTRAALINDEX]] = [shuffle[CENTRAALINDEX], shuffle[0]]
    shuffleLetters();
    savetoStorage();
}

function selectCentralLetter(d) {
    // Loops through the central indices until it finds one where the witch's wordcount is between the min and max
    let i = 0;
            
    // (Until #23, 23rd power of dateUnix was used, but this lacked precision)
    if (woordhexNumber < 24) {
        CENTRAALINDEX = (d ** 23) % 7;
        CENTRAALLETTER = WOORDLETTERS[CENTRAALINDEX];
        findSols(WOORDEN3, ANTWOORDEN);
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
        findSols(WOORDEN3, ANTWOORDEN);
        i++;
    }
}

// Uses the day as a seed to select a pangram word and central letter pseudo-randomly
// TO-DO: Tidy up while loops used for word selection
function selectWord(d) {
    // Loops through words until it finds one between the min and max counts
    let j = 0;
    while (j < 10 && (ANTWOORDEN.length < minWordCount || ANTWOORDEN.length > maxWordCount)) {
        WOORDLETTERS = [];
        ANTWOORDEN = [];

        // Chooses a word pseudo-randomly from the zevens array
        WOORDNUMMER = ((d ** 3) + j) % ZEVENS.length;
        if (woordhexNumber == 32) {
            WOORDNUMMER = 1238;
        }
        WOORD = ZEVENS[WOORDNUMMER];
        alphletters.forEach((value) => WOORD.indexOf(value) != -1 ? WOORDLETTERS.push(value) : null);   // Goes through the alphabet in order and adds the letters of the chosen word to the array WOORDLETTERS
        
        selectCentralLetter(d);

        if (woordhexNumber < 24) {
            break;
        }
        j++;
    }
};

// Finds all solutions to today's puzzle in dictionaryArr and saves them in answerArr
function findSols(dictionaryArr, answerArr) {
    dictionaryArr.forEach(x => isValidWord(x, answerArr) === true ? answerArr.push(x) : null); // Checks each word in the smaller list to see if it is a valid answer
    answerArr.sort();               // Sorts them alphabetically
}

// Takes guess, checks if it is valid, then prints it/an error message and saves it to local storage.
function submitWord() {
    let guess = document.getElementById("woord-input").innerText.toLowerCase();
    document.getElementById("woord-input").textContent = "";
    if (answersSeen == true && !isHashPuzzle) {
        printError("Antwoorden al gezien");
        return;
    }
    currentGuesses = isHashPuzzle ? HASHGUESSES : GUESSES;
    let error = isValidWord(guess, currentGuesses);
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
    (isHashPuzzle) ? HASHGUESSES.push(guess) : GUESSES.push(guess);
    printGuesses();
    //currentLevel = isHashPuzzle ? HASHLEVEL : LEVEL;
    //updateWordCountScore(currentLevel, ANTWOORDENGROEP[currentLevel]);
    updateWordCountScore();
    savetoStorage();
    updateStats();
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
    return Math.round(calculateScore(g)*1000/calculateScore(a));
}

function commentPercent(x) {
    let commentMessage = (
        x == 0 ? "Veel succes!" :
        x < 100 ? "Blijf doorgaan!" :
        x < 200 ? "Goed" :
        x < 400 ? "Prima" :
        x < 500 ? "Super" :
        x < 700 ? "Fantastisch" :
        x < 1000 ? "Uitstekend" :
        x >= 1000 ? "Gefeliciteerd, je hebt gewonnen!" :
        "Hoe heb je dit gedaan? Bravo."
    );
    return commentMessage;
}

// Returns TRUE if w has 7 unique letters
function isPangram(w) {
    let guessLetters = [];
    alphletters.forEach((value) => w.indexOf(value) != -1 ? guessLetters.push(value) : null);   // Creates array of letters in the guess
    return (guessLetters.length == 7);
};

// TO-DO v2: make this appropriate for all three witches (perhaps including the answer array as an input)
function woordheksDidNotFind(w) {
    if (isHashPuzzle) {
        return (HASHGUESSES.indexOf(w) != -1 && ANTWOORDEN3.indexOf(w) == -1)
    }
    return (GUESSES.indexOf(w) != -1 && ANTWOORDEN3.indexOf(w) == -1);
}

function userDidNotFind(w) {
    if (isHashPuzzle) {
        return (HASHGUESSES.indexOf(w) == -1 && ANTWOORDEN3.indexOf(w) != -1)
    }
    return (GUESSES.indexOf(w) == -1 && ANTWOORDEN3.indexOf(w) != -1);
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

// Prints the user's guesses in the guesses sections in the order dictated by isSortAZ
function printGuesses() {
    printText("guesses", "");
    clearWordlists();
    document.getElementById("guesses-modal").style.display = "block";
    document.getElementById("modal-sort-guesses").style.boxShadow = "0px 0px 5px 0px grey";

    currentGuesses = isHashPuzzle ? HASHGUESSES : GUESSES;
    currentLevel = isHashPuzzle ? HASHLEVEL : LEVEL;
    document.getElementById("user-modal-wordcount").textContent = currentGuesses.length;
    if (isSortAZ) {
        currentGuesses.slice().sort().forEach((guess) => formatAppendGuess(guess));
        return;
    }
    currentGuesses.slice().reverse().forEach((guess) => formatAppendGuess(guess));
}

// Formats a guess appropriately and appends it to the guesses sections
function formatAppendGuess(guess) {
    let guessOutput = guess;
    let guessOutputModal = guess;
    if (woordheksDidNotFind(guess)) {
        guessOutput = woordheksDidNotFindFormat(guessOutput);
        guessOutputModal = woordheksDidNotFindFormat(guessOutputModal);
    }
    if (isPangram(guess)) {
        guessOutput = pangramFormat(guessOutput);
        guessOutputModal = pangramFormat(guessOutputModal);
    }
    appendText("guesses", guessOutput, lineBreak());
    appendText("guesses-modal", guessOutputModal, lineBreak());
}

// Prints the answers for a given witch (h = 1, 2, 3) in the appropriate sections
function printAnswers(h) {
    clearWordlists();
    document.getElementById("heks" + h + "-words-modal").style.display = "block";
    document.getElementById("modal-button-heks" + h).style.boxShadow = "0px 0px 5px 0px " + hekscolors[h];
    let ansArray = ANTWOORDENGROEP[h-1];
    ansArray.forEach(x => {
        // If an answer is a pangram, then print it bold
        let antOutput = x;
        let antOutputModal = x;
        if (isPangram(x)) {
            antOutput = pangramFormat(antOutput);
            antOutputModal = pangramFormat(antOutputModal);
        }
        if (userDidNotFind(x)) {
            antOutput = userDidNotFindFormat(antOutput, h);
            antOutputModal = userDidNotFindFormat(antOutputModal, h);
        }
        //appendText("antwoorden", antOutput, lineBreak());
        appendText("heks" + h + "-words-modal", antOutputModal, lineBreak());
    });
    document.getElementById("user-modal-wordcount").textContent = ansArray.length;
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
    appendText("header-woordhex-nummer-mobile", woordhexNumber);
    appendText("footer-version", version);
    appendText("footer-version-mobile", version);
}

function clearWordlists() {
    printText("guesses-modal", "");
    printText("heks1-words-modal", "");
    printText("heks2-words-modal", "");
    printText("heks3-words-modal", "");
    document.getElementById("modal-sort-guesses").style.boxShadow = "none";
    document.getElementById("modal-button-heks1").style.boxShadow = "none";
    document.getElementById("modal-button-heks2").style.boxShadow = "none";
    document.getElementById("modal-button-heks3").style.boxShadow = "none";
}

/*
function updateWordCountScoreAlt(level, answersArr) {
    setLevel();
    
    currentGuesses = isHashPuzzle ? HASHGUESSES : GUESSES;
    let percent = calculatePercentage(currentGuesses, answersArr);
    let totalPercent = calculatePercentage(currentGuesses, ANTWOORDEN);

    printText("score-comment", commentPercent(totalPercent));

    let csspercent = percent;
    if (totalPercent > 111) {
        csspercent = 111;
    }
    let htmlLevel = (level < 3) ? level + 1 : level;
    document.querySelector(":root").style.setProperty('--userscore-' + htmlLevel, csspercent + "%");
    document.getElementById("user-num-words-" + htmlLevel).textContent = currentGuesses.length;
    document.getElementById("user-num-score-" + htmlLevel).textContent = totalPercent;
    if (csspercent >= 93 && csspercent < 100) {
        //document.getElementById("user-num-words-cont").style.left = "-10px";
        //document.getElementById("user-num-score-cont").style.left = "-10px";
        document.getElementById("heks-num-words-cont-" + htmlLevel).style.left = "15px";
        document.getElementById("heks-num-score-cont-" + htmlLevel).style.left = "15px";
    }
    if (csspercent >= 97 && csspercent < 100) {
        document.getElementById("user-num-words-cont-" + htmlLevel).style.left = "-5px";
        document.getElementById("user-num-score-cont-" + htmlLevel).style.left = "-5px";
    }
    if (csspercent >= 100 && csspercent < 107) {
        document.getElementById("user-num-words-cont-" + htmlLevel).style.left = "5px";
        document.getElementById("user-num-score-cont-" + htmlLevel).style.left = "5px";
        document.getElementById("heks-num-words-cont-" + htmlLevel).style.left = "-15px";
        document.getElementById("heks-num-score-cont-" + htmlLevel).style.left = "-15px";
    }
}
*/

// Prints/updates the word count and score
function updateWordCountScore() {
    setLevel();
    //let htmlLevel = (LEVEL < 3) ? LEVEL + 1 : LEVEL;
    
    currentGuesses = isHashPuzzle ? HASHGUESSES : GUESSES;
    currentLevel = isHashPuzzle ? HASHLEVEL : LEVEL;

    //let percent = calculatePercentage(currentGuesses, ANTWOORDENGROEP[currentLevel]);
    let witch1percent = calculatePercentage(ANTWOORDEN1, ANTWOORDENGROEP[currentLevel]);
    let witch2percent = calculatePercentage(ANTWOORDEN2, ANTWOORDENGROEP[currentLevel]);
    let totalPercent = calculatePercentage(currentGuesses, ANTWOORDEN);
    let currentWitchScore = calculatePercentage(ANTWOORDENGROEP[currentLevel], ANTWOORDEN);

    let percent = Math.round(totalPercent * 1000 / currentWitchScore);

    // Printing score comments
    printText("score-comment", commentPercent(totalPercent));

    // Formatting the position of the slider hexes
    let csspercent = percent;
    if (totalPercent > 1111) {
        csspercent = 1111;
    }


    for (i = 1; i < 4; i++) {
        document.getElementById("heks" + i + "-speech-words").textContent = ANTWOORDENGROEP[i-1].length;
        document.getElementById("heks" + i + "-speech-score").textContent = calculatePercentage(ANTWOORDENGROEP[i-1], ANTWOORDEN);
        document.getElementById("heks-num-words-" + i).textContent = ANTWOORDENGROEP[i-1].length;
        //document.getElementById("heks" + i + "-speech-words").textContent = ANTWOORDENGROEP[i-1].length;
        document.getElementById("heks-num-score-" + i).textContent = calculatePercentage(ANTWOORDENGROEP[i-1], ANTWOORDEN);
        //document.getElementById("heks" + i + "-speech-score").textContent = calculatePercentage(ANTWOORDENGROEP[i-1], ANTWOORDEN);

    }

    document.querySelector(":root").style.setProperty('--usersliderleft', 0.09 * csspercent + "%");
    document.querySelector(":root").style.setProperty('--heks1sliderleft', 0.09 * witch1percent + "%");
    document.querySelector(":root").style.setProperty('--heks2sliderleft', 0.09 * witch2percent + "%");
    document.querySelector(":root").style.setProperty('--heks3sliderleft', "90%");

    // Printing the word count and scores next to the hexes
    document.getElementById("user-num-words").textContent = currentGuesses.length;
    document.getElementById("user-num-score").textContent = totalPercent;

    // Adjusting text position during hex clashes 
    //(maxHexGap: the maximum distances two hexes have to be (in px) to cause a clash)
    let sliderWidth = document.getElementById("slider-container").clientWidth;
    let userLeft = Math.round(sliderWidth * 0.0009 * csspercent - 7.5);
    let witch1Left = Math.round(sliderWidth * 0.0009 * witch1percent - 7.5);
    let witch2Left = (currentLevel > 0) ? Math.round(sliderWidth * 0.0009 * witch2percent - 7.5) : witch1Left;
    let witch3Left = (currentLevel > 1) ? Math.round(sliderWidth * 0.0009 * 1000 - 7.5) : witch1Left;

    const maxHexGap = 35;

    let diffUW1 = Math.abs(userLeft - witch1Left);
    let diffUW2 = Math.abs(userLeft - witch2Left);
    let diffUW3 = Math.abs(userLeft - witch3Left);
    let isClash1 = (diffUW1 < maxHexGap);
    let isClash2 = (diffUW2 < maxHexGap);
    let isClash3 = (diffUW3 < maxHexGap);
    let isWitchHigher1 = (userLeft < witch1Left);
    let isWitchHigher2 = (userLeft < witch2Left);
    let isWitchHigher3 = (userLeft < witch3Left);
    let offsetUW1 = 0.5 * (maxHexGap - Math.abs(diffUW1));
    let offsetUW2 = 0.5 * (maxHexGap - Math.abs(diffUW2));
    let offsetUW3 = 0.5 * (maxHexGap - Math.abs(diffUW3));
    

    /*
    testOutput(diffUW1);

    isClash1 ? testOutput("Clash 1!") :
    isClash2 ? testOutput("Clash 2!") :
    isClash3 ? testOutput("Clash 3!") : null;
    */

    let userLeftAdjust = 0;
    let witch1LeftAdjust = 0;
    let witch2LeftAdjust = 0;
    let witch3LeftAdjust = 0;

    userLeftAdjust += (isClash1 && isWitchHigher1) ? -offsetUW1 : 0;
    userLeftAdjust += (isClash1 && !isWitchHigher1) ? offsetUW1 : 0;
    userLeftAdjust += (isClash2 && isWitchHigher2 && currentLevel > 0) ? -offsetUW2 : 0;
    userLeftAdjust += (isClash2 && !isWitchHigher2 && currentLevel > 0) ? offsetUW2 : 0;
    userLeftAdjust += (isClash3 && isWitchHigher3 && currentLevel > 1) ? -offsetUW3 : 0;
    userLeftAdjust += (isClash3 && !isWitchHigher3 && currentLevel > 1) ? offsetUW3 : 0;
    
    witch1LeftAdjust += (isClash1 && isWitchHigher1) ? offsetUW1 : 0;
    witch1LeftAdjust += (isClash1 && !isWitchHigher1) ? -offsetUW1: 0;
    witch2LeftAdjust += (isClash2 && isWitchHigher2) ? offsetUW2 : 0;
    witch2LeftAdjust += (isClash2 && !isWitchHigher2) ? -offsetUW2: 0;
    witch3LeftAdjust += (isClash3 && isWitchHigher3) ? offsetUW3 : 0;
    witch3LeftAdjust += (isClash3 && !isWitchHigher3) ? -offsetUW3: 0;

    let diffWW21 = Math.abs(witch2Left + witch2LeftAdjust - witch1Left - witch1LeftAdjust);
    let diffWW32 = Math.abs(witch3Left + witch3LeftAdjust - witch2Left - witch2LeftAdjust);
    let isClash21 = (diffWW21 < maxHexGap);
    let isClash32 = (diffWW32 < maxHexGap);
    let offsetWW21 = 0.5 * (maxHexGap - Math.abs(diffWW21));
    let offsetWW32 = 0.5 * (maxHexGap - Math.abs(diffWW32));
    
    witch1LeftAdjust += (isClash21 && currentLevel > 0) ? -offsetWW21 : 0;
    witch2LeftAdjust += (isClash21 && currentLevel > 0) ? offsetWW21 : 0;
    witch2LeftAdjust += (isClash32 && currentLevel > 1) ? -offsetWW32 : 0;
    witch3LeftAdjust += (isClash32 && currentLevel > 1) ? offsetWW32 : 0;

    document.getElementById("user-num-words-cont").style.left = userLeftAdjust + "px";
    document.getElementById("user-num-score-cont").style.left = userLeftAdjust + "px";
    document.getElementById("heks-num-words-cont-1").style.left = witch1LeftAdjust + "px";
    document.getElementById("heks-num-score-cont-1").style.left = witch1LeftAdjust + "px";
    document.getElementById("heks-num-words-cont-2").style.left = witch2LeftAdjust + "px";
    document.getElementById("heks-num-score-cont-2").style.left = witch2LeftAdjust + "px";
    document.getElementById("heks-num-words-cont-3").style.left = witch3LeftAdjust + "px";
    document.getElementById("heks-num-score-cont-3").style.left = witch3LeftAdjust + "px";
}

// TO-DO v2: add score and level sections (50+, 70+, 80+; first witch, second, third)
function updateStats() {
    let scoreAll = [];
    scoreAll = scoreHistoryv2 ? [...scoreHistoryv2] : [];
    scoreAll.push(calculatePercentage(GUESSES, ANTWOORDEN));

    let levelAll = [];
    levelAll = levelHistory ? [...levelHistory] : [];
    levelAll.push(LEVEL);

    let topScore = scoreAll.reduce((a, b) => Math.max(a, b), -Infinity);
    printText("highscore-num", topScore);

    let totalScore = scoreAll.reduce((total, current) => total + current, 0);
    let nonZeroDays = scoreAll.reduce((total, current) => current > 0 ? total + 1 : total, 0);
    let avgScore = nonZeroDays == 0 ? "-" : Math.round(totalScore / nonZeroDays);
    printText("averagescore-num", avgScore);

    let winCount = scoreAll.reduce((total, current) => current >= 1000 ? total + 1 : total, 0);
    printText("wincount-num", winCount);

    let greatCount = scoreAll.reduce((total, current) => current >= 500 ? total + 1 : total, 0);
    printText("amazingcount-num", greatCount);

    let geniusCount = scoreAll.reduce((total, current) => current >= 700 ? total + 1 : total, 0);
    printText("geniuscount-num", geniusCount);

    let level1Count = levelAll.reduce((total, current) => current >= 1 ? total + 1 : total, 0);
    printText("level1-num", level1Count);

    let level2Count = levelAll.reduce((total, current) => current >= 2 ? total + 1 : total, 0);
    printText("level2-num", level2Count);
}

// HTML DISPLAY ELEMENTS

function displayPM() {
    if (date.getHours() > 17 || isHashPuzzle) {
        document.getElementById("pmdiv").style.display = "inline";
        for (let i = 1; i < 4; i++) {
            let heksbutton = document.getElementById("modal-button-heks" + i);
            heksbutton.onclick = () => {openAnsConfirm(i)};
            heksbutton.style.backgroundColor = "white";
            heksbutton.style.color = hekscolors[i];
            heksbutton.style.fontWeight = "bold";
        }
    }
}

// Toggles the order of the guesses
// TO-DO v2: apply this to both guess elements
function toggleGuessSort() {
    isSortAZ = !isSortAZ;
    isSortAZ ? printText("sort-guesses", "Sorteren: A-Z") : printText("sort-guesses", "Sorteren: Tijd");
    isSortAZ ? printText("modal-sort-guesses", "Van jou", lineBreak(), "(A-Z)") : printText("modal-sort-guesses", "Van jou", lineBreak(), "(tijd)");
    printGuesses();
}

// Toggles the printing of the list of possible answers
function showAnswers(h) {
    closeModal("ans-confirm");      // Close show answer confirmation modal if open

    // Make all guesslist elements invisible (so only the intended one is shown)
    document.getElementById("guesses-modal").style.display = "none";
    document.getElementById("heks1-words-modal").style.display = "none";
    document.getElementById("heks2-words-modal").style.display = "none";
    document.getElementById("heks3-words-modal").style.display = "none";

    printAnswers(h);
    openModal("words");

    if (!isHashPuzzle) {
        answersSeen = true;
    }
    savetoStorage();
}

function shareResult() {
    currentGuesses = isHashPuzzle ? HASHGUESSES : GUESSES;
    let score = calculatePercentage(currentGuesses, ANTWOORDEN);
    let yourWords = currentGuesses.length;
    let heksWords = ANTWOORDEN.length;
    let yourPangrams = currentGuesses.reduce((total, current) => ZEVENSLANG.indexOf(current) != -1 ? total + 1 : total, 0);
    let pangramText = yourPangrams;
    yourPangrams == 1 ? pangramText += " pangram" : pangramText += " pangrammen";
    let emojiText = "🏰💂‍♂️🧙‍♂️🧙‍♀️";
    let emojiLevel = "";
    for (i = 1; i < 4; i++) {
        emojiLevel += (i <= LEVEL) ? "🏆" : "☠";
        if (i > LEVEL) {
            break;
        }
    }
    let hash = isHashPuzzle ? "#" + hashNumber : "";
    let resultText = "WOORDHEX #" + woordhexNumber + "\n" + emojiText + "\n🏇" + emojiLevel + "\n" + score + " punten\n" + yourWords + " woorden\n" + pangramText + "\nhttp://woordhex.nl" + hash;
    navigator.clipboard.writeText(resultText);
    printText("result-shared", "Resultaat gekopieerd naar klembord");
    document.getElementById("result-shared").style.opacity = 0.8;
    setTimeout(() => {
        document.getElementById("result-shared").style.opacity = 0;
    }, 1000)
    document.getElementById("modal-share-result").innerText = "Gekopieerd";
    document.getElementById("modal-share-result").style.backgroundColor = "grey";
}

// MODALS

function openModal(id) {
    let modal = document.getElementById(id);
    modal.style.display = "flex";
    setUpPuzzleMenu();
}

function openAnsConfirm(h) {
    if (answersSeen || isHashPuzzle) {
        showAnswers(h);
        return;
    }
    let modal = document.getElementById("ans-confirm");
    modal.style.display = "flex";
    document.getElementById("ans-confirm-btn").onclick = () => {showAnswers(h)};
}

function closeModal(id) {
    document.getElementById("modal-share-result").innerText = "Score delen";
    document.getElementById("modal-share-result").style.backgroundColor = "gainsboro";
    let modal = document.getElementById(id);
    modal.style.display = "none";
    focusInput();
}

// HTML INPUT

// Sets up word submission on pressing Enter and shuffle on pressing Space
function setUpEventListeners() {
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
}

function setUpPuzzleMenu() {
    let puzzleGrid = document.getElementById("puzzle-grid");
    while (puzzleGrid.firstChild) {
        puzzleGrid.removeChild(puzzleGrid.firstChild);
    }
    for (let i = todayWoordhexNumber; i > 0; i--) {
        let puzzleBlock = document.createElement("div");
        puzzleBlock.classList.add("puzzle-block");
        puzzleBlock.append(i);
        puzzleBlock.onclick = () => {
            let hashExtension = (i == todayWoordhexNumber) ? "#" : "#" + i;
            location.replace(location.origin + location.pathname + hashExtension);
            location.reload();
        }
        puzzleGrid.append(puzzleBlock);
    }
    puzzleGrid.firstChild.id = "puzzle-block-today";
    resizePuzzleGridWidth();
}

function resizePuzzleGridWidth() {
    let puzzleGridWidth = document.getElementById("puzzle-grid").clientWidth;
    let puzzleBlockS = getComputedStyle(document.querySelector(":root")).getPropertyValue("--puzzle-block-size");
    puzzleBlockS = parseInt(puzzleBlockS.slice(0, -2));
    let puzzleBlockM = getComputedStyle(document.querySelector(":root")).getPropertyValue("--puzzle-block-margin");
    puzzleBlockM = parseInt(puzzleBlockM.slice(0, -2));
    let twoHexUnitWidth = 1.5 * puzzleBlockS + 3 * puzzleBlockM;
    let oneHexUnitWidth = puzzleBlockS + 2 * puzzleBlockM;
    let newGridWidth = Math.floor((puzzleGridWidth - twoHexUnitWidth) / oneHexUnitWidth) * oneHexUnitWidth + twoHexUnitWidth;
    document.getElementById("puzzle-grid").style.width = newGridWidth + "px";
}

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

    // Darken button after press
    let bgcolor = l > 0 ? "grey" : "purple";
    let darkbgcolor = l > 0 ? "rgb(87, 87, 87)" : "rgb(87, 0, 87)";
    document.getElementById("letter"+l).style.background = darkbgcolor;
    setTimeout(() => {
        document.getElementById("letter"+l).style.background = bgcolor;
    }, 100)
};

// Delete the last letter inputted
function backspace() {
    let inputbox = document.getElementById("woord-input");
    inputbox.lastChild ? inputbox.lastChild.remove() : null;
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

// TO-DO v2: add new formattings for each witch
function woordheksDidNotFindFormat(x) {
    let whDNFSpan = document.createElement("span");
    whDNFSpan.classList.add("woordheks-didnotfind");
    whDNFSpan.append(x);
    return whDNFSpan;
}

function userDidNotFindFormat(x, h) {
    let userDNFSpan = document.createElement("span");
    userDNFSpan.classList.add("user-didnotfind-" + h);
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