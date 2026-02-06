const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false;
const scoreLabel = document.getElementById("score");
const livesLabel = document.getElementById("lives");
const joystick = document.getElementById("joystick");
const jumpButton = document.getElementById("jump");
const runButton = document.getElementById("run");

const TILE_SIZE = 32;

const spriteSources = {
  mario: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
      <rect width="32" height="32" fill="none" />
      <rect x="6" y="2" width="20" height="6" fill="#c5391b" />
      <rect x="8" y="8" width="16" height="6" fill="#f5cfa0" />
      <rect x="6" y="14" width="20" height="6" fill="#c5391b" />
      <rect x="6" y="20" width="8" height="8" fill="#1f5da8" />
      <rect x="18" y="20" width="8" height="8" fill="#1f5da8" />
      <rect x="10" y="20" width="12" height="10" fill="#3b2a1a" />
      <rect x="8" y="26" width="16" height="4" fill="#f5cfa0" />
      <rect x="12" y="10" width="4" height="4" fill="#1b1b1b" />
      <rect x="18" y="10" width="4" height="4" fill="#1b1b1b" />
    </svg>
  `,
  goomba: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
      <rect width="32" height="32" fill="none" />
      <rect x="4" y="8" width="24" height="16" fill="#8b5a2b" />
      <rect x="6" y="22" width="20" height="6" fill="#d6b38c" />
      <rect x="8" y="14" width="6" height="6" fill="#1b1b1b" />
      <rect x="18" y="14" width="6" height="6" fill="#1b1b1b" />
      <rect x="10" y="16" width="2" height="2" fill="#ffffff" />
      <rect x="20" y="16" width="2" height="2" fill="#ffffff" />
    </svg>
  `,
  ground: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
      <rect width="32" height="32" fill="#7a4b1e" />
      <rect y="0" width="32" height="10" fill="#5fc44d" />
      <rect y="10" width="32" height="4" fill="#4aa23a" />
      <rect x="4" y="14" width="8" height="6" fill="#8f5a2a" />
      <rect x="18" y="18" width="10" height="6" fill="#8f5a2a" />
    </svg>
  `,
  brick: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
      <rect width="32" height="32" fill="#c97b2d" />
      <rect y="8" width="32" height="2" fill="#9b5a1a" />
      <rect y="16" width="32" height="2" fill="#9b5a1a" />
      <rect y="24" width="32" height="2" fill="#9b5a1a" />
      <rect x="8" y="0" width="2" height="8" fill="#9b5a1a" />
      <rect x="20" y="8" width="2" height="8" fill="#9b5a1a" />
      <rect x="12" y="16" width="2" height="8" fill="#9b5a1a" />
      <rect x="24" y="24" width="2" height="8" fill="#9b5a1a" />
    </svg>
  `,
  question: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
      <rect width="32" height="32" fill="#f4b400" />
      <rect x="2" y="2" width="28" height="28" fill="none" stroke="#c98b00" stroke-width="4" />
      <path d="M10 12h12v4h-4v4h-4v-4h-4z" fill="#ffffff" />
      <rect x="14" y="22" width="4" height="4" fill="#ffffff" />
    </svg>
  `,
  used: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
      <rect width="32" height="32" fill="#b47b3d" />
      <rect x="2" y="2" width="28" height="28" fill="none" stroke="#8a5a24" stroke-width="4" />
    </svg>
  `,
  coin: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" shape-rendering="crispEdges">
      <rect width="16" height="16" fill="none" />
      <circle cx="8" cy="8" r="6" fill="#f7d447" stroke="#c98b00" stroke-width="2" />
    </svg>
  `,
  bubble: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <circle cx="8" cy="8" r="6" fill="rgba(120,200,255,0.6)" stroke="#9cd7ff" stroke-width="2" />
      <circle cx="6" cy="6" r="2" fill="rgba(255,255,255,0.8)" />
    </svg>
  `,
  castle: `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" shape-rendering="crispEdges">
      <rect width="128" height="128" fill="none" />
      <rect x="16" y="28" width="96" height="84" fill="#d9d2c5" stroke="#8c7b6a" stroke-width="4" />
      <rect x="10" y="20" width="20" height="16" fill="#d9d2c5" stroke="#8c7b6a" stroke-width="4" />
      <rect x="98" y="20" width="20" height="16" fill="#d9d2c5" stroke="#8c7b6a" stroke-width="4" />
      <rect x="50" y="50" width="28" height="62" fill="#b35a2a" />
      <rect x="28" y="44" width="16" height="16" fill="#4f6b8b" />
      <rect x="84" y="44" width="16" height="16" fill="#4f6b8b" />
      <rect x="60" y="16" width="8" height="12" fill="#c5391b" />
    </svg>
  `,
};

