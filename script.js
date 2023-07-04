// Game data
const gameData = [];
let remainingImages = [];
let currentImage = null;
let currentRound = 0;
let score = 0;
let timerId = null;

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
const closeButton = document.querySelector(".close-button");

// Utility functions
function startTimer(duration, display) {
    let timer = duration;
    clearInterval(timerId);
    timerId = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        display.textContent = seconds;

        if (--timer < 0) {
            timer = 0;
            clearInterval(timerId);
            startGuessPhase();
        }
    }, 1000);
}

function startGuessPhase() {
    // Reset timer and hide image
    gameTimer.textContent = "";
    gameImage.style.backgroundImage = 'none';
    // Show game options
    gameOptions.style.display = "flex";
}

function resetGame() {
    // Check if we have enough images left for another game
    if (remainingImages.length < 10) {
        buttonRestart.style.display = "none";
        gameMessage.textContent = "No more images left for a new game!";
        return;
    }
    // Reset game data
    currentRound = 0;
    score = 0;
    gameScore.textContent = `Score: ${score}`;
    buttonRestart.style.display = "none";
    startNextRound();
}

// Event listeners
buttonChurch.addEventListener("click", () => {
    checkGuess("Church");
});
buttonWeed.addEventListener("click", () => {
    checkGuess("Weed");
});
buttonRestart.addEventListener("click", resetGame);
closeButton.addEventListener("click", () => {
    rulesModal.style.display = "none";
    startNextRound();
});

// Check guess
function checkGuess(guess) {
    gameOptions.style.display = "none";
    if (guess === currentImage.label) {
        score++;
        gameMessage.textContent = "Correct!";
        confetti({ particleCount: 100, spread: 70 });
    } else {
        score--;
        gameMessage.textContent = "Incorrect!";
        gameMessage.classList.add("animate__shakeX");
    }
    gameScore.textContent = `Score: ${score}`;
    gameMessage.style.display = "block";
    currentRound++;
    if (currentRound === 10) {
        gameMessage.textContent = `Game over! Your final score is: ${score}`;
        buttonRestart.style.display = "block";
    } else {
        setTimeout(startNextRound, 2000);
    }
}

function startNextRound() {
    gameMessage.classList.remove("animate__shakeX");
    gameOptions.style.display = "none";
    gameMessage.style.display = "none";

    // Randomly select an image from the remaining images
    const randomIndex = Math.floor(Math.random() * remainingImages.length);
    currentImage = remainingImages[randomIndex];

    // Remove the selected image from the remaining images
    remainingImages.splice(randomIndex, 1);

    gameImage.style.backgroundImage = `url(${currentImage.img})`;
    startTimer(10, gameTimer);
}

// Fetch game data
fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
        gameData.push(...data);
        // Copy the initial set of images to the remaining images
        remainingImages = [...gameData];
        rulesModal.style.display = "block";
    })
    .catch((error) => console.error("Error:", error));
