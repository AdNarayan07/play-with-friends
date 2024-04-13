const socket = io();

const user = localStorage.getItem('user')
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const startGame = document.getElementById('startGame')
const startRound = document.getElementById('startRound')
const roomID = urlParams.get('id')

const startSound = new Audio('/assets/sounds/start.mp3')
const winSound = new Audio('/assets/sounds/win.mp3')
const tieSound = new Audio('/assets/sounds/tie.mp3')
const connectSound = new Audio('/assets/sounds/connect.mp3')
const disconnectSound = new Audio('/assets/sounds/disconnect.mp3')
const gamePlayers = []
let roundActive;
let gameActive;

var config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'gameCanvas',
        width: 800,
        height: 800
    },
    mode: Phaser.Scale.RESIZE,
    scene: {
        preload,
        create,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }
    }
}

var game = new Phaser.Game(config);

function preload() {
    this.load.image('paper', '/mickeyMouseDonaldDuck/assets/closedChit.png');
    this.load.image('table', '/assets/images/woodTexture.jpg')
    startGame.style.display = "block"
}

function create() {
    this.add.image(0, 0, 'table')
    var papers = this.physics.add.group({collideWorldBounds: true, bounce: 1});
    // Add folded papers at corners
    var corners = [ {x: 20, y: 20, }, {x: this.game.config.width - 120, y: 20}, {x: 20, y: this.game.config.height - 120}, {x: this.game.config.width - 120, y: this.game.config.height - 120} ]
    var names = [ "Mickey", "Mouse", "Donald", "Duck" ]

    shuffle(corners)
    shuffle(names)
    for (let i = 0; i < 4; i++) {
        var paper = papers.create(corners[i].x, corners[i].y, 'paper');
        paper.setData('value', names[i]);
        paper.setDisplaySize(200, 200);
        paper.setBounce(1, 1);
        paper.setInteractive();
    }

    socket.on('fly', (data)=>{
            let i = 0
            shuffle(corners)
            papers.getChildren().forEach((paper)=>{
                paper.setDrag(10000)
                paper.setAngularDrag(Phaser.Math.FloatBetween(3500, 10000))
                paper.enableBody(true, corners[i].x, corners[i].y, true, true)
                i++
                paper.setAngularVelocity(50000)
                paper.setVelocity(Phaser.Math.FloatBetween(2000, 3000), Phaser.Math.FloatBetween(2000, 3000))
            });
            roundActive = true
    })
    socket.on('pickResponse', (res)=>{
        const { card, user } = res
        const paper = papers.getChildren().filter((e)=>e.getData('value') === card)
        console.log(paper[0].disableBody(true, true))
        console.log(card)
    })
    socket.on('roundOver', (players) => {
        roundActive = false
    })

    this.input.on('pointerdown', function(pointer, gameObject) {
        if(!gameObject.length || !roundActive || !gameActive) return;
        const data = {
            type: 'mickeyMouseDonaldDuck',
            input: 'pickCard',
            card: gameObject[0].getData('value'),
            user,
            roomID
        }
        socket.emit('roomInput', data);
    });
}
startRound.addEventListener('click', ()=>{
    const data = {
        type: 'mickeyMouseDonaldDuck',
        input: 'nextRound',
        user,
        roomID
    }
    socket.emit('roomInput', data)
})







socket.on('connect', connectRoom)
socket.on('joinResponse', (res) => joinResponse(res, 'mickeyMouseDonaldDuck'))
socket.on('playerAdded', ({ user, game }) => {
    gamePlayers.push({[user]: { score: 0 }})
    connectSound.play()
})
socket.on('startGame', ({ players, board, display, currentPlayer }) => {
    gameActive = false
    startSound.play()
})

socket.on('moveResponse', ({ currentPlayer, board }) => {
})

socket.on('result', ({winner, board}) => {})
socket.on('messageReceived', (msg)=> {
    const prevMsg = document.querySelectorAll('.msg-container > .msg')
    const prevAuthor = prevMsg?.[prevMsg.length - 1]?.getAttribute('author')
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
      disconnectSound.play()
    }
  })

socket.on('deleteResponse', ({status, error, id})=>{
    if(status) {
        alert('Room deleted by the admin!')
        location.href = '/mickeyMouseDonaldDuck'
    } else {
        if(socket.id === id) alert('error: ' + error)
    }
})
socket.on('leaveRoom', (req) => {
    console.log('disconnect me')
    if(req.user === user && req.id !== socket.id) return location.href = '/mickeyMouseDonaldDuck'
})
document.addEventListener('keypress', function(e) {
    if(document.activeElement === document.querySelector('input[type="text"]')) return
})
startGame.addEventListener('click', (e)=>{
    const data = { 
        type: 'mickeyMouseDonaldDuck',
        input: 'startGame',
        roomID,
        user,
        players: gamePlayers,
        rounds: undefined || 10
    }
    socket.emit('roomInput', data)
})
document.getElementById("messageBox").addEventListener('submit', (e)=>{
    e.preventDefault()
    sendMessage(socket)
})