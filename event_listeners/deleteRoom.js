const fs = require('fs')
module.exports = ({data, io, socket})=>{
    const roomdata = require('../data/rooms.json')
    const { roomID, user } = data
    if(user !== roomdata[roomID].admin) return io.to(roomID).emit('deleteResponse', {status: 0, error: "Only the creator can delete the room!", id: socket.id})
    delete roomdata[roomID]
    console.log(roomID + " deleted.")
    fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
    io.to(roomID).emit('deleteResponse', {status: 1, error: null})
}