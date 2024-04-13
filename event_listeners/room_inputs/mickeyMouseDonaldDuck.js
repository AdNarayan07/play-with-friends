const fs = require('fs')
module.exports = ({data, io})=>{
    const roomdata = require('../../data/rooms.json')
    const userdata = require('../../data/users.json')
    let { roomID, input, user, card, players } = data
    const cards = roomdata[roomID].game.cards
    if(input === "playerJoined"){
        io.to(roomID).emit('playerAdded', { user, game: roomdata[roomID].game })
    }
    if(input === "startGame"){
        roomdata[roomID].game.players = players
        roomdata[roomID].game.gameActive = true
        const display = {}
        Object.keys(players).forEach((player)=>{
            display[player].name = userdata[player].displayName
            display[player].dp = userdata[player].dp
        })
        io.to(roomID).emit('startGame', { display })
    }
    if(input === "nextRound" ){
        if(roomdata[roomID].game.roundActive && !roomdata[roomID].game.gameActive) return
        for (const c in cards) {
            roomdata[roomID].game.cards[c] = null
        }
        io.to(roomID).emit('fly')
    }
    if(input === "pickCard") {
        if(cards[card] || 0) return;
        for (const c in cards) {
           if(cards[c] === user) return;
        }
        roomdata[roomID].game.cards[card] = user
        io.to(roomID).emit('pickResponse', { card, user })
        if(Object.values(cards).filter(value => value !== null).length >= 3) {
            const winners = []
            let loser;
            if (cards.mickey !== null && cards.mouse !== null) winners.push(cards.mickey, cards.mouse)
            else loser = cards.mickey || cards.mouse;
            
            if (cards.donald !== null && cards.duck !== null) winners.push(cards.donald, cards.duck)
            else loser = cards.donald || cards.duck;

            winners.forEach(winner => roomdata[roomID].game.players[winner].score += 10)
            io.to(roomID).emit('roundOver', roomdata[roomID].game.players)
        }
    }
    fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata))
}