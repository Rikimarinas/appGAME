const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hudCoins = document.getElementById("coinCount");
const hudState = document.getElementById("playerState");
const hudTimer = document.getElementById("timer");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayButton = document.getElementById("overlayButton");
const medal = document.getElementById("medal");

const WORLD = {
  width: 3200,
  height: 540,
  gravity: 0.5,
  maxFall: 12,
};

const INPUT = {
  left: false,
  right: false,
  jump: false,
  run: false,
  fire: false,
};

const TOUCH = new Map();

document.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") INPUT.left = true;
  if (event.code === "ArrowRight" || event.code === "KeyD") INPUT.right = true;
  if (event.code === "Space" || event.code === "KeyW") INPUT.jump = true;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") INPUT.run = true;
  if (event.code === "KeyF") INPUT.fire = true;
});

document.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") INPUT.left = false;
  if (event.code === "ArrowRight" || event.code === "KeyD") INPUT.right = false;
  if (event.code === "Space" || event.code === "KeyW") INPUT.jump = false;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") INPUT.run = false;
  if (event.code === "KeyF") INPUT.fire = false;
});

document.querySelectorAll(".touch-btn").forEach((button) => {
  const action = button.dataset.action;
  const handler = (value) => {
    INPUT[action] = value;
  };
  button.addEventListener("touchstart", (event) => {
    event.preventDefault();
    handler(true);
  });
  button.addEventListener("touchend", (event) => {
    event.preventDefault();
    handler(false);
  });
  button.addEventListener("mousedown", () => handler(true));
  button.addEventListener("mouseup", () => handler(false));
  button.addEventListener("mouseleave", () => handler(false));
  TOUCH.set(action, handler);
});

const COLORS = {
  ground: "#62b55d",
  brick: "#c87f4a",
  question: "#f5b841",
  questionUsed: "#d5d5d5",
  coin: "#ffd166",
  mushroom: "#f94144",
  star: "#f9c74f",
  flag: "#2a9d8f",
};

const player = {
  x: 120,
  y: 380,
  width: 32,
  height: 40,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  jumpHold: 0,
  jumpHolding: false,
  state: "SMALL",
  storedState: "SMALL",
  invulnTimer: 0,
  invincibleTimer: 0,
  fireCooldown: 0,
  alive: true,
};

const camera = { x: 0 };

const blocks = [
  { x: 520, y: 320, width: 40, height: 40, type: "question", content: "coin" },
  { x: 580, y: 320, width: 40, height: 40, type: "question", content: "coin" },
  { x: 640, y: 320, width: 40, height: 40, type: "question", content: "coin" },
  { x: 700, y: 320, width: 40, height: 40, type: "question", content: "coin" },
  { x: 880, y: 260, width: 40, height: 40, type: "question", content: "mushroom" },
  { x: 980, y: 260, width: 40, height: 40, type: "question", content: "star" },
  { x: 760, y: 320, width: 40, height: 40, type: "brick" },
  { x: 820, y: 320, width: 40, height: 40, type: "brick" },
  { x: 1160, y: 300, width: 40, height: 40, type: "brick" },
  { x: 1520, y: 260, width: 40, height: 40, type: "brick" },
];

const platforms = [
  { x: 0, y: 440, width: 900, height: 100 },
  { x: 1040, y: 440, width: 620, height: 100 },
  { x: 1720, y: 440, width: 880, height: 100 },
  { x: 820, y: 360, width: 120, height: 20 },
  { x: 1200, y: 340, width: 120, height: 20 },
  { x: 1860, y: 320, width: 140, height: 20 },
];

const pipes = [{ x: 1320, y: 360, width: 80, height: 80 }];

const coins = [
  { x: 360, y: 360 },
  { x: 420, y: 320 },
  { x: 480, y: 280 },
  { x: 920, y: 280 },
  { x: 1240, y: 280 },
  { x: 1400, y: 280 },
  { x: 1760, y: 280 },
  { x: 1900, y: 260 },
  { x: 2040, y: 260 },
  { x: 2160, y: 260 },
];

const items = [];

const enemies = [
  { type: "goomba", x: 600, y: 400, width: 32, height: 30, vx: -1.2, alive: true },
  { type: "goomba", x: 1260, y: 400, width: 32, height: 30, vx: -1.1, alive: true },
  { type: "goomba", x: 1780, y: 400, width: 32, height: 30, vx: -1.2, alive: true },
  { type: "koopa", x: 2000, y: 396, width: 32, height: 34, vx: -1, alive: true, shell: false },
];

