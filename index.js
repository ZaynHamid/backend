import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const users = {};
const messageHistory = {};

io.on('connection', (socket) => {
    socket.on('name', (info) => {
        const { name, code } = info;
        socket.join(code);
        users[socket.id] = { name, code };

        if (messageHistory[code]) {
            messageHistory[code].forEach(msg => {
                socket.emit('msg', msg);
            });
        }

        io.to(code).emit('msg', `${name} has joined the room ${code}`);
    });

    socket.on('chat message', (data) => {
        const { msg, name, code } = data;
        const message = `${name}: ${msg}`;

        if (!messageHistory[code]) {
            messageHistory[code] = [];
        }
        messageHistory[code].push(message);

        io.to(code).emit('msg', message);
    });

    socket.on("insertedInfo", (info) => {
        const { insertedCode, insertedName } = info;
        socket.join(insertedCode);
        users[socket.id] = { name: insertedName, code: insertedCode };

        if (messageHistory[insertedCode]) {
            messageHistory[insertedCode].forEach(msg => {
                socket.emit('msg', msg);
            });
        }

        io.to(insertedCode).emit('msg', `${insertedName} has joined the room ${insertedCode}`);
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            const { name, code } = user;
            io.to(code).emit('msg', `${name} has left the room`);
            delete users[socket.id];
        }
    });
});

app.get('/', (req, res) => {
    res.send('Socket.IO server is running');
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
