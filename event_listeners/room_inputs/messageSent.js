const fs = require('fs')
module.exports = ({data, io})=>{
    let roomdata = require('../../data/rooms.json')
    let userdata = require('../../data/users.json')
    console.log('messageSent')
    const { roomID, message, user } = data
    const timestamp = Date.now()
    const { displayName, dp } = userdata[user]
    io.to(roomID).emit("messageReceived", { content: message, author: user, timestamp, displayName, dp });
    roomdata[roomID].messages.push({author: user, content: message, timestamp})
    fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
}