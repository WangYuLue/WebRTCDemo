let app = require('http').createServer()
let socketIO = require('socket.io');
let io = socketIO.listen(app);

app.listen(8999);

io.on('connection', function (socket) {
  // console.log(io)
  socket.emit('hello','hello,world!!');

  //管理端促发该事件
  socket.on('manager_start',()=>{  
    socket.broadcast.emit('interviewer_start',{
      manager_socket_id : socket.id
    });
  })

  //管理端促发该事件
  socket.on('manager_reply',(data)=>{  
    io.to(data.interviewer_socket_id).emit('interviewer_recive_reply',{
      manager_socket_id : socket.id
    });
  })

  //考生端促发该事件
  socket.on('interviewer_start',()=>{  
    socket.broadcast.emit('manager_start',{
      interviewer_socket_id : socket.id
    });
  })

  //考生端促发该事件
  socket.on('interviewer_reply',(data)=>{  
    io.to(data.manager_socket_id).emit('manager_recive_reply',{
      interviewer_socket_id : socket.id
    });
  })

  //管理端与考生端的offer, answer, 或者 ice candidate 的信息传递
  /*
  *     data格式
  *     {
  *       to_socket_id : 接受方SocketID,
  *       data : offer, answer, 或者 ice candidate
  *     }
  * */
  socket.on('signal',(data)=>{  
    io.to(data.to_socket_id).emit('signal',{
      from_socket_id : socket.id,
      data : data.data
    });
  })
});