const shots = [];

const goal = { x: 3000, y: 260, width: 40, height: 180 };

const state = {
  coins: 0,
  timer: 90,
  timeLeft: 90,
  running: true,
  won: false,
  requiredCoins: 5,
  goalHint: 0,
  lastTime: 0,
};

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function applyFriction() {
  if (!player.onGround) return;
  const friction = 0.4;
  if (!INPUT.left && !INPUT.right) {
    if (Math.abs(player.vx) < friction) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * friction;
    }
  }
}

function handleMovement(delta) {
  const accel = player.onGround ? 0.6 : 0.25;
  const maxSpeed = INPUT.run ? 5.4 : 3.2;
  if (INPUT.left) {
    player.vx -= accel;
    player.facing = -1;
  }
  if (INPUT.right) {
    player.vx += accel;
    player.facing = 1;
  }
  if (player.vx > maxSpeed) player.vx = maxSpeed;
  if (player.vx < -maxSpeed) player.vx = -maxSpeed;

  if (player.onGround && INPUT.jump) {
    player.vy = -9.8;
    player.onGround = false;
    player.jumpHold = 0;
    player.jumpHolding = true;
  }

  if (!INPUT.jump) {
    player.jumpHolding = false;
  }

  if (player.jumpHolding && player.jumpHold < 0.22) {
    player.vy -= 0.18;
    player.jumpHold += delta;
  }

  player.vy += WORLD.gravity;
  if (player.vy > WORLD.maxFall) player.vy = WORLD.maxFall;

  applyFriction();

  moveWithCollisions(player, delta);
}

function moveWithCollisions(entity) {
  entity.x += entity.vx;
  resolveCollisions(entity, "x");
  entity.y += entity.vy;
  resolveCollisions(entity, "y");
}

function resolveCollisions(entity, axis) {
  const solids = [...platforms, ...pipes, ...blocks];
  for (const solid of solids) {
    if (!rectsOverlap(entity, solid)) continue;
    if (axis === "x") {
      if (entity.vx > 0) {
        entity.x = solid.x - entity.width;
      } else if (entity.vx < 0) {
        entity.x = solid.x + solid.width;
      }
      entity.vx = 0;
    } else {
      if (entity.vy > 0) {
        entity.y = solid.y - entity.height;
        if (entity === player) player.onGround = true;
      } else if (entity.vy < 0) {
        entity.y = solid.y + solid.height;
        if (entity === player) triggerBlockHit(solid);
      }
      entity.vy = 0;
    }
  }
}

function triggerBlockHit(block) {
  const hitBlock = blocks.find((item) => item === block);
  if (!hitBlock) return;
  if (hitBlock.bumping) return;
  hitBlock.bumping = 0.15;
  if (hitBlock.type === "question" && !hitBlock.used) {
    hitBlock.used = true;
    spawnItem(hitBlock);
  }
  if (hitBlock.type === "brick") {
    if (player.state === "SUPER" || player.state === "FIRE") {
      blocks.splice(blocks.indexOf(hitBlock), 1);
    }
  }
}

function spawnItem(block) {
  if (block.content === "coin") {
    state.coins += 1;
    coins.push({ x: block.x + 6, y: block.y - 20, floating: 0.4, bonus: true });
  }
  if (block.content === "mushroom") {
    items.push({ type: "mushroom", x: block.x + 6, y: block.y - 20, vx: 1.2, vy: -2, width: 28, height: 28 });
  }
  if (block.content === "star") {
    items.push({ type: "star", x: block.x + 6, y: block.y - 20, vx: 1.6, vy: -3, width: 28, height: 28 });
  }
}

function updateItems() {
  for (const item of items) {
    item.vy = (item.vy ?? 0) + WORLD.gravity;
    item.x += item.vx;
    item.y += item.vy;
    const itemRect = { x: item.x, y: item.y, width: item.width, height: item.height };
    for (const solid of [...platforms, ...pipes, ...blocks]) {
      if (!rectsOverlap(itemRect, solid)) continue;
      if (item.vy > 0) {
        item.y = solid.y - item.height;
        item.vy = 0;
      } else if (item.vy < 0) {
        item.y = solid.y + solid.height;
        item.vy = 0;
      }
      if (item.x < solid.x && item.vx > 0) item.vx *= -1;
      if (item.x + item.width > solid.x + solid.width && item.vx < 0) item.vx *= -1;
    }
    if (rectsOverlap(player, itemRect)) {
      if (item.type === "mushroom" && player.state === "SMALL") {
        player.state = "SUPER";
      }
      if (item.type === "star") {
        player.storedState = player.state;
        player.state = "INVINCIBLE";
        player.invincibleTimer = 8;
      }
      items.splice(items.indexOf(item), 1);
    }
  }
}

