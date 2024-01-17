let jsonDate = localStorage.getItem("date");
let jsonGuesses = localStorage.getItem("guesses");
let jsonScoreHistory = localStorage.getItem("score-hist");
let jsonScoreHistoryv2 = localStorage.getItem("score-hist-v2");
let jsonLevelHistory = localStorage.getItem("level-hist");
let jsonTodayScore = localStorage.getItem("todayScore");
let jsonTodayLevel = localStorage.getItem("todayLevel");
let jsonAnswersSeen = localStorage.getItem("answersSeen");

document.getElementById("local-storage").innerText =
    "date: " + jsonDate + "\n" +
    "guesses: " + jsonGuesses + "\n" +
    "score-hist: " + jsonScoreHistory + "\n" +
    "score-hist-v2: " + jsonScoreHistoryv2 + "\n" + 
    "level-hist: " + jsonLevelHistory + "\n" +
    "todayScore: " + jsonTodayScore + "\n" +
    "todayLevel: " + jsonTodayLevel + "\n" +
    "answersSeen: " + jsonAnswersSeen;

function copyText(id) {
    let text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text);
}