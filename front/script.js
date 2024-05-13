const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('message', (msg) => {
    displayMessage(msg);
});

socket.on('join', (room) => {
    console.log('Joined room: ' + room);
});

socket.on('leave', (room) => {
    console.log('leave room: ' + room);
});

socket.on('deleteRoom', (room) => {
    console.log('delete room: ' + room);
});
socket.on('invitation', (room) => {
    const accept = confirm(`You've been invited to join room "${room}". Do you accept?`);
    if (accept) {
        socket.emit('join', room);
        console.log('Joined room: ' + room);
    }
});

/*function sendMessage() {
    const message = document.getElementById('messageInput').value;
    socket.emit('message', message);
}*/

function leaveRoom() {
    const room = document.getElementById('roomInput').value;
    socket.emit('leave', room);
}

function joinRoom() {
    const room = document.getElementById('roomInput').value;
    socket.emit('join', room);
}

function inviteUser() {
    const room = document.getElementById('roomInput').value;
    const invitedUserId = document.getElementById('inviteUserId').value;
    socket.emit('invite', room, invitedUserId);
}

function createRoom() {
    const roomName = document.getElementById('newRoomInput').value;
    socket.emit('createRoom', roomName);
}
function deleteRoom(room) {
    socket.emit('deleteRoom', room);
}



function displayMessage(msg) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    messagesDiv.appendChild(messageElement);
}