var app = require('http').createServer(handler)
var socketIO = require('socket.io');
var io = socketIO.listen(app);
var io_manage = socketIO.listen(app,{path:'/manage'});
var fs = require('fs');

app.listen(8989);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

//面试端
io.on('connection', function (socket) {
  socket.emit('hello','hello,interview');

  socket.on('message',(d)=>{
    io_manage.emit('message',d)
  })
  //匹配ice
  socket.on('candidate',(d)=>{
    io_manage.emit('candidate',d)
  })
  //收到offer
  socket.on('offer',(d)=>{
    io_manage.emit('offer',d)
  })
});

//管理端
io_manage.on('connection', function (socket) {
  socket.emit('hello','hello,manager');
  //匹配ice
  socket.on('candidate',(d)=>{
    io.emit('candidate',d)
  })
  //收到answer
  socket.on('answer',(d)=>{
    io.emit('answer',d)
  })
});