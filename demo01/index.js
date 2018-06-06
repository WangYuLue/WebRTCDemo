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
    socket.emit("msg",{someMsg:123})
    socket.on("send",function(data){
        console.log(data)
        var temp = io.to(data.rooms)
        temp.emit("send",data.data);
    })
    socket.on('join',function(data){
        socket.join(data)
    })
})