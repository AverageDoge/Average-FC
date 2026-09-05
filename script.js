const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. The World & Camera Setup
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1200;

const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

// Game State
const keys = {};
let ball = { 
    x: WORLD_WIDTH / 2, 
    y: WORLD_HEIGHT / 2, 
    radius: 8, 
    color: 'white',
    isPossessedBy: null 
};

// 4-3-3 Formation on the massive pitch
const blueTeam = [
    { id: 1, role: 'GK', x: 100, y: WORLD_HEIGHT / 2, isControlled: false, radius: 15 },
    { id: 2, role: 'RB', x: 400, y: 200, isInverted: true, isControlled: false, radius: 15 },
    { id: 3, role: 'CB', x: 300, y: 450, isControlled: false, radius: 15 },
    { id: 4, role: 'CB', x: 300, y: 750, isControlled: false, radius: 15 },
    { id: 5, role: 'LB', x: 400, y: 1000, isInverted: true, isControlled: false, radius: 15 },
    { id: 6, role: 'CM', x: 700, y: WORLD_HEIGHT / 2, isControlled: false, radius: 15 },
    { id: 7, role: 'CAM', x: 900, y: 350, isControlled: false, radius: 15 },
    { id: 8, role: 'CAM', x: 900, y: 850, isControlled: false, radius: 15 },
    { id: 9, role: 'RW', x: 1100, y: 200, isControlled: false, radius: 15 },
    { id: 10, role: 'ST', x: 1200, y: WORLD_HEIGHT / 2, isControlled: true, radius: 15 }, // You start here
    { id: 11, role: 'LW', x: 1100, y: 1000, isControlled: false, radius: 15 }
];

// Input Handling
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Math helper for distance
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function updateGame() {
    let activePlayer = blueTeam.find(p => p.isControlled);
    const speed = 6;

    // Movement
    if (keys['ArrowUp']) activePlayer.y -= speed;
    if (keys['ArrowDown']) activePlayer.y += speed;
    if (keys['ArrowLeft']) activePlayer.x -= speed;
    if (keys['ArrowRight']) activePlayer.x += speed;

    // Keep player in bounds
    activePlayer.x = Math.max(0, Math.min(WORLD_WIDTH, activePlayer.x));
    activePlayer.y = Math.max(0, Math.min(WORLD_HEIGHT, activePlayer.y));

    // Dribbling Logic: Check if active player touches the ball
    if (getDistance(activePlayer.x, activePlayer.y, ball.x, ball.y) < activePlayer.radius + ball.radius) {
        ball.isPossessedBy = activePlayer;
    }

    // If a player has the ball, it moves with them
    if (ball.isPossessedBy) {
        // Put the ball slightly in front of the player (basic dribble)
        ball.x = ball.isPossessedBy.x + 15;
        ball.y = ball.isPossessedBy.y + 10;
    }

    // 2. Camera Logic: Follow the ball smoothly
    let targetCameraX = ball.x - (camera.width / 2);
    let targetCameraY = ball.y - (camera.height / 2);

    // Clamp camera to the edges of the world so we don't see the "void" outside the pitch
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - camera.width, targetCameraX));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - camera.height, targetCameraY));
}

function drawPitch() {
    // Draw Grass Stripes (so you can see the camera moving)
    const stripeWidth = 100;
    for (let x = 0; x < WORLD_WIDTH; x += stripeWidth) {
        ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? '#27ae60' : '#2ecc71';
        // Offset by camera
        ctx.fillRect(x - camera.x, 0 - camera.y, stripeWidth, WORLD_HEIGHT);
    }
    
    // Draw boundary lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(0 - camera.x, 0 - camera.y, WORLD_WIDTH, WORLD_HEIGHT);

    // Center Line
    ctx.beginPath();
    ctx.moveTo((WORLD_WIDTH / 2) - camera.x, 0 - camera.y);
    ctx.lineTo((WORLD_WIDTH / 2) - camera.x, WORLD_HEIGHT - camera.y);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc((WORLD_WIDTH / 2) - camera.x, (WORLD_HEIGHT / 2) - camera.y, 150, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPlayers() {
    blueTeam.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, Math.PI * 2);
        
        // Highlight active player, otherwise regular blue
        ctx.fillStyle = player.isControlled ? '#f1c40f' : '#3498db'; 
        ctx.fill();
        
        // Draw player number
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.id, player.x - camera.x, player.y - camera.y);
        ctx.stroke();
    });
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x - camera.x, ball.y - camera.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.stroke();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen
    updateGame();
    drawPitch();
    drawPlayers();
    drawBall();
    requestAnimationFrame(gameLoop);
}

gameLoop();
