var app = require('http').createServer()
var socketIO = require('socket.io');
var io = socketIO.listen(app);

app.listen(8999);

io.on('connection', function (socket) {
  console.log(io)
  socket.emit('hello','hello,world');
  socket.on('start',()=>{  //管理端促发该事件
    socket.broadcast.emit('interview_start',{
      manager_socket_id : socket.id
    });
  })
  socket.on('interview_reply',(data)=>{  //考生端促发该事件
    io.to(data.manager_socket_id).emit('manager_recive_reply',{
      interviewer_socket_id : socket.id
    });
  })
});
