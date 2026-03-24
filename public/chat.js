// public/chat.js

const socket = io();

// Get DOM elements
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');
const photoInput = document.getElementById('photo-input');
const userListContainer = document.getElementById('user-list');

// Send message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default form submission
    const message = messageInput.value;
    if (message) {
        socket.emit('chat message', message); // Emit chat message event
        messageInput.value = ''; // Clear input field
    }
});

// Handle incoming messages
socket.on('chat message', (msg) => {
    const msgElement = document.createElement('li');
    msgElement.textContent = msg;
    messagesContainer.appendChild(msgElement); // Append message to messages container
});

// Handle photo upload
photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            socket.emit('photo upload', event.target.result); // Emit photo upload event
        };
        reader.readAsDataURL(file); // Read file as Data URL
    }
});

// Handle incoming photos
socket.on('photo upload', (photo) => {
    const imgElement = document.createElement('img');
    imgElement.src = photo;
    messagesContainer.appendChild(imgElement); // Append photo to messages container
});

// Update user list
socket.on('update user list', (users) => {
    userListContainer.innerHTML = ''; // Clear current user list
    users.forEach(user => {
        const userElement = document.createElement('li');
        userElement.textContent = user;
        userListContainer.appendChild(userElement); // Append user to user list
    });
});

// Event handler for user joining
socket.on('user joined', (user) => {
    console.log(`${user} has joined the chat`);
});

// Event handler for user leaving
socket.on('user left', (user) => {
    console.log(`${user} has left the chat`);
});
