//camera side js

var socket = io('http://localhost:8001');

const streamButton = document.getElementById('streamButton');
const cameraVideo = document.getElementById('cameraVideo');

let localStream;
let pear;
const offerOptions = {
    offerToReceiveVideo: 1
};

streamButton.addEventListener('click', socketListener);

async function startStream(){
    //try to catch camera
    try{
        const media = await navigator.mediaDevices.getUserMedia({audio:false, video:true});
        cameraVideo.srcObject = media;
        localStream = media;
        console.log('已抓取攝像頭');
    }catch(e){
        alert(`getUserMedia() error: ${e.name}`);
    }

    //
    //socket.emit('button','Stream');
    const configuration = {
        iceServers: [{
            urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
          }]
    };

    try{
        pear = new RTCPeerConnection(configuration);
        console.log('建立P2P連線點');
    }catch(e){
        console.log(`連線點建立失敗，原因: ${e.toString()}`);
    }

    pear.addEventListener('icecandidate', e1 => {
        console.log('send e1 to server');
        console.log(e1.candidate);
        socket.emit('e1_1toS',e1.candidate);
    });
    try{
        localStream.getTracks().forEach(track => pear.addTrack(track, localStream)); //將視訊流串上P2P
        console.log('連接視訊流');
    }catch(e){
        console.log(`視訊流連接失敗，原因: ${e.toString()}`);
    }
    
    /*pc.addEventListener('icecandidate', event => {
        console.log('Camera取得ICEcandidate');
        console.log(event.candidate);
        socket.emit('myICE', event.candidate)
    });*/

    console.log('開始監聽socket server');
    //socketListener();
}

async function socketListener(){
  /************************* */
  socket.emit('button','press start button');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: true});
    //console.log('Received local stream');
    cameraVideo.srcObject = stream;
    localStream = stream;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }

  /************************************* */
  socket.emit('button','press call button');
  const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
      }]
  };
  //console.log('RTCPeerConnection configuration:', configuration);
  pc1 = new RTCPeerConnection(configuration);
  console.log('Created local peer connection object pc1');
  /*pc1.addEventListener('icecandidate', e1 => {
    onIceCandidate(pc1, e1);
    console.log(e1.candidate);
  });*/
  pc1.addEventListener('icecandidate', (e1) => {
    console.log('send e1 to server');
    console.log(e1.candidate);
    socket.emit('e1_1toS',e1.candidate);
  });
}