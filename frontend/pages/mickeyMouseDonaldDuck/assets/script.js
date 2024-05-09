const socket = io()
const user = localStorage.getItem('user')

const createRoom = document.getElementById('createRoom')
const joinForm = document.getElementById('joinForm')

socket.on('connect', () => {
    if(!user) return location.href = '/'
    socket.emit('giveMyData', { user, parent: 'mickeyMouseDonaldDuck' })
})
socket.on('yourData', (data)=>{
    console.log(data)
    if(!data) return handleNoData()
    sessionStorage.setItem(user, JSON.stringify(data))
    displayMyRooms(data.rooms)
    document.getElementById('accountHead').innerHTML = `<img src="/assets/DPs/${data.dp}"><div>${data.displayName}</div>`
})
createRoom.addEventListener('submit', (e)=>{
    e.preventDefault()
    let roomName = document.querySelector('#createRoom > input').value
    if(!roomName) return alert('Please enter a name for your room')
    let data =  { user, roomID: uuidv4(), roomName, max: 3, parent: 'mickeyMouseDonaldDuck', game: { players: [], gameActive: false, roundActive: false, rounds: 10, currentRound: 0, cards: { Mickey: null, Mouse: null, Donald: null, Duck: null } } }
    socket.emit('createRoom', data)
    location.href = '/mickeyMouseDonaldDuck/room?id=' + data.roomID
})
joinForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    location.href = '/mickeyMouseDonaldDuck/room?id=' + document.querySelector('#joinForm > input').value
})