const fs = require('fs')
module.exports = ({data, socket})=>{
    const userdata = require('../data/users.json')
    const { user, data } = req
    let response = "Profile updated!"
    if(data.password === userdata[user].password) response = "Password same as old password. Profile updated!"
    userdata[user] = {...data, password: data.password || userdata[user].password}
    fs.writeFileSync('./data/users.json', JSON.stringify(userdata), 'utf-8')
    socket.emit('editProfileResponse', { data: userdata[user], response })
}