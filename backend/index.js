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

const activeDepts = ["je"];

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.broadcast.emit('user connected');

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

