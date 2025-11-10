const canvas = document.getElementById("dogbreadFight");
const ctx = canvas.getContext("2d");

// ----------------------
// Setup and Globals
// ----------------------
const width = canvas.width;
const height = canvas.height;

const textBoxHeight = height * 0.3;
const menuHeight = 100;
const statsHeight = 40;
const enemyZoneHeight = height - (textBoxHeight + menuHeight + statsHeight);

let gameStarted = false;
let round = 0;
let inBattle = false;
let fading = 0;
let disableInput = false;

// Player
let player = {
  name: "YOU",
  lvl: 1,
  hp: 20,
  maxHp: 20
};

// UI Elements
const nameScreen = document.getElementById("nameScreen");
const playerNameInput = document.getElementById("playerNameInput");
const startButton = document.getElementById("startButton");

startButton.addEventListener("click", startGame);
playerNameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") startGame();
});

function startGame() {
  const name = playerNameInput.value.trim();
  player.name = name || "YOU";
  nameScreen.style.display = "none";
  canvas.style.display = "block";
  gameStarted = true;
  setDialogue(round);
  requestAnimationFrame(gameLoop);
}

// ----------------------
// Menu and State
// ----------------------
const menuOptions = ["FIGHT", "ACT", "ITEM", "MERCY"];
let selectedIndex = 0;
let menuState = "main";

const actOptions = ["Pet", "Play", "Pun", "Bath"];
let actIndex = 0;
let actsDone = 0;

let itemOptions = [
  { name: "Legendary Loaf", heal: 10, used: false },
  { name: "Legendary Loaf", heal: 10, used: false },
  { name: "Soda", heal: 15, used: false }
];
let itemIndex = 0;

const mercyOptions = ["Spare", "Flee"];
let mercyIndex = 0;

// ----------------------
// Assets
// ----------------------
const soul = new Image();
soul.src = "images/Soul.png";
const soulSize = 20;

const loaf = new Image();
loaf.src = "../images/Dogbread.png";

// ----------------------
// Text and Dialogues
// ----------------------
let message = "";
let displayedText = "";
let textIndex = 0;
let textTimer = 0;

const actDialogues = {
  "Pet": "You pet the loaf, it feels crusty. Loaf loves it.",
  "Bath": "You spray water on Loaf... Nobody likes soggy bread... But it 'Loafs' it.",
  "Play": "You play around with Loaf.",
  "Pun": "You 'break' bread with Loaf."
};

const dialogueLines = [
  "Loaf is walking around aimlessly.",
  "Loaf wags its tail happily!",
  "Loaf seems curious about you.",
  "Loaf starts rolling around.",
  "Loaf looks sleepy now..."
];

function setDialogue(roundIndex) {
  message = dialogueLines[Math.min(roundIndex, dialogueLines.length - 1)];
  displayedText = "";
  textIndex = 0;
  textTimer = 0;
}

// ----------------------
// Heart (SOUL) Movement
// ----------------------
let soulX = width / 2;
let soulY = enemyZoneHeight + textBoxHeight / 2;
const soulSpeed = 3;
let vx = 0, vy = 0;

// ----------------------
// Controls
// ----------------------
document.addEventListener("keydown", e => {
  if (!gameStarted || disableInput) return;

  // --- MAIN MENU ---
  if (menuState === "main") {
    if (e.key === "ArrowLeft") selectedIndex = (selectedIndex + menuOptions.length - 1) % menuOptions.length;
    if (e.key === "ArrowRight") selectedIndex = (selectedIndex + 1) % menuOptions.length;

    if (e.key.toLowerCase() === "z") {
      const current = menuOptions[selectedIndex];
      if (current === "ACT") menuState = "act";
      else if (current === "ITEM") menuState = "item";
      else if (current === "MERCY") menuState = "mercy";
      else if (current === "FIGHT") {
        message = "You attack Loaf! (not really)";
        resetText();
      }
    }
  }

  // --- ACT MENU ---
  else if (menuState === "act") {
    if (e.key === "ArrowLeft") actIndex = (actIndex + actOptions.length - 1) % actOptions.length;
    if (e.key === "ArrowRight") actIndex = (actIndex + 1) % actOptions.length;
    if (e.key.toLowerCase() === "x") menuState = "main";
    if (e.key.toLowerCase() === "z") {
      const chosen = actOptions[actIndex];
      message = actDialogues[chosen];
      actsDone++;
      resetText();
      menuState = "main";
      disableInput = true;
      waitForTextThenBattle();
    }
  }

  // --- ITEM MENU ---
  else if (menuState === "item") {
    if (e.key === "ArrowUp") itemIndex = (itemIndex + itemOptions.length - 1) % itemOptions.length;
    if (e.key === "ArrowDown") itemIndex = (itemIndex + 1) % itemOptions.length;
    if (e.key.toLowerCase() === "x") menuState = "main";
    if (e.key.toLowerCase() === "z") {
      const selectedItem = itemOptions[itemIndex];
      if (selectedItem.used) message = "You already used that.";
      else {
        player.hp = Math.min(player.maxHp, player.hp + selectedItem.heal);
        selectedItem.used = true;
        message = `${player.name} used ${selectedItem.name}! (+${selectedItem.heal} HP)`;
      }
      resetText();
      menuState = "main";
      disableInput = true;
      waitForTextThenBattle();
    }
  }

  // --- MERCY MENU ---
  else if (menuState === "mercy") {
    if (e.key === "ArrowUp" || e.key === "ArrowDown")
      mercyIndex = (mercyIndex + 1) % mercyOptions.length;

    if (e.key.toLowerCase() === "x") menuState = "main";
    if (e.key.toLowerCase() === "z") {
      const selected = mercyOptions[mercyIndex];
      if (selected === "Flee") {
        message = `${player.name} ran away!`;
        resetText();
        disableInput = true;
        setTimeout(() => alert("Combat ended!"), 1000);
      } else if (selected === "Spare") {
        if (actsDone >= 4) {
          message = "You spared Loaf.";
          resetText();
          disableInput = true;
          setTimeout(() => alert("You win!"), 1000);
        } else {
          message = "Loaf isn’t ready to be spared.";
          resetText();
        }
        menuState = "main";
      }
    }
  }
});

