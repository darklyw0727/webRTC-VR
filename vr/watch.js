//連線socket server
//var socket = io('https://localhost:8001');
var socket = io('https://120.113.74.66:8001');
//var socket = io('http://localhost:8001');

//抓取網頁元件
const watchButton = document.getElementById('watchButton');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;//本地視訊流
let pearWatcher;//P2P連接點
//offer設定
const offerOptions = {
    offerToReceiveVideo: 1
};

//監聽按鈕事件
watchButton.addEventListener('click', startWatch);

async function startWatch(){
    //傳送加入訊號至socket server
    socket.emit('button','Watch');

    //監聽socket server
    socketListener();
    console.log('開始監聽socket server');
}

async function socketListener(){
    //監聽開始訊號
    socket.on('start', () => {
        console.log('Link Start!');

        //NET穿透設定
        const ICEconf = {
            iceServers: [{
                urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
              }]
        };

        //架設P2P連接點
        pearWatcher = new RTCPeerConnection(ICEconf);
        console.log('建立P2P連線點');

        //連接P2P遠端視訊流
        pearWatcher.addEventListener('track', (event) => {
            remoteVideo.srcObject = event.streams[0];
            console.log('視訊流同步');
            if(remoteVideo !== event.streams[0]){
                remoteVideo.srcObject = event.streams[0];
                console.log('連接視訊流');
            }
        });
    });

    //監聽offer
    socket.on('cameraOffer', (offer) => {
        remoteOffer(offer);
        localAnswer();
        pearWatcher.addEventListener('icecandidate', (event) => {
            console.log('Watcher取得ICEcandidate');
            console.log(event.candidate);
            socket.emit('ice', event.candidate)
        });
    })

    //監聽ice
    socket.on('otherICE', (ice) => {
        awaitICE(ice);
    });

    //監聽P2P連接訊號
    socket.on('cameraP2Pok', () => {
        var rtcState = pearWatcher.connectionState;
        console.log(`P2P連線狀態: ${rtcState}`);
        if(rtcState === 'connected'){
            console.log('P2P連線成功');
        }
        
    });
}

//await is only valid in async functions and the top level bodies of modules
async function localAnswer(){
    try{
        const answer = await pearWatcher.createAnswer();//建立answer
        console.log('建立answer');
        try{
            await pearWatcher.setLocalDescription(answer);//answer setLocalDescription
            console.log('Answer setLocalDescription');
            socket.emit('answer', answer);//answer傳送至socket server
            console.log('Answer傳送至socket server');
        }catch(e){
            console.log(`Answer setLocalDescription失敗，原因: ${e.toString()}`);
        }
    }catch(e){
        console.log(`creatAnswer失敗，原因: ${e.toString()}`);
    }
}

async function remoteOffer(event){
    try{
        await pearWatcher.setRemoteDescription(event);//接收遠端offer後，offer setRemoteDescription
        console.log('Offer setRemoteDescription');
    }catch(e){
        console.log(`Offer setRemoteDescription失敗，原因: ${e.toString()}`);
    }
}

async function awaitICE(ice){
    try{
        console.log('開始接收camera ICE');
        console.log(ice);
        await (pearWatcher.addIceCandidate(new RTCIceCandidate(ice)));//接收到遠端ice後，建立P2P連線
        console.log('addIceCandidate成功');
    }catch(e){
        console.log(`addIceCandidate失敗，原因: ${e.toString()}`);
    }
}