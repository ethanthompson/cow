"use strict";

/**
 * Church or Weed — data-driven guessing game.
 * All game balance and categories live in data.json; this engine adapts to
 * however many categories are defined there, so new categories or images can
 * be added without touching this file.
 */

const DATA_URL = "data.json";
const FEEDBACK_GAP_MS = 1600;
const CONFETTI_SRC = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";

class Game {
  constructor() {
    this.el = {
      scoreValue: document.getElementById("scoreValue"),
      streakStat: document.getElementById("streakStat"),
      streakValue: document.getElementById("streakValue"),
      progressLabel: document.getElementById("progressLabel"),
      stageImage: document.getElementById("stageImage"),
      stageTimer: document.getElementById("stageTimer"),
      timerFill: document.getElementById("timerFill"),
      toast: document.getElementById("toast"),
      options: document.getElementById("options"),
      roundEndPanel: document.getElementById("roundEndPanel"),
      roundEndTitle: document.getElementById("roundEndTitle"),
      roundEndBody: document.getElementById("roundEndBody"),
      nextRoundBtn: document.getElementById("nextRoundBtn"),
      gameEndPanel: document.getElementById("gameEndPanel"),
      finalStats: document.getElementById("finalStats"),
      playAgainBtn: document.getElementById("playAgainBtn"),
      rulesModal: document.getElementById("rulesModal"),
      startBtn: document.getElementById("startBtn"),
    };

    this.imageCache = new Map();
    this.confettiPromise = null;

    this.state = {
      settings: null,
      categoriesById: new Map(),
      rounds: [],
      roundIndex: 0,
      itemIndex: 0,
      currentItem: null,
      score: 0,
      correct: 0,
      answered: 0,
      streak: 0,
      bestStreak: 0,
      guessPending: false,
      dangerTimeoutId: null,
      expireTimeoutId: null,
    };

    this.el.nextRoundBtn.addEventListener("click", () => this.startNextRound());
    this.el.playAgainBtn.addEventListener("click", () => this.restart());
    this.el.startBtn.addEventListener("click", () => this.closeRulesModal());
    this.el.rulesModal.addEventListener("click", (e) => {
      if (e.target === this.el.rulesModal) this.closeRulesModal();
    });
    document.addEventListener("keydown", (e) => this.onKeyDown(e));
  }

  async init() {
    try {
      const res = await fetch(DATA_URL);
      const data = await res.json();
      this.data = data;
      for (const category of data.categories) {
        this.state.categoriesById.set(category.id, category);
      }
      this.buildOptionButtons(data.categories);
      this.setStageImage(data.settings.defaultImage);
      this.prepareRounds();
      this.openRulesModal();
    } catch (err) {
      console.error("Failed to load game data:", err);
      this.el.progressLabel.textContent = "Couldn't load the game. Please refresh.";
    }
  }

  // ---------- Setup ----------

  buildOptionButtons(categories) {
    this.el.options.innerHTML = "";
    this.optionButtons = categories.map((category, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--guess";
      btn.style.setProperty("--accent", category.color || "var(--color-accent)");
      btn.dataset.categoryId = category.id;
      btn.setAttribute("aria-label", category.label);
      btn.innerHTML = `
        <span class="btn__emoji" aria-hidden="true">${category.emoji || ""}</span>
        <span>${category.label}</span>
        <span class="btn__key">Press ${index + 1}</span>
      `;
      btn.addEventListener("click", () => this.onGuess(category.id));
      this.el.options.appendChild(btn);
      return btn;
    });
  }

  prepareRounds() {
    const { settings, items } = this.data;
    const shuffled = [...items];
    shuffleArray(shuffled);

    const rounds = [];
    for (let i = 0; i < shuffled.length; i += settings.imagesPerRound) {
      rounds.push(shuffled.slice(i, i + settings.imagesPerRound));
    }
    this.state.rounds = rounds;
  }

  // ---------- Modal ----------

  openRulesModal() {
    this.el.rulesModal.hidden = false;
    this.el.rulesModal.setAttribute("aria-hidden", "false");
  }

