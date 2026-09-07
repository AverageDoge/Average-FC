function drawPitch() {
    const stripeWidth = 100;
    for (let x = 0; x < WORLD_WIDTH; x += stripeWidth) {
        ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? '#27ae60' : '#2ecc71';
        ctx.fillRect(x - camera.x, 0 - camera.y, stripeWidth, WORLD_HEIGHT);
    }
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(0 - camera.x, 0 - camera.y, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.beginPath(); ctx.moveTo((WORLD_WIDTH / 2) - camera.x, 0 - camera.y);
    ctx.lineTo((WORLD_WIDTH / 2) - camera.x, WORLD_HEIGHT - camera.y); ctx.stroke();
    ctx.beginPath(); ctx.arc((WORLD_WIDTH / 2) - camera.x, (WORLD_HEIGHT / 2) - camera.y, 150, 0, Math.PI * 2); ctx.stroke();
}

function drawPlayers() {
    allPlayers.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x - camera.x, player.y - camera.y, player.radius, 0, Math.PI * 2);
        
        if (player.team === 'yellow') {
            ctx.fillStyle = player.isControlled ? '#f39c12' : '#f1c40f'; 
        } else {
            ctx.fillStyle = '#3498db';
        }
        
        ctx.fill();
        ctx.strokeStyle = player.isControlled ? '#ffffff' : '#000000';
        ctx.lineWidth = player.isControlled ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = player.team === 'yellow' && !player.isControlled ? 'black' : 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.id, player.x - camera.x, player.y - camera.y);

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

    ctx.beginPath(); ctx.arc(screenX, screenY, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.5; ctx.stroke();
    
    ctx.beginPath(); ctx.arc(screenX, screenY, ball.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#000000'; ctx.fill();

    for (let i = 0; i < 3; i++) {
        let angle = i * ((Math.PI * 2) / 3) + (ball.x + ball.y) * 0.05; 
        ctx.beginPath();
        ctx.arc(
            screenX + Math.cos(angle) * ball.radius * 0.7,
            screenY + Math.sin(angle) * ball.radius * 0.7,
            ball.radius * 0.25, 0, Math.PI * 2
        );
        ctx.fillStyle = '#000000'; ctx.fill();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateGame(); drawPitch(); drawPlayers(); drawBall();
    requestAnimationFrame(gameLoop);
}

gameLoop();
