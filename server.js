const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const server = app.listen(8080, () => {
    console.log("Listening to port 8080...")
});

const io = require('socket.io')(server);


app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'html');
app.use(express.static(__dirname + "/public"))


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

const chat_namespace = io.of('/chat');
var users = [];

chat_namespace.on('connection', socket => {
    console.log(`Client ${socket.conn.id} connected to /chat namespace`);

    socket.on('disconnect', (data) => {
        console.log(`Client ${socket.conn.id} disconnected from /chat namespace`);
        // Tell everyone that you left the chat room
        chat_namespace.emit('userLeft', users[socket.conn.id]);
        delete users[socket.conn.id];
        // Tell everyone about new total number of active user
        chat_namespace.emit('count', Object.keys(users).length);
    });

    socket.on('sendMessage', data => {
        // Tell other except current session that new message is sent
        socket.broadcast.emit('newMessage', data)
    });

    socket.on('userJoin', data => {
        // Tell other except current session that new user join chat 
        socket.broadcast.emit('newUser', data);
        users[socket.conn.id] = data.username;
        // Tell everyone about total number of active user
        chat_namespace.emit('count', Object.keys(users).length);
    });

    socket.on('userTyping', data => {
        // Tell other except current session that you are typing
        data.sessionId = socket.conn.id;
        socket.broadcast.emit('userTyping', data);
    });

    socket.on('userStopTyping', data => {
        // Tell other except current session that you stop typing
        data.sessionId = socket.conn.id;
        socket.broadcast.emit('userStopTyping', data);
    });
});
