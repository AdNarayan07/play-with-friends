const fs = require('fs')
module.exports = ({ io, data, socket }) => {
    const roomdata = require('../data/rooms.json')
    console.log('dup join')
    const {roomID, user}  = data
    roomdata[roomID].users = roomdata[roomID].users.filter(e => e !== user)
    fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
    io.to(roomID).emit('leaveRoom', { user, id: socket.id })
}