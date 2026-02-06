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
  shootCooldown: 0,
  gameOver: false,
  win: false,
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
  hasBubblePower: false,
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
  { x: 2100, y: 460, width: 520, height: 80 },
  { x: 2440, y: 360, width: 200, height: 18 },
  { x: 2700, y: 460, width: 520, height: 80 },
];

const enemies = [
  { x: 520, y: 428, width: 36, height: 32, velocityX: -1.2, alive: true, kind: "goomba" },
  { x: 980, y: 418, width: 38, height: 34, velocityX: 1.1, alive: true, kind: "koopa" },
  {
    x: 1500,
    y: 300,
    width: 40,
    height: 36,
    velocityX: -1,
    alive: true,
    kind: "koopa-fly",
    baseY: 300,
    flapOffset: 0,
  },
  { x: 1980, y: 420, width: 36, height: 32, velocityX: 1.4, alive: true, kind: "goomba" },
];

const blocks = [
  { x: 260, y: 300, width: 42, height: 42, type: "coin", used: false },
  { x: 312, y: 300, width: 42, height: 42, type: "coin", used: false },
  { x: 364, y: 300, width: 42, height: 42, type: "bubble", used: false },
];

const bubbles = [];

const goal = {
  x: 2960,
  y: 200,
  width: 140,
  height: 260,
};

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
  const moveSpeed = player.speed;
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

  const previousY = player.y;
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
      }
    }
  });

  blocks.forEach((block) => {
    if (block.used) return;
    if (!isColliding(player, block)) return;
    const hitFromBelow = player.velocityY < 0 && previousY >= block.y + block.height;
    if (!hitFromBelow) return;
    player.y = block.y + block.height;
    player.velocityY = 1;
    block.used = true;
    if (block.type === "coin") {
      world.score += 50;
    }
    if (block.type === "bubble") {
      player.hasBubblePower = true;
      world.score += 150;
    }
  });

  if (player.y > canvas.height) {
    loseLife();
  }

  if (input.run) {
    tryShootBubble();
  }

  if (player.x + player.width >= goal.x + 40) {
    world.win = true;
    world.gameOver = true;
  }

  world.cameraX = clamp(player.x - canvas.width * 0.4, 0, goal.x - 320);
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    if (enemy.bubbled) {
      enemy.y -= 1.4;
      if (enemy.y + enemy.height < 0) {
        enemy.alive = false;
      }
      return;
    }

    if (enemy.kind === "koopa-fly") {
      enemy.flapOffset += 0.08;
      enemy.y = enemy.baseY + Math.sin(enemy.flapOffset) * 18;
      enemy.x += enemy.velocityX;
    } else {
      enemy.x += enemy.velocityX;
    }
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
        loseLife();
      }
    }
  });
}

function tryShootBubble() {
  if (!player.hasBubblePower || world.shootCooldown > 0 || world.gameOver) return;
  const direction = input.left ? -1 : 1;
  bubbles.push({
    x: player.x + player.width / 2,
    y: player.y + 18,
    radius: 10,
    velocityX: 5 * direction,
    velocityY: -0.4,
  });
  world.shootCooldown = 24;
}

function updateBubbles() {
  if (world.shootCooldown > 0) {
    world.shootCooldown -= 1;
  }
  bubbles.forEach((bubble) => {
    bubble.x += bubble.velocityX;
    bubble.y += bubble.velocityY;
  });
  for (let i = bubbles.length - 1; i >= 0; i -= 1) {
    const bubble = bubbles[i];
    if (bubble.x < -40 || bubble.x > goal.x + 400 || bubble.y < -40) {
      bubbles.splice(i, 1);
      continue;
    }
    enemies.forEach((enemy) => {
      if (!enemy.alive || enemy.bubbled) return;
      const bubbleRect = {
        x: bubble.x - bubble.radius,
        y: bubble.y - bubble.radius,
        width: bubble.radius * 2,
        height: bubble.radius * 2,
      };
      if (isColliding(bubbleRect, enemy)) {
        enemy.bubbled = true;
        world.score += 120;
        bubbles.splice(i, 1);
      }
    });
  }
}

function respawn() {
  player.x = 120;
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  world.cameraX = 0;
}

function loseLife() {
  world.lives = Math.max(0, world.lives - 1);
  if (world.lives === 0) {
    world.gameOver = true;
    return;
  }
  respawn();
}

function drawBackground() {
  const skyGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#6ec9ff");
  skyGradient.addColorStop(0.55, "#c4f0ff");
  skyGradient.addColorStop(0.56, "#f6d288");
  skyGradient.addColorStop(1, "#f3c46f");
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.7)";
  context.beginPath();
  context.arc(140, 100, 38, 0, Math.PI * 2);
  context.arc(190, 100, 48, 0, Math.PI * 2);
  context.arc(240, 100, 36, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#6dbb4f";
  context.fillRect(0, 420, canvas.width, 140);
  context.fillStyle = "#4f8a39";
  for (let i = 0; i < canvas.width; i += 24) {
    context.fillRect(i, 420, 12, 140);
  }
}

