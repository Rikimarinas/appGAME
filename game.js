const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreLabel = document.getElementById("score");
const livesLabel = document.getElementById("lives");
const joystick = document.getElementById("joystick");
const jumpButton = document.getElementById("jump");
const runButton = document.getElementById("run");

const world = {
  gravity: 0.7,
  friction: 0.85,
  cameraX: 0,
  score: 0,
  lives: 3,
  runBoost: 1,
};

const player = {
  x: 120,
  y: 300,
  width: 40,
  height: 56,
  velocityX: 0,
  velocityY: 0,
  speed: 4,
  jumpForce: 14,
  onGround: false,
};

const platforms = [
  { x: 0, y: 460, width: 1200, height: 80 },
  { x: 260, y: 380, width: 140, height: 18 },
  { x: 520, y: 320, width: 160, height: 18 },
  { x: 760, y: 260, width: 140, height: 18 },
  { x: 1040, y: 360, width: 160, height: 18 },
  { x: 1300, y: 420, width: 220, height: 18 },
  { x: 1580, y: 340, width: 160, height: 18 },
  { x: 1860, y: 280, width: 160, height: 18 },
  { x: 2100, y: 460, width: 900, height: 80 },
];

const enemies = [
  { x: 520, y: 280, width: 36, height: 32, velocityX: -1.2, alive: true },
  { x: 980, y: 420, width: 36, height: 32, velocityX: 1.1, alive: true },
  { x: 1500, y: 388, width: 36, height: 32, velocityX: -1.3, alive: true },
  { x: 1980, y: 420, width: 36, height: 32, velocityX: 1.4, alive: true },
];

const input = {
  left: false,
  right: false,
  jump: false,
  run: false,
  axisX: 0,
};

const joystickState = {
  active: false,
  originX: 0,
  originY: 0,
  deltaX: 0,
  deltaY: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateJoystick(clientX, clientY) {
  const radius = 60;
  const deltaX = clientX - joystickState.originX;
  const deltaY = clientY - joystickState.originY;
  const distance = Math.hypot(deltaX, deltaY);
  const limited = distance > radius ? radius / distance : 1;
  joystickState.deltaX = deltaX * limited;
  joystickState.deltaY = deltaY * limited;
  joystick.style.transform = `translate(${joystickState.deltaX}px, ${joystickState.deltaY}px)`;
  input.axisX = clamp(joystickState.deltaX / radius, -1, 1);
  input.left = input.axisX < -0.2;
  input.right = input.axisX > 0.2;
}

function resetJoystick() {
  joystick.style.transform = "translate(0px, 0px)";
  input.axisX = 0;
  input.left = false;
  input.right = false;
}

function handleJoystickStart(event) {
  const touch = event.touches ? event.touches[0] : event;
  joystickState.active = true;
  joystickState.originX = touch.clientX;
  joystickState.originY = touch.clientY;
}

function handleJoystickMove(event) {
  if (!joystickState.active) return;
  const touch = event.touches ? event.touches[0] : event;
  updateJoystick(touch.clientX, touch.clientY);
}

function handleJoystickEnd() {
  joystickState.active = false;
  resetJoystick();
}

function isColliding(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

function updatePlayer() {
  const moveSpeed = player.speed * (input.run ? 1.6 : 1);
  if (input.left) {
    player.velocityX = -moveSpeed;
  } else if (input.right) {
    player.velocityX = moveSpeed;
  } else {
    player.velocityX *= world.friction;
  }

  if (input.jump && player.onGround) {
    player.velocityY = -player.jumpForce;
    player.onGround = false;
  }

  player.velocityY += world.gravity;
  player.x += player.velocityX;
  player.y += player.velocityY;

  player.onGround = false;
  platforms.forEach((platform) => {
    if (isColliding(player, platform)) {
      if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.onGround = true;
      } else if (player.velocityY < 0) {
        player.y = platform.y + platform.height;
        player.velocityY = 1;
      }
    }
  });

  if (player.y > canvas.height) {
    world.lives = Math.max(0, world.lives - 1);
    respawn();
  }

  world.cameraX = clamp(player.x - canvas.width * 0.4, 0, 2000);
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    enemy.x += enemy.velocityX;
    const platform = platforms.find(
      (segment) => enemy.x + enemy.width > segment.x && enemy.x < segment.x + segment.width
    );

    if (!platform || enemy.x <= platform.x || enemy.x + enemy.width >= platform.x + platform.width) {
      enemy.velocityX *= -1;
    }

    if (isColliding(player, enemy)) {
      const isStomp = player.velocityY > 0 && player.y + player.height - player.velocityY <= enemy.y + 4;
      if (isStomp) {
        enemy.alive = false;
        world.score += 100;
        player.velocityY = -player.jumpForce * 0.6;
      } else {
        world.lives = Math.max(0, world.lives - 1);
        respawn();
      }
    }
  });
}

