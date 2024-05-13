const fs = require('fs')
module.exports = ({data, io, socket})=>{
    const roomdata = require('../../data/rooms.json')
    const userdata = require('../../data/users.json')
    let { roomID, input, user, card, rounds } = data

    const cards = roomdata[roomID].game.cards
    const display = {}
    roomdata[roomID].users.forEach(player => {
        display[player] = {}
        display[player].name = userdata[player]?.displayName || "User"
        display[player].dp = userdata[player]?.dp || "1.png"
    })

    if(input === "playerJoined") {
        if(roomdata[roomID].game.gameActive && !roomdata[roomID].game.players.includes(user)) io.to(roomID).emit('joinResponse', { status: 0, error: "You are not a part of ongoing game!", sender: socket.id })
        else io.to(roomID).emit('playerAdded', { admin: roomdata[roomID].admin, game: roomdata[roomID].game, users: roomdata[roomID].users, display, newAdded: user, id: socket.id })
    }

    if(input === "startGame"){
        if(roomdata[roomID].users?.length !== 3 || roomdata[roomID].game.gameActive || roomdata[roomID].game.roundActive) return;
        roomdata[roomID].game.players = roomdata[roomID].users
        roomdata[roomID].game.players.forEach(player=>{
        roomdata[roomID].game.scores[player] = 0
        })
        roomdata[roomID].game.gameActive = true
        roomdata[roomID].game.maxRounds = rounds
        roomdata[roomID].game.rounds = []
        io.to(roomID).emit('startGame', { display, players: roomdata[roomID].game.players, admin: roomdata[roomID].admin })
    }

    if(input === "nextRound" ){
        if(roomdata[roomID].game.roundActive && !roomdata[roomID].game.gameActive) return
        roomdata[roomID].game.roundActive = true
        for (const c in cards) {
            roomdata[roomID].game.cards[c] = null
        }
        io.to(roomID).emit('fly')
    }

    if(input === "pickCard") {
        if(cards[card]) return console.log(cards, card);
        for (const c in cards) {
           if(cards[c] === user) return;
        }
        roomdata[roomID].game.cards[card] = user
        io.to(roomID).emit('pickResponse', { card, user })
        if(Object.values(cards).filter(value => value !== null).length >= 3) {
            let gameover = false;
            const winners = []
            let loser;
            console.log(cards)
            if (cards.mickey !== null && cards.mouse !== null) winners.push(cards.mickey, cards.mouse)
            else loser = cards.mickey || cards.mouse;
            
            if (cards.donald !== null && cards.duck !== null) winners.push(cards.donald, cards.duck)
            else loser = cards.donald || cards.duck;
            console.log(winners)
            winners.forEach(winner => roomdata[roomID].game.scores[winner] += 10)
            roomdata[roomID].game.rounds.push({winners, loser})
            if(roomdata[roomID].game.rounds.length >= roomdata[roomID].game.maxRounds) {
                roomdata[roomID].game.gameActive = false
                gameover = true;
            }
            const playerCards = {};
            for (const key in cards) {
            const value = cards[key];
            playerCards[value] = key;
            }
            io.to(roomID).emit('roundOver', {display, players: roomdata[roomID].game.players, scores: roomdata[roomID].game.scores, winners, gameover, playerCards, rounds: roomdata[roomID].game.rounds, loser})
            roomdata[roomID].game.roundActive = false
        }
    }
    fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata))
}