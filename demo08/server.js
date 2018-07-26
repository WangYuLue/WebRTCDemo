var app = require('http').createServer()
var socketIO = require('socket.io');
var io = socketIO.listen(app);
var io_manage = socketIO.listen(app,{path:'/manage'});

app.listen(8999);


//面试端
io.on('connection', function (socket) {
  socket.emit('hello','hello,interviewer');
  socket.on('message',(d)=>{
    io_manage.emit('message',d)
  })

  socket.on('create',(d)=>{
    io_manage.emit('create',d)
  })
});

//管理端
io_manage.on('connection', function (socket) {
  socket.emit('hello','hello,manager');
  //发送连接请求
  socket.on('message',(d)=>{
    io.emit('message',d)
  })
  socket.on('start',(d)=>{
    io.emit('start',d)
  })
});
