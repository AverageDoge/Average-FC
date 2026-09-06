const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1200;

const camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };

// Input State
const keys = {};
let charge = 0;
let chargingAction = null; // 'Space' (Shoot) or 'e' (Pass)

let ball = { 
    x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, 
    radius: 8, vx: 0, vy: 0, isPossessedBy: null 
};

// Tactical 4-3-3 Attack Formations
const createTeam = (teamColor, isPlayerTeam) => {
    // If player team, defend left (x=0), attack right (x=2000)
    // If AI team, defend right (x=2000), attack left (x=0)
    const dir = isPlayerTeam ? 1 : -1;
    const offsetX = isPlayerTeam ? 200 : 1800;

    return [
        { id: 1, role: 'GK', baseX: offsetX, baseY: 600 },
        { id: 2, role: 'RB', baseX: offsetX + (dir * 200), baseY: 200 },
        { id: 3, role: 'CB', baseX: offsetX + (dir * 150), baseY: 450 },
        { id: 4, role: 'CB', baseX: offsetX + (dir * 150), baseY: 750 },
        { id: 5, role: 'LB', baseX: offsetX + (dir * 200), baseY: 1000 },
        { id: 6, role: 'CM', baseX: offsetX + (dir * 450), baseY: 600 },
        { id: 7, role: 'CAM', baseX: offsetX + (dir * 600), baseY: 350 },
        { id: 8, role: 'CAM', baseX: offsetX + (dir * 600), baseY: 850 },
        { id: 9, role: 'RW', baseX: offsetX + (dir * 800), baseY: 200 },
        { id: 10, role: 'ST', baseX: offsetX + (dir * 850), baseY: 600 },
        { id: 11, role: 'LW', baseX: offsetX + (dir * 800), baseY: 1000 }
    ].map(p => ({
        ...p,
        x: p.baseX, y: p.baseY,
        team: teamColor,
        isControlled: isPlayerTeam && p.role === 'ST',
        radius: 15, facingX: dir, facingY: 0
    }));
};

const yellowTeam = createTeam('yellow', true);
const blueTeam = createTeam('blue', false);
const allPlayers = [...yellowTeam, ...blueTeam];

// Enhanced Key Listeners for Power Charging
window.addEventListener('keydown', (e) => {
    let key = e.code === 'Space' ? 'Space' : e.key.toLowerCase();
    keys[key] = true;
});
window.addEventListener('keyup', (e) => {
    let key = e.code === 'Space' ? 'Space' : e.key.toLowerCase();
    keys[key] = false;
});

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function executeAction(player, action, power) {
    if (action === 'Space') { // SHOOT
        ball.x += player.facingX * 15;
        ball.y += player.facingY * 15;
        ball.vx = player.facingX * (15 + power); // Power adds velocity
        ball.vy = player.facingY * (15 + power);
        ball.isPossessedBy = null;
    } else if (action === 'e') { // PASS
        let bestTeammate = null;
        let maxScore = -Infinity;
        
        yellowTeam.forEach(teammate => {
            if (teammate === player) return;
            let tx = teammate.x - player.x;
            let ty = teammate.y - player.y;
            let dist = Math.sqrt(tx*tx + ty*ty);
            
            if (dist > 0 && dist < 1500) {
                let dirX = tx / dist;
                let dirY = ty / dist;
                let dot = (dirX * player.facingX) + (dirY * player.facingY);
                
                if (dot > 0.4) { 
                    let score = (dot * 1000) - dist; 
                    if (score > maxScore) {
                        maxScore = score;
                        bestTeammate = teammate;
                    }
                }
            }
        });

        if (bestTeammate) {
            let passDx = bestTeammate.x - player.x;
            let passDy = bestTeammate.y - player.y;
            let passDist = Math.sqrt(passDx*passDx + passDy*passDy);
            
            ball.x += (passDx / passDist) * 15;
            ball.y += (passDy / passDist) * 15;
            ball.vx = (passDx / passDist) * (10 + power); 
            ball.vy = (passDy / passDist) * (10 + power);
            
            player.isControlled = false;
            bestTeammate.isControlled = true;
        } else {
            // If no one is targeted, just do a weak kick forward
            ball.vx = player.facingX * (10 + power);
            ball.vy = player.facingY * (10 + power);
        }
        ball.isPossessedBy = null;
    }
}

