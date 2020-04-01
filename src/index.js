const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')


const app = express();
const server = http.createServer(app)
const io = socketio(server)
app.use(express.static(path.join(__dirname,'../public')));


app.get('/',(req,res) =>{
    res.render('index.html')
 })

io.on('connection', (socket)=>{
    console.log('New Connection')

    
    socket.on('join',(options, callback)=>{

        const {error, user} = addUser({id: socket.id, ...options});

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users:  getUsersInRoom(user.room)
        })
        callback();
    })

     socket.on('sendMessage',(message,callback)=>{
        const filter = new Filter();
        const user = getUser(socket.id);
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })
    socket.on('sendLocation',(location, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
    
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})



server.listen(3000,() =>{
    console.log('Server has started')
})