const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const keys = {};
let ball = { x: 400, y: 300, radius: 5, color: 'white' };

// Define a basic 4-3-3 Attack formation for the player's team (Blue)
const blueTeam = [
    { id: 1, role: 'GK', x: 50, y: 300, isControlled: false },
    { id: 2, role: 'RB', x: 200, y: 100, isInverted: true, isControlled: false },
    { id: 3, role: 'CB', x: 150, y: 230, isControlled: false },
    { id: 4, role: 'CB', x: 150, y: 370, isControlled: false },
    { id: 5, role: 'LB', x: 200, y: 500, isInverted: true, isControlled: false },
    { id: 6, role: 'CM', x: 300, y: 300, isControlled: false },
    { id: 7, role: 'CAM', x: 380, y: 200, isControlled: false },
    { id: 8, role: 'CAM', x: 380, y: 400, isControlled: false },
    { id: 9, role: 'RW', x: 450, y: 100, isControlled: false },
    { id: 10, role: 'ST', x: 500, y: 300, isControlled: true }, // You start as Striker
    { id: 11, role: 'LW', x: 450, y: 500, isControlled: false }
];

// Input Handling
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

function drawPitch() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Center Line and Circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPlayers() {
    blueTeam.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = player.isControlled ? '#f1c40f' : '#3498db'; // Highlight controlled player in yellow
        ctx.fill();
        ctx.stroke();
    });
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.stroke();
}

function updateGame() {
    // Find the currently controlled player
    let activePlayer = blueTeam.find(p => p.isControlled);

    // Basic Movement Logic
    const speed = 3;
    if (keys['ArrowUp']) activePlayer.y -= speed;
    if (keys['ArrowDown']) activePlayer.y += speed;
    if (keys['ArrowLeft']) activePlayer.x -= speed;
    if (keys['ArrowRight']) activePlayer.x += speed;

    // TODO: Add AI logic here for the other 10 players to hold formation
    // TODO: Add ball collision and dribbling physics
}

function gameLoop() {
    updateGame();
    drawPitch();
    drawPlayers();
    drawBall();
    requestAnimationFrame(gameLoop);
}

// Start the engine
gameLoop();
