const fs = require('fs')
module.exports = ({data, socket})=>{
    let userdata = require('../data/users.json')
    let { username, password, displayName, dp } = data
    if(userdata[username]) return socket.emit('LSresponse', {status: 0, error: "Username already registered"});
    userdata[username] = { password, displayName, dp }
    fs.writeFileSync('./data/users.json', JSON.stringify(userdata), 'utf-8')
    socket.emit('LSresponse', {status: 1, error: null, data:{ username, message: 'Signed in' }})
}