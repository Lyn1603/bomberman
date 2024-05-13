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
    
    socket.on('dept', (dept, msg) => {
        console.log('dept: ' + dept + ' message: ' + msg);
        io.to(dept).emit('message', msg);
    });

    socket.on('join', (dept) => {
        console.log('join dept: ' + dept);
        if (io.sockets.adapter.rooms.has(dept)) {
            socket.join(dept);
            io.to(dept).emit('join', dept);
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

    const activeDepts = [];

    socket.on('createDept', (deptName) => {
        activeDepts.push(deptName)
        console.log('Creating dept: ' + deptName);
        socket.join(deptName);
        io.emit('deptCreated', deptName);
        io.emit('updateDept', deptName);
    });

    // When a client requests the list of active dept, send it to them
    socket.on('getDept', (deptName) => {
        socket.emit('updateDept', deptName);
    })

})

server.listen(PORT, () => {
    console.log('Server ip : http://' +ip.address() +":" + PORT);
})

