const socket = io();

const user = localStorage.getItem('user')
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const roomID = urlParams.get('id')
let gameBoard = [[],[],[]]
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let currentGamePlayer = ''
let playerActive = false
let gamePlayers = { x: null, o: null }
let colors = { x: {main: "cyan", bg:"#003e3ea3"}, o:{main:"#ffa200", bg:"#3f2d00ad"}}
const xImage = new Image()
xImage.src = '/ticTacToe/assets/x.svg'
const oImage = new Image()
oImage.src = '/ticTacToe/assets/o.svg'
const lineImage = new Image()
lineImage.src = '/ticTacToe/assets/line.png'

const xSound = new Audio('/ticTacToe/assets/x.mp3')
const oSound = new Audio('/ticTacToe/assets/o.mp3')
const startSound = new Audio('/assets/sounds/start.mp3')
const winSound = new Audio('/assets/sounds/win.mp3')
const tieSound = new Audio('/assets/sounds/tie.mp3')
const connectSound = new Audio('/assets/sounds/connect.mp3')
const disconnectSound = new Audio('/assets/sounds/disconnect.mp3')

socket.on('connect', () => {
    if(!user) return location.href = '/'
    socket.emit('joinRoom', { user, roomID })
})
socket.on('joinResponse', (res) => {
    console.log(res)
    if(!res.status) handleJoinError(res, socket) 
    else {
    const { users, game, admin, messages } = res.data
    gameBoard = game.board[0] ? game.board : [[],[],[]]
    updateOnline(users, admin)
    document.getElementById('accountHead').innerHTML = `<img src="/assets/DPs/${res.sender.data.dp}"><div>${res.sender.data.displayName}</div>`
    const data = {
        type: 'ticTacToe',
        input: 'playerJoined',
        roomID,
        user
    }
    if(res.sender.id === socket.id) socket.emit('roomInput', data)
    
    drawBoard(gameBoard)
    let opponentId; let playerId;
    let xName = res.display[game.players.x]?.name || game.players.x || "Player"
    let oName = res.display[game.players.o]?.name || game.players.o || "Player"
    let xDP = res.display[game.players.x]?.dp || 'default.png'
    let oDP = res.display[game.players.o]?.dp || "default.png"

    if(game.players.x === user) {
        playerId = 'x'
        opponentId = 'o'
    } else {
        playerId = 'o'
        opponentId = 'x'
    }

    document.querySelector("#gameDiv > footer").id = playerId
    document.querySelector("#gameDiv > header").id = opponentId
    document.querySelector("#x").innerHTML = `<img src="/assets/DPs/${xDP}" style="color:${colors.x.main}"><span style="color:${colors.x.main}">${xName}</span>`
    document.querySelector("#x").style.opacity = users.includes( game.players.x) ? 1 : 0.4
    document.querySelector("#o").innerHTML = `<img src="/assets/DPs/${oDP}" style="color:${colors.o.main}"><span style="color:${colors.o.main}">${oName}</span>`
    document.querySelector("#o").style.opacity = users.includes(game.players.o) ? 1 : 0.4
    resizeCanvas()
    if(socket.id !== res.sender.id) return console.log('no need to add the messages');
    document.getElementById("message").innerHTML = ""
    let prevUser;
    messages.forEach((msg)=> {
        bubble = prevUser === msg.author ? '' : 'bubble'
        displayMessage(msg, bubble, user === msg.author)
        prevUser = msg.author
    })
    }
})
socket.on('playerAdded', ({ players, users, gameActive, currentPlayer }) => {
    console.log("plaerAdded")
    gamePlayers = players
    currentGamePlayer = currentPlayer
    console.log(gamePlayers)
    if(users.length === 2) {
        const emptyBoard = gameBoard.every(row => row.every(value => !value));
        console.log(players, users, gameActive)
        if(users.includes(gamePlayers.x) && users.includes(gamePlayers.o) && gameActive && !emptyBoard) {
            document.getElementById('startGame').style.display = 'none'
            canvas.style.backgroundColor = colors[currentGamePlayer].bg
            playerActive = gamePlayers[currentGamePlayer] === user
        } else {
            document.getElementById('startGame').style.display = ''
            document.getElementById('startGame').style.backgroundColor = ''
            playerActive = false
        }
        document.getElementById('startGame').innerHTML = `<p>Start Game</p>`
    }
    else if(users.length !== 2) {
        document.getElementById('startGame').innerHTML = `<p>Waiting for opponent...</p>`
    }
    connectSound.play()
})
socket.on('startGame', ({ players, board, display, currentPlayer }) => {
    gameBoard = board
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard(gameBoard)
    gamePlayers = players
    playerActive = gamePlayers.x === user
    console.log('resetGame')
    currentGamePlayer = currentPlayer;
    document.getElementById('startGame').style.display = 'none'

    let hfTags = []
    if(players.x === user) hfTags = [`<img src="/assets/DPs/${display[players.x]?.dp}" style="color:${colors.x.main}"><span style="color:${colors.x.main}">${display[players.x]?.name || players.x}</span>`, `<img src="/assets/DPs/${display[players.o]?.dp}" style="color:${colors.o.main}"><span style="color:${colors.o.main}">${display[players.o]?.name || players.o}</span>`]
    else hfTags = [`<img src="/assets/DPs/${display[players.o]?.dp}" style="color:${colors.o.main}"><span style="color:${colors.o.main}">${display[players.o]?.name || players.o}</span>`, `<img src="/assets/DPs/${display[players.x]?.dp}" style="color:${colors.x.main}"><span style="color:${colors.x.main}">${display[players.x]?.name || players.x}</span>`]

    console.log(hfTags)
    document.querySelector("#gameDiv > footer").innerHTML = hfTags[0]
    document.querySelector("#gameDiv > header").innerHTML = hfTags[1]
    document.querySelector("#x").style.opacity = 1
    document.querySelector("#o").style.opacity = 1

    canvas.style.backgroundColor = colors[currentGamePlayer].bg
    startSound.play()
})

