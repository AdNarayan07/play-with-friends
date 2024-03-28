const socket = io();
const user = localStorage.getItem('user')

const LSbuttons = document.getElementById('LSbuttons')
const loginBTN = document.getElementById('loginBTN')
const signupBTN = document.getElementById('signupBTN')

const LSforms = document.getElementById('LSforms')
const loginForm = document.getElementById('loginForm')
const signupForm = document.getElementById('signupForm')

const gamesDiv = document.getElementById('gamesDiv')

const profileChangeBTN = document.getElementById('profileChange')
const logoutBTN = document.getElementById('logout')
const saveChangeBTN = document.getElementById('saveChange')

if(!user) {
    gamesDiv.style.display = "none";
    accountDiv.style.display = "none";
    LSforms.style.display = "none";
    LSbuttons.style.display = "ruby-text";
}

loginBTN.addEventListener('click', (e)=>{
    LSbuttons.style.display = "none";
    LSforms.style.display = "block";
    loginForm.style.display = "flex"
})
signupBTN.addEventListener('click', (e) =>{
    for(let i=1; i<=7 ; i++) {
            let checked = i === 1 ? 'checked' : ''
            document.querySelector('#chooseDP').innerHTML += `<label><input type="radio" name="dpSignup" value="${i}.png" id="dp${i}" style="display:none" ${checked}><img src="assets/DPs/${i}.png"><img class="check" src="assets/images/tick.svg""></label>`
        }
    LSbuttons.style.display = "none";
    LSforms.style.display = "block";
    signupForm.style.display = "flex";
    console.log(getComputedStyle(document.querySelector('#chooseDP')).width)
})

loginForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    const username = document.querySelectorAll('#loginForm > input')[0].value
    const password = document.querySelectorAll('#loginForm > input')[1].value

    const data = {username, password}
    socket.emit('login', data)
})
signupForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    const otherDatas = document.querySelectorAll('#otherData > input')
    let dp = "";
    const radioInputs = document.querySelectorAll('input[name="dpSignup"]');
    for (var i = 0; i < radioInputs.length; i++) {
        if (radioInputs[i].checked) {
        dp = radioInputs[i].value;
        break;
        }
    }
    if(otherDatas[2].value !== otherDatas[3].value) return alert('Passwords are not same')

    const data = { username: otherDatas[0].value, displayName: otherDatas[1].value, dp, password: otherDatas[2].value }
    const { username, password } = data
    if(containsWhitespace(username) || containsWhitespace(password)) return alert('Username or Password can\'t have whitespaces')
    socket.emit('signup', data)
})
profileChangeBTN.addEventListener('click', (e)=>{
    profileChangeBTN.style.display = "none"
    logoutBTN.style.display = "none"
    saveChangeBTN.style.display = "initial"
    backBTN.style.display = "initial"

    document.getElementById('myRooms').style.display = "none"
    document.getElementById('editProfile').style.display = "block"
})
logoutBTN.addEventListener('click', (e)=>{
    localStorage.removeItem('user')
    location.reload()
})
saveChangeBTN.addEventListener('click', (e) => {  
    let newDP = "";
    const radioInputs = document.querySelectorAll('input[name="dp"]');
    for (var i = 0; i < radioInputs.length; i++) {
        if (radioInputs[i].checked) {
        newDP = radioInputs[i].value;
        break;
        }
    }
    const newDisplayName = document.getElementById('displayNameInput').value
    let passwords = []
    const pwds = document.querySelectorAll('#pwdChange > input')
    pwds.forEach((p)=>passwords.push(p.value))

    if(passwords[0] !== passwords[1]) return alert('Passwords don\'t match')
    if(containsWhitespace(passwords[0])) return alert('Passwords can\'t have whitespace')
    let data = {  password: passwords[0] || null,  displayName: newDisplayName, dp: newDP}
    socket.emit('editProfile', { user, data })
})
backBTN.addEventListener('click', (e) => {
    const userOriginalData = JSON.parse(sessionStorage.getItem(user))
    const dpInput = document.querySelector(`input#dp${userOriginalData.dp.split('.')[0]}`)
    const displayNameInput = document.querySelector(`input#displayNameInput`)
    const pwds = document.querySelectorAll('#pwdChange > input')

    dpInput.checked = "true"
    displayNameInput.value = userOriginalData.displayName
    pwds.forEach((p)=>p.value="")

    profileChangeBTN.style.display = "initial"
    logoutBTN.style.display = "initial"
    saveChangeBTN.style.display = "none"
    backBTN.style.display = "none"

    document.getElementById('myRooms').style.display = "block"
    document.getElementById('editProfile').style.display = "none"
})

socket.on('connect', () => socket.emit('giveMyData', { user: user || undefined, parent: undefined }))
socket.on('yourData', (data)=>{
    if(!data) return handleNoData()
    sessionStorage.setItem(user, JSON.stringify(data))
    displayMyRooms(data.rooms)
    document.getElementById('accountHead').innerHTML = `<img src="assets/DPs/${data.dp}"><div>${data.displayName}</div>`
    document.querySelector('#dpSelect').innerHTML = ""
    for(let i=1; i<=7 ; i++) {
        let checked = data.dp === i + '.png' ? 'checked' : ''
        document.querySelector('#dpSelect').innerHTML += `<label><input type="radio" name="dp" value="${i}.png" id="dp${i}" style="display:none" ${checked}><img src="assets/DPs/${i}.png"><img class="check" src="assets/images/tick.svg""></label>`
    }
    document.querySelector('#Names').innerHTML = `<label>User Name: </label><input value="${user}" type="text" style="color:#7b8185; border-color:#7b8185; cursor: not-allowed" readonly autocomplete="username"><br><label>Display Name: </label><input value="${data.displayName}" type="text" id="displayNameInput">`
})
socket.on('LSresponse', (res)=>{
    if(!res.status) {
        alert(res.error)
        return
    } else {
        localStorage.setItem('user', res.data.username)
        alert(res.data.message)
        return location.reload()
    }
})
socket.on('editProfileResponse', (res) => {
    socket.emit('giveMyData', { user })
    const newData = res.data
    const dpInput = document.querySelector(`input#dp${newData.dp.split('.')[0]}`)
    const displayNameInput = document.querySelector(`input#displayNameInput`)
    const pwds = document.querySelectorAll('#pwdChange > input')

    dpInput.checked = "true"
    displayNameInput.value = newData.displayName
    pwds.forEach((p)=>p.value="")

    profileChangeBTN.style.display = "initial"
    logoutBTN.style.display = "initial"
    saveChangeBTN.style.display = "none"
    backBTN.style.display = "none"

    document.getElementById('myRooms').style.display = "block"
    document.getElementById('editProfile').style.display = "none"
    alert(res.response)
})