function updateCoins(delta) {
  for (const coin of coins) {
    if (coin.collected) continue;
    const coinRect = { x: coin.x, y: coin.y, width: 18, height: 18 };
    if (!coin.bonus && rectsOverlap(player, coinRect)) {
      coin.collected = true;
      state.coins += 1;
    }
    if (coin.floating) {
      coin.floating -= delta;
      coin.y -= 30 * delta;
      if (coin.floating <= 0) coin.collected = true;
    }
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.vy = (enemy.vy ?? 0) + WORLD.gravity;
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    const enemyRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
    for (const solid of [...platforms, ...pipes]) {
      if (!rectsOverlap(enemyRect, solid)) continue;
      if (enemy.vy > 0) {
        enemy.y = solid.y - enemy.height;
        enemy.vy = 0;
      }
      if (enemy.x < solid.x && enemy.vx > 0) enemy.vx *= -1;
      if (enemy.x + enemy.width > solid.x + solid.width && enemy.vx < 0) enemy.vx *= -1;
    }

    if (rectsOverlap(player, enemyRect)) {
      if (player.state === "INVINCIBLE") {
        enemy.alive = false;
      } else if (player.vy > 1 && player.y + player.height - 8 < enemy.y) {
        if (enemy.type === "koopa") {
          if (!enemy.shell) {
            enemy.shell = true;
            enemy.vx = 0;
          } else {
            enemy.vx = player.facing * 5;
          }
        } else {
          enemy.alive = false;
        }
        player.vy = -7;
      } else {
        takeDamage();
      }
    }
  }

  for (const enemy of enemies) {
    if (!enemy.alive || enemy.type !== "koopa" || !enemy.shell || enemy.vx === 0) continue;
    for (const other of enemies) {
      if (enemy === other || !other.alive) continue;
      if (rectsOverlap(enemy, other)) {
        other.alive = false;
      }
    }
  }
}

function takeDamage() {
  if (player.invulnTimer > 0) return;
  if (player.state === "INVINCIBLE") return;
  if (player.state === "FIRE") {
    player.state = "SUPER";
  } else if (player.state === "SUPER") {
    player.state = "SMALL";
  } else {
    lose();
    return;
  }
  player.invulnTimer = 1.5;
}

function updateShots(delta) {
  if (player.fireCooldown > 0) player.fireCooldown -= delta;
  if (player.state === "FIRE" && INPUT.fire && player.fireCooldown <= 0) {
    shots.push({
      x: player.x + player.width / 2,
      y: player.y + 10,
      width: 16,
      height: 12,
      vx: player.facing * 6,
      vy: -2,
    });
    player.fireCooldown = 0.3;
  }

  for (const shot of shots) {
    shot.vy += WORLD.gravity * 0.4;
    shot.x += shot.vx;
    shot.y += shot.vy;
    for (const solid of [...platforms, ...pipes]) {
      if (!rectsOverlap(shot, solid)) continue;
      if (shot.vy > 0) {
        shot.y = solid.y - shot.height;
        shot.vy = -4;
      }
    }
    for (const enemy of enemies) {
      if (enemy.alive && rectsOverlap(shot, enemy)) {
        enemy.alive = false;
        shot.hit = true;
      }
    }
  }

  for (let i = shots.length - 1; i >= 0; i -= 1) {
    if (shots[i].hit || shots[i].x < camera.x - 100 || shots[i].x > camera.x + canvas.width + 100) {
      shots.splice(i, 1);
    }
  }
}

function updateGoal() {
  const goalRect = { x: goal.x, y: goal.y, width: goal.width, height: goal.height };
  if (rectsOverlap(player, goalRect)) {
    if (state.coins < state.requiredCoins) {
      state.goalHint = 1.5;
    } else {
      win();
    }
  }
}