socket.on('moveResponse', ({ currentPlayer, board }) => {
    gameBoard = board
    drawBoard(gameBoard)
    currentGamePlayer = currentPlayer
    const sound = currentGamePlayer === 'x' ? oSound : xSound
    console.log(sound)
    sound.play()
    playerActive = gamePlayers[currentGamePlayer] === user

    canvas.style.backgroundColor = colors[currentGamePlayer].bg
})

socket.on('result', ({winner, board}) => {
    playerActive = false
    document.getElementById('startGame').style.display = ""
    canvas.style.backgroundColor = colors[winner]?.bg || ''
    drawBoard(board)
    let message;
    if(winner === 'tie') {
        message = "Match Tied!"
        document.getElementById('startGame').style.backgroundColor = ''
        document.getElementById('startGame').style.backgroundImage = ''
        tieSound.play()
    } else {
        message = gamePlayers[winner] + " Won!"
        document.getElementById('startGame').style.backgroundColor = colors[winner]?.bg
        document.getElementById('startGame').style.backgroundImage = 'url(/assets/images/win.gif)'
        winSound.play()
    }
    document.getElementById('startGame').innerHTML = `<p><span style="font-size: 0.8em">${message}</span><br>Click to Restart!</p>`
})
socket.on('messageReceived', (msg)=> {
    const prevMsg = document.querySelectorAll('.msg-container > .msg')
    const prevAuthor = prevMsg[prevMsg.length - 1].getAttribute('author')
    const bubble = prevAuthor === msg.author ? '' : 'bubble'
    displayMessage(msg, bubble, user === msg.author)
})
socket.on('disconnectResponse', (res) => {
    if(!res.status) {
      alert(res.error)
      return location.reload()
    } else {
      console.log(res)
      const { users, admin, } = res.data
      updateOnline(users, admin)
      document.getElementById('startGame').style.display = ''
      document.getElementById('startGame').style.backgroundImage = ''
      document.getElementById('startGame').innerHTML = `<p><span style="font-size: 0.8em">Opponent disconnected...</span><br>Game Over</p>`
      canvas.style.backgroundColor = "#232323bf"
      disconnectSound.play()
    }
  })

