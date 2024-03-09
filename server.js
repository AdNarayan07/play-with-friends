const express = require('express');
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')
const fs = require('fs')

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'index.html'));})
const files = fs.readdirSync('client_pages')
files.forEach((file)=>{
    if(file.endsWith('.html')) {
        app.get('/'+ file.split('.')[0], function(req, res){
            res.sendFile(path.join(__dirname, 'client_pages', file));})
    }
})
app.use(express.static('./client_pages/serve'))

const socketUserMap = {};
io.on('connection', function(socket){
    console.log('A user connected to Main Socket');
    socket.on('giveMyData', (data)=>{
        if(data.user) {
            const roomdata = require('./data/rooms.json')
            const rooms = [];
            for (const x in roomdata){
                if(roomdata.hasOwnProperty(x) && roomdata[x].admin === data.user) rooms.push([x, roomdata[x].name])
            }
            const { displayName, dp } = require('./data/users.json')[data.user]
            socket.emit('yourData', { rooms, displayName, dp })
        }
    })
    socket.on('login', (data)=>{
        let userdata = require('./data/users.json')
        let { username, password } = data
        if(!userdata[username]) return socket.emit('LSresponse', {status: 0, error: "Username not found"});
        if(userdata[username].password !== password) return  socket.emit('LSresponse', {status: 0, error: "Incorrect Password"});
        socket.emit('LSresponse', {status: 1, error: null, data:{ username, message:'Logged in successfully' }})
    })
    socket.on('signup', (data)=>{
        let userdata = require('./data/users.json')
        let { username, password, displayName, dp } = data
        if(userdata[username]) return socket.emit('LSresponse', {status: 0, error: "Username already registered"});
        userdata[username] = { password, displayName, dp }
        fs.writeFileSync('./data/users.json', JSON.stringify(userdata), 'utf-8')
        socket.emit('LSresponse', {status: 1, error: null, data:{ username, message: 'Signed in' }})
    })
    socket.on('createRoom', (data)=>{
        let roomdata = require('./data/rooms.json')
        roomdata[data.roomID] = { users:[], messages:[], admin: data.user, name: data.roomName }
        fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
    })
    socket.on('joinRoom', (data)=>{
        let roomdata = require('./data/rooms.json')
        const { roomID, user } = data
        console.log(user + " Joined the room")
        if(!roomdata[roomID]) {
            console.log("no room data on joining")
            return socket.emit('joinResponse', { status: 0, error: "Incorrect room id" });
        }
        socket.join(roomID)
        let roomMembers = roomdata[roomID].users
        if(!roomMembers.includes(user)) roomMembers.push(user);
        roomdata[roomID].users = roomMembers
        fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
        io.to(roomID).emit('joinResponse', { sender: socket.id, status: 1, error: null, data: roomdata[roomID]});
        socketUserMap[socket.id] = user;
    })
    socket.on('disconnecting', () => {
        let roomdata = require('./data/rooms.json')
        const user = socketUserMap[socket.id]
        delete socketUserMap[socket.id];
        const rooms = [...socket.rooms];
        const roomsWithoutDefault = rooms.filter(room => room !== socket.id);
        const roomID =  roomsWithoutDefault[0]
        if(!roomdata[roomID]) {
            console.log("no room data on disconnecting")
            return socket.emit('disconnectResponse', { status: 0, error: "No room id" });
        }

        const roomSockets = [...io.sockets.adapter.rooms.get(roomID)]
        const socketsStillConnected = roomSockets.filter(skt => skt !== socket.id)
        
        console.log(user + " disconnected")

        if(socketsStillConnected) {
            let usersStillConnected = []
            socketsStillConnected.forEach((connectedSocket)=>{
                usersStillConnected.push(socketUserMap[connectedSocket])
            })
            roomdata[roomID].users = [...new Set(usersStillConnected)]
            fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
            return io.to(roomID).emit('disconnectResponse', { status: 1, error: null, data: roomdata[roomID] });
        }
    })
    socket.on('messageSent', (data)=>{
        let roomdata = require('./data/rooms.json')
        console.log('messageSent')
        const { roomID, message, user } = data
        const timestamp = Date.now()
        io.to(roomID).emit("messageReceived", { message, user, timestamp });
        roomdata[roomID].messages.push({author: user, content: message, timestamp})
        fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
    })
    socket.on('deleteRoom', (data)=>{
        const roomdata = require('./data/rooms.json')
        const { roomID, user } = data
        if(user !== roomdata[roomID].admin) return socket.emit('deleteResponse', {status: 0, error: "Only the creator can delete the room!"})
        delete roomdata[roomID]
        console.log(roomID + " deleted.")
        fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
        io.to(roomID).emit('deleteResponse', {status: 1, error: null})
    })
    socket.on('editProfile', (req)=>{
        const userdata = require('./data/users.json')
        const { user, data } = req
        let response = "Profile updated!"
        if(data.password === userdata[user].password) response = "Password same as old password. Profile updated!"
        userdata[user] = {...data, password: data.password || userdata[user].password}
        fs.writeFileSync('./data/users.json', JSON.stringify(userdata), 'utf-8')
        socket.emit('editProfileResponse', { data: userdata[user], response })
    })
});
http.listen(3000, function(){
   console.log('listening on http://localhost:3000');
});