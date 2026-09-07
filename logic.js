function executeAction(player, action, power) {
    if (action === 'Space') { 
        ball.x += player.facingX * 15;
        ball.y += player.facingY * 15;
        ball.vx = player.facingX * (15 + power); 
        ball.vy = player.facingY * (15 + power);
        ball.isPossessedBy = null;
    } else if (action === 'e') { 
        let bestTeammate = null;
        let maxScore = -Infinity;
        
        yellowTeam.forEach(teammate => {
            if (teammate === player) return;
            let tx = teammate.x - player.x;
            let ty = teammate.y - player.y;
            let dist = getDistance(player.x, player.y, teammate.x, teammate.y);
            
            if (dist > 0 && dist < 1500) {
                let dot = ((tx / dist) * player.facingX) + ((ty / dist) * player.facingY);
                if (dot > 0.4) { 
                    let score = (dot * 1000) - dist; 
                    if (score > maxScore) { maxScore = score; bestTeammate = teammate; }
                }
            }
        });

        if (bestTeammate) {
            let passDx = bestTeammate.x - player.x;
            let passDy = bestTeammate.y - player.y;
            let passDist = getDistance(player.x, player.y, bestTeammate.x, bestTeammate.y);
            
            ball.x += (passDx / passDist) * 15;
            ball.y += (passDy / passDist) * 15;
            ball.vx = (passDx / passDist) * (10 + power); 
            ball.vy = (passDy / passDist) * (10 + power);
            
            player.isControlled = false;
            bestTeammate.isControlled = true;
        } else {
            ball.vx = player.facingX * (10 + power);
            ball.vy = player.facingY * (10 + power);
        }
        ball.isPossessedBy = null;
    }
}

function updateGame() {
    let activePlayer = yellowTeam.find(p => p.isControlled);
    const speed = 6;
    
    // Manual Player Switching (R Key)
    if (keys['r']) {
        activePlayer.isControlled = false;
        let closest = yellowTeam[0];
        let minDist = Infinity;
        yellowTeam.forEach(p => {
            let d = getDistance(p.x, p.y, ball.x, ball.y);
            if (d < minDist) { minDist = d; closest = p; }
        });
        closest.isControlled = true;
        activePlayer = closest;
        keys['r'] = false; // Prevent rapid toggling
    }
    
    // Player Movement
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

    // Charge Mechanics
    if (ball.isPossessedBy === activePlayer) {
        if (keys['Space']) { chargingAction = 'Space'; charge = Math.min(charge + 0.5, 20); } 
        else if (keys['e']) { chargingAction = 'e'; charge = Math.min(charge + 0.5, 20); } 
        else if (chargingAction) {
            executeAction(activePlayer, chargingAction, charge);
            charge = 0; chargingAction = null;
        }
    } else { charge = 0; chargingAction = null; }

    // Ball Pickup
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
        ball.x += ball.vx; ball.y += ball.vy;
        ball.vx *= 0.95; ball.vy *= 0.95;
        if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
        if (ball.x <= 0 || ball.x >= WORLD_WIDTH) ball.vx *= -1;
        if (ball.y <= 0 || ball.y >= WORLD_HEIGHT) ball.vy *= -1;
    }

    // AI & Tackling Logic
    let closestBlue = null, closestYellow = null;
    let minBlueDist = Infinity, minYellowDist = Infinity;
    
    allPlayers.forEach(p => {
        let d = getDistance(p.x, p.y, ball.x, ball.y);
        if (p.team === 'blue' && d < minBlueDist) { minBlueDist = d; closestBlue = p; }
        if (p.team === 'yellow' && d < minYellowDist) { minYellowDist = d; closestYellow = p; }
    });

    allPlayers.forEach(p => {
        // Universal Tackling: If an opponent touches the ball carrier, they steal it
        if (ball.isPossessedBy && ball.isPossessedBy.team !== p.team) {
            if (getDistance(p.x, p.y, ball.isPossessedBy.x, ball.isPossessedBy.y) < p.radius * 2) {
                ball.isPossessedBy = p;
                charge = 0; chargingAction = null;
                if (p.team === 'yellow') {
                    yellowTeam.forEach(yt => yt.isControlled = false);
                    p.isControlled = true;
                }
            }
        }

        if (p.team === 'blue') {
            if (ball.isPossessedBy === p) {
                let tx = 0 - p.x; let ty = 600 - p.y;
                let dist = Math.sqrt(tx*tx + ty*ty);
                p.facingX = tx/dist; p.facingY = ty/dist;
                p.x += p.facingX * (speed * 0.8); p.y += p.facingY * (speed * 0.8);
                if (p.x < 500 && Math.random() < 0.05) {
                    ball.vx = p.facingX * 25; ball.vy = p.facingY * 25; ball.isPossessedBy = null;
                }
            } else if (p === closestBlue && (!ball.isPossessedBy || ball.isPossessedBy.team !== 'blue')) {
                let tx = ball.x - p.x; let ty = ball.y - p.y;
                let dist = Math.sqrt(tx*tx + ty*ty);
                if (dist > 0) { p.x += (tx/dist) * (speed * 0.7); p.y += (ty/dist) * (speed * 0.7); }
            } else {
                let targetX = p.baseX + (ball.x - 1000) * 0.2;
                p.x += (targetX - p.x) * 0.05; p.y += (p.baseY - p.y) * 0.05;
            }
        }

        if (p.team === 'yellow' && !p.isControlled) {
            // Yellow Counter-Attacking Defense: Closest player aggressively tackles, rest fall back
            if (ball.isPossessedBy && ball.isPossessedBy.team === 'blue' && p === closestYellow) {
                let tx = ball.x - p.x; let ty = ball.y - p.y;
                let dist = Math.sqrt(tx*tx + ty*ty);
                if (dist > 0) { p.x += (tx/dist) * (speed * 0.75); p.y += (ty/dist) * (speed * 0.75); }
            } else {
                let targetX = p.baseX + (ball.x - 1000) * 0.2;
                p.x += (targetX - p.x) * 0.05; p.y += (p.baseY - p.y) * 0.05;
            }
        }

        p.x = Math.max(0, Math.min(WORLD_WIDTH, p.x));
        p.y = Math.max(0, Math.min(WORLD_HEIGHT, p.y));
    });

    let targetCameraX = ball.x - (camera.width / 2);
    let targetCameraY = ball.y - (camera.height / 2);
    targetCameraX = Math.max(0, Math.min(WORLD_WIDTH - camera.width, targetCameraX));
    targetCameraY = Math.max(0, Math.min(WORLD_HEIGHT - camera.height, targetCameraY));
    camera.x += (targetCameraX - camera.x) * 0.1; camera.y += (targetCameraY - camera.y) * 0.1;
}