function drawPlatform(platform) {
  const plankGradient = context.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
  plankGradient.addColorStop(0, "#d59b4b");
  plankGradient.addColorStop(1, "#8b5c2b");
  context.fillStyle = plankGradient;
  context.fillRect(platform.x, platform.y, platform.width, platform.height);
  context.fillStyle = "#6b3b17";
  context.fillRect(platform.x, platform.y, platform.width, 6);
  context.fillStyle = "rgba(255,255,255,0.2)";
  for (let i = platform.x + 8; i < platform.x + platform.width; i += 28) {
    context.fillRect(i, platform.y + 10, 12, platform.height - 16);
  }
}

function drawBlock(block) {
  context.fillStyle = block.used ? "#b45b2d" : "#f5c542";
  context.fillRect(block.x, block.y, block.width, block.height);
  context.strokeStyle = "#8a4f2b";
  context.lineWidth = 3;
  context.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
  if (!block.used) {
    context.fillStyle = "#fff2b8";
    context.fillRect(block.x + 12, block.y + 12, block.width - 24, block.height - 24);
  }
}

function drawGoal() {
  context.fillStyle = "#d2d7e0";
  context.fillRect(goal.x + 40, goal.y, 18, goal.height);
  context.fillStyle = "#9aa2b1";
  context.fillRect(goal.x + 44, goal.y, 10, goal.height);
  context.fillStyle = "#e8e6f2";
  context.fillRect(goal.x, goal.y + 120, 120, 120);
  context.fillStyle = "#c2b7e5";
  context.fillRect(goal.x + 20, goal.y + 150, 28, 50);
  context.fillRect(goal.x + 70, goal.y + 150, 28, 50);
  context.fillStyle = "#6a5acd";
  context.beginPath();
  context.moveTo(goal.x + 58, goal.y + 20);
  context.lineTo(goal.x + 120, goal.y + 50);
  context.lineTo(goal.x + 58, goal.y + 80);
  context.closePath();
  context.fill();
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
  if (player.hasBubblePower) {
    context.fillStyle = "rgba(180,220,255,0.8)";
    context.beginPath();
    context.arc(player.x + player.width / 2, player.y + 10, 8, 0, Math.PI * 2);
    context.fill();
  }
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  if (enemy.bubbled) {
    context.fillStyle = "rgba(180,220,255,0.6)";
    context.beginPath();
    context.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width * 0.8, 0, Math.PI * 2);
    context.fill();
  }
  if (enemy.kind === "goomba") {
    context.fillStyle = "#8b5a2b";
    context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    context.fillStyle = "#f5d6a0";
    context.fillRect(enemy.x + 4, enemy.y + 12, enemy.width - 8, 12);
    context.fillStyle = "#222";
    context.fillRect(enemy.x + 8, enemy.y + 18, 6, 6);
    context.fillRect(enemy.x + enemy.width - 14, enemy.y + 18, 6, 6);
  } else if (enemy.kind === "koopa" || enemy.kind === "koopa-fly") {
    context.fillStyle = "#5cb85c";
    context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    context.fillStyle = "#2e7d32";
    context.fillRect(enemy.x + 6, enemy.y + 10, enemy.width - 12, enemy.height - 14);
    context.fillStyle = "#f5d6a0";
    context.fillRect(enemy.x + 8, enemy.y + 2, enemy.width - 16, 10);
    if (enemy.kind === "koopa-fly") {
      context.fillStyle = "rgba(255,255,255,0.8)";
      context.beginPath();
      context.ellipse(enemy.x - 6, enemy.y + 8, 10, 6, 0, 0, Math.PI * 2);
      context.ellipse(enemy.x + enemy.width + 6, enemy.y + 8, 10, 6, 0, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawBubbles() {
  bubbles.forEach((bubble) => {
    context.fillStyle = "rgba(180,220,255,0.6)";
    context.beginPath();
    context.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.7)";
    context.stroke();
  });
}

function draw() {
  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  context.translate(-world.cameraX, 0);
  platforms.forEach(drawPlatform);
  blocks.forEach(drawBlock);
  enemies.forEach(drawEnemy);
  drawBubbles();
  drawPlayer();
  drawGoal();
  context.restore();

  if (world.gameOver) {
    context.fillStyle = "rgba(0,0,0,0.55)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.font = "bold 36px Trebuchet MS";
    context.textAlign = "center";
    context.fillText(world.win ? "¡Ganaste! Castillo conquistado." : "Game Over", canvas.width / 2, canvas.height / 2);
  }
}

function updateHUD() {
  scoreLabel.textContent = `Puntos: ${world.score}`;
  livesLabel.textContent = `Vidas: ${world.lives}`;
}

function gameLoop() {
  if (!world.gameOver) {
    updatePlayer();
    updateEnemies();
    updateBubbles();
  }
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
