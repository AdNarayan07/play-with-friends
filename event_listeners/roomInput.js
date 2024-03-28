const fs = require('fs')
const path = require('path')

module.exports = ({data, socket, io, socketUserMap}) => {
    let roomInputs = fs.readdirSync(path.join(__dirname, 'room_inputs'))
    roomInputs = roomInputs.filter(file => file.endsWith('.js'))

    roomInputs.forEach((file) => {
        if(file.split('.')[0] === data.type) require(path.join(__dirname, 'room_inputs', file))({data, socket, io, socketUserMap})
    })
}