const socket = io('http://localhost:3000');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const blockSize = 40; // Taille du bloc
const bombSize = blockSize;
const playerSize = blockSize;

const numRows = 15; // Nombre de lignes
const numCols = 15; // Nombre de colonnes

const canvasHeight = numCols * blockSize;
const canvasWidth = numRows * blockSize;

// Tableau représentant la disposition des éléments dans votre jeu
const gameMap = [
    "ppppppppppppppp",
    "pssbbbbbbbbbssp",
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
let isPlayerDead = false;

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

// Gère les mouvements et la pose de bombes des joueurs
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
        case ' ':
            if (players[socket.id]) {
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

                // Vérifie si le joueur traverse une bombe
                checkCollisions(players[socket.id]);

                // récupère les coordonnées de la bombe
                bombs.push({ x: bombX, y: bombY } )
            }
            return; // Ne rien faire d'autre pour la touche espace
        default:
            return; // Ne rien faire pour d'autres touches
    }

    // Vérifie si le mouvement est autorisé
    if (isMovementAllowed(direction)) {
        socket.emit('move', direction);
        lastDirection = direction; // Met à jour la dernière direction
    }
});

// Fonction pour vérifier si le mouvement est autorisé
function isMovementAllowed(direction) {
    let player = players[socket.id];
    if (!player) return false; // Vérifie si le joueur existe

    let nextX = player.x;
    let nextY = player.y;

    // Calcul des coordonnées du prochain mouvement
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
    }

    // Vérifie si le mouvement reste dans les limites du canvas
    if (nextX < 0 || nextX >= canvasWidth || nextY < 0 || nextY >= canvasHeight) {
        return false;
    }

    // Convertit les coordonnées en indices de tableau
    let col = Math.floor(nextX / blockSize);
    let row = Math.floor(nextY / blockSize);

    // Vérifie si la case dans la direction du mouvement contient un pilier
    return gameMap[row][col] !== 'p';
}




// Vérifie les collisions entre les joueurs et les bombes
function checkCollisions() {
    if (isPlayerDead) return;

    let player = players[socket.id];
    if (!player) return;



}

// Met à jour le jeu
function updateGame() {
    drawGameMap(); // Dessine d'abord les éléments de la scène (décors, obstacles, etc.)
    drawPlayers(); // Puis dessine les joueurs
    drawBombs();   // Dessine ensuite les bombes
    checkCollisions(); // Vérifie les collisions après la mise à jour du jeu

}

// Gère la réception des mouvements des autres joueurs
socket.on('updatePlayers', (data) => {
    players = data;
    checkCollisions(); // Vérifie les collisions après la mise à jour des joueurs
    updateGame();
});

// Gère la réception des bombes placées par les joueurs
socket.on('updateBombs', (data) => {
    bombs = data;
    checkCollisions(); // Vérifie les collisions après la mise à jour des bombes
    updateGame();
});

// Gère la réception de la mort d'un joueur
socket.on('playerDead', (playerId, bomb) => {

    if (playerId === socket.id) {
        isPlayerDead = true;
        alert(' You died ! Try again ')// Créez une nouvelle div pour l'explosion
        const explosionDiv = document.createElement('div');
        explosionDiv.classList.add('explosion');
        console.log(explosionDiv)

    } else {
        console.log('Another player died');
    }
});
