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

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.broadcast.emit('user connected');

    players[socket.id] = {
        x: 0,
        y: 0,
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

    socket.on('move', (room, direction) => {
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
        io.to(room).emit('updatePlayers', players);
    });

    socket.on('placeBomb', ({ x, y }) => {
        bombs.push({ x, y });
        io.emit('updateBombs', bombs);

        setTimeout(() => {
            bombs = bombs.filter(bomb => bomb.x !== x || bomb.y !== y);
            io.emit('updateBombs', bombs);
        }, 5000);
    });

    socket.on('createGame', (gameName) => {
        console.log("create", gameName);
        const gameExists = activeDepts.includes(gameName);
        if (!gameExists) {
            activeDepts.push(gameName);
            console.log('Creating game: ' + gameName);
            socket.join(gameName);
            io.emit('gameCreated', gameName);
            io.emit('updateDept', activeDepts);
        } else {
            console.error('Game already exists: ' + gameName);
            socket.emit('gameExistsError', gameName);
        }
    });

    socket.on('getDept', () => {
        socket.emit('updateDept', activeDepts);
    });

    socket.on('createDept', (deptName) => {
        console.log("create", deptName);
        const deptExists = activeDepts.includes(deptName);
        if (!deptExists) {
            activeDepts.push(deptName);
            console.log('Creating dept: ' + deptName);
            socket.join(deptName);
            io.emit('deptCreated', deptName);
            io.emit('updateDept', activeDepts);
        } else {
            console.error('Department already exists: ' + deptName);
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
            console.log("Join dept: " + dept);
        } else {
            console.error('Dept does not exist: ' + dept);
        }
    });

    socket.on('invite', (dept, invitedUserId) => {
        console.log('invite user ' + invitedUserId + ' to dept: ' + dept);
        if (io.sockets.adapter.rooms.has(dept)) {
            io.to(invitedUserId).emit('invitation', dept);
        } else {
            console.error('The dept does not exist: ' + dept);
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

    socket.on('joinRoom', (roomName) => {
        io.emit('redirectToBombermanPage', roomName);
    });

});

server.listen(PORT, () => {
    console.log('Server IP: http://' + ip.address() + ":" + PORT);
});
