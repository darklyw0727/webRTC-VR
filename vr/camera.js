//連線socket server
//var socket = io('https://localhost:8001');
var socket = io('https://120.113.74.66:8001');
//var socket = io('http://localhost:8001');

//抓取網頁元件
const streamButton = document.getElementById('streamButton');
const cameraVideo = document.getElementById('cameraVideo');

let localStream;//本地視訊流
let pearCamera;//P2P連接點
//offer設定
const offerOptions = {
    offerToReceiveVideo: 1
};

//監聽按鈕事件
streamButton.addEventListener('click', startStream);

async function startStream(){
    //傳送加入訊號至socket server
    socket.emit('button','Stream');

    //獲取攝像頭
    try{
        localStream = await navigator.mediaDevices.getUserMedia({audio:false, video:true});//抓取攝像頭
        cameraVideo.srcObject = localStream;//影像串聯到網頁上的video
        console.log('已抓取攝像頭');
    }catch(e){
        alert(`getUserMedia() error: ${e.name}`);
    }

    //監聽socket server
    socketListener();
    console.log('開始監聽socket server');
}

async function socketListener(){
    //監聽開始訊號
    socket.on('start', () => {
        console.log('Link Start!');
        
        //NET穿透設定
        const configuration = {
            iceServers: [{
                urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
              }]
        };
    
        //架設P2P連接點
        pearCamera = new RTCPeerConnection(configuration);
        console.log('建立P2P連線點');
    
        //將本地視訊流連上P2P接點
        localStream.getTracks().forEach(track => pearCamera.addTrack(track, localStream)); //將視訊流串上P2P
        console.log('連接視訊流');
        
        //送出offer
        localOffer();

        //取得ICE並傳送
        pearCamera.addEventListener('icecandidate', event => {
            console.log('Camera取得ICEcandidate');
            console.log(event.candidate);
            socket.emit('ice', event.candidate);//ice傳送至socket server
            console.log('ICEcandidate傳送至socket server');
        });
    });

    //監聽answer
    socket.on('watcherAnswer', (answer) => {
        remoteAnswer(answer);
    })

    //監聽ice
    socket.on('otherICE', (ice) => {
        awaitICE(ice);
    });
}

//await is only valid in async functions and the top level bodies of modules
async function localOffer(){
    try{
        const offer = await pearCamera.createOffer();//建立offer
        console.log('建立offer');
        try{
            await pearCamera.setLocalDescription(offer);//offer setLocalDescription
            console.log('Offer setLocalDescription');
            socket.emit('offer', offer);
            console.log('傳送offer到socket server');//offer傳送至socket server
        }catch(e){
            console.log(`Offer setLocalDescription失敗，原因: ${e.toString()}`);
        }
    }catch(e){
        console.log(`creatOffer失敗，原因: ${e.toString()}`);
    }
}

async function remoteAnswer(event){
    try{
        await pearCamera.setRemoteDescription(event);//接收遠端answer後，answer setRemoteDescription
        console.log('Answer setRemoteDescription');
    }catch(e){
        console.log(`Answer setRemoteDescription失敗，原因: ${e.toString()}`);
    }
}

async function awaitICE(ice){
    try{
        console.log('開始接收watcher ICE');
        console.log(ice);
        await (pearCamera.addIceCandidate(new RTCIceCandidate(ice)));//接收到遠端ice後，建立P2P連線
        console.log('addIceCandidate成功');
        //確認連線狀態
        var rtcState = pearCamera.connectionState;//獲取連線狀態
        console.log(`P2P連線狀態: ${rtcState}`);
        if(rtcState === 'connected'){
            socket.emit('p2pSucess');//傳送P2P建立成功訊號至socket server
            console.log('P2P連線成功');
        }
    }catch(e){
        console.log(`addIceCandidate失敗，原因: ${e.toString()}`);
    }
}