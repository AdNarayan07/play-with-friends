const express = require('express');
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')
const fs = require('fs')
const roomdata = require('./data/rooms.json')
for(let room in roomdata) {
    roomdata[room].users = []
}
fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'home', 'index.html')));
app.use('/assets', express.static(path.join(__dirname, 'frontend', 'home', 'assets')));

const pages = fs.readdirSync(path.join(__dirname, 'frontend/pages'))
pages.forEach((folder) => {
    app.get('/'+ folder, (req,res) => res.sendFile(path.join(__dirname, 'frontend', 'pages', folder, 'index.html')))
    app.get('/'+ folder + '/room', (req,res) => res.sendFile(path.join(__dirname, 'frontend', 'pages', folder, 'room.html')))
    app.use('/'+ folder+ '/assets', express.static(path.join(__dirname, 'frontend', 'pages', folder, 'assets')));
})
const socketUserMap = {};
io.on('connection', function(socket){
    console.log('A user connected to Main Socket');

    let events = fs.readdirSync('./event_listeners')
    events = events.filter(file => file.endsWith('.js'))

    events.forEach((file) => {
        socket.on(file.split('.')[0], (data)=>{
            require(path.join(__dirname, 'event_listeners',  file))({data, socket, io, socketUserMap})
        })
    })
});
http.listen(5152, function(){
   console.log('listening on http://localhost:5152');
});