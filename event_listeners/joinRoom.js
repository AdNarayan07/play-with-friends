const fs = require('fs')
module.exports = ({data, socket, io, socketUserMap})=>{
    let roomdata = require('../data/rooms.json')
    let userdata = require('../data/users.json')
    const { roomID, user, room } = data
    if(!roomdata[roomID]) {
        console.log("no room data on joining")
        return socket.emit('joinResponse', { status: 0, error: "Incorrect room id!" });
    } else if(roomdata[roomID].users.length >= roomdata[roomID].max && !roomdata[roomID].users.includes(user)){
        console.log("limit exceeded")
        return socket.emit('joinResponse', { status: 0, error: "Room already full!" });
    }
    let roomMembers = roomdata[roomID].users
    if(roomMembers.includes(user) && !room) return socket.emit('joinResponse', { status: 0, error: "You have already joined this room in a different session. \n Ok: Leave this session \n Cancel: Leave other session(s)", optional: true, sender: socket.id });
    socket.join(roomID)
    console.log(user + " Joined the room")
    if(!roomMembers.includes(user))roomMembers.push(user)
    roomdata[roomID].users = roomMembers      
    const display = {
        [roomdata[roomID]?.game?.players?.x]:{ dp: userdata[roomdata[roomID]?.game?.players?.x]?.dp, name: userdata[roomdata[roomID]?.game?.players?.x]?.displayName},
        [roomdata[roomID]?.game?.players?.o]:{ dp: userdata[roomdata[roomID]?.game?.players?.o]?.dp, name: userdata[roomdata[roomID]?.game?.players?.o]?.displayName}
       }
    fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
    let thisRoom = roomdata[roomID]
    thisRoom.messages.map((msg) => {
        msg.dp = userdata[msg.author].dp
        msg.displayName = userdata[msg.author].displayName
    })
    const { displayName, dp } = userdata[user]
    io.to(roomID).emit('joinResponse', { sender: {id: socket.id, data: { displayName, dp }}, status: 1, error: null, data: thisRoom, display});
    socketUserMap[socket.id] = user;
}