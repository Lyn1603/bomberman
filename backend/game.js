import express from 'express';
import http from 'http';
import ip from 'ip';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const io = new Server(server, {
    cors: {
        origin: '*',
    }
})

app.use(cors())

app.get('/', (req, res) => {
    res.json('ip address: http://' + ip.address()+':'+PORT);
});

const activeDepts = ["default"];
const blockSize = 40; // Définition de la taille du bloc
const players = {};
let bombs = [];

app.use(express.static('public'));


io.on('connection', (socket) => {
    console.log('a user connected');

    console.log('Client connected');
    socket.emit('createNewGame', )
    players[socket.id] = {
        x: 0, // Position initiale X
        y: 0, // Position initiale Y
    };

    socket.broadcast.emit('user connected');

    console.log('Client connected');
    socket.emit('createNewGame', )
    players[socket.id] = {
        x: 0, // Position initiale X
        y: 0, // Position initiale Y
    };

    // Met à jour tous les joueurs
    socket.emit('updatePlayers', players);

    // Met à jour toutes les bombes
    socket.emit('updateBombs', bombs);

    // Gère les mouvements des joueurs
    socket.on('move', (direction) => {
        // socket.emit('createDept', room)
        // console.log(room, direction);
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
        // // io.to(room).emit('updatePlayers', players);
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
        console.log('user disconnected');
        socket.broadcast.emit('user disconnected');
    });

    // When a client requests the list of active dept, send it to them
    socket.on('getDept', () => {
        let noDept = activeDepts.length === 0
        console.log(activeDepts, noDept)
        if (!noDept) {
            const name = "Default Department"
            console.log('helo', typeof(name))
            socket.emit('updateDept', activeDepts);
            console.log(name)
        }
        socket.emit('updateDept', activeDepts);
    })

    // Handle createDept event
    socket.on('createDept', (deptName) => {
        console.log("create", deptName)
        const deptExists = activeDepts.includes(deptName)
        if (!deptExists) {
            activeDepts.push(deptName);
            console.log('Creating dept: ' + deptName);
            socket.join(deptName);
            io.emit('deptCreated', deptName);
            io.emit('updateDept', activeDepts);
        } else {
            console.error('Department already exists: ' + deptName);
            // Send an error message to the client if the department already exists
            socket.emit('deptExistsError', deptName);
        }
    });

    socket.on('message', (msg) => {
        console.log('message: ' + msg);
        io.emit('message', msg);
    });

    socket.on('dept', (dept, msg) => {
        console.log('dept: ' + dept + ' message: ' + msg);
        io.to(dept).emit('message', msg);
    });

    socket.on('join', (dept) => {
        const roomExists = io.sockets.adapter.rooms.has(dept);
        if (roomExists) {
            socket.join(dept);
            console.log("Join dept: " + dept)
        } else {
            console.error('Dept does not exist: ' + dept);
        }
    });

    socket.on('invite', (dept, invitedUserId) => {
        console.log('invite user ' + invitedUserId + ' to dept: ' + dept);
        if (io.sockets.adapter.rooms.has(dept)) {
            io.to(invitedUserId).emit('invitation', dept);
        } else {
            console.error('The dept does not exist' + dept)        }
    });

    socket.on('leave', (dept) => {
        console.log('leave dept: ' + dept);
        socket.leave(dept);
        io.to(dept).emit('leave', dept);
    });

    // Handle deleteDept event
    socket.on('deleteDept', (deptName) => {
        const index = activeDepts.indexOf(deptName);
        if (index !== -1) {
            activeDepts.splice(index, 1);
            io.emit('updateDept', activeDepts);
        }
    });

    socket.on('joinRoom', (roomName) => {
        io.emit('redirectToBombermanPage', roomName);
    });

})

server.listen(PORT, () => {
    console.log('Server ip : http://' +ip.address() +":" + PORT);
})