socket.on('deleteResponse', ({status, error, id})=>{
    if(status) {
        alert('Room deleted by the admin!')
        location.href = '/ticTacToe'
    } else {
        if(socket.id === id) alert('error: ' + error)
    }
})
socket.on('leaveRoom', (req) => {
    console.log('disconnect me')
    if(req.user === user && req.id !== socket.id) return location.href = '/ticTacToe'
})
canvas.addEventListener('click', (event) => {
    const cellSize = canvas.width / 3;
    let x = Math.floor(event.offsetX / cellSize);
    let y = Math.floor(event.offsetY / cellSize);
    gameInput(x, y, cellSize)
})
document.addEventListener('keypress', function(e) {
    if(e.code.startsWith('Numpad')){
        const cellSize = canvas.width / 3;
        const map = {1: [0, 2], 2:[1, 2], 3:[2, 2], 4:[0, 1], 5: [1, 1], 6: [2, 1], 7:[0, 0], 8:[1, 0], 9:[2, 0]}
        const key = e.code.split('Numpad')[1]
        gameInput(map[key][0], map[key][1], cellSize)
    }
})
document.getElementById('startGame').addEventListener('click', (e)=>{
    const data = {
        type: 'ticTacToe',
        input: 'resetGame',
        roomID
    }
    socket.emit('roomInput', data)
})
document.getElementById("messageBox").addEventListener('submit', (e)=>{
    e.preventDefault()
    sendMessage(socket)
})
window.addEventListener('resize', () => resizeCanvas());
function drawBoard(board) {
    const cellSize = canvas.width / 3;
    const lineWidth = canvas.width / 80

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(cellSize, 0);
    ctx.lineTo(cellSize, canvas.height);
    ctx.moveTo(cellSize * 2, 0);
    ctx.lineTo(cellSize * 2, canvas.height);
    ctx.moveTo(0, cellSize);
    ctx.lineTo(canvas.width, cellSize);
    ctx.moveTo(0, cellSize * 2);
    ctx.lineTo(canvas.width, cellSize * 2);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = 'aliceblue';
    ctx.stroke();

    // Draw symbols
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = board[row][col];
            if (cell !== null) {
                // Calculate center coordinates of the cell
                const y = col * cellSize;
                const x = row * cellSize;
                const image = cell === 'x' ? xImage : oImage;
                ctx.drawImage(image, x, y, cellSize, cellSize)   
            }
        }
    }
    const winner = checkWinner(board)
    const lineCoordinates = cutLine(board, winner)
    if(lineCoordinates) {
        const [x1, y1, x2, y2] = lineCoordinates
        console.log(lineCoordinates)
        const angleInRadians = Math.atan((y2-y1)/(x2-x1))
        console.log(angleInRadians, angleInRadians * 180 / Math.PI)
        let translate = 0;
        if(Math.abs(angleInRadians) === 0) {
            if(y1 === 0) translate = -cellSize
            if(y1 === 2) translate = cellSize
        }
        if(Math.abs(angleInRadians) === Math.PI/2) {
            if(x1 === 0) translate = cellSize
            if(x1 === 2) translate = -cellSize
        }
        console.log(translate)
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(angleInRadians);
        ctx.drawImage(lineImage, -canvas.width / 2, -canvas.height / 2 + translate, canvas.width, canvas.height);
        ctx.restore();
    }
}
function resizeCanvas(){
    const vw = window.innerWidth * 0.20;
    canvas.width = vw;
    canvas.height = vw;
    drawBoard(gameBoard)
}
function cutLine(board, winner){
    if(winner === "x" || winner === "o") {
        const checkLine = (a, b, c) => a === winner && b === winner && c === winner;
        let lineCoordinates = [];

        // Check rows
        for (let i = 0; i < 3; i++) {
            if (checkLine(...board[i])) {
                lineCoordinates = [i, 0, i, 2]; // Horizontal line
                break;
            }
            if (checkLine(board[0][i], board[1][i], board[2][i])) {
                lineCoordinates = [0, i, 2, i]; // Vertical line
                break;
            }
        }

        // Check diagonals
        if (lineCoordinates.length === 0) {
            if (checkLine(board[0][0], board[1][1], board[2][2])) {
                lineCoordinates = [0, 0, 2, 2]; // Diagonal from top-left to bottom-right
            } else if (checkLine(board[2][0], board[1][1], board[0][2])) {
                lineCoordinates = [0, 2, 2, 0]; // Diagonal from top-right to bottom-left
            }
        }
        return lineCoordinates
    } else {
        return null
    }
}
async function gameInput(x, y, cellSize){
    console.log(playerActive)
    if(!playerActive || gameBoard[x]?.[y] !== null) return;
    playerActive = false
    if(gamePlayers[currentGamePlayer] !== user) return;
    const data = {
        type: 'ticTacToe',
        input: 'gameMove',
        coordinates: {x, y},
        user,
        currentGamePlayer,
        roomID
    }
    console.log(data)
    const image = currentGamePlayer === 'x' ? xImage : oImage;
    x = x * cellSize
    y = y * cellSize    
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.drawImage(image, x, y, cellSize, cellSize)
    ctx.restore()
    sleep(1000)
    socket.emit('roomInput', data)
}
function checkWinner(board) {
    const lines = [
        [board[0][0], board[0][1], board[0][2]],
        [board[1][0], board[1][1], board[1][2]],
        [board[2][0], board[2][1], board[2][2]],
        [board[0][0], board[1][0], board[2][0]],
        [board[0][1], board[1][1], board[2][1]],
        [board[0][2], board[1][2], board[2][2]],
        [board[0][0], board[1][1], board[2][2]],
        [board[0][2], board[1][1], board[2][0]]
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