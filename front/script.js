const socket = io('http://localhost:3000');

socket.on('connect', () => {
    getDept();
});

// Function to request the list of active departments from the server
function getDept() {
    socket.emit('getDept');
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

// Update the list of departments when received from the server
socket.on('updateDept', (depts) => {
    const deptsList = document.getElementById('deptsList');
    deptsList.innerHTML = '';
    depts.forEach((dept, index) => {
        const deptElement = document.createElement('div');
        deptElement.textContent = dept;
        deptElement.classList.add('dept-card');
        deptElement.addEventListener('click', () => {
            joinDept(dept);
        });
        deptsList.appendChild(deptElement);
        if (index === depts.length - 1) {
            // Create a "create" card for the last department
            const createCard = document.createElement('div');
            createCard.id = 'createCard';
            createCard.classList.add('create-card');
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

// Join a department
function joinDept(dept) {
    socket.emit('joinDept', dept);
    window.location.href = `game.html?dept=${dept}`;
}

socket.on('roomFull', () => {
    alert('Room is full!');
    window.location.href = `index.html`;
});