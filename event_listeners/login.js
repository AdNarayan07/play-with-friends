module.exports = ({data, socket})=>{
    let userdata = require('../data/users.json')
    let { username, password } = data
    if(!userdata[username]) return socket.emit('LSresponse', {status: 0, error: "Username not found"});
    if(userdata[username].password !== password) return  socket.emit('LSresponse', {status: 0, error: "Incorrect Password"});
    socket.emit('LSresponse', {status: 1, error: null, data:{ username, message:'Logged in successfully' }})
}