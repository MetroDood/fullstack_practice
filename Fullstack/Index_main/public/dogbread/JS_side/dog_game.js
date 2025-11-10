const canvas = document.getElementById("dogbreadFight");
const ctx = canvas.getContext("2d");

// ----------------------
// Setup and Globals
// ----------------------
const width = canvas.width;
const height = canvas.height;
-
const textBoxHeight = height * 0.3;
const menuHeight = 100;
const statsHeight = 40;
const enemyZoneHeight = height - (textBoxHeight + menuHeight + statsHeight);

// Game State Trackers
let gameStarted = false;
let round = 0;
let inBattle = false;
let fading = 0;
let disableInput = false;
let lastAttack = null; // Track the last attack used

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

// *** End Screen UI Elements ***
const endScreen = document.getElementById("endScreen");
const endMessage = document.getElementById("endMessage");
const retryButton = document.getElementById("retryButton");
const menuButton = document.getElementById("menuButton");
const MENU_URL = "dogbread_menu.html";

// ----------------------
// Event Listeners
// ----------------------
startButton.addEventListener("click", startGame);
playerNameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") startGame();
});

// *** End Screen Listeners ***
if (retryButton) retryButton.addEventListener("click", resetGame);
if (menuButton) menuButton.addEventListener("click", () => {
    window.location.href = MENU_URL;
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

function resetGame() {
    // Reset core state
    gameStarted = true;
    round = 0;
    inBattle = false;
    fading = 0;
    disableInput = false;
    lastAttack = null; 

    // Reset player stats
    player.hp = player.maxHp;
    actsDone = 0;
    loafDamage = 0;
    
    // Reset menus and items
    selectedIndex = 0;
    menuState = "main";
    actIndex = 0;
    itemIndex = 0;
    mercyIndex = 0;
    itemOptions.forEach(item => item.used = false);

    // Reset combat state and UI
    stopAllAttacks();
    if (endScreen) endScreen.style.display = "none";
    canvas.style.display = "block";
    
    setDialogue(round);
    
    lastTime = performance.now(); 
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
                disableInput = true;
                waitForTextThenBattle();
            }
        }
    }

    // --- ACT MENU ---
    else if (menuState === "act") {
        // Vertical movement for column layout
        if (e.key === "ArrowUp") actIndex = (actIndex + actOptions.length - 1) % actOptions.length;
        if (e.key === "ArrowDown") actIndex = (actIndex + 1) % actOptions.length;
        
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
                setTimeout(() => gameOver("flee"), 1000); 
            } else if (selected === "Spare") {
                if (actsDone >= 4) {
                    message = "You spared Loaf.";
                    resetText();
                    disableInput = true;
                    setTimeout(() => victory(), 1000); 
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
    if (menuState !== "battle" || disableInput) return;
    if (e.key === "ArrowLeft") vx = -soulSpeed;
    if (e.key === "ArrowRight") vx = soulSpeed;
    if (e.key === "ArrowUp") vy = -soulSpeed;
    if (e.key === "ArrowDown") vy = soulSpeed;
});
document.addEventListener("keyup", e => {
    if (menuState !== "battle" || disableInput) return;
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
            // Wait a moment longer for the user to read
            setTimeout(() => {
                message = ""; // Wipe dialogue message
                displayedText = ""; // Wipe displayed text
                fading = 0; // Ensure fade starts from 0
                fadeOutDialogue(() => startBattlePhase());
            }, 500); 
        }
    }, 100);
}

function fadeOutDialogue(callback) {
    const fadeInterval = setInterval(() => {
        fading += 0.05;
        if (fading >= 1) {
            clearInterval(fadeInterval);
            fading = 1;
            callback();
        }
    }, 30);
}

function fadeInDialogue() {
    const fadeInterval = setInterval(() => {
        fading -= 0.05;
        if (fading <= 0) {
            clearInterval(fadeInterval);
            fading = 0;
            setDialogue(round); 
        }
    }, 30);
}

