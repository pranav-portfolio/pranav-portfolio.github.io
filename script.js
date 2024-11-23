const spaceship = document.getElementById('spaceship');
const gameArea = document.getElementById('game-area');
const bestTimeElement = document.getElementById('best-time');
const timerElement = document.getElementById('timer');

let positionX = window.innerWidth / 2;
let positionY = window.innerHeight / 2;
const speed = 0.2; // Movement speed
let isInvincible = false; // Tracks if the spaceship is invincible after respawn
let spawnRate = 500; // Initial asteroid spawn rate (in ms)
let spawnRateDecrement = 50; // How much to decrease the spawn rate each iteration
let minSpawnRate = 50; // Minimum spawn rate
let gameInterval; // Interval for spawning asteroids
let gameTimer; // Tracks time since start/reset

//Update the Minimum spawn rate of astroids according to screen size
function updateMinSpawnRate() {
  if (window.innerWidth <= 600) {
    minSpawnRate = 300; 
  } 
  else if (window.innerWidth <= 800) {
    minSpawnRate = 200; 
  } 
  else if (window.innerWidth <= 1200) {
    minSpawnRate = 150; 
  } else {
    minSpawnRate = 50; // Revert back to 60 for larger screens
  }
}

// Initial check
updateMinSpawnRate();

// Add a listener to detect screen size changes
window.addEventListener('resize', updateMinSpawnRate);


// Time tracking variables
let currentTime = 0;
let bestTime = localStorage.getItem('bestTime') ? parseInt(localStorage.getItem('bestTime')) : 0;
let timerInterval;

// Update spaceship position
function updatePosition() {
  spaceship.style.left = `${positionX}px`;
  spaceship.style.top = `${positionY}px`;
}

// Mouse move event to track mouse position
document.addEventListener('mousemove', (event) => {
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  const gameAreaRect = gameArea.getBoundingClientRect();
  if (mouseX > gameAreaRect.left && mouseX < gameAreaRect.right && mouseY > gameAreaRect.top && mouseY < gameAreaRect.bottom) {
    positionX += (mouseX - positionX) * speed;
    positionY += (mouseY - positionY) * speed;
    updatePosition();
  }
});

// Touch move event to track touch position (for mobile users)
document.addEventListener('touchmove', (event) => {
  const touchX = event.touches[0].clientX; // Get touch X position
  const touchY = event.touches[0].clientY; // Get touch Y position

  const gameAreaRect = gameArea.getBoundingClientRect();
  if (touchX > gameAreaRect.left && touchX < gameAreaRect.right && touchY > gameAreaRect.top && touchY < gameAreaRect.bottom) {
    positionX += (touchX - positionX) * speed;
    positionY += (touchY - positionY) * speed;
    updatePosition();
  }
});

// Function to create an asteroid
function createAsteroid() {
  const asteroid = document.createElement('div');
  asteroid.classList.add('asteroid');
  asteroid.style.left = `${Math.random() * gameArea.offsetWidth}px`;
  asteroid.style.top = `-50px`;
  gameArea.appendChild(asteroid);

  const asteroidSpeed = Math.random() * 3 + 2; // Random speed
  const interval = setInterval(() => {
    const top = parseFloat(asteroid.style.top);
    if (top > gameArea.offsetHeight) {
      asteroid.remove();
      clearInterval(interval);
    } else {
      asteroid.style.top = `${top + asteroidSpeed}px`;
    }

    checkCollision(asteroid, interval);
  }, 20);
}

// Function to check collision
function checkCollision(asteroid, interval) {
  const spaceshipRect = spaceship.getBoundingClientRect();
  const asteroidRect = asteroid.getBoundingClientRect();

  if (
    !isInvincible &&
    spaceshipRect.left < asteroidRect.right &&
    spaceshipRect.right > asteroidRect.left &&
    spaceshipRect.top < asteroidRect.bottom &&
    spaceshipRect.bottom > asteroidRect.top
  ) {
    handleCollision(asteroid, interval);
  }
}