function updateTimers(delta) {
  if (!state.running) return;
  state.timeLeft -= delta;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    lose();
  }
  if (state.goalHint > 0) state.goalHint -= delta;
  if (player.invulnTimer > 0) player.invulnTimer -= delta;
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= delta;
    if (player.invincibleTimer <= 0) {
      player.state = player.storedState;
      player.invincibleTimer = 0;
    }
  }
}

function win() {
  if (state.won) return;
  state.running = false;
  state.won = true;
  overlayTitle.textContent = "Nivel superado";
  overlayMessage.textContent = "¡Has llegado a la meta!";
  overlayButton.textContent = "Volver al menú";
  overlay.hidden = false;
  medal.hidden = false;
  localStorage.setItem("marioCompleted", "true");
}

function lose() {
  state.running = false;
  overlayTitle.textContent = "Has perdido";
  overlayMessage.textContent = "Inténtalo de nuevo.";
  overlayButton.textContent = "Reintentar";
  overlay.hidden = false;
}

overlayButton.addEventListener("click", () => {
  window.location.reload();
});

function update(delta) {
  if (!state.running) return;
  player.onGround = false;
  handleMovement(delta);
  updateItems();
  updateCoins(delta);
  updateEnemies();
  updateShots(delta);
  updateGoal();

  if (player.y > WORLD.height) {
    lose();
  }

  camera.x = Math.min(Math.max(player.x - canvas.width / 2, 0), WORLD.width - canvas.width);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-camera.x, 0);

  ctx.fillStyle = COLORS.ground;
  for (const platform of platforms) {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  }

  ctx.fillStyle = "#2d6a4f";
  for (const pipe of pipes) {
    ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
  }

  for (const block of blocks) {
    const bump = block.bumping ? Math.sin((0.15 - block.bumping) * 16) * 6 : 0;
    if (block.bumping) {
      block.bumping -= 0.016;
      if (block.bumping <= 0) block.bumping = 0;
    }
    ctx.fillStyle = block.type === "brick" ? COLORS.brick : block.used ? COLORS.questionUsed : COLORS.question;
    ctx.fillRect(block.x, block.y - bump, block.width, block.height);
    if (block.type === "question" && !block.used) {
      ctx.fillStyle = "#fff";
      ctx.font = "20px sans-serif";
      ctx.fillText("?", block.x + 14, block.y + 26);
    }
  }

  ctx.fillStyle = COLORS.coin;
  for (const coin of coins) {
    if (coin.collected) continue;
    ctx.beginPath();
    ctx.arc(coin.x + 9, coin.y + 9, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const item of items) {
    ctx.fillStyle = item.type === "mushroom" ? COLORS.mushroom : COLORS.star;
    ctx.fillRect(item.x, item.y, item.width, item.height);
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.fillStyle = enemy.type === "goomba" ? "#a05a2c" : "#7d5ba6";
    if (enemy.shell) ctx.fillStyle = "#2b9348";
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }

  ctx.fillStyle = COLORS.flag;
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  ctx.fillStyle = "#f94144";
  ctx.fillRect(goal.x + 10, goal.y + 20, 26, 18);

  for (const shot of shots) {
    ctx.fillStyle = "#ffb703";
    ctx.beginPath();
    ctx.ellipse(shot.x, shot.y, shot.width / 2, shot.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (player.alive) {
    const shouldBlink = player.invulnTimer > 0 && Math.floor(performance.now() / 100) % 2 === 0;
    if (!shouldBlink) {
      ctx.fillStyle = player.state === "SMALL" ? "#1d3557" : player.state === "SUPER" ? "#457b9d" : "#e63946";
      if (player.state === "INVINCIBLE") ctx.fillStyle = "#fcbf49";
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
  }

  ctx.restore();

  if (state.goalHint > 0) {
    ctx.fillStyle = "rgba(16, 42, 67, 0.85)";
    ctx.fillRect(220, 16, 520, 36);
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText(`Necesitas ${state.requiredCoins} monedas para activar la meta.`, 240, 40);
  }
}

function renderHud() {
  hudCoins.textContent = state.coins;
  hudState.textContent = player.state;
  hudTimer.textContent = Math.ceil(state.timeLeft);
}

function loop(timestamp) {
  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.03);
  state.lastTime = timestamp;
  updateTimers(delta);
  update(delta);
  draw();
  renderHud();
  requestAnimationFrame(loop);
}

function init() {
  if (localStorage.getItem("marioCompleted") === "true") {
    medal.hidden = false;
  }
  requestAnimationFrame(loop);
}

init();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => null);
}
