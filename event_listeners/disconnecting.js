const fs = require('fs')
module.exports = ({socket, io, socketUserMap}) => {
    let roomdata = require('../data/rooms.json')
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
}