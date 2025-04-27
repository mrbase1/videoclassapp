const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://mrbase1.com/vidclass', // Replace with your Netlify/Vercel URL
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary signature endpoint
app.post('/sign-upload', (req, res) => {
    const { publicId, resourceType } = req.body;
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        { public_id: publicId, timestamp, resource_type: resourceType },
        process.env.CLOUDINARY_API_SECRET
    );
    res.json({ signature, timestamp, apiKey: process.env.CLOUDINARY_API_KEY });
});

const users = new Map();
let instructorId = null;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', ({ id, role }) => {
        if (role === 'instructor') {
            instructorId = id; // Track instructor's ID
        }
        users.set(id, { socketId: socket.id, role });
        socket.join('classroom');
        io.to('classroom').emit('userJoined', { id, role, instructorId });
    });

    socket.on('chatMessage', ({ message, sender }) => {
        io.to('classroom').emit('chatMessage', { message, sender });
    });

    socket.on('fileShare', ({ fileName, data, sender }) => {
        io.to('classroom').emit('fileShare', { fileName, data, sender });
    });

    socket.on('whiteboardUpdate', (data) => {
        socket.to('classroom').emit('whiteboardUpdate', data);
    });

    socket.on('raiseHand', ({ id }) => {
        io.to('classroom').emit('handRaised', { id });
    });

    socket.on('muteAll', () => {
        socket.to('classroom').emit('mute');
    });

    socket.on('unmuteAll', () => {
        socket.to('classroom').emit('unmute');
    });

    socket.on('muteStudent', ({ studentId }) => {
        const user = users.get(studentId);
        if (user) {
            io.to(user.socketId).emit('mute');
        }
    });

    socket.on('grantPermission', ({ studentId, permission }) => {
        const user = users.get(studentId);
        if (user) {
            io.to(user.socketId).emit('permissionGranted', { permission });
        }
    });

    socket.on('createBreakout', ({ roomName }) => {
        io.to('classroom').emit('breakoutCreated', { roomName });
    });

    socket.on('startRecording', () => {
        // Notify clients if needed
    });

    socket.on('stopRecording', () => {
        // Notify clients if needed
    });

    socket.on('disconnect', () => {
        users.forEach((value, key) => {
            if (value.socketId === socket.id) {
                users.delete(key);
                if (key === instructorId) {
                    instructorId = null; // Clear instructorId if instructor disconnects
                }
                io.to('classroom').emit('userLeft', { id: key, instructorId });
            }
        });
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));