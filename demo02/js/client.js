'use strict';
window.onbeforeunload = function(e){
	hangup();
}
var sendChannel, receiveChannel;
var startButton = document.getElementById("startButton");
var callButton = document.getElementById("callButton");
var sendButton = document.getElementById("sendButton");
var sendTextarea = document.getElementById("dataChannelSend");
var receiveTextarea = document.getElementById("dataChannelReceive");
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var isChannelReady;
var isInitiator;
var isStarted;
var localStream;
var remoteStream;
var pc;
sendButton.onclick = sendData;
// PC ICE
var pc_config = {'iceServers': [{'url': 'turn:peer.eztest.org', 'username': 'eztest', 'credential': 'eztest-pass-1234'}]};
// Peer Connection contraints: (i) use DTLS; (ii) use data channel  
var pc_constraints = {
  'optional': [
    {'DtlsSrtpKeyAgreement': true}
  ]};
// Session Description Protocol constraints:
var sdpcredential = webrtcDetectedBrowser === 'firefox' ? 
		{'offerToReceiveAudio':true,'offerToReceiveVideo':true } :
		{'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true }};
var constraints = {audio: true,
    video: {
        width: { min: 320, ideal: 320, max: 320 },
        height: { min: 240, ideal: 240, max: 240 }
    }
};
var room = prompt('输入房间号:');
var socket = io.connect();
if (room !== '') {
    log('Create or join room', room);
    socket.emit('create or join', room);
}
// 获取本地媒体流
startButton.onclick = function() {
    navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
}
function handleUserMedia(stream) {
	localStream = stream;
	attachMediaStream(localVideo, stream);
	log('本地媒体流添加到video.');
	sendMessage('got user media');
}
function handleUserMediaError(error){
	log('navigator.getUserMedia error: ', error);
}
callButton.onclick = function(){
    if (isInitiator) {
        checkAndStart();
    }
}
// 1. 服务端向客户端发送的信息
socket.on('created', function (room){
  log('Created room ' + room);
  isInitiator = true;
});
socket.on('full', function (room){
  log('Room ' + room + ' is full');
});
socket.on('join', function (room){
  log('remote peer 进入 ' + room);
  isChannelReady = true;
});
socket.on('joined', function (room){
  log('This peer has joined room ' + room);
  isChannelReady = true;
});
socket.on('log', function (array){
  console.log.apply(console, array);
});
// 获得的信息，SDP
socket.on('message', function (message){
  log('Received message:', message);
  if (message === 'got user media') {
        //checkAndStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      checkAndStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
      candidate:message.candidate});
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    console.log("对方已失踪");
    handleRemoteHangup();
  }
});

// 2. 客户端向服务端发送信息
function sendMessage(message){
  if (typeof message === "string"){
      log('Sending message: ', message);
  }else{
      log('Sending message: ', JSON.stringify(message));
  }
  socket.emit('message', message);
}
// PC 创建 并 creat offer
function checkAndStart() {
  if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    if (isInitiator) {
      doCall();
    }
  }
}
// PC 创建
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    pc.onicecandidate = handleIceCandidate;
  } catch (e) {
    console.log('创建PC失败: ' + e.message);
    alert('创建PC失败');
      return;
  }
  pc.onaddstream = handleRemoteStreamAdded;
  pc.onremovestream = handleRemoteStreamRemoved;

  if (isInitiator) {
    try {
      // 创建数据通道
      sendChannel = pc.createDataChannel("sendDataChannel");
      log('Created send data channel');
    } catch (e) {
      alert('Failed to create data channel. ');
      log('createDataChannel() failed with exception: ' + e.message);
    }
    sendChannel.onopen = handleSendChannelStateChange;
    sendChannel.onmessage = handleMessage;
    sendChannel.onclose = handleSendChannelStateChange;
  } else { // remote
    pc.ondatachannel = gotReceiveChannel;
  }
}
// Data channel
function sendData() {
  var data = sendTextarea.value;
  if(isInitiator){
      sendChannel.send(data)
  }else{
      receiveChannel.send(data);
  }
  sendTextarea.value  = "";
  log('Sent data: ' + data);
}

// Handlers
function gotReceiveChannel(event) {
  log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = handleMessage;
  receiveChannel.onopen = handleReceiveChannelStateChange;
  receiveChannel.onclose = handleReceiveChannelStateChange;
}
function handleMessage(event) {
  log('Received message: ' + event.data);
  receiveTextarea.value += event.data + '\n';
}
function handleSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  log('Send channel state is: ' + readyState);
  // If channel ready, enable user's input
  if (readyState == "open") {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    dataChannelSend.placeholder = "";
    sendButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
  }
}
function handleReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  log('Receive channel state is: ' + readyState);
  // If channel ready, enable user's input
  if (readyState == "open") {
	    dataChannelSend.disabled = false;
	    dataChannelSend.focus();
	    dataChannelSend.placeholder = "";
	    sendButton.disabled = false;
	  } else {
	    dataChannelSend.disabled = true;
	    sendButton.disabled = true;
	  }
}
// ICE candidates management
function handleIceCandidate(event) {
  console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

// Create Offer
function doCall() {
  log('Creating Offer...');
  pc.createOffer(setLocalAndSendMessage, onSignalingError, sdpConstraints);
}

// Signalling error handler
function onSignalingError(error) {
	console.log('Failed to create signaling message : ' + error.name);
}

// Create Answer
function doAnswer() {
  log('Sending answer to peer.');
  pc.createAnswer(setLocalAndSendMessage, onSignalingError, sdpConstraints);  
}

// Success handler for both createOffer() and createAnswer()
function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

// Remote stream handlers...
function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}
// Clean-up functions...
function hangup() {
  log('Hanging up.');
  stop();
  sendMessage('bye');
}
function handleRemoteHangup() {
  log('Session terminated.');
  stop();
  isInitiator = false;
}
function stop() {
  isStarted = false;
  if (sendChannel) sendChannel.close();
  if (receiveChannel) receiveChannel.close();
  if (pc) pc.close();  
  pc = null;
  sendButton.disabled=true;
}
function log(data){
  console.log(data);
}
