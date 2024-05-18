const socket = io('http://localhost:3000');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d')

const blockSize = 40; // Définition de la taille du bloc

const bombSize = blockSize ;
const playerSize = blockSize ;

const numRows = 15; // Nombre de lignes
const numCols = 15; // Nombre de colonnes

function getRoom() {
    const sPageURL = window.location.search.substring(1);
    const sURLVariables = sPageURL.split('&');
    for (let i = 0; i < sURLVariables.length; i++) {
        const sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === 'dept') {
            return sParameterName[1];
        }
    }
}
let room = getRoom()
console.log(room)

// Tableau représentant la disposition des éléments dans votre jeu
const gameMap = [
    "spppppppppppppp",
    "sssbbbbbbbbbssp",
    "pspbpbpbpbpbpsp",
    "pbbbbbbbbbbbbbp",
    "pbpbpbpbpbpbpbp",
    "pbbbbbbbbbbbbbp",
    "pbpbpbpbpbpbpbp",
    "pbbbbbbbbbbbbbp",
    "pbpbpbpbpbpbpbp",
    "pbbbbbbbbbbbbbp",
    "pbpbpbpbpbpbpbp",
    "pbbbbbbbbbbbbbp",
    "pspbpbpbpbpbpsp",
    "pssbbbbbbbbbssp",
    "ppppppppppppppp"
];

let players = {};
let bombs = [];
let lastDirection = ''; // Variable pour stocker la dernière direction
let isPlayerDead = false

let elapsedTime = 0; // Temps écoulé en secondes
const gameTimeLimit = 60; // Limite de temps en secondes (1 minute)


// Chargement des images
const pillarImg = new Image();
pillarImg.src = 'assets/pillar.png'; // Chemin vers l'image du pilier

const brickImg = new Image();
brickImg.src = 'assets/brick.png'; // Chemin vers l'image de la brique

const floorImg = new Image();
floorImg.src = 'assets/floor.png'; // Chemin vers l'image du sol

const playerImg = new Image();
playerImg.src = 'assets/player1.png'; // Chemin vers l'image du joueur

const bombImg = new Image();
bombImg.src = 'assets/bomb.png';

// Dessine un joueur
function drawPlayer(player) {
    ctx.drawImage(playerImg, player.x, player.y, playerSize, playerSize);
}

// Dessine toutes les bombes
function drawBombs() {
    bombs.forEach(bomb => {
        ctx.drawImage(bombImg, bomb.x, bomb.y, bombSize, bombSize);
    });
}

// Dessine tous les joueurs
function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGameMap();
    for (let playerId in players) {
        let player = players[playerId];
        drawPlayer(player);
    }
}


// Fonction pour dessiner les éléments sur le canvas
function drawGameMap() {
    for (let row = 0; row < numRows; row++) {

        for (let col = 0; col < numCols; col++) {

            const tile = gameMap[row][col];
            let img;

            switch (tile) {
                case 'p':
                    img = pillarImg;
                    break;
                case 'b':
                    img = brickImg;
                    break;
                case 's':
                    img = floorImg;
                    break;
                default:
                    continue;
            }

            ctx.drawImage(img, col * blockSize, row * blockSize, blockSize, blockSize);
        }
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
    // Vérifie si le mouvement est autorisé
    if (isMovementAllowed(direction)) {
        socket.emit('move', room, direction);
        lastDirection = direction; // Met à jour la dernière direction
    }
});

function isMovementAllowed(direction) {
    let player = players[socket.id];
    let nextX = player.x;
    let nextY = player.y;
    switch (direction) {
        case 'Up':
            nextY -= blockSize;
            break;
        case 'Down':
            nextY += blockSize;
            break;
        case 'Left':
            nextX -= blockSize;
            break;
        case 'Right':
            nextX += blockSize;
            break;
        default:
            return false;
    }
    return !isObstacle(nextX, nextY);
}

function isObstacle(x, y) {
    const col = x / blockSize;
    const row = y / blockSize;
    const tile = gameMap[row][col];
    return tile === 'p' || tile === 'b';
}

canvas.addEventListener('click', (event) => {
    if (isPlayerDead) {
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const bombX = Math.floor(x / blockSize) * blockSize;
    const bombY = Math.floor(y / blockSize) * blockSize;
    socket.emit('placeBomb', { x: bombX, y: bombY });
});

socket.on('updatePlayers', (updatedPlayers) => {
    players = updatedPlayers;
    drawPlayers();
});

socket.on('updateBombs', (updatedBombs) => {
    bombs = updatedBombs;
    drawPlayers();
    drawBombs();
});

socket.on('playerDead', (deadPlayerId) => {
    if (socket.id === deadPlayerId) {
        isPlayerDead = true;
    }
});

function resetGame() {
    players = {};
    bombs = [];
    lastDirection = '';
    isPlayerDead = false;
}

resetGame();
drawGameMap();
