const socket = io();

const user = localStorage.getItem('user')
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const startGame = document.getElementById('startGame')
const startRound = document.getElementById('startRound')
const roomID = urlParams.get('id')
const table = document.querySelector('.scoreboard > table')
let playersDiv = document.querySelector('.players')

const startSound = new Audio('/assets/sounds/start.mp3')
const winSound = new Audio('/assets/sounds/win.mp3')
const tieSound = new Audio('/assets/sounds/tie.mp3')
const connectSound = new Audio('/assets/sounds/connect.mp3')
const disconnectSound = new Audio('/assets/sounds/disconnect.mp3')
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
    this.load.image('paper', 'assets/closedChit.png');
    this.load.image('table', '/assets/images/woodTexture.jpg', 800, 800)
    startGame.style.display = "flex"
}

let papers;
let corners;
function create() {
    this.add.image(0, 0, 'table')
    papers = this.physics.add.group({collideWorldBounds: true, bounce: 1});
    corners = [ {x: 20, y: 20, }, {x: this.game.config.width - 120, y: 20}, {x: 20, y: this.game.config.height - 120}, {x: this.game.config.width - 120, y: this.game.config.height - 120} ]
    var names = [ "mickey", "mouse", "donald", "duck" ]

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
            document.querySelectorAll(".card").forEach(e => e.innerHTML = "")
            shuffle(corners)
            let i = 0
            papers.getChildren().forEach((paper)=>{
                paper.enableBody(true, corners[i].x, corners[i].y, true, true)
                fly(paper)
                i++
            });
            roundActive = true
    })

    socket.on('pickResponse', (res)=>{
        const { card, user:inputUser } = res
        const paper = papers.getChildren().filter((e)=>e.getData('value') === card)
        paper[0].disableBody(true, true)
        document.querySelector(`#${inputUser} > .card`).innerHTML = `<img src="assets/closedChit.png">`
    })

    this.input.on('pointerdown', function(pointer, gameObject) {
        if(!gameObject.length || !roundActive || !gameActive) return
        console.log(gameObject[0].getData('value'))
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

socket.on('connect', connectRoom)
socket.on('joinResponse', (res) => joinResponse(res, 'mickeyMouseDonaldDuck'))

socket.on('playerAdded', async ({ admin, game, users, display, id }) => {
    if(users.length < 3) {
        startGame.innerHTML = "<p>Waiting for players...</p>"
        startGame.style.display = "flex"
        return
    } else {
        startGame.style.display = "none"
    }
    if (game.gameActive) {
        if(id !== socket.id) return;
        gameActive = true;
        startGame.style.display = "none"
        let players = game.players.sort()
        playersDiv.innerHTML = ""
        players.forEach(player => {
            let color = "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0")
            playersDiv.innerHTML += `
            <div class="player" id="${player}"><div class="card" style="border-color: ${color}"></div><div class="info"><img style="border-color: ${color}" src="/assets/DPs/${display[player].dp || "default.png"}">${display[player].name || player}</div></div>
            `
        })
        table.innerHTML = `<thead><th>Round</th><th>${display[players[0]]?.name || players[0]}</th><th>${display[players[1]]?.name || players[1]}</th><th>${display[players[2]]?.name || players[2]}</th></thead>`
        if(game.rounds.length){
            if(game.rounds[game.rounds.length - 1].loser !== user) startRound.setAttribute("disabled", "disabled")
            else startRound.removeAttribute("disabled")
            i = 0
            game.rounds.forEach((round)=>{
            i++
            table.innerHTML += `<tr><th>${i}</th><td>${round.winners.includes(players[0]) ? 10 : 0}</td><td>${round.winners.includes(players[1]) ? 10 : 0}</td><td>${round.winners.includes(players[2]) ? 10 : 0}</td></tr>`
            })
        } else {
            if(user !== admin) startRound.setAttribute("disabled", "disabled")
            else startRound.removeAttribute("disabled")
        }
        if(game.roundActive) startRound.setAttribute("disabled", "disabled")
        if(!game.roundActive && !game.rounds.length) return
        while (true) {
            try {
                roundActive = true
                for (const card in game.cards) {
                    if(game.cards[card]){
                        if(user === game.cards[card]) roundActive = false;
                        const paper = papers.getChildren().filter((e) => e.getData('value') === card);
                        paper[0].disableBody(true, true);
                        document.querySelector(`#${game.cards[card]} > .card`).innerHTML = game.roundActive ? `<img src="assets/closedChit.png">` : `<img src="assets/${card}.png">`;
                        shuffle(corners)
                        papers.getChildren().forEach(paper=>fly(paper));
                    } else papers.getChildren().forEach(paper=>fly(paper));
                }
                break;
            } catch (e) {
                await sleep(100)
                console.log(e)
            }
        }
    } else {
        startGame.style.display = "flex"
        startGame.innerHTML = "<p>Click to start!<p/>"
    }
})

socket.on('startGame', async ({ players, display, admin }) => {
    while (true) {
        try {
            let i = 0
            papers.getChildren().forEach((paper)=>{
                paper.enableBody(true, corners[i].x, corners[i].y, true, true)
                i++
            })
            break;
        } catch (e) {
            await sleep(100)
            console.log(e)
        }
    }
    players.sort()
    console.log(display)
    table.innerHTML = `<thead><th>Round</th><th>${display[players[0]]?.name || players[0]}</th><th>${display[players[1]]?.name || players[1]}</th><th>${display[players[2]]?.name || players[2]}</th></thead>`
    playersDiv.innerHTML = ""
    players.forEach(player => {
        let color = "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0")
        playersDiv.innerHTML += `
        <div class="player" id="${player}"><div class="card" style="border-color: ${color}"></div><div class="info"><img style="border-color: ${color}" src="/assets/DPs/${display[player].dp || "default.png"}">${display[player].name || player}</div></div>
        `
    })
    gameActive = true
    roundActive = false
    startGame.style.display = "none"
    startSound.play()
    if(user !== admin) startRound.setAttribute('disabled', 'disabled')
    else startRound.removeAttribute('disabled')
})
socket.on('roundOver', (data) => {
    roundActive = false
    console.log(data)
    let players = data.players.sort()
    table.innerHTML = `<thead><th>Round</th><th>${data.display[players[0]].name || players[0]}</th><th>${data.display[players[1]].name || players[1]}</th><th>${data.display[players[2]].name || players[2]}</th></thead>`
    i = 0
    data.rounds.forEach((round)=>{
    i++
    table.innerHTML += `<tr><th>${i}</th><td>${round.winners.includes(players[0]) ? 10 : 0}</td><td>${round.winners.includes(players[1]) ? 10 : 0}</td><td>${round.winners.includes(players[2]) ? 10 : 0}</td></tr>`
    })
    if(data.gameover){
        table.innerHTML += `<tfoot><th>Total</th><td>${data.scores[players[0]]}</td><td>${data.scores[players[1]]}</td><td>${data.scores[players[2]]}</td></tfoot>`
        roundActive = false
        gameActive = false
        startGame.innerHTML = "<p>Game over</p>"
        startGame.innerHTML += `<div>${table.outerHTML}</div>`
        startGame.innerHTML += "<p>Click to restart!</p>"
        startGame.style.display = "flex"
    }
    players.forEach(player =>{
        document.querySelector(`#${player} > .card`).innerHTML = `<img src="assets/${data.playerCards[player]}.png">`
    })
    if(user !== data.loser) startRound.setAttribute('disabled', 'disabled')
    else startRound.removeAttribute('disabled')
})
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
      const { users, admin } = res.data
      updateOnline(users, admin)
      disconnectSound.play()
      if(users.length < 3){
        startGame.innerHTML = gameActive ? `<p>Someone disconnected! Waiting...</p>` : `<p>Waiting for players...</p>`
        startGame.style.display = "flex"
      }
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

startGame.addEventListener('click', (e)=>{
    const data = { 
        type: 'mickeyMouseDonaldDuck',
        input: 'startGame',
        roomID,
        user,
        rounds: undefined || 3
    }
    socket.emit('roomInput', data)
})
startRound.addEventListener('click', () => {
    if(roundActive || !gameActive) return;
    const data = {
        type: 'mickeyMouseDonaldDuck',
        input: 'nextRound',
        user,
        roomID
    }
    socket.emit('roomInput', data)
    startRound.setAttribute('disabled', 'disabled')
})
document.getElementById("messageBox").addEventListener('submit', (e)=>{
    e.preventDefault()
    sendMessage(socket)
})
function fly(paper){
    paper.setDrag(10000)
    paper.setAngularDrag(Phaser.Math.FloatBetween(3500, 10000))
    paper.setAngularVelocity(50000)
    paper.setVelocity(Phaser.Math.FloatBetween(2000, 3000), Phaser.Math.FloatBetween(2000, 3000))
}