var app = require('http').createServer(hander);

var io = require('socket.io')(app);

app.listen(8888);

var fs = require('fs')

function hander (req,res) {
    console.log(__dirname);
    fs.readFile(__dirname+'/index.html',function(err,data){
        if(err){
            res.writeHead(500);
            res.end('Error loading index.html');
        }else{
            res.writeHead(200);
            res.end(data);
        }
    })
}

io.on("connection",function(socket){
    socket.join('test');
    var clientsInRoom = io.sockets.adapter.rooms['test'];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log(numClients);
    socket.emit('isInit',numClients===1);
    socket.on('message',(d)=>{
        socket.broadcast.emit('message',d)
    })
})