// ----------------------
// Game Over and Victory Functions
// ----------------------
function gameOver(reason) {
    disableInput = true;
    
    // Start fade out sequence
    const fadeInterval = setInterval(() => {
        fading += 0.05;
        if (fading >= 1) {
            clearInterval(fadeInterval);
            gameStarted = false; 
            ctx.clearRect(0, 0, width, height);
            canvas.style.display = "none";
            
            let messageText;
            if (reason === "flee") {
                messageText = "You gave up the fight.";
            } else {
                messageText = "Game Over";
            }

            if (endMessage) endMessage.textContent = messageText;
            if (endScreen) endScreen.style.display = "flex";
        }
    }, 30);
}

function victory() {
    disableInput = true;
    
    // Start fade out sequence
    const fadeInterval = setInterval(() => {
        fading += 0.05;
        if (fading >= 1) {
            clearInterval(fadeInterval);
            gameStarted = false; 
            
            canvas.style.display = "none";
            
            if (endMessage) endMessage.textContent = "You and Loaf had a wonderful time!";
            if (endScreen) endScreen.style.display = "flex";
        }
    }, 30);
}

// ----------------------
// ATTACK SYSTEM 
// ----------------------

let pellets = [];
let pelletTimer = 0;
let croissantSpeed = 0.015;
let croissants = [];
let bigBread = null;
let comboActive = false;
let activeAttack = null; 
let loafDamage = 0;      

function startBattlePhase() {
    menuState = "battle";
    inBattle = true;
    vx = vy = 0;
    
    const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
    soulX = width / 2;
    soulY = arenaY + 50; 
    
    disableInput = false;

    let nextAttack;
    if (loafDamage >= 50 || actsDone >= 3) {
        nextAttack = "combo";
    } else {
        const availableAttacks = ["pellet", "croissant"].filter(att => att !== lastAttack);
        if (availableAttacks.length === 0) {
            nextAttack = lastAttack === "pellet" ? "croissant" : "pellet";
        } else {
            nextAttack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
        }
    }
    
    activeAttack = nextAttack;
    lastAttack = activeAttack; 

    if (activeAttack === "pellet") startPelletAttack();
    else if (activeAttack === "croissant") startCroissantAttack();
    else if (activeAttack === "combo") startComboAttack();

    setTimeout(() => endBattlePhase(), 12000);
}

