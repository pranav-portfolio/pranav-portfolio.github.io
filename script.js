const spaceship = document.getElementById("spaceship");
const gameArea = document.getElementById("game-area");
const bestTimeElement = document.getElementById("best-time");
const timerElement = document.getElementById("timer");

const CAPTION_RULES = {
  risk: [
    {
      max: 735,
      text: "Calculated gambles and bold decisions-can you take the Risk?"
    },
    {
      max: 1200,
      text: "A thrilling card game of gambles and strategy. Each turn, pick the right card, hit or stand, and balance nerve with tactics. Will you take the Risk?"
    },
    {
      max: Infinity,
      text: "The ultimate playing card game of calculated gambles and bold decisions. Players face a thrilling dilemma each turn: select the right card and decide whether to hit or stand, balancing strategy and nerve in a game where every move could lead to triumph or disaster. Are you ready to take the Risk?"
    }
  ],
  squared: [
    {
      max: 970,
      text: "Squared reimagines Tic-Tac-Toe on a 5x5 grid. Race to form the ultimate square with strategy and quick thinking!"
    },
    {
      max: 1390,
      text: "Rethink Tic-Tac-Toe on a 5x5 grid! Squared challenges players to drop X's and O's, racing to form the ultimate square. Quick thinking and strategy are key in this electrifying twist on a classic game."
    },
    {
      max: Infinity,
      text: "Get ready to rethink Tic-Tac-Toe! Played on a vibrant 5x5 grid, Squared challenges players to drop X's and O's in a thrilling race to form the ultimate square. With each turn, the stakes rise, demanding quick thinking, sharp strategy, and a dash of cunning. Get ready for an electrifying twist on a beloved classic-victory has never been this satisfying!"
    }
  ],
  employee216: [
    {
      max: 970,
      text: "In this thrilling short film, Employee 216's normal day turns into a spine-chilling mystery, with tension rising at every click!"
    },
    {
      max: 1390,
      text: "Brace yourself for a spine-tingling short film! Employee 216, absorbed in their office work, begins noticing strange occurrences. What starts as a normal day spirals into a mind-bending mystery, with tension building at every click."
    },
    {
      max: Infinity,
      text: "Brace yourself for a spine-tingling ride in this thrilling short film! Watch as Employee 216, completely absorbed in their office assignment, suddenly begins to notice strange and unnerving occurrences around the office. What starts as a routine day quickly spirals into a mind-bending mystery, and the tension keeps building with every click of the mouse."
    }
  ],
  solitaire: [
    {
      max: 970,
      text: "Modern Solitaire-relax, reset, and shuffle your way to victory!"
    },
    {
      max: 1390,
      text: "Solitaire with a modern twist! Enjoy smooth gameplay, reset the board anytime, and challenge yourself with every shuffle."
    },
    {
      max: Infinity,
      text: "A fresh twist on the classic card game! Experience the timeless challenge of Solitaire with a sleek, modern design and smooth gameplay. Whether you're relaxing or testing your skills, this fully functioning version lets you reset the board and dive right back into the action. Simple yet addictive, it's the perfect way to unwind, and every shuffle brings a new opportunity to strategize and win!"
    }
  ],
  spaceshooter: [
    {
      max: 870,
      text: "Space shooter action-dodge, upgrade, and save the galaxy!"
    },
    {
      max: 1470,
      text: "Embark on a thrilling space adventure with a modern twist on the classic Galaga! Face waves of enemies, dodge attacks, and unleash powerful upgrades to save the galaxy."
    },
    {
      max: Infinity,
      text: "Blast off into an exhilarating space adventure! Inspired by the classic Galaga, this space shooter brings a fresh, modern twist with stunning graphics and intense action. Face waves of enemies, dodge relentless attacks, and unleash powerful upgrades as you race to save the galaxy. Every level escalates the excitement, challenging your reflexes and strategy-are you ready to take on the challenge and become the ultimate space hero?"
    }
  ]
};

const CAPTION_TARGETS = {
  risk: "#risk-caption .caption-text",
  squared: "#squared-caption .caption-text",
  employee216: "#employee-216-caption .caption-text",
  solitaire: "#solitaire-caption .caption-text",
  spaceshooter: "#space-shooter-caption .caption-text"
};

