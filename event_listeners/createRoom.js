const fs = require('fs')
module.exports = ({data})=>{
    let roomdata = require('../data/rooms.json')
    roomdata[data.roomID] = { users:[], messages:[], admin: data.user, name: data.roomName, max: data.max, parent: data.parent, game: data.game }
    fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata), 'utf-8')
}