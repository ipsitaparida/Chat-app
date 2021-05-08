var express = require('express')
var bodyParser = require('body-parser')
var app = express() //instance of express

// using socket
var http = require('http').Server(app) 
var io = require('socket.io')(http) 

var mongoose = require('mongoose')

//middleware
app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// uncomment this if deprication warning
mongoose.Promise = Promise

// mongoDB uri
var dbUrl = 'mongodb://user:user@cluster0-shard-00-00.5pyvg.mongodb.net:27017,cluster0-shard-00-01.5pyvg.mongodb.net:27017,cluster0-shard-00-02.5pyvg.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-6hgjxi-shard-0&authSource=admin&retryWrites=true&w=majority'

var Message = mongoose.model('Message', {
    name: String,
    message: String
})


app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) =>{
        res.send(messages)
    })
})

app.get('/messages/:user', (req, res) => {
    var user = req.params.user
    Message.find({name: user}, (err, messages) =>{
        res.send(messages)
    })
})

app.post('/messages', async (req, res) => {
    var msg = new Message(req.body)
    var savedMessage = await msg.save()
    .then(()=> {
        console.log('saved')
        return Message.findOne({message: 'badword'})
    }).then(censor => {
        if(censor) {
            console.log('censored word found', censor)
            return Message.deleteOne({_id: censor.id})
        }
        io.emit('syncmessage', req.body) // badword is not longer displayed
        res.sendStatus(200)
    }).catch((err) => {
        return sendStatus(500)
        return console.error(err)
    })
})

io.on('connection', (socket) => {
    console.log("a user connected")
})

// save message to DB. Using mongoDB here
mongoose.connect(dbUrl,{ useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    console.log('mongo ds connection', err)
})
// use http server so that both socket and express are running
var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
}) //start server to listen