const GAME_CONFIG = {
  initialSpawnRate: 1000,
  spawnRateDecrement: 50,
  mouseThrottleMs: 16,
  playerLerp: 1,
  difficultyStep: 0.1,
  difficultyTickMs: 5000,
  invincibleDurationMs: 3000,
  restartDelayMs: 3000,
  clearTickMs: 16
};

const BREAKPOINTS = [
  { max: 400, minSpawnRate: 500, minSpeed: 2, maxSpeed: 8 },
  { max: 500, minSpawnRate: 400, minSpeed: 2, maxSpeed: 8 },
  { max: 600, minSpawnRate: 300, minSpeed: 2, maxSpeed: 8 },
  { max: 800, minSpawnRate: 200, minSpeed: 3, maxSpeed: 9 },
  { max: 1200, minSpawnRate: 150, minSpeed: 5, maxSpeed: 15 },
  { max: Infinity, minSpawnRate: 50, minSpeed: 10, maxSpeed: 20 }
];

const state = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  lastMove: 0,
  lastSpawn: 0,
  asteroids: [],
  isInvincible: false,
  spawnPaused: false,
  gameRunning: false,
  spawnRate: GAME_CONFIG.initialSpawnRate,
  minSpawnRate: 300,
  asteroidMinSpeed: 5,
  asteroidMaxSpeed: 10,
  difficultyMultiplier: 1,
  currentTime: 0,
  timerInterval: null,
  difficultyInterval: null,
  bestTime: Number.parseInt(localStorage.getItem("bestTime") || "0", 10)
};

function pickBreakpoint(width) {
  return BREAKPOINTS.find((bp) => width <= bp.max);
}

function updateDifficultyByViewport() {
  const bp = pickBreakpoint(window.innerWidth);
  state.minSpawnRate = bp.minSpawnRate;
  state.asteroidMinSpeed = bp.minSpeed;
  state.asteroidMaxSpeed = bp.maxSpeed;
}

function formatTime(label, totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) return `${label}: ${h}h ${m}m ${s}s`;
  if (m > 0) return `${label}: ${m}m ${s}s`;
  return `${label}: ${s}s`;
}

function updatePlayerPosition() {
  if (!spaceship) return;
  spaceship.style.left = `${state.x}px`;
  spaceship.style.top = `${state.y}px`;
}

function onMouseMove(event) {
  if (!gameArea) return;

  const now = Date.now();
  if (now - state.lastMove < GAME_CONFIG.mouseThrottleMs) return;
  state.lastMove = now;

  const rect = gameArea.getBoundingClientRect();
  const inside =
    event.clientX > rect.left &&
    event.clientX < rect.right &&
    event.clientY > rect.top &&
    event.clientY < rect.bottom;

  if (!inside) return;

  state.x += (event.clientX - state.x) * GAME_CONFIG.playerLerp;
  state.y += (event.clientY - state.y) * GAME_CONFIG.playerLerp;
  updatePlayerPosition();
}

function createAsteroid() {
  if (!gameArea) return;

  const asteroid = document.createElement("div");
  asteroid.classList.add("asteroid");
  asteroid.style.left = `${Math.random() * gameArea.offsetWidth}px`;
  asteroid.style.top = "-50px";
  gameArea.appendChild(asteroid);

  const baseSpeed =
    Math.random() * (state.asteroidMaxSpeed - state.asteroidMinSpeed) + state.asteroidMinSpeed;

  state.asteroids.push({
    element: asteroid,
    speed: baseSpeed * state.difficultyMultiplier
  });
}

function moveAsteroids() {
  if (!gameArea) return;

  state.asteroids = state.asteroids.filter(({ element, speed }) => {
    const nextTop = Number.parseFloat(element.style.top) + speed;
    if (nextTop > gameArea.offsetHeight) {
      element.remove();
      return false;
    }
    element.style.top = `${nextTop}px`;
    return true;
  });
}

function createExplosion() {
  if (!gameArea) return;

  const explosion = document.createElement("div");
  explosion.classList.add("explosion");
  explosion.style.left = `${state.x}px`;
  explosion.style.top = `${state.y}px`;
  gameArea.appendChild(explosion);

  setTimeout(() => explosion.remove(), 1000);
}

function handleCollision(asteroidElement) {
  asteroidElement.remove();
  createExplosion();

  state.spawnPaused = true;
  setTimeout(() => {
    state.spawnPaused = false;
  }, GAME_CONFIG.restartDelayMs);

  resetGame();
}

