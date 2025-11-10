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

// attack assets
const pelletImg = new Image();
pelletImg.src = "images/attacks/breadpellet.png";

const croissantImg = new Image();
croissantImg.src = "images/attacks/croissant.png";

const bigBreadImg = new Image();
bigBreadImg.src = "images/attacks/big_bread.png";

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
      if (current === "ACT") {
        menuState = "act";
      } else if (current === "ITEM") {
        menuState = "item";
      } else if (current === "MERCY") {
        menuState = "mercy";
      } else if (current === "FIGHT") {
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
        if (actsDone >= 4 && !endState) {
          message = "You spared Loaf.";
          resetText();
          disableInput = true;
          setTimeout(() => triggerEnd("spare"), 1000);
        } else {
          message = "Loaf isn’t ready to be spared.";
          resetText();
        }
        menuState = "main";
      }
    }
  }
});

// Movement for battle (soul)
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
// Attack System
// ----------------------
let pellets = [];
let pelletTimer = 0;
let pelletSpawnInterval = 500;
let pelletRotationSpeed = 0.05;

let croissants = [];
let croissantSpeed = 0.015;

let comboActive = false;
let bigBread = null;

let activeAttack = null; // "pellet" | "croissant" | "combo"
let loafDamage = 0;

// ----------------------
// End Screens Integration
// ----------------------
let endState = null; // "lose" | "spare" | "kill"
let fadeBlack = 0;
let showEndButtons = false;

function triggerEnd(state) {
  endState = state;
  fadeBlack = 0;
  disableInput = true;
  showEndButtons = false;
  setTimeout(() => {
    showEndButtons = true;
  }, 1000);
}

function resetGame() {
  player.hp = player.maxHp;
  actsDone = 0;
  loafDamage = 0;
  menuState = "main";
  activeAttack = null;
  inBattle = false;
  endState = null;
  fadeBlack = 0;
  showEndButtons = false;
  disableInput = false;
  setDialogue(0);
}

// ----------------------
// Start Battle Phase
// ----------------------
function startBattlePhase() {
  menuState = "battle";
  inBattle = true;
  vx = vy = 0;
  soulX = width / 2;
  soulY = enemyZoneHeight + textBoxHeight / 2;
  disableInput = true;

  if (loafDamage >= 50 || actsDone >= 3) {
    activeAttack = "combo";
    startComboAttack();
  } else {
    activeAttack = Math.random() < 0.5 ? "pellet" : "croissant";
    if (activeAttack === "pellet") startPelletAttack();
    else startCroissantAttack();
  }

  setTimeout(() => {
    stopAllAttacks();
    inBattle = false;
    fadeInDialogue();
    menuState = "main";
    disableInput = false;
  }, 12000);
}

// ----------------------
// Pellets
// ----------------------
function startPelletAttack() {
  pellets = [];
  pelletTimer = 0;
}

function updatePellets(delta) {
  pelletTimer += delta;
  if (pelletTimer > 500) {
    spawnPellet();
    pelletTimer = 0;
  }
  pellets.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += 0.08;
    const dx = p.x - soulX;
    const dy = p.y - soulY;
    if (Math.hypot(dx, dy) < (p.size / 2 + soulSize / 2)) {
      player.hp = Math.max(0, player.hp - 3);
      p.hit = true;
    }
  });
  const arenaX = width / 2 - 50;
  const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
  pellets = pellets.filter(p =>
    !p.hit &&
    p.x > arenaX - 300 &&
    p.x < arenaX + 400 &&
    p.y > arenaY - 300 &&
    p.y < arenaY + 400
  );
}

function spawnPellet() {
  const arenaX = width / 2 - 50;
  const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const offset = 250;
  if (side === 0) { x = arenaX + Math.random() * 100; y = arenaY - offset; }
  else if (side === 1) { x = arenaX + Math.random() * 100; y = arenaY + 100 + offset; }
  else if (side === 2) { x = arenaX - offset; y = arenaY + Math.random() * 100; }
  else { x = arenaX + 100 + offset; y = arenaY + Math.random() * 100; }

  const dx = soulX - x, dy = soulY - y;
  let len = Math.hypot(dx, dy);
  if (len === 0) len = 0.001;
  const speed = 1.1;
  pellets.push({ x, y, vx: (dx / len) * speed, vy: (dy / len) * speed, size: 14, rotation: Math.random()*Math.PI*2, hit: false });
}

