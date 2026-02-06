const startMarioButton = document.getElementById("startMario");
const backMenuButton = document.getElementById("backMenu");
const gamePanel = document.getElementById("gamePanel");
const lifeEl = document.getElementById("life");
const powerEl = document.getElementById("power");
const scoreEl = document.getElementById("score");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const state = {
  running: false,
  lives: 3,
  score: 0,
  power: "Normal",
};

const world = {
  gravity: 0.6,
  ground: 380,
};

const player = {
  x: 70,
  y: world.ground - 40,
  width: 32,
  height: 40,
  vx: 0,
  vy: 0,
  speed: 3.2,
  turbo: 1,
  jumping: false,
};

const boxes = [
  { x: 120, y: 250, kind: "Poder" },
  { x: 170, y: 250, kind: "Vida" },
  { x: 220, y: 250, kind: "Turbo" },
];

const stairs = [
  { x: 460, y: 330, width: 40, height: 50 },
  { x: 500, y: 300, width: 40, height: 80 },
  { x: 540, y: 270, width: 40, height: 110 },
  { x: 580, y: 240, width: 40, height: 140 },
];

const obstacles = [
  { x: 300, y: 340, width: 60, height: 40 },
  { x: 650, y: 320, width: 40, height: 60 },
  { x: 740, y: 300, width: 80, height: 80 },
];

const enemies = [
  { x: 360, y: world.ground - 28, width: 28, height: 28, dir: 1 },
  { x: 680, y: world.ground - 28, width: 28, height: 28, dir: -1 },
];

const keys = new Set();

function resetGame() {
  state.lives = 3;
  state.score = 0;
  state.power = "Normal";
  player.x = 70;
  player.y = world.ground - player.height;
  player.vx = 0;
  player.vy = 0;
  player.turbo = 1;
  player.jumping = false;
  boxes.forEach((box) => (box.collected = false));
}

function updateHud() {
  lifeEl.textContent = String(state.lives);
  powerEl.textContent = state.power;
  scoreEl.textContent = String(state.score);
}

function collide(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function handleInput() {
  player.vx = 0;
  if (keys.has("ArrowLeft")) {
    player.vx = -player.speed * player.turbo;
  }
  if (keys.has("ArrowRight")) {
    player.vx = player.speed * player.turbo;
  }
  if (keys.has("Space")) {
    player.turbo = 1.7;
  } else {
    player.turbo = 1;
  }
}

function applyPhysics() {
  player.x += player.vx;
  player.vy += world.gravity;
  player.y += player.vy;

  if (player.y + player.height >= world.ground) {
    player.y = world.ground - player.height;
    player.vy = 0;
    player.jumping = false;
  }

  obstacles.concat(stairs).forEach((block) => {
    if (collide(player, block) && player.vy >= 0) {
      player.y = block.y - player.height;
      player.vy = 0;
      player.jumping = false;
    }
  });

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    enemy.x += enemy.dir * 1.1;
    if (enemy.x < 320) enemy.dir = 1;
    if (enemy.x + enemy.width > 780) enemy.dir = -1;

    if (collide(player, enemy)) {
      state.lives -= 1;
      player.x = 70;
      player.y = world.ground - player.height;
      player.vx = 0;
      player.vy = 0;
      if (state.lives <= 0) {
        state.lives = 3;
        state.score = 0;
        state.power = "Normal";
      }
    }
  });
}

function collectBoxes() {
  boxes.forEach((box) => {
    if (box.collected) return;
    const hitBox = {
      x: box.x,
      y: box.y,
      width: 30,
      height: 30,
    };
    if (collide(player, hitBox)) {
      box.collected = true;
      state.score += 100;
      if (box.kind === "Poder") state.power = "Fuego";
      if (box.kind === "Vida") state.lives = Math.min(5, state.lives + 1);
      if (box.kind === "Turbo") state.power = "Turbo";
    }
  });
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f2d16b";
  ctx.fillRect(0, world.ground, canvas.width, canvas.height - world.ground);

  ctx.fillStyle = "#f9b0c3";
  boxes.forEach((box) => {
    if (box.collected) return;
    ctx.fillRect(box.x, box.y, 30, 30);
    ctx.fillStyle = "#fff3";
    ctx.fillRect(box.x + 5, box.y + 5, 20, 20);
    ctx.fillStyle = "#f9b0c3";
  });

  ctx.fillStyle = "#7149c6";
  obstacles.forEach((block) => {
    ctx.fillRect(block.x, block.y, block.width, block.height);
  });

  ctx.fillStyle = "#3d2d87";
  stairs.forEach((step) => {
    ctx.fillRect(step.x, step.y, step.width, step.height);
  });

  ctx.fillStyle = "#ff944d";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#3b2030";
  enemies.forEach((enemy) => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

function loop() {
  if (!state.running) return;
  handleInput();
  applyPhysics();
  updateEnemies();
  collectBoxes();
  updateHud();
  drawScene();
  requestAnimationFrame(loop);
}

startMarioButton.addEventListener("click", () => {
  gamePanel.classList.remove("hidden");
  startMarioButton.setAttribute("disabled", "true");
  state.running = true;
  resetGame();
  updateHud();
  loop();
});

backMenuButton.addEventListener("click", () => {
  state.running = false;
  gamePanel.classList.add("hidden");
  startMarioButton.removeAttribute("disabled");
});

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowUp" && !player.jumping) {
    player.vy = -11;
    player.jumping = true;
  }
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});
