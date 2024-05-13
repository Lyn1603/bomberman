const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('message', (msg) => {
    displayMessage(msg);
});

socket.on('join', (dept) => {
    console.log('Joined dept: ' + dept);
});

socket.on('leave', (dept) => {
    console.log('leave dept: ' + dept);
});

socket.on('deleteDept', (dept) => {
    console.log('delete dept: ' + dept);
});

socket.on('invitation', (dept) => {
    const accept = confirm(`You've been invited to join dept "${dept}". Do you accept?`);
    if (accept) {
        socket.emit('join', dept);
        console.log('Joined dept: ' + dept);
    }
});

socket.on('updateDept', (dept) => {
    console.log('update dept: ' + dept);
    const deptList = document.getElementById('deptList')
})
/*function sendMessage() {
    const message = document.getElementById('messageInput').value;
    socket.emit('message', message);
}*/

function leaveDept() {
    const dept = document.getElementById('deptInput').value;
    socket.emit('leave', dept);
}

function joinDept() {
    const dept = document.getElementById('deptInput').value;
    socket.emit('join', dept);
}

function inviteUser() {
    const dept = document.getElementById('deptInput').value;
    const invitedUserId = document.getElementById('inviteUserId').value;
    socket.emit('invite', dept, invitedUserId);
}

function createDept() {
    const deptName = document.getElementById('newDeptInput').value;
    socket.emit('createDept', deptName);
}
function deleteDept(dept) {
    socket.emit('deleteDept', dept);
}

function displayMessage(msg) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    messagesDiv.appendChild(messageElement);
}

function getdept() {
    socket.emit('getdept');
}