// Handle collision
function handleCollision(asteroid, interval) {
  // Get collision point
  const asteroidRect = asteroid.getBoundingClientRect();
  const spaceshipRect = spaceship.getBoundingClientRect();

  const explosionX = (asteroidRect.left + asteroidRect.right) / 2;
  const explosionY = (asteroidRect.top + asteroidRect.bottom) / 2;

  createExplosion(explosionX, explosionY);
  onPlayerDeath();
  asteroid.remove();
  spaceship.style.display = 'none';
  clearInterval(interval);

  clearInterval(gameInterval); // Stop spawning asteroids
  clearTimeout(gameTimer); // Stop timer

  // Respawn spaceship after 3 seconds
  setTimeout(() => {
    spaceship.style.display = 'block';
    isInvincible = true;
    spaceship.classList.add('invincible');

    // End invincibility after 3 seconds
    setTimeout(() => {
      isInvincible = false;
      spaceship.classList.remove('invincible');
    }, 3000);

    resetGame(); // Restart the game loop
  }, 3000);
}

// Function to create an explosion
function createExplosion(x, y) {
  const explosion = document.createElement('div');
  explosion.classList.add('explosion');
  explosion.style.left = `${x}px`;
  explosion.style.top = `${y}px`;

  gameArea.appendChild(explosion);

  // Remove the explosion after the animation ends
  setTimeout(() => {
    explosion.remove();
  }, 1000); // Explosion lasts 1 second
}

// Function to gradually increase asteroid spawn rate
function startGame() {
  spawnRate = 1000; // Reset spawn rate for new game
  // Spawn the first asteroid immediately
  createAsteroid();
  gameInterval = setInterval(createAsteroid, spawnRate);

  gameTimer = setInterval(() => {
    if (spawnRate > minSpawnRate) {
      spawnRate -= spawnRateDecrement; // Decrease spawn rate
      clearInterval(gameInterval); // Clear existing interval
      gameInterval = setInterval(createAsteroid, spawnRate); // Start new interval with updated rate
    }
  }, 1000); // Check every second to adjust spawn rate
}

// Function to reset game state
function resetGame() {
  stopTimer(); // Stop the timer when the player dies
  setTimeout(() => {
    startTimer(); // Restart the timer after respawn
    startGame();  // Restart asteroid spawning and game logic
  }, 3000); // 3-second delay for respawn
}

// Update and display the best time
function updateBestTime() {
  if (currentTime > bestTime) {
    bestTime = currentTime; // Update best time if the current time is better
    localStorage.setItem('bestTime', bestTime); // Store it in localStorage
  }
  // Convert bestTime to hours, minutes, and seconds
  const hours = Math.floor(bestTime / 3600);
  const minutes = Math.floor((bestTime % 3600) / 60);
  const seconds = bestTime % 60;

  // Format the best time display
  const bestTimeString = hours > 0
    ? `Best Time: ${hours}h ${minutes}m ${seconds}s`
    : minutes > 0
    ? `Best Time: ${minutes}m ${seconds}s`
    : `Best Time: ${seconds}s`;



  // Display the best time in a readable format
  bestTimeElement.innerHTML = bestTimeString;
}

// Start the timer
function startTimer() {
  // Clear any existing timer interval
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Reset the time to 0
  currentTime = 0;

  // Start a new interval
  timerInterval = setInterval(() => {
    currentTime++;

    // Convert currentTime to hours, minutes, and seconds
    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = currentTime % 60;

    // Format the timer display
    const timeString = hours > 0
      ? `Time: ${hours}h ${minutes}m ${seconds}s`
      : minutes > 0
      ? `Time: ${minutes}m ${seconds}s`
      : `Time: ${seconds}s`;



    timerElement.innerHTML = timeString; // Display current time
    updateBestTime(); // Update the best time as the player progresses
  }, 1000);
}

// Stop the timer
function stopTimer() {
  // Stop the timer immediately
  clearInterval(timerInterval);
}

// Example: Stop timer when the player dies (you'll need to integrate this with your game logic)
function onPlayerDeath() {
  stopTimer(); // Stop the timer when player dies
}