function drawPellets() {
  pellets.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.drawImage(pelletImg, -p.size/2, -p.size/2, p.size, p.size);
    ctx.restore();
  });
}

// ----------------------
// Croissants
// ----------------------
function startCroissantAttack() {
  croissants = [];
  const centerY = enemyZoneHeight + textBoxHeight / 2 + 20;
  croissants.push({ x: -80, y: centerY, vx: 2.2, rotation:0, dir:1, returning:false });
  croissants.push({ x: width + 80, y: centerY, vx: -2.2, rotation:0, dir:-1, returning:false });
}

function updateCroissants(delta) {
  croissants.forEach(c => {
    c.x += c.vx;
    c.rotation += 0.15*c.dir;
    if (!c.returning && ((c.dir===1 && c.x>width/2+60) || (c.dir===-1 && c.x<width/2-60))) {
      c.returning = true;
      c.vx *= -1.05;
    }
    const dx = c.x - soulX, dy = c.y - soulY;
    if (Math.hypot(dx, dy) < 28 + soulSize/2) player.hp = Math.max(0, player.hp - 1);
  });
  croissants = croissants.filter(c => c.x>-200 && c.x<width+200);
}

function drawCroissants() {
  croissants.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);
    ctx.drawImage(croissantImg, -35, -20, 70, 40);
    ctx.restore();
  });
}

// ----------------------
// Combo Attack
// ----------------------
function startComboAttack() {
  comboActive = true;
  bigBread = { x: width/2, y: -250, targetY: enemyZoneHeight+textBoxHeight/2-220, speed:0.4, width:200, height:200 };
  startCroissantAttack();
}

function updateComboAttack(delta) {
  if (bigBread && bigBread.y < bigBread.targetY) {
    bigBread.y += bigBread.speed;
    if (bigBread.y>bigBread.targetY) bigBread.y = bigBread.targetY;
  }
  updateCroissants(delta);
}

function drawComboAttack() {
  if (bigBread) {
    ctx.save();
    const wobble = Math.sin(Date.now()/250)*3;
    ctx.translate(bigBread.x, bigBread.y + wobble);
    ctx.drawImage(bigBreadImg, -bigBread.width/2, 0, bigBread.width, bigBread.height);
    ctx.restore();
  }
  drawCroissants();
}

// ----------------------
// Helpers
// ----------------------
function stopAllAttacks() { pellets=[]; croissants=[]; bigBread=null; comboActive=false; activeAttack=null; }

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

// ----------------------
// Update Function
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
    const arenaX = width/2-50, arenaY = enemyZoneHeight+textBoxHeight/2-50;
    soulX = Math.max(arenaX+soulSize/2, Math.min(soulX, arenaX+100-soulSize/2));
    soulY = Math.max(arenaY+soulSize/2, Math.min(soulY, arenaY+100-soulSize/2));

    if (activeAttack==="pellet") updatePellets(delta);
    else if (activeAttack==="croissant") updateCroissants(delta);
    else if (activeAttack==="combo") updateComboAttack(delta);
  }

  // Check end conditions
  if (player.hp<=0 && !endState) triggerEnd("lose");
  if (loafDamage>=100 && !endState) setTimeout(()=>triggerEnd("kill"),1200);
  if (menuState==="mercy" && mercyOptions[mercyIndex]==="Spare" && actsDone>=4 && !endState)
    setTimeout(()=>triggerEnd("spare"),1200);
}

