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
const playersInDept = {}
const playersIntoRoom = {}

// Predefined positions for up to 4 players
const predefinedPositions = [
    { x: 40, y: 40 },
    { x: 520, y: 520 },
    { x: 40, y: 520 },
    { x: 520, y: 40 }
];

io.on('connection', (socket) => {
    console.log('A user connected');
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
        const playerDept = players[socket.id]?.room;
        if (playerDept) {
            depts[playerDept] = depts[playerDept].filter(id => id !== socket.id);
        }
        delete players[socket.id];
        io.emit('updatePlayers', players);
        socket.broadcast.emit('user disconnected');
    });

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

    socket.on('getDept', () => {
        socket.emit('updateDept', activeDepts);
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

    socket.on('joinDept', (deptName) => {
        // Initialize player count for the department if it doesn't exist
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
            players[socket.id] = predefinedPositions[0]
        } else if (!playersIntoRoom[deptName]['player2']) {
            playersIntoRoom[deptName]['player2'] = predefinedPositions[1];
            players[socket.id] = predefinedPositions[1]
        } else if (!playersIntoRoom[deptName]['player3']) {
            playersIntoRoom[deptName]['player3'] = predefinedPositions[2];
            players[socket.id] = predefinedPositions[2]
        } else if (!playersIntoRoom[deptName]['player4']) {
            playersIntoRoom[deptName]['player4'] = predefinedPositions[3];
            players[socket.id] = predefinedPositions[3]
        }

        console.log(playersInDept, playersIntoRoom);
        console.log(players[socket.id])
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

    /*socket.on('joinDept', (deptName) => {
        console.log(deptName, activeDepts, depts);
        if (!depts[deptName]) {
            console.log(depts[deptName]);
            depts[deptName] = [];
        }
        if (depts[deptName].length >= 4) {
            socket.emit('roomFull', deptName);
            socket.disconnect(true);  // Forcefully disconnect the socket
            return;
        }

        // Assign the next available predefined position
        const position = predefinedPositions[depts[deptName].length];
        players[socket.id] = {
            ...position,
            room: deptName,
        };

        depts[deptName].push(socket.id);
        socket.join(deptName);
        console.log(`User joined room: ${deptName}`);

        socket.emit('updateDept', activeDepts);
        io.to(deptName).emit('updatePlayers', getPlayersInDept(deptName));
        socket.emit('updateBombs', bombs);
        io.emit('redirectToBombermanPage', deptName);
    });*/
});

// Utility function to get players in a specific room
const getPlayersInDept = (deptName) => {
    const roomPlayers = depts[deptName] || [];
    const roomPlayersInfo = {};
    roomPlayers.forEach(playerId => {
        roomPlayersInfo[playerId] = players[playerId];
    });
    return roomPlayersInfo;
};

server.listen(PORT, () => {
    console.log('Server IP: http://' + ip.address() + ":" + PORT);
});