  closeRulesModal() {
    this.el.rulesModal.hidden = true;
    this.el.rulesModal.setAttribute("aria-hidden", "true");
    this.el.streakStat.hidden = false;
    this.startNextRound();
  }

  // ---------- Flow ----------

  restart() {
    this.state.score = 0;
    this.state.correct = 0;
    this.state.answered = 0;
    this.state.streak = 0;
    this.state.bestStreak = 0;
    this.state.roundIndex = 0;
    this.updateScore();
    this.updateStreak();
    this.el.gameEndPanel.hidden = true;
    this.prepareRounds();
    this.startNextRound();
  }

  startNextRound() {
    this.el.roundEndPanel.hidden = true;
    if (this.state.roundIndex >= this.state.rounds.length) {
      this.endGame();
      return;
    }
    this.state.itemIndex = 0;
    this.startNextItem();
  }

  async startNextItem() {
    const round = this.state.rounds[this.state.roundIndex];
    if (this.state.itemIndex >= round.length) {
      this.endRound();
      return;
    }

    this.hideToast();
    const item = round[this.state.itemIndex];
    this.state.currentItem = item;
    this.updateProgressLabel();

    await this.preload(item.img);
    this.setStageImage(item.img, { animate: true });
    this.preloadUpcoming();

    this.el.options.hidden = false;
    for (const btn of this.optionButtons) btn.disabled = false;
    this.startTimer(this.data.settings.guessTimeMs);
  }

  endRound() {
    this.hideToast();
    this.el.options.hidden = true;
    this.state.roundIndex++;
    if (this.state.roundIndex < this.state.rounds.length) {
      this.el.roundEndTitle.textContent = `Round ${this.state.roundIndex} complete!`;
      this.el.roundEndBody.textContent = `Your score so far: ${formatScore(this.state.score)}`;
      this.el.roundEndPanel.hidden = false;
    } else {
      this.endGame();
    }
  }

  endGame() {
    this.hideToast();
    this.el.options.hidden = true;
    const accuracy = this.state.answered
      ? Math.round((this.state.correct / this.state.answered) * 100)
      : 0;
    this.el.finalStats.innerHTML =
      `Final score: <strong>${formatScore(this.state.score)}</strong> &middot; ` +
      `Accuracy: <strong>${accuracy}%</strong> &middot; ` +
      `Best streak: <strong>${this.state.bestStreak}</strong>`;
    this.el.gameEndPanel.hidden = false;
    this.setStageImage(this.data.settings.defaultImage);
    this.el.progressLabel.textContent = "Game over";
  }

  // ---------- Guessing ----------

  onGuess(categoryId) {
    if (!this.state.guessPending) return;
    this.state.guessPending = false;
    this.stopTimer();
    for (const btn of this.optionButtons) btn.disabled = true;

    const item = this.state.currentItem;
    const timedOut = categoryId === null;
    const isCorrect = !timedOut && categoryId === item.category;
    const settings = this.data.settings;

    this.state.answered++;

    if (timedOut) {
      this.state.score += settings.timeUpPoints;
      this.state.streak = 0;
      this.showToast("Time's up!", "bad");
    } else if (isCorrect) {
      const quick = this.state.guessTime <= settings.quickGuessTimeMs;
      const points = settings.correctPoints + (quick ? settings.quickGuessBonus : 0);
      this.state.score += points;
      this.state.correct++;
      this.state.streak++;
      this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
      this.showToast(
        quick ? `Correct! +${formatScore(points)} (quick!)` : `Correct! +${formatScore(points)}`,
        "good"
      );
      this.fireConfetti();
    } else {
      this.state.score += settings.wrongPoints;
      this.state.streak = 0;
      const correctCategory = this.state.categoriesById.get(item.category);
      const label = correctCategory ? correctCategory.label : item.category;
      this.showToast(`Incorrect — that was ${label}.`, "bad");
    }

    this.updateScore();
    this.updateStreak();
    this.el.options.hidden = true;
    this.state.itemIndex++;

    setTimeout(() => this.startNextItem(), FEEDBACK_GAP_MS);
  }