// ----------------------
// Draw Function (including end screens)
// ----------------------
function draw() {
  ctx.clearRect(0,0,width,height);

  // Background
  ctx.fillStyle="black";
  ctx.fillRect(0,0,width, height);

  // Enemy Zone
  ctx.fillStyle="#444";
  ctx.fillRect(0,0,width,enemyZoneHeight);

  // Battle projectiles
  if (activeAttack==="pellet") drawPellets();
  else if (activeAttack==="croissant") drawCroissants();
  else if (activeAttack==="combo") drawComboAttack();

  // Draw soul
  ctx.drawImage(soul, soulX-soulSize/2, soulY-soulSize/2, soulSize, soulSize);

  // Text box
  ctx.fillStyle="#222";
  ctx.fillRect(0,enemyZoneHeight,width,textBoxHeight);
  ctx.fillStyle="white";
  ctx.font="24px DeterminationSansWeb";
  ctx.fillText(displayedText, 20, enemyZoneHeight+30);

  // Player stats
  ctx.fillStyle="#111";
  ctx.fillRect(0,enemyZoneHeight+textBoxHeight,width,statsHeight);
  ctx.fillStyle="white";
  ctx.font="20px DeterminationSansWeb";
  ctx.fillText(`${player.name} HP: ${player.hp}/${player.maxHp}`, 20, enemyZoneHeight+textBoxHeight+25);

  // Menu
  if (menuState==="main") {
    ctx.font="20px DeterminationSansWeb";
    menuOptions.forEach((opt,i)=>{
      ctx.fillStyle=(i===selectedIndex)?"yellow":"white";
      ctx.fillText(opt, width/2-100+i*100, height-50);
    });
  } else if (menuState==="act") {
    ctx.font="20px DeterminationSansWeb";
    actOptions.forEach((opt,i)=>{
      ctx.fillStyle=(i===actIndex)?"yellow":"white";
      ctx.fillText(opt, width/2-100+i*100, height-50);
    });
  } else if (menuState==="item") {
    ctx.font="20px DeterminationSansWeb";
    itemOptions.forEach((opt,i)=>{
      ctx.fillStyle=(i===itemIndex)?"yellow":"white";
      ctx.fillText(opt.name, width/2-100+i*100, height-50);
    });
  } else if (menuState==="mercy") {
    ctx.font="20px DeterminationSansWeb";
    mercyOptions.forEach((opt,i)=>{
      ctx.fillStyle=(i===mercyIndex)?"yellow":"white";
      ctx.fillText(opt, width/2-100+i*100, height-50);
    });
  }

  // End screens
  if (endState) {
    fadeBlack=Math.min(fadeBlack+0.02,1);
    ctx.fillStyle=`rgba(0,0,0,${fadeBlack})`;
    ctx.fillRect(0,0,width,height);

    if (fadeBlack>=1){
      ctx.fillStyle="white";
      ctx.font="48px DeterminationSansWeb";
      ctx.textAlign="center";
      let msg="";
      if (endState==="lose") msg="GAME OVER";
      else if (endState==="spare") msg="LOAF FRIENDSHIP!";
      else if (endState==="kill") msg="The mutt ran away... dammit.";
      ctx.fillText(msg,width/2,height/2-50);

      if (showEndButtons){
        ctx.font="32px DeterminationSansWeb";
        const retryX=width/2-100, menuX=width/2+100, btnY=height/2+30;
        const btnW=140, btnH=50;
        ctx.strokeStyle="white"; ctx.lineWidth=2;

        ctx.strokeRect(retryX-btnW/2,btnY-btnH/2,btnW,btnH);
        ctx.fillText("Retry", retryX, btnY+10);
        ctx.strokeRect(menuX-btnW/2,btnY-btnH/2,btnW,btnH);
        ctx.fillText("Menu", menuX, btnY+10);
      }
    }
  }
}

// ----------------------
// Mouse Click for End Screens
// ----------------------
canvas.addEventListener("click", e=>{
  if (!showEndButtons) return;
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left;
  const my=e.clientY-rect.top;

  const btnW=140, btnH=50;
  const retryX=width/2-100, menuX=width/2+100, btnY=height/2+30;

  if (mx>retryX-btnW/2 && mx<retryX+btnW/2 && my>btnY-btnH/2 && my<btnY+btnH/2)
    resetGame();

  if (mx>menuX-btnW/2 && mx<menuX+btnW/2 && my>btnY-btnH/2 && my<btnY+btnH/2)
    window.location.href="dogbread_menu.html";
});