function updateGame() {
    let activePlayer = yellowTeam.find(p => p.isControlled);
    const speed = 6;
    
    // --- PLAYER MOVEMENT ---
    let dx = 0, dy = 0;
    if (keys['arrowup']) dy -= 1;
    if (keys['arrowdown']) dy += 1;
    if (keys['arrowleft']) dx -= 1;
    if (keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        let length = Math.sqrt(dx * dx + dy * dy);
        activePlayer.facingX = dx / length;
        activePlayer.facingY = dy / length;
        activePlayer.x += activePlayer.facingX * speed;
        activePlayer.y += activePlayer.facingY * speed;
    }

    // --- CHARGE MECHANICS ---
    if (ball.isPossessedBy === activePlayer) {
        if (keys['Space']) {
            chargingAction = 'Space';
            charge = Math.min(charge + 0.5, 20); // Max power 20
        } else if (keys['e']) {
            chargingAction = 'e';
            charge = Math.min(charge + 0.5, 20);
        } else if (chargingAction) {
            // Key released, fire!
            executeAction(activePlayer, chargingAction, charge);
            charge = 0;
            chargingAction = null;
        }
    } else {
        charge = 0;
        chargingAction = null;
    }

    // --- BALL PICKUP LOGIC & STEALING ---
    if (!ball.isPossessedBy) {
        allPlayers.forEach(player => {
            if (getDistance(player.x, player.y, ball.x, ball.y) < player.radius + ball.radius) {
                ball.isPossessedBy = player;
                ball.vx = 0; ball.vy = 0;
                
                if (player.team === 'yellow') {
                    yellowTeam.forEach(p => p.isControlled = false);
                    player.isControlled = true;
                }
            }
        });
    }

    if (ball.isPossessedBy) {
        ball.x = ball.isPossessedBy.x + (ball.isPossessedBy.facingX * 18);
        ball.y = ball.isPossessedBy.y + (ball.isPossessedBy.facingY * 18);
    } else {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.95; 
        ball.vy *= 0.95;

        if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
        
        if (ball.x <= 0 || ball.x >= WORLD_WIDTH) ball.vx *= -1;
        if (ball.y <= 0 || ball.y >= WORLD_HEIGHT) ball.vy *= -1;
    }

    // --- INTELLIGENT AI SYSTEM ---
    let closestBlue = null;
    let minDist = Infinity;
    
    blueTeam.forEach(p => {
        let d = getDistance(p.x, p.y, ball.x, ball.y);
        if (d < minDist) { minDist = d; closestBlue = p; }
    });

    blueTeam.forEach(p => {
        if (ball.isPossessedBy === p) {
            // AI HAS THE BALL: Attack Yellow Goal (x = 0)
            let tx = 0 - p.x;
            let ty = 600 - p.y;
            let dist = Math.sqrt(tx*tx + ty*ty);
            p.facingX = tx/dist; p.facingY = ty/dist;
            p.x += p.facingX * (speed * 0.8);
            p.y += p.facingY * (speed * 0.8);

            if (p.x < 500 && Math.random() < 0.05) { // Shoot!
                ball.vx = p.facingX * 25;
                ball.vy = p.facingY * 25;
                ball.isPossessedBy = null;
            }
        } else if (p === closestBlue && (!ball.isPossessedBy || ball.isPossessedBy.team !== 'blue')) {
            // AI CHASE: Closest player pressures the ball
            let tx = ball.x - p.x;
            let ty = ball.y - p.y;
            let dist = Math.sqrt(tx*tx + ty*ty);
            if (dist > 0) {
                p.facingX = tx/dist; p.facingY = ty/dist;
                p.x += p.facingX * (speed * 0.7);
                p.y += p.facingY * (speed * 0.7);
            }
        } else {
            // AI FORMATION: Return to tactical positions based on ball location
            let targetX = p.baseX + (ball.x - 1000) * 0.2; // Shift slightly with play
            p.x += (targetX - p.x) * 0.05;
            p.y += (p.baseY - p.y) * 0.05;
        }

        // Steal Logic: If blue touches yellow ball carrier, they steal it
        if (ball.isPossessedBy && ball.isPossessedBy.team === 'yellow') {
            if (getDistance(p.x, p.y, ball.isPossessedBy.x, ball.isPossessedBy.y) < p.radius * 2) {
                ball.isPossessedBy = p; // Steal!
                charge = 0; // Cancel player charge
                chargingAction = null;
            }
        }
    });

    // Yellow team auto-formation (uncontrolled players)
    yellowTeam.forEach(p => {
        if (!p.isControlled) {
            let targetX = p.baseX + (ball.x - 1000) * 0.2;
            p.x += (targetX - p.x) * 0.05;
            p.y += (p.baseY - p.y) * 0.05;
        }
    });

    // Keep everyone in bounds
    allPlayers.forEach(p => {
        p.x = Math.max(0, Math.min(WORLD_WIDTH, p.x));
        p.y = Math.max(0, Math.min(WORLD_HEIGHT, p.y));
    });

    // --- CAMERA LERP ---
    let targetCameraX = ball.x - (camera.width / 2);
    let targetCameraY = ball.y - (camera.height / 2);
    targetCameraX = Math.max(0, Math.min(WORLD_WIDTH - camera.width, targetCameraX));
    targetCameraY = Math.max(0, Math.min(WORLD_HEIGHT - camera.height, targetCameraY));
    camera.x += (targetCameraX - camera.x) * 0.1;
    camera.y += (targetCameraY - camera.y) * 0.1;
}

