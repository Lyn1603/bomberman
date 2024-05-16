import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
})
app.use(cors())

const PORT = process.env.PORT || 3000;

const blockSize = 40; // Définition de la taille du bloc

const players = {};
let bombs = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Client connected');

    players[socket.id] = {
        x: 40, // Position initiale X
        y: 40, // Position initiale Y
    };

    // Met à jour tous les joueurs
    socket.emit('updatePlayers', players);

    // Met à jour toutes les bombes
    socket.emit('updateBombs', bombs);

    // Gère les mouvements des joueurs
    socket.on('move', (direction) => {
        // Vérifie si le joueur est mort
        if (players[socket.id] === undefined) {
            return; // Ne rien faire si le joueur est mort
        }

        // Met à jour la position du joueur
        if (direction === 'Up') {
            players[socket.id].y -= blockSize;
        } else if (direction === 'Down') {
            players[socket.id].y += blockSize;
        } else if (direction === 'Left') {
            players[socket.id].x -= blockSize;
        } else if (direction === 'Right') {
            players[socket.id].x += blockSize;
        }

        // Vérifie les collisions avec les bombes
        bombs.forEach(bomb => {
            if (players[socket.id].x === bomb.x && players[socket.id].y === bomb.y) {
                // Envoie un événement indiquant que le joueur est mort
                io.emit('playerDead', socket.id);
            }
        });

        // Met à jour tous les joueurs
        io.emit('updatePlayers', players);
    });


// Gère le dépôt de bombes
    socket.on('placeBomb', ({ x, y }) => {
        bombs.push({ x, y });

        // Envoie les bombes mises à jour à tous les clients
        io.emit('updateBombs', bombs);

        // Planifie la suppression de la bombe après 5 secondes
        setTimeout(() => {
            bombs = bombs.filter(bomb => bomb.x !== x || bomb.y !== y);
            io.emit('updateBombs', bombs);
        }, 5000);

    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});