var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));

var numUsers = {'main': 0, 'movies': 0, 'auto': 0};

io.on('connection', function (socket) {

    var addedUser = false;
    var room = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        socket.broadcast.to(room).emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username, userRoom) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        socket.join(userRoom);
        ++numUsers[userRoom];
        room = userRoom;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers[userRoom]
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.to(userRoom).emit('user joined', {
            username: socket.username,
            numUsers: numUsers[userRoom]
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.to(room).emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.to(room).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers[room];

            // echo globally that this client has left
            socket.broadcast.to(room).emit('user left', {
                username: socket.username,
                numUsers: numUsers[room]
            });
        }
    });

});
