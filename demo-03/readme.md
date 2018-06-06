1、当 `pc.addStream(s);` 后，`pc.createOffe()`就不再需要 `{offerToReceiveVideo: 1}` ，参考 `../wang-02/index.html` 里提出的疑惑。

```js
pc = new RTCPeerConnection(null);
pc.onicecandidate = (a) =>{
    console.log("show",a)
}
pc.createOffer((sessionDescription) =>{
    pc.setLocalDescription(sessionDescription);console.log(sessionDescription);
},()=>{});
```

```js
pc = new RTCPeerConnection(null);
pc.onicecandidate = (a) =>{
    console.log("show",a)
}
pc.createOffer({offerToReceiveVideo: 1}).then((sessionDescription) =>{
    pc.setLocalDescription(sessionDescription);console.log(sessionDescription);
},()=>{});
```

```js
navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
})
.then((s)=>{
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = (a) =>{
        console.log("show",a)
    }
    pc.addStream(s);
    pc.createOffer((sessionDescription) =>{
        pc.setLocalDescription(sessionDescription);console.log(sessionDescription);
    },()=>{});
})
```

2、要获得 `socket.io` 房间里的成员数，可参考如下代码：

```js
var clientsInRoom = io.sockets.adapter.rooms['test'];
var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
```
其中：关闭浏览器的一个窗口，成员数会相应减少。