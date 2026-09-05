const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1200;

const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

const keys = {};
let ball = { 
    x: WORLD_WIDTH / 2, 
    y: WORLD_HEIGHT / 2, 
    radius: 8, 
    vx: 0,
    vy: 0,
    isPossessedBy: null 
};

// Player facing logic remains so the ball knows which way to shoot
const blueTeam = [
    { id: 1, role: 'GK', x: 100, y: WORLD_HEIGHT / 2, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 2, role: 'RB', x: 400, y: 200, isInverted: true, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 3, role: 'CB', x: 300, y: 450, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 4, role: 'CB', x: 300, y: 750, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 5, role: 'LB', x: 400, y: 1000, isInverted: true, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 6, role: 'CM', x: 700, y: WORLD_HEIGHT / 2, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 7, role: 'CAM', x: 900, y: 350, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 8, role: 'CAM', x: 900, y: 850, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 9, role: 'RW', x: 1100, y: 200, isControlled: false, radius: 15, facingX: 1, facingY: 0 },
    { id: 10, role: 'ST', x: 1200, y: WORLD_HEIGHT / 2, isControlled: true, radius: 15, facingX: -1, facingY: 0 },
    { id: 11, role: 'LW', x: 1100, y: 1000, isControlled: false, radius: 15, facingX: 1, facingY: 0 }
];

// FIX: Improved Spacebar detection for all browsers
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') keys['Space'] = true;
    else keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') keys['Space'] = false;
    else keys[e.key] = false;
});

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function updateGame() {
    let activePlayer = blueTeam.find(p => p.isControlled);
    const speed = 6;
    
    let dx = 0;
    let dy = 0;

    if (keys['ArrowUp']) dy -= 1;
    if (keys['ArrowDown']) dy += 1;
    if (keys['ArrowLeft']) dx -= 1;
    if (keys['ArrowRight']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        let length = Math.sqrt(dx * dx + dy * dy);
        activePlayer.facingX = dx / length;
        activePlayer.facingY = dy / length;

        activePlayer.x += activePlayer.facingX * speed;
        activePlayer.y += activePlayer.facingY * speed;
    }

    activePlayer.x = Math.max(0, Math.min(WORLD_WIDTH, activePlayer.x));
    activePlayer.y = Math.max(0, Math.min(WORLD_HEIGHT, activePlayer.y));

    if (!ball.isPossessedBy) {
        if (getDistance(activePlayer.x, activePlayer.y, ball.x, ball.y) < activePlayer.radius + ball.radius) {
            ball.isPossessedBy = activePlayer;
            ball.vx = 0;
            ball.vy = 0;
        }
    }

    if (ball.isPossessedBy) {
        ball.x = ball.isPossessedBy.x + (ball.isPossessedBy.facingX * 18);
        ball.y = ball.isPossessedBy.y + (ball.isPossessedBy.facingY * 18);

        // FIX: Shoot mechanics properly disconnect the ball from the player
        if (keys['Space']) {
            const kickPower = 22; // Harder kick
            
            // Push the ball forward explicitly so it clears the player's hit box
            ball.x += ball.isPossessedBy.facingX * 10;
            ball.y += ball.isPossessedBy.facingY * 10;
            
            ball.vx = ball.isPossessedBy.facingX * kickPower;
            ball.vy = ball.isPossessedBy.facingY * kickPower;
            
            ball.isPossessedBy = null;
            keys['Space'] = false; 
        }
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

    let targetCameraX = activePlayer.x - (camera.width / 2);
    let targetCameraY = activePlayer.y - (camera.height / 2);

    camera.x = Math.max(0, Math.min(WORLD_WIDTH - camera.width, targetCameraX));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - camera.height, targetCameraY));
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
    blueTeam.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, Math.PI * 2);
        
        ctx.fillStyle = player.isControlled ? '#f1c40f' : '#3498db'; 
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.id, player.x - camera.x, player.y - camera.y);
    });
}

function drawBall() {
    let screenX = ball.x - camera.x;
    let screenY = ball.y - camera.y;

    // FIX: Hard-coded black and white fills so they can never glitch to clear
    ctx.beginPath();
    ctx.arc(screenX, screenY, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; // White base
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw Center Black Pentagon
    ctx.beginPath();
    ctx.arc(screenX, screenY, ball.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#000000'; // Black center
    ctx.fill();

    // Draw 3 smaller edge spots that spin
    for (let i = 0; i < 3; i++) {
        let angle = i * ((Math.PI * 2) / 3) + (ball.x + ball.y) * 0.05; 
        ctx.beginPath();
        ctx.arc(
            screenX + Math.cos(angle) * ball.radius * 0.7,
            screenY + Math.sin(angle) * ball.radius * 0.7,
            ball.radius * 0.25, 0, Math.PI * 2
        );
        ctx.fillStyle = '#000000'; // Black spots
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
