// Game data
let allImages = [];
let rounds = [];
let currentRound = 0;
let currentGuessInRound = 0;
let score = 0;
let timerId = null;
let guessStartTime = null;
let currentImage = null;

// Constants
const IMAGES_PER_ROUND = 10;
const GUESS_TIME = 5000; // 5 seconds per guess
const QUICK_GUESS_TIME = 2000; // 2 seconds for bonus points
const DEFAULT_BACKGROUND = 'img/default.jpg'; // Added this line

// DOM elements
const gameImage = document.querySelector(".game__image");
const gameTimer = document.querySelector(".game__timer");
const gameScore = document.querySelector(".game__score");
const gameMessage = document.querySelector(".game__message");
const gameOptions = document.querySelector(".game__options");
const buttonChurch = document.querySelector(".button--church");
const buttonWeed = document.querySelector(".button--weed");
const buttonRestart = document.querySelector(".button--restart");

// Modal DOM elements
const rulesModal = document.getElementById("rulesModal");
const closeButtons = document.querySelectorAll(".js-close-modal");

// Utility functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function prepareRounds() {
    shuffleArray(allImages);
    rounds = [];
    for (let i = 0; i < allImages.length; i += IMAGES_PER_ROUND) {
        rounds.push(allImages.slice(i, i + IMAGES_PER_ROUND));
    }
}

function resetGame() {
    currentRound = 0;
    currentGuessInRound = 0;
    score = 0;
    gameScore.textContent = `Score: ${score}`;
    buttonRestart.style.display = "none";
    
    // Set the default background image
    gameImage.style.backgroundImage = `url(${DEFAULT_BACKGROUND})`;
    
    if (allImages.length < IMAGES_PER_ROUND) {
        gameMessage.textContent = "Not enough images to play. Please check data.json.";
        return;
    }
    
    prepareRounds();
    showRulesModal();
}

function showRulesModal() {
    rulesModal.style.display = "block";
}

function startGame() {
    rulesModal.style.display = "none";
    startNextRound();
}

function startNextRound() {
    if (currentRound >= rounds.length) {
        endGame();
        return;
    }
    
    currentGuessInRound = 0;
    startNextGuess();
}

function startNextGuess() {
    if (timerId) {
        clearTimeout(timerId);
    }
    
    confetti.reset();
    gameMessage.classList.remove("animate__shakeX");
    gameOptions.style.display = "none";
    gameMessage.style.display = "none";
    buttonRestart.style.display = "none";

    if (currentGuessInRound >= IMAGES_PER_ROUND) {
        endRound();
        return;
    }

    currentImage = rounds[currentRound][currentGuessInRound];
    loadAndStartGuess();
}

function loadAndStartGuess() {
    const img = new Image();
    img.onload = function() {
        gameImage.style.backgroundImage = `url(${currentImage.img})`;
        gameOptions.style.display = "block";
        startTimer();
        guessStartTime = Date.now();
    };
    img.src = currentImage.img;
}

function startTimer() {
    let timeLeft = GUESS_TIME / 1000;
    gameTimer.textContent = `${timeLeft}`;
    
    timerId = setInterval(() => {
        timeLeft--;
        gameTimer.textContent = `${timeLeft}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerId);
            checkGuess("TimeUp");
        }
    }, 1000);
}

function checkGuess(guess) {
    clearInterval(timerId);
    gameOptions.style.display = "none";
    
    const guessTime = Date.now() - guessStartTime;
    const isQuickGuess = guessTime <= QUICK_GUESS_TIME;
    
    if (guess === "TimeUp") {
        score--;
        gameMessage.textContent = "Time's up!";
        gameMessage.classList.add("animate__shakeX");
    } else if (guess === currentImage.label) {
        score += isQuickGuess ? 1.5 : 1;
        gameMessage.textContent = isQuickGuess ? "Correct! +1.5 points" : "Correct! +1 point";
        confetti({
            particleCount: 100,
            spread: 70,
            decay: 0.95,
            lifetime: 1.5
        });
    } else {
        score--;
        gameMessage.textContent = "Incorrect!";
        gameMessage.classList.add("animate__shakeX");
    }
    
    gameScore.textContent = `Score: ${score}`;
    gameMessage.style.display = "block";
    currentGuessInRound++;

    setTimeout(() => {
        confetti.reset();
        startNextGuess();
    }, 2000);
}

function endRound() {
    currentRound++;
    if (currentRound < rounds.length) {
        gameMessage.textContent = `Round ${currentRound} complete! Your current score is: ${score}`;
        buttonRestart.textContent = "Start Next Round";
        buttonRestart.style.display = "block";
        gameMessage.style.display = "block";
    } else {
        endGame();
    }
}

function endGame() {
    gameMessage.innerHTML = `That's all the images we have at the moment. Thanks for playing! Your final score is: ${score}<br><br>Psst. Know of a church or dispensary that would fit this game? <a href="https://ethanthompson705282.typeform.com/to/ux1PUERb" class="text-blue-600 hover:underline" target="_blank">Tell us about it!</a>`;
    buttonRestart.style.display = "none";
    gameMessage.style.display = "block";
    
    // Set the default background image when the game ends
    gameImage.style.backgroundImage = `url(${DEFAULT_BACKGROUND})`;
}

// Fetch data and start game
fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
        allImages = data;
        resetGame();
    })
    .catch((error) => console.error("Error:", error));

// Event listeners
buttonChurch.addEventListener("click", () => checkGuess("Church"));
buttonWeed.addEventListener("click", () => checkGuess("Weed"));
buttonRestart.addEventListener("click", () => {
    if (buttonRestart.textContent === "Start Next Round") {
        startNextRound();
    }
});

// Close modal functionality
closeButtons.forEach(button => {
    button.addEventListener("click", () => {
        startGame();
    });
});

// Close modal when clicking outside
window.addEventListener("click", (event) => {
    if (event.target === rulesModal) {
        startGame();
    }
});