function drawPitch() {
    const stripeWidth = 100;
    for (let x = 0; x < WORLD_WIDTH; x += stripeWidth) {
        ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? '#27ae60' : '#2ecc71';
        ctx.fillRect(x - camera.x, 0 - camera.y, stripeWidth, WORLD_HEIGHT);
    }
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(0 - camera.x, 0 - camera.y, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.beginPath();
    ctx.moveTo((WORLD_WIDTH / 2) - camera.x, 0 - camera.y);
    ctx.lineTo((WORLD_WIDTH / 2) - camera.x, WORLD_HEIGHT - camera.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc((WORLD_WIDTH / 2) - camera.x, (WORLD_HEIGHT / 2) - camera.y, 150, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPlayers() {
    allPlayers.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, Math.PI * 2);
        
        // Colors: Yellow for player team, Blue for rivals
        if (player.team === 'yellow') {
            ctx.fillStyle = player.isControlled ? '#f39c12' : '#f1c40f'; // Darker orange if controlled
        } else {
            ctx.fillStyle = '#3498db';
        }
        
        ctx.fill();
        ctx.strokeStyle = player.isControlled ? '#ffffff' : '#000000'; // White ring around active player
        ctx.lineWidth = player.isControlled ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = player.team === 'yellow' && !player.isControlled ? 'black' : 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.id, player.x - camera.x, player.y - camera.y);

        // Draw Power Bar above controlled player
        if (player.isControlled && charge > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(player.x - camera.x - 15, player.y - camera.y - 25, 30, 6);
            ctx.fillStyle = charge > 15 ? '#e74c3c' : '#f1c40f';
            ctx.fillRect(player.x - camera.x - 15, player.y - camera.y - 25, (charge / 20) * 30, 6);
        }
    });
}

function drawBall() {
    let screenX = ball.x - camera.x;
    let screenY = ball.y - camera.y;

    ctx.beginPath();
    ctx.arc(screenX, screenY, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; 
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, ball.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#000000'; 
    ctx.fill();

    for (let i = 0; i < 3; i++) {
        let angle = i * ((Math.PI * 2) / 3) + (ball.x + ball.y) * 0.05; 
        ctx.beginPath();
        ctx.arc(
            screenX + Math.cos(angle) * ball.radius * 0.7,
            screenY + Math.sin(angle) * ball.radius * 0.7,
            ball.radius * 0.25, 0, Math.PI * 2
        );
        ctx.fillStyle = '#000000'; 
        ctx.fill();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateGame();
    drawPitch();
    drawPlayers();
    drawBall();
    requestAnimationFrame(gameLoop);
}

gameLoop();
