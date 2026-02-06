const menu = document.getElementById("main-menu");
const gameScreen = document.getElementById("game-screen");
const statusText = document.getElementById("game-status");
const powerStatus = document.getElementById("power-status");
const exitBtn = document.getElementById("exit-game");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const menuButtons = document.querySelectorAll(".menu__button");
const joystickButtons = document.querySelectorAll(".joystick__btn");
const jumpBtn = document.getElementById("jump-btn");
const powerBtn = document.getElementById("power-btn");

const controls = {
  left: false,
  right: false,
  jumpQueued: false,
  powerQueued: false,
};

const world = {
  gravity: 0.6,
  friction: 0.82,
  floor: 400,
};

const player = {
  x: 60,
  y: 0,
  width: 28,
  height: 40,
  vx: 0,
  vy: 0,
  speed: 0.9,
  jumpPower: 13,
  onGround: false,
  powerCount: 0,
};

const boxes = [
  { x: 70, y: 340, width: 50, height: 50, letter: "L", type: "coin" },
  { x: 130, y: 340, width: 50, height: 50, letter: "O", type: "coin" },
  { x: 190, y: 340, width: 50, height: 50, letter: "V", type: "coin" },
  { x: 250, y: 340, width: 50, height: 50, letter: "E", type: "power" },
];

const platforms = [
  { x: 0, y: world.floor, width: 900, height: 80 },
  { x: 320, y: 330, width: 90, height: 20 },
  { x: 430, y: 300, width: 90, height: 20 },
  { x: 540, y: 270, width: 90, height: 20 },
  { x: 620, y: 360, width: 120, height: 20 },
  { x: 720, y: 310, width: 80, height: 20 },
];

const enemies = [
  { x: 430, y: 360, width: 26, height: 26, vx: 0.6, floating: false },
  { x: 660, y: 334, width: 26, height: 26, vx: -0.5, floating: false },
  { x: 780, y: 334, width: 26, height: 26, vx: 0.7, floating: false },
];

const bubbles = [];
const castle = { x: 820, y: 280, width: 60, height: 120 };

let lastBubbleTime = 0;
let running = false;
let gameEnded = false;

function setStatus(message) {
  statusText.textContent = message;
}

function updatePowerStatus() {
  powerStatus.textContent = `Poder: ${player.powerCount}`;
}

function resetGame() {
  player.x = 60;
  player.y = 0;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.powerCount = 0;
  bubbles.length = 0;
  enemies.forEach((enemy, index) => {
    enemy.x = [430, 660, 780][index];
    enemy.y = 360 - (index === 0 ? 0 : 26);
    enemy.vx = index % 2 === 0 ? 0.6 : -0.5;
    enemy.floating = false;
  });
  boxes.forEach((box) => {
    box.collected = false;
  });
  lastBubbleTime = 0;
  gameEnded = false;
  updatePowerStatus();
  setStatus("Encuentra las cajas y llega al castillo");
}

function showGame() {
  menu.hidden = true;
  gameScreen.hidden = false;
  resetGame();
  running = true;
}

function hideGame() {
  menu.hidden = false;
  gameScreen.hidden = true;
  running = false;
}

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.game === "mario") {
      showGame();
    } else {
      alert("Este juego aún no está disponible.");
    }
  });
});

exitBtn.addEventListener("click", hideGame);

function handlePointerButton(button, state) {
  const dir = button.dataset.dir;
  if (dir === "left") {
    controls.left = state;
  }
  if (dir === "right") {
    controls.right = state;
  }
}

joystickButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handlePointerButton(button, true);
  });
  button.addEventListener("pointerup", () => handlePointerButton(button, false));
  button.addEventListener("pointerleave", () => handlePointerButton(button, false));
});

jumpBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  controls.jumpQueued = true;
});

powerBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  controls.powerQueued = true;
});

window.addEventListener("keydown", (event) => {
  if (!running) {
    return;
  }
  if (event.key === "ArrowLeft") controls.left = true;
  if (event.key === "ArrowRight") controls.right = true;
  if (event.key === " " || event.key === "ArrowUp") controls.jumpQueued = true;
  if (event.key.toLowerCase() === "x") controls.powerQueued = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") controls.left = false;
  if (event.key === "ArrowRight") controls.right = false;
});

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function collectBox(box) {
  box.collected = true;
  if (box.type === "power") {
    player.powerCount = 4;
    setStatus("Has encontrado el poder de burbuja (4 usos)");
  } else {
    setStatus(`Caja ${box.letter} → moneda`);
  }
  updatePowerStatus();
}

