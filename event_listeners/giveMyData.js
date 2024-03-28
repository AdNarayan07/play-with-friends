module.exports = ({data, socket})=>{
    if(data.user) {
        const roomdata = require('../data/rooms.json')
        const rooms = [];
        for (const x in roomdata){
            if(roomdata.hasOwnProperty(x) && roomdata[x].admin === data.user && (roomdata[x].parent === data.parent || !data.parent)) rooms.push({id: x, ...roomdata[x]})
        }
        const userdata = require('../data/users.json')[data.user]
        if(!userdata) return socket.emit('yourData', null)
        const {displayName, dp} = userdata
        socket.emit('yourData', { rooms, displayName, dp })
    }
}