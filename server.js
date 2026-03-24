const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Store active users
const users = {};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Upload photo endpoint
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const photoUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, photoUrl: photoUrl });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // User joins chat
  socket.on('join', (name) => {
    users[socket.id] = name;
    io.emit('userJoined', {
      name: name,
      message: `${name} joined the chat!`,
      timestamp: new Date().toLocaleTimeString()
    });
    io.emit('updateUserList', Object.values(users));
    console.log(`${name} joined the chat`);
  });

  // Handle chat messages
  socket.on('message', (data) => {
    const userName = users[socket.id];
    io.emit('message', {
      name: userName,
      message: data.message,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // Handle photo messages
  socket.on('photoMessage', (data) => {
    const userName = users[socket.id];
    io.emit('photoMessage', {
      name: userName,
      photoUrl: data.photoUrl,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // User disconnects
  socket.on('disconnect', () => {
    const userName = users[socket.id];
    delete users[socket.id];
    if (userName) {
      io.emit('userLeft', {
        name: userName,
        message: `${userName} left the chat!`,
        timestamp: new Date().toLocaleTimeString()
      });
      io.emit('updateUserList', Object.values(users));
      console.log(`${userName} disconnected`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});