// Movement for battle
document.addEventListener("keydown", e => {
  if (menuState !== "battle") return;
  if (e.key === "ArrowLeft") vx = -soulSpeed;
  if (e.key === "ArrowRight") vx = soulSpeed;
  if (e.key === "ArrowUp") vy = -soulSpeed;
  if (e.key === "ArrowDown") vy = soulSpeed;
});
document.addEventListener("keyup", e => {
  if (menuState !== "battle") return;
  if (["ArrowLeft", "ArrowRight"].includes(e.key)) vx = 0;
  if (["ArrowUp", "ArrowDown"].includes(e.key)) vy = 0;
});

function resetText() {
  displayedText = "";
  textIndex = 0;
  textTimer = 0;
}

function waitForTextThenBattle() {
  const interval = setInterval(() => {
    if (displayedText.length === message.length) {
      clearInterval(interval);
      fadeOutDialogue(() => startBattlePhase());
    }
  }, 100);
}

function fadeOutDialogue(callback) {
  const fadeInterval = setInterval(() => {
    fading += 0.05;
    if (fading >= 1) {
      clearInterval(fadeInterval);
      callback();
    }
  }, 30);
}
function fadeInDialogue() {
  const fadeInterval = setInterval(() => {
    fading -= 0.05;
    if (fading <= 0) clearInterval(fadeInterval);
  }, 30);
}

// ----------------------
// ATTACK SYSTEM (Enhanced)
// ----------------------
const pelletImg = new Image();
pelletImg.src = "images/attacks/Breadpellet.png";

let pellets = [];
let pelletTimer = 0;
let pelletSpawnInterval = 500;
let pelletRotationSpeed = 0.05; // radians per frame

function startBattlePhase() {
  menuState = "battle";
  inBattle = true;
  vx = vy = 0;
  soulX = width / 2;
  soulY = enemyZoneHeight + textBoxHeight / 2;

  startPelletAttack();

  setTimeout(() => {
    stopAllAttacks();
    inBattle = false;
    fadeInDialogue();
    menuState = "main";
    disableInput = false;
  }, 15000);
}

function startPelletAttack() {
  pellets = [];
  pelletTimer = 0;
}

function stopAllAttacks() {
  pellets = [];
}

// Enhanced pellet update
function updatePellets(delta) {
  pelletTimer += delta;
  if (pelletTimer > pelletSpawnInterval) {
    spawnPellet();
    pelletTimer = 0;
  }

  pellets.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += pelletRotationSpeed;

    // Collision with SOUL
    const dx = p.x - soulX;
    const dy = p.y - soulY;
    const dist = Math.hypot(dx, dy);
    if (dist < p.size / 2 + soulSize / 2) {
      player.hp = Math.max(0, player.hp - 1);
      p.hit = true;
    }
  });

  const arenaX = width / 2 - 50;
  const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
  pellets = pellets.filter(p =>
    !p.hit &&
    p.x > arenaX - 20 &&
    p.x < arenaX + 120 &&
    p.y > arenaY - 20 &&
    p.y < arenaY + 120
  );
}

function spawnPellet() {
  const arenaX = width / 2 - 50;
  const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = arenaX + Math.random() * 100; y = arenaY - 10; }
  else if (side === 1) { x = arenaX + Math.random() * 100; y = arenaY + 110; }
  else if (side === 2) { x = arenaX - 10; y = arenaY + Math.random() * 100; }
  else { x = arenaX + 110; y = arenaY + Math.random() * 100; }

  const dx = soulX - x, dy = soulY - y;
  const len = Math.hypot(dx, dy);
  const speed = 1.8;
  pellets.push({
    x, y,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    size: 12,
    rotation: Math.random() * Math.PI * 2
  });
}

function drawPellets() {
  pellets.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.drawImage(pelletImg, -p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });
}