function checkCollisions() {
  if (!spaceship || state.isInvincible) return;

  const shipRect = spaceship.getBoundingClientRect();

  state.asteroids.forEach(({ element }) => {
    const aRect = element.getBoundingClientRect();
    const overlapping =
      shipRect.left < aRect.right &&
      shipRect.right > aRect.left &&
      shipRect.top < aRect.bottom &&
      shipRect.bottom > aRect.top;

    if (overlapping && !state.isInvincible) {
      handleCollision(element);
    }
  });
}

function updateTimer() {
  if (!timerElement || !bestTimeElement) return;

  state.currentTime += 1;
  timerElement.textContent = formatTime("Time", state.currentTime);

  if (state.currentTime > state.bestTime) {
    state.bestTime = state.currentTime;
    localStorage.setItem("bestTime", String(state.bestTime));
  }

  bestTimeElement.textContent = formatTime("Best Time", state.bestTime);
}

function startTimer() {
  clearInterval(state.timerInterval);
  state.currentTime = 0;
  state.timerInterval = setInterval(updateTimer, 1000);
}

function startDifficultyTicker() {
  clearInterval(state.difficultyInterval);
  state.difficultyInterval = setInterval(() => {
    if (state.gameRunning) {
      state.difficultyMultiplier += GAME_CONFIG.difficultyStep;
    }
  }, GAME_CONFIG.difficultyTickMs);
}

function clearRuntimeIntervals() {
  clearInterval(state.timerInterval);
}

function resetGame() {
  clearRuntimeIntervals();
  state.gameRunning = false;
  state.isInvincible = true;
  state.spawnPaused = true;
  state.currentTime = 0;
  state.spawnRate = GAME_CONFIG.initialSpawnRate;
  state.difficultyMultiplier = 1;

  if (spaceship) spaceship.style.display = "none";

  const clearLoop = setInterval(() => {
    moveAsteroids();
    if (state.asteroids.length === 0) clearInterval(clearLoop);
  }, GAME_CONFIG.clearTickMs);

  setTimeout(() => {
    if (spaceship) {
      spaceship.style.display = "block";
      spaceship.classList.add("invincible");
    }

    setTimeout(() => {
      state.isInvincible = false;
      if (spaceship) spaceship.classList.remove("invincible");
    }, GAME_CONFIG.invincibleDurationMs);

    startGame();
  }, GAME_CONFIG.restartDelayMs);
}

function gameLoop(timestamp) {
  if (!state.gameRunning) return;

  if (!state.spawnPaused && timestamp - state.lastSpawn > state.spawnRate) {
    createAsteroid();
    state.lastSpawn = timestamp;
    if (state.spawnRate > state.minSpawnRate) {
      state.spawnRate -= GAME_CONFIG.spawnRateDecrement;
    }
  }

  moveAsteroids();
  checkCollisions();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  state.gameRunning = true;
  startTimer();
  requestAnimationFrame(gameLoop);
}

function textForWidth(rules, width) {
  return rules.find((rule) => width <= rule.max).text;
}

function updateCaptions() {
  const width = window.innerWidth;

  Object.keys(CAPTION_TARGETS).forEach((key) => {
    const target = document.querySelector(CAPTION_TARGETS[key]);
    if (!target) return;
    target.textContent = textForWidth(CAPTION_RULES[key], width);
  });
}

function setupMarqueeTracks() {
  const tracks = document.querySelectorAll(".marquee-text-track-one, .marquee-text-track-two");
  tracks.forEach((track) => {
    const distance = track.scrollWidth / 2;
    track.style.setProperty("--marquee-distance", `${distance}px`);
  });
}

function setupResize() {
  let marqueeTimer = null;
  let captionTimer = null;

  window.addEventListener("resize", () => {
    updateDifficultyByViewport();

    clearTimeout(marqueeTimer);
    marqueeTimer = setTimeout(setupMarqueeTracks, 120);

    clearTimeout(captionTimer);
    captionTimer = setTimeout(updateCaptions, 50);
  });
}

function init() {
  if (!spaceship || !gameArea || !bestTimeElement || !timerElement) return;

  updateDifficultyByViewport();
  updatePlayerPosition();
  updateCaptions();
  setupMarqueeTracks();
  startDifficultyTicker();
  startGame();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setupMarqueeTracks);
  }

  setupResize();
  document.addEventListener("mousemove", onMouseMove);
}

document.addEventListener("DOMContentLoaded", init);