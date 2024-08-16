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
    // Check if we have enough images left for another game
    if (remainingImages.length < 10) {
        buttonRestart.style.display = "none";
        gameMessage.textContent = "Whoops, that's all the images we have at the moment. Thanks for playing!";
        return;
    }
    // Reset game data
    currentRound = 0;
    score = 0;
    gameScore.textContent = `Score: ${score}`;
    buttonRestart.style.display = "none";
    
    // Refill remainingImages if it's empty
    if (remainingImages.length === 0) {
        remainingImages = [...gameData];
    }
    
    // Preload the first image before starting
    preloadNextImage();
    startNextRound();
}

// Add these variables at the top of your script
let nextImage = null;
let preloadedImage = null;
let isProMode = false;

// Modify the startNextRound function
function startNextRound() {
    confetti.reset();  // Ensure confetti is cleared before starting new round
    gameMessage.classList.remove("animate__shakeX");
    gameOptions.style.display = "none";
    gameMessage.style.display = "none";

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

// Modify the resetGame function to start preloading
function resetGame() {
    // Check if we have enough images left for another game
    if (remainingImages.length < 10) {
        buttonRestart.style.display = "none";
        gameMessage.textContent = "Whoops, that's all the images we have at the moment. Thanks for playing!";
        return;
    }
    // Reset game data
    currentRound = 0;
    score = 0;
    gameScore.textContent = `Score: ${score}`;
    buttonRestart.style.display = "none";
    
    // Refill remainingImages if it's empty
    if (remainingImages.length === 0) {
        remainingImages = [...gameData];
    }
    
    // Preload the first image before starting
    preloadNextImage();
    startNextRound();
}

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

// Add this function
function skipTimer() {
    clearInterval(timerId);
    skippedTimer = true;
    startGuessPhase();
}

// Check guess
function checkGuess(guess) {
    gameOptions.style.display = "none";
    // No need to hide skip button here as it's already hidden in startGuessPhase
    if (guess === currentImage.label) {
        score += skippedTimer ? 1.5 : 1;
        gameMessage.textContent = "Correct!";
        confetti({
            particleCount: 100,
            spread: 70,
            decay: 0.95,  // Increased decay for faster disappearance
            lifetime: 1.5  // Limit confetti lifetime to 1.5 seconds
        });
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
        setTimeout(() => {
            confetti.reset();  // Clear any remaining confetti
            startNextRound();
        }, 2000);
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