// ----------------------
// Update + Draw
// ----------------------
function update(delta) {
  textTimer += delta;
  if (textTimer > 50 && textIndex < message.length) {
    displayedText += message[textIndex++];
    textTimer = 0;
  }

  if (menuState === "battle") {
    soulX += vx;
    soulY += vy;

    const arenaX = width / 2 - 50;
    const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
    const arenaW = 100, arenaH = 100;

    soulX = Math.max(arenaX + soulSize / 2, Math.min(soulX, arenaX + arenaW - soulSize / 2));
    soulY = Math.max(arenaY + soulSize / 2, Math.min(soulY, arenaY + arenaH - soulSize / 2));

    updatePellets(delta);
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, enemyZoneHeight);
  ctx.drawImage(loaf, width / 2 - 64, 50, 128, 128);

  // Dialogue
  if (fading < 1 && menuState !== "battle") {
    ctx.globalAlpha = 1 - fading;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, enemyZoneHeight + 10, width - 60, textBoxHeight - 20);
    ctx.font = "20px DeterminationSansWeb";
    ctx.fillStyle = "white";
    wrapText(displayedText, 50, enemyZoneHeight + 50, width - 100, 24);
    ctx.globalAlpha = 1;
  }

  // Battle arena
  if (menuState === "battle") {
    const arenaX = width / 2 - 50;
    const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
    ctx.strokeStyle = "white";
    ctx.strokeRect(arenaX, arenaY, 100, 100);

    drawPellets();
    ctx.drawImage(soul, soulX - soulSize / 2, soulY - soulSize / 2, soulSize, soulSize);
  }

  drawStats();
  drawMenus();
}

// ----------------------
// UI Draw helpers
// ----------------------
function drawStats() {
  const statsY = height - menuHeight - statsHeight;
  ctx.font = "20px DeterminationSansWeb";
  ctx.fillStyle = "white";
  ctx.fillText(`${player.name}  LV ${player.lvl}`, 30, statsY + 25);

  const barX = 200, barY = statsY + 10, barWidth = 200;
  const hpWidth = (player.hp / player.maxHp) * barWidth;
  ctx.fillStyle = "red";
  ctx.fillRect(barX, barY, barWidth, 15);
  ctx.fillStyle = "yellow";
  ctx.fillRect(barX, barY, hpWidth, 15);
  ctx.strokeStyle = "white";
  ctx.strokeRect(barX, barY, barWidth, 15);
  ctx.fillStyle = "white";
  ctx.fillText(`${player.hp}/${player.maxHp}`, barX + 210, barY + 15);
}

function drawMenus() {
  if (menuState === "main") drawMainMenu();
  else if (menuState === "act") drawActMenu();
  else if (menuState === "item") drawItemMenu();
  else if (menuState === "mercy") drawMercyMenu();
}

function drawMainMenu() {
  const menuY = height - menuHeight + 20;
  const optionWidth = width / 4;
  menuOptions.forEach((opt, i) => {
    const x = i * optionWidth;
    const isSelected = i === selectedIndex;
    ctx.strokeStyle = isSelected ? "yellow" : "white";
    ctx.strokeRect(x + 20, menuY, optionWidth - 40, 50);
    ctx.fillStyle = isSelected ? "yellow" : "white";
    ctx.textAlign = "center";
    ctx.fillText(opt, x + optionWidth / 2, menuY + 32);
    if (isSelected)
      ctx.drawImage(soul, x + optionWidth / 2 - 60, menuY + 10, soulSize, soulSize);
  });
}

function drawActMenu() {
  const startX = width / 2 - 180, startY = enemyZoneHeight + 50, spacing = 180;
  actOptions.forEach((opt, i) => {
    const x = startX + (i % 2) * spacing, y = startY + Math.floor(i / 2) * 50;
    ctx.textAlign = "center";
    ctx.fillStyle = i === actIndex ? "yellow" : "white";
    ctx.fillText(opt, x + 80, y + 25);
    if (i === actIndex) ctx.drawImage(soul, x + 10, y + 10, soulSize, soulSize);
  });
}

function drawItemMenu() {
  const startX = width / 2 - 100, startY = enemyZoneHeight + 50;
  itemOptions.forEach((item, i) => {
    ctx.textAlign = "center";
    ctx.fillStyle = i === itemIndex ? "yellow" : item.used ? "gray" : "white";
    ctx.fillText(item.name, startX + 100, startY + i * 40);
    if (i === itemIndex) ctx.drawImage(soul, startX + 20, startY - 10 + i * 40, soulSize, soulSize);
  });
}

function drawMercyMenu() {
  const startX = width / 2 - 60, startY = enemyZoneHeight + 50;
  const flash = Math.sin(performance.now() / 200) > 0 ? "gold" : "white";
  mercyOptions.forEach((opt, i) => {
    let color = (i === mercyIndex) ? "yellow" : "white";
    if (opt === "Spare") color = actsDone < 4 ? "gray" : flash;
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText(opt, startX + 60, startY + i * 40);
    if (i === mercyIndex) ctx.drawImage(soul, startX + 10, startY - 10 + i * 40, soulSize, soulSize);
  });
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else line = testLine;
  }
  ctx.fillText(line, x, y);
}

// ----------------------
// Game Loop
// ----------------------
let lastTime = 0;
function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}