  onKeyDown(e) {
    if (!this.state.guessPending) return;
    const index = Number(e.key) - 1;
    if (Number.isInteger(index) && this.optionButtons[index]) {
      this.onGuess(this.optionButtons[index].dataset.categoryId);
    }
  }

  // ---------- Timer ----------

  startTimer(durationMs) {
    this.state.guessPending = true;
    this.state.guessStartedAt = performance.now();

    const fill = this.el.timerFill;
    fill.classList.remove("is-running", "is-danger");
    fill.style.transition = "none";
    fill.style.transform = "scaleX(1)";
    void fill.offsetWidth; // force reflow so the transition below applies cleanly
    fill.classList.add("is-running");
    fill.style.transition = `transform ${durationMs}ms linear`;
    fill.style.transform = "scaleX(0)";

    const dangerAt = Math.max(0, durationMs - 1500);
    this.state.dangerTimeoutId = setTimeout(() => fill.classList.add("is-danger"), dangerAt);

    this.state.expireTimeoutId = setTimeout(() => {
      this.state.guessTime = durationMs;
      this.onGuess(null);
    }, durationMs);
  }

  stopTimer() {
    this.state.guessTime = performance.now() - this.state.guessStartedAt;
    clearTimeout(this.state.dangerTimeoutId);
    clearTimeout(this.state.expireTimeoutId);
    this.el.timerFill.classList.remove("is-running");
  }

  // ---------- Rendering helpers ----------

  setStageImage(src, { animate = false } = {}) {
    const el = this.el.stageImage;
    el.classList.remove("is-active");
    el.style.backgroundImage = `url(${src})`;
    if (animate) {
      void el.offsetWidth;
      el.classList.add("is-active");
    }
  }

  updateScore() {
    this.el.scoreValue.textContent = formatScore(this.state.score);
  }

  updateStreak() {
    this.el.streakValue.textContent = String(this.state.streak);
  }

  updateProgressLabel() {
    const totalRounds = this.state.rounds.length;
    const round = this.state.rounds[this.state.roundIndex];
    const roundLabel = totalRounds > 1
      ? `Round ${this.state.roundIndex + 1} of ${totalRounds} · `
      : "";
    this.el.progressLabel.textContent =
      `${roundLabel}Image ${this.state.itemIndex + 1} of ${round.length}`;
  }

  showToast(message, tone) {
    const toast = this.el.toast;
    toast.textContent = message;
    toast.classList.remove("is-good", "is-bad", "is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible", tone === "good" ? "is-good" : "is-bad");
  }

  hideToast() {
    this.el.toast.classList.remove("is-visible", "is-good", "is-bad");
  }

  // ---------- Image preloading ----------

  preload(src) {
    if (this.imageCache.has(src)) return this.imageCache.get(src);
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(src);
      img.onerror = () => resolve(src);
      img.src = src;
    });
    this.imageCache.set(src, promise);
    return promise;
  }

  preloadUpcoming() {
    const round = this.state.rounds[this.state.roundIndex];
    for (let offset = 1; offset <= 2; offset++) {
      const next = round[this.state.itemIndex + offset];
      if (next) this.preload(next.img);
    }
    const nextRound = this.state.rounds[this.state.roundIndex + 1];
    if (this.state.itemIndex + 1 >= round.length && nextRound && nextRound[0]) {
      this.preload(nextRound[0].img);
    }
  }

  // ---------- Confetti (loaded on demand) ----------

  fireConfetti() {
    this.loadConfetti().then((confetti) => {
      if (!confetti) return;
      confetti({ particleCount: 100, spread: 70, decay: 0.95 });
    });
  }

  loadConfetti() {
    if (window.confetti) return Promise.resolve(window.confetti);
    if (this.confettiPromise) return this.confettiPromise;
    this.confettiPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = CONFETTI_SRC;
      script.onload = () => resolve(window.confetti || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
    return this.confettiPromise;
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function formatScore(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

document.addEventListener("DOMContentLoaded", () => {
  new Game().init();
});
