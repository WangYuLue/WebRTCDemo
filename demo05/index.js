const mediasoup = require("mediasoup");

const mediaSerer =  mediasoup.Server();

const mediaCodecs =
[
  {
    kind        : "audio",
    name        : "opus",
    clockRate   : 48000,
    channels    : 2,
    parameters  :
    {
      useinbandfec : 1
    }
  },
  {
    kind      : "video",
    name      : "VP8",
    clockRate : 90000
  },
  {
    kind       : "video",
    name       : "H264",
    clockRate  : 90000,
    parameters :
    {
      "packetization-mode"      : 1,
      "profile-level-id"        : "42e01f",
      "level-asymmetry-allowed" : 1
    }
  }
];

const room = mediaSerer.Room(mediaCodecs);
//const peers = [];

room.on('newpeer', (peer)=>{
    initPeer(peer);
    console.log(Number(String(Date.now()).slice(-7)),'a new peer');
})

const express = require('express');
const app = express();
const webPort = 3000;
//app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
});
app.get('/js/socketio.js', function (req, res) {
    res.sendfile(__dirname + '/public/js/socketio.js');
});
app.get('/js/mediasoup.js', function (req, res) {
    res.sendfile(__dirname + '/public/js/mediasoup.js');
});
const webServer = app.listen(webPort, function(){
    console.log(Number(String(Date.now()).slice(-7)),'Web server start1. http://localhost:' + webServer.address().port + '/');
}); 

// 新建一个socket.io
const io = require('socket.io')(webServer);

io.on('connection',(socket) => {
    console.log(Number(String(Date.now()).slice(-7)),'client connected. socket id=' + socket.id + '  , total clients=' + getClientCount());

    socket.on('request', (req, callback) => {
        console.log('request from client');
        switch (req.target) {
            case 'room':
                requestRoom(req, callback);
                break;
            case 'peer':
                requestPeer(req, callback);
                break;
        }
    });

    socket.on('notify',(notification) => {
        console.log('notify from client');
        message(notification);
        switch (notification.target) {
            case 'peer':
                console.log("---------")
                console.log(room.peers)
                room.getPeerByName(notification.peerName)
                    .receiveNotification(notification)
                    .then(res=>{
                        console.log(res);
                    })
                // room.peers.forEach(p=>{
                //     p.receiveNotification(notification);
                // })
                // break;
        }
        //peerStates(`notify----> method:${notification.method},`);
    });

    socket.on('disconnect',()=>{
        console.log(Number(String(Date.now()).slice(-7)),'client disconnected. socket id=' + socket.id + '  , total clients=' + getClientCount());
    })
    
    function message (data){
        socket.emit('message',data)
    }

    // 接受来自room的请求
    function requestRoom (req, callback) {
        message(req);
        room.receiveRequest(req)
            .then(callback)
            .then(()=>{
                peerStates(`requestRoom----> method:${req.method},`);
            });
    }

    // 接受来自peer的请求
    function requestPeer(req, callback) {
        message(req);
        room.getPeerByName(req.peerName)
        .receiveRequest(req)
        .then(callback)
        .then(()=>{
            peerStates(`requestPeer----> method:${req.method},`);
        });
    }

    // 初始化peer
    function initPeer (peer){
        peer.on('close',(originator, appData)=>{
            console.log(`a peer name ${peer.name} closed` , originator, appData)
        });
        peer.on('notify', (notification)=>{
            console.log(`${peer.name} send notify:` , notification);
        //    socket.emit('notify', notification);
        });
        peer.on('newtransport', (webrtcTransport)=>{
            console.log(`a new newtransport is created in ${peer.name}` , webrtcTransport)
        });
        peer.on('newproducer', (producer)=>{
            console.log(`a new newproducer is created in ${peer.name}` , producer)
        });
        peer.on('newconsumer', (consumer)=>{
            console.log(`a new newconsumer is created in ${peer.name}` , consumer)
        });
    }
})

//房间 peer 的状态
function peerStates (from){
    console.log("*****--",from,"--****")
    console.log('peers number:',room.peers.length);
    room.peers.forEach(e => {
        console.log(e.name,e.closed,e.transports,e.producers,e.consumers);
    });
    console.log("****-- end -****")
}

// 获取当前房间连接数
function getClientCount() {
    return io.eio.clientsCount;
}