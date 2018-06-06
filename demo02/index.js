var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
        file.serve(req, res);
}).listen(8181);
console.log("listen on localhost:8181");

var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket){

        socket.on('message', function (message) {
                log('S --> got message: ', message);
                socket.broadcast.emit('message', message);
        });

        socket.on('create or join', function (room) {
                io.clients(function(error, clients){
                        if (error) throw error;
                        log('S --> Room client 数：' + clients.length);
                        var numClients = clients.length;
                        //var numClients = io.of('/').in(room).clients.length;
                        log('S --> Room ' + room + ' has ' + numClients + ' client(s)');
                        if (numClients == 1){
                                socket.join(room);
                                socket.emit('created', room);
                        } else if (numClients == 2) {
                                io.sockets.in(room).emit('join', room);
                                socket.join(room);
                                socket.emit('joined', room);
                        } else {
                                socket.emit('full', room);
                        }
                });
        });
        
        function log(){
            var array = [">>> "];
            for (var i = 0; i < arguments.length; i++) {
            	array.push(arguments[i]);
            }
            socket.emit('log', array);
        }
});