const socket = io()

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () =>{
    //New Message element 
    const $newMessage = $messages.lastElementChild

    //Height of the new Message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight 

    // Height of messages Container 
    const containerHeight = $messages.scrollHeight

    //How Far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(Math.round(containerHeight - newMessageHeight - 1) <= Math.round(scrollOffset)){
        $messages.scrollTop = $messages.scrollHeight;
    }
}


socket.on('message', ({username, text, createdAt}) => {
    const html = Mustache.render(messageTemplate,{
        username,
        text,
        createdAt: moment(createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll()
})

socket.on('locationMessage',(message) =>{
    const html = Mustache.render(locationMessageTemplate,{
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const input = e.target.elements.message.value
    socket.emit('sendMessage', input, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if (error) {
            return console.log(error)
        }

        console.log('Message has delivered')
    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geo location is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    })
})

socket.emit('join',{username, room}, (error) =>{
    if(error){
        alert(error)
        location.href = '/'
    }
})