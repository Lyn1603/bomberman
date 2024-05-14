const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to server');
    getDept();
});

socket.on('message', (msg) => {
    displayMessage(msg);
});

socket.on('join', (dept) => {
    console.log('Joined dept: ' + dept);
});

socket.on('leave', (dept) => {
    console.log('Leave dept: ' + dept);
});

socket.on('deleteDept', (dept) => {
    console.log('Delete dept: ' + dept);
});

socket.on('invitation', (dept) => {
    const accept = confirm(`You've been invited to join dept "${dept}". Do you accept?`);
    if (accept) {
        socket.emit('join', dept);
        console.log('Joined dept: ' + dept);
    }
});

// Update the list of departments when received from the server
socket.on('updateDept', (depts) => {
    console.log('Update depts: ' + depts);
    const deptsList = document.getElementById('deptsList');
    deptsList.innerHTML = '';
    depts.forEach((dept, index) => {
        const deptElement = document.createElement('div');
        deptElement.textContent = dept;
        deptElement.classList.add('dept-card'); // Add class to style the card
        deptsList.appendChild(deptElement);
        if (index === depts.length - 1) {
            // Create a "create" card for the last department
            const createCard = document.createElement('div');
            createCard.id = 'createCard'; // Assign ID to the create card
            createCard.classList.add('create-card'); // Add class to style the card
            const input = document.createElement('input');
            input.id = 'newDeptInput';
            input.classList.add('newDeptInput');
            input.type = 'text';
            input.placeholder = 'New dept';
            const button = document.createElement('button');
            button.textContent = '✔';
            button.classList.add('create-button'); // Add class to style the card
            button.addEventListener('click', () => {
                createDept(input.value);
            });
            createCard.appendChild(input);
            createCard.appendChild(button);
            deptsList.appendChild(createCard);
        }
    });
});

// Function to request the list of active departments from the server
function getDept() {
    socket.emit('getDept');
}

// Function to leave a department
function leaveDept() {
    const dept = document.getElementById('deptInput').value;
    socket.emit('leave', dept);
}

// Join a department
function joinDept() {
    const dept = document.getElementById('deptInput').value;
    console.log(dept)
    socket.emit('join', dept);
}

// Invite to a department
function inviteUser() {
    const dept = document.getElementById('deptInput').value;
    const invitedUserId = document.getElementById('inviteUserId').value;
    socket.emit('invite', dept, invitedUserId);
}

// Create a new department
function createDept() {
    const deptName = document.getElementById('newDeptInput').value;
    if (!deptName) return;
    socket.emit('createDept', deptName);
}

// Delete a department
function deleteDept(dept) {
    socket.emit('deleteDept', dept);
}

// Display a message in the UI
function displayMessage(msg) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    messagesDiv.appendChild(messageElement);
}
