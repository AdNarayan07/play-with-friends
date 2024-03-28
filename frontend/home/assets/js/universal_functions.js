const backBTN = document.getElementById('backEditProf')
const accountDiv = document.getElementById('account')

function sleep(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}
function containsWhitespace(str) {
    return /\s/.test(str);
}
function updateOnline(users, admin) {
    const userDiv = document.getElementById('users')
    userDiv.innerHTML = "<h3>Online Users</h3><ul></ul>"

    users.forEach((user)=>{
        console.log(gamePlayers)
    document.querySelector('#users > ul').innerHTML += '<li>' + user + '</li>'
    })
    if(user === admin) userDiv.innerHTML += `<button id="deleteRoom" onclick="deleteRoom()">Delete Room</button>`
    else userDiv.children[1].style.height = '80.5%'
}
function handleJoinError(res, socket) {
    console.log(res.sender, socket.id)
    if(socket.id !== res.sender) return;
    if(res.optional) {
        const choice = window.confirm(res.error)
        if(choice) return location.href = '/' + res.parent
        else {
            socket.emit('duplicateJoin', {roomID, user})
            location.reload()
        }
    } else {
        alert(res.error)
        return location.href = '/' + res.parent
    }
}
function handleNoData(){
    localStorage.removeItem('user')
    location.reload()
}
function displayMyRooms(rooms){
    if(rooms.length > 0) {
        document.querySelector('#myRooms > ul').innerHTML = ""
        rooms.forEach(room => {
            document.querySelector('#myRooms > ul').innerHTML += `<a href="/ticTacToe/room?id=${room.id}"><li>${room.name}</li></a>`
        });
    } else {
        document.querySelector('#myRooms > p').innerHTML = ""
        document.querySelector('#myRooms > p').innerHTML += "No Rooms, Create One"
    }
    document.querySelector('#accountMenu > p').innerHTML = '@' + user
}
function displayMessage(message, bubble, isAuthor) {
    document.querySelector('#messageBox > input').removeAttribute('readonly')
    document.querySelector('#messageBox').style.opacity = '1'
    document.querySelector('#messageBox').style.cursor = "auto"
    document.querySelectorAll('#messageBox > input').forEach((e) => e.style.cursor = "auto")
    const dateTimeString = formatTimestamp(message.timestamp)
    console.log('messageReceived')
    const side = isAuthor ? 'right' : 'left'
    const img = bubble ? `<img src="/assets/DPs/${message.dp}">`:`<img style="visibility:hidden">`
    const moreMargin = bubble ? 'more-margin' : ''
    const authorSpan = bubble ? `<span>${message.displayName}</span>` : ''
    const msgDiv = `<div class="msg ${side} ${bubble}" author="${message.author}">${authorSpan}${message.content}${dateTimeString}</div>`
    const content = side === 'left' ? img + msgDiv : msgDiv + img
    document.getElementById("message").innerHTML += `<div class="msg-container ${moreMargin}">${content}</div>`
    document.getElementById("message").scroll({
        top: document.getElementById("message").scrollHeight,
        behavior: "smooth"
    })
}
function sendMessage(){
    if(document.querySelector('#messageBox > input').value === "") return;
    document.querySelector('#messageBox > input').setAttribute('readonly', 'readonly')
    document.querySelector('#messageBox').style.opacity = '0.5'
    document.querySelector('#messageBox').style.cursor = "wait"
    document.querySelectorAll('#messageBox > input').forEach((e) => e.style.cursor = "wait")
    data = { type: 'messageSent', user, message: document.querySelector('#messageBox > input').value, roomID }
    socket.emit('roomInput', data);
    document.querySelector('#messageBox > input').value = ""
}
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
    };
    const dateString = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date);
    const timeString = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

    return `<span><span class="time">${timeString} </span><span class="date">${dateString}</span></span>`
}
function deleteRoom(){
    let x = confirm('Delete Room?')
    if(x) socket.emit('deleteRoom', {roomID, user})
}
document.onkeydown = (e)=>{
    if(e.key === "Escape") document.body.click()
}

if(accountDiv){
    accountDiv.addEventListener('click', function(e) {
        if(e.target.id === backBTN?.id) return;
        this.style.height = "400px";
        this.style.width = "320px";
        this.style.cursor = "default";
        this.style.transition = "width 0.2s cubic-bezier(0.45, 0.05, 0.55, 0.95), height 0.2s cubic-bezier(0.45, 0.05, 0.55, 0.95)"
    })
    
    document.addEventListener('click', async (e) => {
        let element = e.target;
        while (element) {
            if (element.id === "account") return;
            element = element.parentElement;
        }
        accountDiv.style.height = "";
        accountDiv.style.width = "";
        accountDiv.style.cursor = "";
        accountDiv.style.transition = "width 0.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0.2s, height 0.2s cubic-bezier(0.45, 0.05, 0.55, 0.95)";
        await sleep(500)
        if(backBTN?.style.display !== "none") backBTN?.click()
    })
}