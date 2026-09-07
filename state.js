const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1200;
const camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };

const keys = {};
let charge = 0;
let chargingAction = null; 

let ball = { 
    x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, 
    radius: 8, vx: 0, vy: 0, isPossessedBy: null 
};

// Fixed Spawning: Player (Yellow) is on the left, AI (Blue) is on the right
const createTeam = (teamColor, isPlayerTeam) => {
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
        ...p, x: p.baseX, y: p.baseY, team: teamColor,
        isControlled: isPlayerTeam && p.role === 'ST',
        radius: 15, facingX: dir, facingY: 0
    }));
};

const yellowTeam = createTeam('yellow', true);
const blueTeam = createTeam('blue', false);
const allPlayers = [...yellowTeam, ...blueTeam];

// Give Yellow the ball first
ball.isPossessedBy = yellowTeam.find(p => p.role === 'ST');

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
