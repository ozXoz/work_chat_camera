const path = require('path');
const express = require('express');
const http = require('http');
const app = express();
const socketio = require('socket.io');
const formatMessage = require('./public/utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./public/utils/users');
const server = http.createServer(app);
const io = socketio(server);
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const ChatMessagee = require('./public/models/ ChatMessageSchema')
const User = require('./public/models/UserSchema')
app.use(express.json())
// Set static folder
// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://test:test123@week04.thgujhs.mongodb.net/?retryWrites=true&w=majority",
    "mongodb+srv://test:test@cluster0.t0kjdo0.mongodb.net/testApp?retryWrites=true&w=majority",
       { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err))
app.use(express.static(path.join(__dirname, 'public')));
const botName = 'Welcome to Our Web Chat ! this is virtual writing in hereee';
// Run when client connects

// Serve the index page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html")
})

// Serve the sign up page
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/public/signup.html")
})

// Route to handle Sign Up
app.post("/signup", (req, res) => {
  const { username, password } = req.body
  const user = new User({ username, password })
  user.save((err) => {
    if (err) {
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" })
    }
    return res.status(200).json({ success: true })
  })
})

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html")
})

// Route to handle Log In
app.post("/login", (req, res) => {
  const { username, password } = req.body
  User.findOne({ username }, (err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .json({ success: false, error: "Incorrect username or password" })
    }
    if (user.password !== password) {
      return res
        .status(400)
        .json({ success: false, error: "Incorrect username or password" })
    }
    return res.status(200).json({ success: true })
  })
})
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    if (!user) {
      return;
    }

    socket.join(user.room);
    socket.emit('message', formatMessage(botName, '~~~~~ Welcome~~~~~~~'))
    socket.broadcast.to(user.room)
      .emit('message', formatMessage(botName, `A ${user.username} user has joined the chat`));
    // send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });

  });

  // listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    if (!user) {
      return;
    }
    io.to(user.room).emit('message', formatMessage(user.username, msg))
  });

  

socket.on('disconnect', () => {
  const user = userLeave(socket.id);

  if (!user) {
    return;
  }

  io.to(user.room).emit('message', formatMessage(botName, `${user.username} has been left the chat !!!`));

  // send users and room info
  const roomUsers = getRoomUsers(user.room);
  if (roomUsers) {
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: roomUsers
    });
  }
});

// ...

});

const PORT = 3333 || process.env.PORT;

server.listen(PORT, () => console.log(`server is running on port ${PORT}`));