function respawn() {
  player.x = 120;
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  world.cameraX = 0;
}

function drawBackground() {
  context.fillStyle = "#69c0ff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#78c850";
  context.fillRect(0, 420, canvas.width, 140);
}

function drawPlatform(platform) {
  context.fillStyle = "#c68642";
  context.fillRect(platform.x, platform.y, platform.width, platform.height);
  context.fillStyle = "#7a4b1e";
  context.fillRect(platform.x, platform.y, platform.width, 6);
}

function drawPlayer() {
  context.fillStyle = "#ff3b30";
  context.fillRect(player.x, player.y, player.width, player.height);
  context.fillStyle = "#1f5da8";
  context.fillRect(player.x, player.y + 28, player.width, 28);
  context.fillStyle = "#f7d6b5";
  context.fillRect(player.x + 8, player.y + 8, 24, 16);
  context.fillStyle = "#333";
  context.fillRect(player.x + 10, player.y + 12, 6, 6);
  context.fillRect(player.x + 24, player.y + 12, 6, 6);
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  context.fillStyle = "#8b5a2b";
  context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  context.fillStyle = "#f5d6a0";
  context.fillRect(enemy.x + 6, enemy.y + 12, enemy.width - 12, 12);
  context.fillStyle = "#222";
  context.fillRect(enemy.x + 10, enemy.y + 18, 6, 6);
  context.fillRect(enemy.x + enemy.width - 16, enemy.y + 18, 6, 6);
}

function draw() {
  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  context.translate(-world.cameraX, 0);
  platforms.forEach(drawPlatform);
  enemies.forEach(drawEnemy);
  drawPlayer();
  context.restore();
}

function updateHUD() {
  scoreLabel.textContent = `Puntos: ${world.score}`;
  livesLabel.textContent = `Vidas: ${world.lives}`;
}

function gameLoop() {
  updatePlayer();
  updateEnemies();
  draw();
  updateHUD();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") input.left = true;
  if (event.key === "ArrowRight") input.right = true;
  if (event.key === " ") input.jump = true;
  if (event.key === "Shift") input.run = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") input.left = false;
  if (event.key === "ArrowRight") input.right = false;
  if (event.key === " ") input.jump = false;
  if (event.key === "Shift") input.run = false;
});

jumpButton.addEventListener("touchstart", () => {
  input.jump = true;
});

jumpButton.addEventListener("touchend", () => {
  input.jump = false;
});

jumpButton.addEventListener("mousedown", () => {
  input.jump = true;
});

jumpButton.addEventListener("mouseup", () => {
  input.jump = false;
});

runButton.addEventListener("touchstart", () => {
  input.run = true;
});

runButton.addEventListener("touchend", () => {
  input.run = false;
});

runButton.addEventListener("mousedown", () => {
  input.run = true;
});

runButton.addEventListener("mouseup", () => {
  input.run = false;
});

const joystickBase = document.querySelector(".joystick-base");
joystickBase.addEventListener("touchstart", handleJoystickStart);
joystickBase.addEventListener("touchmove", handleJoystickMove);
joystickBase.addEventListener("touchend", handleJoystickEnd);
joystickBase.addEventListener("mousedown", handleJoystickStart);
joystickBase.addEventListener("mousemove", handleJoystickMove);
joystickBase.addEventListener("mouseup", handleJoystickEnd);
joystickBase.addEventListener("mouseleave", handleJoystickEnd);

requestAnimationFrame(gameLoop);