function spawnBubble() {
  if (player.powerCount <= 0 || gameEnded) return;
  const now = performance.now();
  if (now - lastBubbleTime < 200) return;
  lastBubbleTime = now;
  player.powerCount -= 1;
  updatePowerStatus();
  bubbles.push({
    x: player.x + player.width,
    y: player.y + player.height / 2,
    radius: 6,
    vx: 4,
  });
}

function applyControls() {
  if (controls.left) player.vx -= player.speed;
  if (controls.right) player.vx += player.speed;

  if (controls.jumpQueued && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }

  if (controls.powerQueued) {
    spawnBubble();
  }

  controls.jumpQueued = false;
  controls.powerQueued = false;
}

function updatePlayer() {
  player.vx *= world.friction;
  player.vy += world.gravity;

  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  player.onGround = false;

  platforms.forEach((platform) => {
    const withinX = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const falling = player.vy >= 0;
    const hittingTop = player.y + player.height >= platform.y && player.y + player.height <= platform.y + platform.height;

    if (withinX && falling && hittingTop) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  });
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    if (enemy.floating) {
      enemy.y -= 0.5;
      return;
    }
    enemy.x += enemy.vx;
    if (enemy.x <= 360 || enemy.x + enemy.width >= 860) {
      enemy.vx *= -1;
    }
  });
}

function updateBubbles() {
  for (let i = bubbles.length - 1; i >= 0; i -= 1) {
    const bubble = bubbles[i];
    bubble.x += bubble.vx;
    if (bubble.x - bubble.radius > canvas.width) {
      bubbles.splice(i, 1);
      continue;
    }
    enemies.forEach((enemy) => {
      if (!enemy.floating && rectsOverlap(
        { x: bubble.x - bubble.radius, y: bubble.y - bubble.radius, width: bubble.radius * 2, height: bubble.radius * 2 },
        enemy
      )) {
        enemy.floating = true;
        setStatus("Enemigo atrapado en burbuja, ahora flota.");
      }
    });
  }
}

function checkCollisions() {
  boxes.forEach((box) => {
    if (!box.collected && rectsOverlap(player, box)) {
      collectBox(box);
    }
  });

  if (!gameEnded && rectsOverlap(player, castle)) {
    setStatus("¡Llegaste al castillo! Fin del juego.");
    gameEnded = true;
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Platforms
  platforms.forEach((platform) => {
    ctx.fillStyle = "#6d4c41";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });

  // Boxes
  boxes.forEach((box) => {
    if (box.collected) return;
    ctx.fillStyle = box.type === "power" ? "#ffd54f" : "#fff176";
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.fillStyle = "#5d4037";
    ctx.font = "18px sans-serif";
    ctx.fillText(box.letter, box.x + 16, box.y + 30);
  });

  // Enemies
  enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.floating ? "#90caf9" : "#ef5350";
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Castle
  ctx.fillStyle = "#8d6e63";
  ctx.fillRect(castle.x, castle.y, castle.width, castle.height);
  ctx.fillStyle = "#ffcc80";
  ctx.fillRect(castle.x + 15, castle.y + 40, 30, 50);
  ctx.fillStyle = "#4e342e";
  ctx.fillText("Castillo", castle.x - 6, castle.y - 8);

  // Player
  ctx.fillStyle = "#1565c0";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x + 6, player.y + 8, 6, 6);

  // Bubbles
  bubbles.forEach((bubble) => {
    ctx.strokeStyle = "#42a5f5";
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function gameLoop() {
  if (!running) {
    requestAnimationFrame(gameLoop);
    return;
  }
  if (!gameEnded) {
    applyControls();
    updatePlayer();
    updateEnemies();
    updateBubbles();
    checkCollisions();
  }
  drawScene();
  requestAnimationFrame(gameLoop);
}

resetGame();
requestAnimationFrame(gameLoop);
