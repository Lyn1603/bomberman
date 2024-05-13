const socket = io('http://localhost:3000');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const blockSize = 40; // Définition de la taille du bloc

const bombSize = blockSize / 2;
const playerSize = blockSize / 2;

let players = {};
let bombs = [];
let lastDirection = ''; // Variable pour stocker la dernière direction
let isPlayerDead = false



// Dessine un joueur
function drawPlayer(player) {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, playerSize, playerSize);
}

// Dessine toutes les bombes
function drawBombs() {
    ctx.fillStyle = 'red';
    bombs.forEach(bomb => {
        ctx.beginPath();
        ctx.arc(bomb.x + bombSize / 2, bomb.y + bombSize / 2, bombSize / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Dessine tous les joueurs
function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let playerId in players) {
        drawPlayer(players[playerId]);
    }
}

// Gère les mouvements des joueurs
document.addEventListener('keydown', (event) => {
    // Vérifie si le joueur est mort
    if (isPlayerDead) {
        return; // Ne rien faire si le joueur est mort
    }
    let direction = '';
    switch(event.key) {
        case 'z':
            direction = 'Up';
            break;
        case 'q':
            direction = 'Left';
            break;
        case 's':
            direction = 'Down';
            break;
        case 'd':
            direction = 'Right';
            break;
        default:
            return; // Ne rien faire pour d'autres touches
    }
    socket.emit('move', direction);
    lastDirection = direction; // Met à jour la dernière direction

});

// Gère le dépôt de bombes
document.addEventListener('keydown', (event) => {
    // Vérifie si le joueur est mort
    if (isPlayerDead) {
        return; // Ne rien faire si le joueur est mort
    }

    if (event.key === ' ') {
        let bombX = players[socket.id].x;
        let bombY = players[socket.id].y;

        // Ajuste les coordonnées de la bombe en fonction de la direction du joueur
        switch (lastDirection) {
            case 'Up':
                bombY -= blockSize;
                break;
            case 'Down':
                bombY += blockSize;
                break;
            case 'Left':
                bombX -= blockSize;
                break;
            case 'Right':
                bombX += blockSize;
                break;
        }

        socket.emit('placeBomb', { x: bombX, y: bombY });
    }
});


// Met à jour le jeu
function updateGame() {
    drawPlayers();
    drawBombs();
}

// Gère la réception des mouvements des autres joueurs
socket.on('updatePlayers', (data) => {
    players = data;
    updateGame();
});

// Gère la réception des bombes placées par les joueurs
socket.on('updateBombs', (data) => {
    bombs = data;
    updateGame();
});

// Gère la réception de la mort d'un joueur
socket.on('playerDead', (playerId) => {
    if (playerId === socket.id) {
        isPlayerDead = true
        console.log('You died!');

    } else {
        console.log('Another player died');
    }
});
