const fs = require('fs')
module.exports = ({data, io})=>{
    let roomdata = require('../../data/rooms.json')    
    let userdata = require('../../data/users.json')
    let { roomID, input, coordinates, currentGamePlayer: currentPlayer } = data
    if(!roomdata[roomID]?.game) return console.log('no parent game or roomID')
    
    if(input === "playerJoined") {
        io.to(roomID).emit('playerAdded', { players: roomdata[roomID]?.game.players, users: roomdata[roomID].users, gameActive: roomdata[roomID]?.game.active, currentPlayer: roomdata[roomID]?.game.currentPlayer })
    }
    if(input === "gameMove"){
        let { x, y } = coordinates
        if (roomdata[roomID].game.board[x][y] === null) {
            roomdata[roomID].game.board[x][y] = currentPlayer;
            currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
            roomdata[roomID].game.currentPlayer = currentPlayer
            io.to(roomID).emit('moveResponse', { currentPlayer, board: roomdata[roomID].game.board })
        }
        let winner = checkWinner()
        if(winner) {
            roomdata[roomID].game.active = false
            roomdata[roomID].game.currentPlayer = 'x'
            io.to(roomID).emit('result', {winner, board: roomdata[roomID].game.board, gameActive: roomdata[roomID]?.game.active});
        }
        fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata))
    }
    if(input === "resetGame"){
        roomdata[roomID].game.board = [[],[],[]]
        roomdata[roomID].game.players = { x:null, o:null }
        roomdata[roomID].game.currentPlayer = 'x'
        roomdata[roomID].users.forEach(player => {
            console.log(assignSymbols(player))
        });
        if(roomdata[roomID].game.players.x && roomdata[roomID].game.players.x) {
        startGame()
        console.log('restarted')
        }
    }
    function startGame() {
        if((!roomdata[roomID].game.players.x || !roomdata[roomID].game.players.o)) return console.log(roomdata[roomID].game.players)

        if(roomdata[roomID].game.players.x && roomdata[roomID].game.players.o) {        
            const display = {
                             [roomdata[roomID]?.game?.players?.x]:{ dp: userdata[roomdata[roomID]?.game?.players?.x]?.dp, name: userdata[roomdata[roomID]?.game?.players?.x]?.displayName},
                             [roomdata[roomID]?.game?.players?.o]:{ dp: userdata[roomdata[roomID]?.game?.players?.o]?.dp, name: userdata[roomdata[roomID]?.game?.players?.o]?.displayName}
                            }
            for (let i = 0; i < 3; i++) {
                roomdata[roomID].game.board[i] = [];
                for (let j = 0; j < 3; j++) {
                    roomdata[roomID].game.board[i][j] = null;
                }
            }
            roomdata[roomID].game.active = true;
            io.to(roomID).emit('startGame', { players: roomdata[roomID].game.players, board: roomdata[roomID].game.board, display, gameActive: roomdata[roomID]?.game.active, currentPlayer: roomdata[roomID]?.game.currentPlayer })
        fs.writeFileSync('./data/rooms.json', JSON.stringify(roomdata))
        }
    }
    function assignSymbols(user) {
        if(!roomdata[roomID].game.players.x && roomdata[roomID].game.players.o){
            roomdata[roomID].game.players.x = user
        } else if(!roomdata[roomID].game.players.o && roomdata[roomID].game.players.x) {
            roomdata[roomID].game.players.o = user
        } else if(!roomdata[roomID].game.players.x && !roomdata[roomID].game.players.o){
            let xo = Math.random() < 0.5 ? 'x' : 'o'
            roomdata[roomID].game.players[xo] = user
        }
        return(roomdata[roomID].game.players)
    }
    function checkWinner() {
        const lines = [
            [roomdata[roomID].game.board[0][0], roomdata[roomID].game.board[0][1], roomdata[roomID].game.board[0][2]],
            [roomdata[roomID].game.board[1][0], roomdata[roomID].game.board[1][1], roomdata[roomID].game.board[1][2]],
            [roomdata[roomID].game.board[2][0], roomdata[roomID].game.board[2][1], roomdata[roomID].game.board[2][2]],
            [roomdata[roomID].game.board[0][0], roomdata[roomID].game.board[1][0], roomdata[roomID].game.board[2][0]],
            [roomdata[roomID].game.board[0][1], roomdata[roomID].game.board[1][1], roomdata[roomID].game.board[2][1]],
            [roomdata[roomID].game.board[0][2], roomdata[roomID].game.board[1][2], roomdata[roomID].game.board[2][2]],
            [roomdata[roomID].game.board[0][0], roomdata[roomID].game.board[1][1], roomdata[roomID].game.board[2][2]],
            [roomdata[roomID].game.board[0][2], roomdata[roomID].game.board[1][1], roomdata[roomID].game.board[2][0]]
        ];
    
        let isTie = true;
        let winner = null;
    
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].every(cell => cell === 'x')) {
                winner = 'x';
                break;
            } else if (lines[i].every(cell => cell === 'o')) {
                winner = 'o';
                break;
            } else if (lines[i].includes(null)) {
                isTie = false;
            }
        }
         if(winner) return winner
         else if(isTie) return 'tie'
         else return null
    }
}