function endBattlePhase() {
    stopAllAttacks();
    inBattle = false;
    fadeInDialogue();
    menuState = "main";
    disableInput = false;
    round++;
}

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
        const dist = Math.hypot(dx, dy);
        if (dist < (p.size / 2 + soulSize / 2)) {
            player.hp = Math.max(0, player.hp - 3);
            p.hit = true;
            if (player.hp <= 0 && gameStarted) gameOver(); 
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
    pellets.push({
        x, y,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        size: 14,
        rotation: Math.random() * Math.PI * 2,
        hit: false
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

function startCroissantAttack() {
    croissants = [];
    const centerY = enemyZoneHeight + textBoxHeight / 2 + 20;
    croissants.push({
        x: -80, y: centerY, vx: 2.2, rotation: 0, dir: 1, returning: false,
    });
    croissants.push({
        x: width + 80, y: centerY, vx: -2.2, rotation: 0, dir: -1, returning: false,
    });
}

function updateCroissants(delta) {
    croissants.forEach((c) => {
        c.x += c.vx;
        c.rotation += 0.15 * c.dir;

        if (!c.returning && ((c.dir === 1 && c.x > width / 2 + 60) || (c.dir === -1 && c.x < width / 2 - 60))) {
            c.returning = true;
            c.vx *= -1.05;
        }

        const dx = c.x - soulX;
        const dy = c.y - soulY;
        const dist = Math.hypot(dx, dy);
        if (dist < 28 + soulSize / 2) {
            player.hp = Math.max(0, player.hp - 1);
            if (player.hp <= 0 && gameStarted) gameOver();
        }
    });
    croissants = croissants.filter((c) => c.x > -200 && c.x < width + 200);
}

function drawCroissants() {
    croissants.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.drawImage(croissantImg, -35, -20, 70, 40);
        ctx.restore();
    });
}

function startComboAttack() {
    comboActive = true;
    bigBread = {
        x: width / 2, y: -250, targetY: enemyZoneHeight + textBoxHeight / 2 - 220, speed: 0.4, width: 200, height: 200,
    };
    startCroissantAttack();
}

function updateComboAttack(delta) {
    if (bigBread && bigBread.y < bigBread.targetY) {
        bigBread.y += bigBread.speed;
        if (bigBread.y > bigBread.targetY) bigBread.y = bigBread.targetY;
    }
    updateCroissants(delta);
}

function drawComboAttack() {
    if (bigBread) {
        ctx.save();
        const wobble = Math.sin(Date.now() / 250) * 3;
        ctx.translate(bigBread.x, bigBread.y + wobble);
        ctx.drawImage(bigBreadImg, -bigBread.width / 2, 0, bigBread.width, bigBread.height);
        ctx.restore();
    }
    drawCroissants();
}

function stopAllAttacks() {
    pellets = [];
    croissants = [];
    bigBread = null;
    comboActive = false;
    activeAttack = null;
}

// ----------------------
// Integrate into Update & Draw
// ----------------------
function update(delta) {
    if (!gameStarted) return; 

    textTimer += delta;
    // Only continue typing if there is a message and we are not in battle
    if (textTimer > 50 && textIndex < message.length && menuState !== "battle") {
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

        if (activeAttack === "pellet") updatePellets(delta);
        else if (activeAttack === "croissant") updateCroissants(delta);
        else if (activeAttack === "combo") updateComboAttack(delta);
    }
    if (player.hp <= 0 && gameStarted) {
        gameOver();
    }
}

function draw() {
    if (!gameStarted && fading >= 1) return; 

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height); 
    ctx.drawImage(loaf, width / 2 - 64, 50, 128, 128);

    // Dialogue Box Drawing: Only draw if NOT in battle (inBattle is false)
    // AND NOT actively fading (fading < 1)
    if (fading < 1 && !inBattle) {
        ctx.globalAlpha = 1 - fading;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.strokeRect(30, enemyZoneHeight + 10, width - 60, textBoxHeight - 20);
        ctx.font = "20px DeterminationSansWeb";
        ctx.fillStyle = "white";
        
        // *** FINAL FIX: Adjusted Y position to ensure text is well inside the box ***
        wrapText(displayedText, 50, enemyZoneHeight + 45, width - 100, 24);
    }
    
    // Reset Alpha for drawing critical elements
    ctx.globalAlpha = 1;

    if (menuState === "battle") {
        const arenaX = width / 2 - 50;
        const arenaY = enemyZoneHeight + textBoxHeight / 2 - 50;
        
        ctx.strokeStyle = "white";
        ctx.strokeRect(arenaX, arenaY, 100, 100);

        if (activeAttack === "pellet") drawPellets();
        else if (activeAttack === "croissant") drawCroissants();
        else if (activeAttack === "combo") drawComboAttack();

        ctx.drawImage(soul, soulX - soulSize / 2, soulY - soulSize / 2, soulSize, soulSize);
    }
    
    // Draw fade-to-black overlay
    if (fading > 0 && (menuState !== "battle" || !gameStarted)) {
        ctx.save(); 
        ctx.globalAlpha = fading;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        ctx.restore(); 
    }

    drawStats();
    
    // Only draw menus if dialogue is finished and we are not in battle (fading is 0)
    if (fading <= 0 && !inBattle) {
        drawMenus();
    }
}

    // ----------------------
    // UI Draw helpers
    // ----------------------
    function drawStats() {
        const statsY = height - menuHeight - statsHeight;
        ctx.font = "20px DeterminationSansWeb";
        ctx.fillStyle = "white";
        ctx.fillText(`${player.name}  LV ${player.lvl}`, 30, statsY + 25);

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

    // *** FIX: Act Menu is now a single vertical column ***
    function drawActMenu() {
        const menuWidth = 150; 
        const startX = width / 2 - menuWidth / 2; 
        const startY = enemyZoneHeight + 30;
        const lineHeight = 35;

        actOptions.forEach((opt, i) => {
            const y = startY + i * lineHeight;
            ctx.textAlign = "left"; 
            ctx.fillStyle = i === actIndex ? "yellow" : "white";
            ctx.fillText(opt, startX + 30, y + 25); 
            
            if (i === actIndex) {
                ctx.drawImage(soul, startX, y + 10, soulSize, soulSize); 
            }
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
    if (!gameStarted && endScreen && endScreen.style.display === "flex") return; 

    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    requestAnimationFrame(gameLoop);
}