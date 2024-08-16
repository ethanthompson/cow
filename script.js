// Game data
const gameData = [];
let remainingImages = [];
let currentImage = null;
let currentRound = 0;
let score = 0;
let timerId = null;
let skippedTimer = false;

// DOM elements
const gameImage = document.querySelector(".game__image");
const gameTimer = document.querySelector(".game__timer");
const gameScore = document.querySelector(".game__score");
const gameMessage = document.querySelector(".game__message");
const gameOptions = document.querySelector(".game__options");
const buttonChurch = document.querySelector(".button--church");
const buttonWeed = document.querySelector(".button--weed");
const buttonRestart = document.querySelector(".button--restart");
const buttonSkip = document.querySelector(".button--skip");

// Modal DOM elements
const rulesModal = document.getElementById("rulesModal");
const closeButtons = document.querySelectorAll(".js-close-modal");
const buttonProMode = document.querySelector('.js-pro-mode');

// Utility functions
function startTimer(display) {
    let timer = isProMode ? 3 : 6;
    clearInterval(timerId);
    skippedTimer = false;
    buttonSkip.classList.remove("hidden"); // Show skip button when timer starts
    
    display.textContent = timer;
    
    timerId = setInterval(() => {
        timer--;
        
        if (timer > 0) {
            display.textContent = timer;
        } else {
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
    buttonSkip.classList.add("hidden"); // Hide skip button during guess phase
}

function resetGame() {
    currentRound = 0;
    score = 0;
    gameScore.textContent = `Score: ${score}`;
    buttonRestart.style.display = "none";
    buttonRestart.textContent = "Restart";
    
    remainingImages = [...gameData];
    
    if (remainingImages.length < ROUNDS_PER_SET) {
        gameMessage.textContent = "Whoops, that's all the images we have at the moment. Thanks for playing!";
        return;
    }
    
    preloadNextImage();
    startNextRound();
}

// Add these variables at the top of your script
let nextImage = null;
let preloadedImage = null;
let isProMode = false;
let currentSet = 0;
const ROUNDS_PER_SET = 10;

// Modify the startNextRound function
function startNextRound() {
    confetti.reset();  // Ensure confetti is cleared before starting new round
    gameMessage.classList.remove("animate__shakeX");
    gameOptions.style.display = "none";
    gameMessage.style.display = "none";

    if (remainingImages.length === 0) {
        // No more images, end the game
        gameMessage.textContent = `Game over! Your final score is: ${score}`;
        buttonRestart.style.display = "block";
        return;
    }

    if (preloadedImage) {
        // Use the preloaded image
        currentImage = nextImage;
        gameImage.style.backgroundImage = `url(${preloadedImage.src})`;
        
        // Start the timer immediately
        startTimer(gameTimer);
        
        // Start preloading the next image for the following round
        preloadNextImage();
    } else {
        // If no preloaded image (first round), load normally
        loadAndStartRound();
    }
}

// Add this new function to preload the next image
function preloadNextImage() {
    if (remainingImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingImages.length);
        nextImage = remainingImages[randomIndex];
        remainingImages.splice(randomIndex, 1);

        preloadedImage = new Image();
        preloadedImage.src = nextImage.img;
    } else {
        nextImage = null;
        preloadedImage = null;
    }
}

// Add this function for the initial load or when no preloaded image is available
function loadAndStartRound() {
    const randomIndex = Math.floor(Math.random() * remainingImages.length);
    currentImage = remainingImages[randomIndex];
    remainingImages.splice(randomIndex, 1);

    startTimer(gameTimer);

    const img = new Image();
    img.onload = function() {
        gameImage.style.backgroundImage = `url(${currentImage.img})`;
        
        // Preload the next image for the following round
        preloadNextImage();
    };
    img.src = currentImage.img;
}

// Add this function
function skipTimer() {
    clearInterval(timerId);
    skippedTimer = true;
    startGuessPhase();
}

// Check guess
function checkGuess(guess) {
    gameOptions.style.display = "none";
    if (guess === currentImage.label) {
        score += skippedTimer ? 1.5 : 1;
        gameMessage.textContent = "Correct!";
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
    currentRound++;

    setTimeout(() => {
        confetti.reset();
        if (currentRound % ROUNDS_PER_SET === 0) {
            endSet();
        } else {
            startNextRound();
        }
    }, 2000);
}

// Add this function
function endSet() {
    let currentSet = Math.floor(currentRound / ROUNDS_PER_SET);
    gameMessage.textContent = `Round complete! Your current score is: ${score}`;
    buttonRestart.textContent = "Continue";
    buttonRestart.style.display = "block";
    
    // Check if we have enough images for another set
    if (remainingImages.length < ROUNDS_PER_SET) {
        if (gameData.length - currentRound >= ROUNDS_PER_SET) {
            // Refill remainingImages for the next set
            remainingImages = gameData.slice(currentRound);
        } else {
            buttonRestart.style.display = "none";
            gameMessage.textContent += "\n\nWhoops, that's all the images we have at the moment. Thanks for playing!";
        }
    }
}

// Add this function
function startGame(proMode = false) {
    isProMode = proMode;
    rulesModal.style.display = "none";
    resetGame();
}

// Add event listeners
const buttonStartGame = document.querySelector('.js-start-game');
buttonStartGame.addEventListener('click', () => startGame(false));
buttonProMode.addEventListener('click', () => startGame(true));

// Modify the buttonRestart event listener
buttonRestart.addEventListener("click", () => {
    if (buttonRestart.textContent === "Continue") {
        startNextRound();
    } else {
        resetGame();
    }
});

// Modify the fetch callback to preload the first image
fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
        gameData.push(...data);
        remainingImages = [...gameData];
        preloadNextImage(); // Preload the first image
        rulesModal.style.display = "block";
        buttonSkip.classList.add("hidden");
    })
    .catch((error) => console.error("Error:", error));

// Add this function to toggle Pro Mode
function toggleProMode() {
    isProMode = !isProMode;
    buttonProMode.textContent = isProMode ? "Normal Mode" : "Pro Mode (3s timer)";
    buttonProMode.classList.toggle('bg-[#3d4e6a]');
    buttonProMode.classList.toggle('bg-[#8b0000]');
}

// Event listeners
buttonChurch.addEventListener("click", () => {
    checkGuess("Church");
});
buttonWeed.addEventListener("click", () => {
    checkGuess("Weed");
});
buttonRestart.addEventListener("click", resetGame);
buttonSkip.addEventListener("click", skipTimer);

closeButtons.forEach((closeButton) => {
    closeButton.addEventListener("click", () => {
      rulesModal.style.display = "none";
      resetGame();
    });
});

buttonProMode.addEventListener('click', toggleProMode);