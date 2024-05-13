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

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.broadcast.emit('user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.broadcast.emit('user disconnected');
    });
    socket.on('message', (msg) => {
        console.log('message: ' + msg);
        io.emit('message', msg);
    });
    
    socket.on('room', (room, msg) => {
        console.log('room: ' + room + ' message: ' + msg);
        io.to(room).emit('message', msg);
    });

    socket.on('join', (room) => {
        console.log('join room: ' + room);
        if (io.sockets.adapter.rooms.has(room)) {
            socket.join(room);
            io.to(room).emit('join', room);
        } else {
            console.error('Room does not exist: ' + room);
        }
    });

    socket.on('invite', (room, invitedUserId) => {
        console.log('invite user ' + invitedUserId + ' to room: ' + room);
        if (io.sockets.adapter.rooms.has(room)) {
            io.to(invitedUserId).emit('invitation', room);
        } else {
            console.error('The room does not exist' + room)        }
    });

    socket.on('leave', (room) => {
        console.log('leave room: ' + room);
        socket.leave(room);
        io.to(room).emit('leave', room);
    });

    socket.on('createRoom', (roomName) => {
        console.log('Creating room: ' + roomName);
        socket.join(roomName);
        io.emit('roomCreated', roomName);
    });

})


server.listen(PORT, () => {
    console.log('Server ip : http://' +ip.address() +":" + PORT);
})