document.addEventListener("DOMContentLoaded", () => {
  const riskCaption = document.querySelector("#risk-caption .caption-text");
  const squaredCaption = document.querySelector("#squared-caption .caption-text");
  const employee216Caption = document.querySelector("#employee-216-caption .caption-text");
  const solitaireCaption = document.querySelector("#solitaire-caption .caption-text");
  const spaceshooterCaption = document.querySelector("#space-shooter-caption .caption-text");

  const updateCaptionText = () => {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 735) {
      riskCaption.textContent = "Calculated gambles and bold decisions—can you take the Risk?";
    } else if (screenWidth <= 1200) {
      riskCaption.textContent = "A thrilling card game of gambles and strategy. Each turn, pick the right card, hit or stand, and balance nerve with tactics. Will you take the Risk?";
    } else {
      riskCaption.textContent =
        "The ultimate playing card game of calculated gambles and bold decisions. Players face a thrilling dilemma each turn: select the right card and decide whether to hit or stand, balancing strategy and nerve in a game where every move could lead to triumph or disaster. Are you ready to take the Risk?";
    }
    if (screenWidth <= 970) {
      squaredCaption.textContent = "Squared reimagines Tic-Tac-Toe on a 5x5 grid. Race to form the ultimate square with strategy and quick thinking!";
    } else if (screenWidth <= 1390) {
      squaredCaption.textContent = "Rethink Tic-Tac-Toe on a 5x5 grid! Squared challenges players to drop X's and O's, racing to form the ultimate square. Quick thinking and strategy are key in this electrifying twist on a classic game.";
    } else {
      squaredCaption.textContent =
      "Get ready to rethink Tic-Tac-Toe! Played on a vibrant 5x5 grid, Squared challenges players to drop X's and O's in a thrilling race to form the ultimate square. With each turn, the stakes rise, demanding quick thinking, sharp strategy, and a dash of cunning. Get ready for an electrifying twist on a beloved classic—victory has never been this satisfying!";
    }

    if (screenWidth <= 970) {
      employee216Caption.textContent = "In this thrilling short film, Employee 216’s normal day turns into a spine-chilling mystery, with tension rising at every click!";
    } else if (screenWidth <= 1390) {
      employee216Caption.textContent =  "Brace yourself for a spine-tingling short film! Employee 216, absorbed in their office work, begins noticing strange occurrences. What starts as a normal day spirals into a mind-bending mystery, with tension building at every click.";
    } else {
      employee216Caption.textContent = "Brace yourself for a spine-tingling ride in this thrilling short film! Watch as Employee 216, completely absorbed in their office assignment, suddenly begins to notice strange and unnerving occurrences around the office. What starts as a routine day quickly spirals into a mind-bending mystery, and the tension keeps building with every click of the mouse.";
    }

    if (screenWidth <= 970) {
      solitaireCaption.textContent = "Modern Solitaire—relax, reset, and shuffle your way to victory!";
    } else if (screenWidth <= 1390) {
      solitaireCaption.textContent =  "Solitaire with a modern twist! Enjoy smooth gameplay, reset the board anytime, and challenge yourself with every shuffle.";
    } else {
      solitaireCaption.textContent = "A fresh twist on the classic card game! Experience the timeless challenge of Solitaire with a sleek, modern design and smooth gameplay. Whether you're relaxing or testing your skills, this fully functioning version lets you reset the board and dive right back into the action. Simple yet addictive, it's the perfect way to unwind, and every shuffle brings a new opportunity to strategize and win!";
    }

    if (screenWidth <= 870) {
      spaceshooterCaption.textContent = "Space shooter action—dodge, upgrade, and save the galaxy!";
    } else if (screenWidth <= 1470) {
      spaceshooterCaption.textContent =  "Embark on a thrilling space adventure with a modern twist on the classic Galaga! Face waves of enemies, dodge attacks, and unleash powerful upgrades to save the galaxy.";
    } else {
      spaceshooterCaption.textContent = "Blast off into an exhilarating space adventure! Inspired by the classic Galaga, this space shooter brings a fresh, modern twist with stunning graphics and intense action. Face waves of enemies, dodge relentless attacks, and unleash powerful upgrades as you race to save the galaxy. Every level escalates the excitement, challenging your reflexes and strategy—are you ready to take on the challenge and become the ultimate space hero?";
    }

  };

  // Update caption text on page load and window resize
  updateCaptionText();
  window.addEventListener("resize", updateCaptionText);
});



// Initialize position and start the game with the timer
updatePosition();
startTimer();
startGame();
