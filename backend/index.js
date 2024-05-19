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
});

app.use(cors());

app.get('/', (req, res) => {
    res.json('IP address: http://' + ip.address() + ':' + PORT);
});

const activeDepts = ["je"];
const blockSize = 40;
const players = {};
let bombs = [];
let depts = {};

// Number of player in a room
const playersInDept = {}

// Position of player in each room
const playersIntoRoom = {}

// Predefined positions for up to 4 players
const predefinedPositions = [
    { x: 40, y: 40 },
    { x: 520, y: 520 },
    { x: 40, y: 520 },
    { x: 520, y: 40 }
];

// Management of the connection between players
io.on('connection', (socket) => {
    console.log('A user is connected');
    socket.broadcast.emit('user connected');

    players[socket.id] = {
        x: 40,
        y: 40,
    };

    socket.emit('updateDept', activeDepts);
    socket.emit('updatePlayers', players);
    socket.emit('updateBombs', bombs);

    socket.on('disconnect', () => {
        console.log('User disconnected');

        delete players[socket.id];
        io.emit('updatePlayers', players);
        socket.broadcast.emit('user disconnected');
    });

    // Get all rooms
    socket.on('getDept', () => {
        socket.emit('updateDept', activeDepts);
    });

    // Join a room
    socket.on('joinDept', (deptName) => {
        socket.join(deptName)

        // Check if max of 4 players in a room
        if (!playersInDept[deptName]) {
            playersInDept[deptName] = 1;
        } else {
            if (playersInDept[deptName] === 4) {
                socket.emit('roomFull');
                return;
            } else {
                playersInDept[deptName]++;
            }
        }

        // Initialize the room object if it doesn't exist
        if (!playersIntoRoom[deptName]) {
            playersIntoRoom[deptName] = {
                player1: null,
                player2: null,
                player3: null,
                player4: null
            };
        }

        // Add the player to the first available slot in the room
        if (!playersIntoRoom[deptName]['player1']) {
            playersIntoRoom[deptName]['player1'] = predefinedPositions[0];
            players[socket.id] = {
                x: 40,
                y: 40,
                room: deptName
            };
            console.log("player1")
        } else if (!playersIntoRoom[deptName]['player2']) {
            playersIntoRoom[deptName]['player2'] = predefinedPositions[1];
            players[socket.id] = {
                x: 520,
                y: 520,
                room: deptName
            };
            console.log("player2")

        } else if (!playersIntoRoom[deptName]['player3']) {
            playersIntoRoom[deptName]['player3'] = predefinedPositions[2];
            players[socket.id] = {
                x: 520,
                y: 40,
                room: deptName
            };
            console.log("player3")

        } else if (!playersIntoRoom[deptName]['player4']) {
            playersIntoRoom[deptName]['player4'] = predefinedPositions[3];
            players[socket.id] = {
                x: 40,
                y: 520,
                room: deptName
            };
            console.log("player4")
        }

        io.to(deptName).emit('updatePlayers', players);

        console.log(playersIntoRoom)
        console.log(players)
    });

    // Manage a player's movement
    socket.on('move', (dept, direction) => {

        if (players[socket.id] === undefined) {
            return;
        }

        if (direction === 'Up') {
            players[socket.id].y -= blockSize;
        } else if (direction === 'Down') {
            players[socket.id].y += blockSize;
        } else if (direction === 'Left') {
            players[socket.id].x -= blockSize;
        } else if (direction === 'Right') {
            players[socket.id].x += blockSize;
        }

        bombs.forEach(bomb => {
            if (players[socket.id].x === bomb.x && players[socket.id].y === bomb.y) {
                io.emit('playerDead', socket.id);
            }
        });

        io.emit('updatePlayers', players);
        io.to(dept).emit('updatePlayers', players);
    });

    socket.on('placeBomb', ({ x, y }) => {
        bombs.push({ x, y });
        io.emit('updateBombs', bombs);

        setTimeout(() => {
            bombs = bombs.filter(bomb => bomb.x !== x || bomb.y !== y);
            io.emit('updateBombs', bombs);
        }, 5000);
    });

    socket.on('createDept', (deptName) => {
        const deptExists = activeDepts.includes(deptName);
        if (!deptExists) {
            activeDepts.push(deptName);
            socket.join(deptName);
            io.emit('deptCreated', deptName);
            io.emit('updateDept', activeDepts);
        } else {
            console.error('Department already exists: ' + deptName);
            socket.emit('deptExistsError', deptName);
        }
    });

    socket.on('leave', (dept) => {
        console.log('leave dept: ' + dept);
        socket.leave(dept);
        io.to(dept).emit('leave', dept);
    });

    socket.on('deleteDept', (deptName) => {
        const index = activeDepts.indexOf(deptName);
        if (index !== -1) {
            activeDepts.splice(index, 1);
            io.emit('updateDept', activeDepts);
        }
    });

});

server.listen(PORT, () => {
    console.log('Server IP: http://' + ip.address() + ":" + PORT);
});
