const socket = io('http://localhost:3000');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d')

const blockSize = 40; // Définition de la taille du bloc

const bombSize = blockSize / 2;
const playerSize = blockSize / 2;

const numRows = 15; // Nombre de lignes
const numCols = 15; // Nombre de colonnes

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
let isPlayerDead = false



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
function  drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let playerId in players) {
        drawPlayer(players[playerId]);
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

// Met à jour le jeu
// Met à jour le jeu
function updateGame() {
    drawBombs();   // Dessine ensuite les bombes
    drawPlayers(); // Puis dessine les joueurs
    drawGameMap();   // Dessine d'abord les éléments de la scène (décors, obstacles, etc.)


}