function makeSvgDataUri(svg) {
  const trimmed = svg.trim().replace(/\s+/g, " ");
  return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
}

const sprites = Object.fromEntries(
  Object.entries(spriteSources).map(([key, svg]) => {
    const image = new Image();
    image.src = makeSvgDataUri(svg);
    return [key, image];
  })
);

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

const boxes = [
  { x: 220, y: 300, width: 36, height: 36, type: "coin", hit: false },
  { x: 270, y: 300, width: 36, height: 36, type: "coin", hit: false },
  { x: 320, y: 300, width: 36, height: 36, type: "bubble", hit: false },
  { x: 370, y: 300, width: 36, height: 36, type: "coin", hit: false },
];

const castle = {
  x: 2800,
  y: 260,
  width: 160,
  height: 180,
};

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

  boxes.forEach((box) => {
    if (!isColliding(player, box)) return;

    if (player.velocityY > 0 && player.y + player.height - player.velocityY <= box.y) {
      player.y = box.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
    } else if (player.velocityY < 0 && player.y - player.velocityY >= box.y + box.height) {
      player.y = box.y + box.height;
      player.velocityY = 1;
      if (!box.hit) {
        box.hit = true;
        if (box.type === "coin") {
          world.score += 50;
        }
      }
    } else if (player.velocityX > 0 && player.x + player.width - player.velocityX <= box.x) {
      player.x = box.x - player.width;
      player.velocityX = 0;
    } else if (player.velocityX < 0 && player.x - player.velocityX >= box.x + box.width) {
      player.x = box.x + box.width;
      player.velocityX = 0;
    }
  });

  if (player.y > canvas.height) {
    world.lives = Math.max(0, world.lives - 1);
    respawn();
  }

  world.cameraX = clamp(player.x - canvas.width * 0.4, 0, 2200);
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
  context.fillStyle = "#b3e5ff";
  context.fillRect(0, 0, canvas.width, 120);
}

function drawPlatform(platform) {
  const sprite = platform.height > 40 ? sprites.ground : sprites.brick;
  drawTiledSprite(sprite, platform.x, platform.y, platform.width, platform.height);
}

function drawPlayer() {
  if (sprites.mario.complete) {
    context.drawImage(sprites.mario, player.x, player.y, player.width, player.height);
  } else {
    context.fillStyle = "#ff3b30";
    context.fillRect(player.x, player.y, player.width, player.height);
  }
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  if (sprites.goomba.complete) {
    context.drawImage(sprites.goomba, enemy.x, enemy.y, enemy.width, enemy.height);
  } else {
    context.fillStyle = "#8b5a2b";
    context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

function drawBox(box) {
  const sprite = box.hit ? sprites.used : sprites.question;
  if (sprite.complete) {
    context.drawImage(sprite, box.x, box.y, box.width, box.height);
  } else {
    context.fillStyle = "#f4b400";
    context.fillRect(box.x, box.y, box.width, box.height);
  }

  const overlay = box.type === "coin" ? sprites.coin : sprites.bubble;
  if (!box.hit && overlay.complete) {
    const size = 16;
    const offsetX = box.x + (box.width - size) / 2;
    const offsetY = box.y + (box.height - size) / 2;
    context.drawImage(overlay, offsetX, offsetY, size, size);
  }
}

function drawCastle() {
  if (sprites.castle.complete) {
    context.drawImage(sprites.castle, castle.x, castle.y, castle.width, castle.height);
  } else {
    context.fillStyle = "#d9d2c5";
    context.fillRect(castle.x, castle.y, castle.width, castle.height);
  }
}

function drawTiledSprite(sprite, x, y, width, height) {
  if (!sprite.complete) {
    context.fillStyle = "#c68642";
    context.fillRect(x, y, width, height);
    return;
  }

  for (let tileX = 0; tileX < width; tileX += TILE_SIZE) {
    for (let tileY = 0; tileY < height; tileY += TILE_SIZE) {
      const drawWidth = Math.min(TILE_SIZE, width - tileX);
      const drawHeight = Math.min(TILE_SIZE, height - tileY);
      context.drawImage(
        sprite,
        0,
        0,
        TILE_SIZE,
        TILE_SIZE,
        x + tileX,
        y + tileY,
        drawWidth,
        drawHeight
      );
    }
  }
}

function draw() {
  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  context.translate(-world.cameraX, 0);
  platforms.forEach(drawPlatform);
  boxes.forEach(drawBox);
  drawCastle();
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
