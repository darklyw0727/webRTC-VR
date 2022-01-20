/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

var socket = io('http://localhost:8001');

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

remoteVideo.addEventListener('resize', () => {
  //console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight} - Time since pageload ${performance.now().toFixed(0)}ms`);
  // We'll use the first onsize callback as an indication that video has started
  // playing out.
  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    //console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
});

let localStream;
let pc1;
let pc2;
const offerOptions = {
  offerToReceiveVideo: 1
};

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

async function start() {
  socket.emit('button','press start button');
  startButton.disabled = true;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({audio: false, video: true});
    localVideo.srcObject = localStream;
    callButton.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function call() {
  socket.emit('button','press call button');
  callButton.disabled = true;
  hangupButton.disabled = false;
  startTime = window.performance.now();
  const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
      }]
  };
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
  pc2 = new RTCPeerConnection(configuration);
  console.log('Created remote peer connection object pc2');
  //pc2.addEventListener('icecandidate', e2 => onIceCandidate(pc2, e2));
  pc2.addEventListener('icecandidate', e2 => socket.emit('e2_2toS',e2));
  //pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));
  //pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
  pc2.addEventListener('track', gotRemoteStream);

  localStream.getTracks().forEach((track) => pc1.addTrack(track, localStream));

  try {
    console.log('pc1 createOffer start');
    const offer = await pc1.createOffer(offerOptions);
    await onCreateOfferSuccess(offer);
  } catch (e) {
    //console.log(`Failed to create session description: ${e.toString()}`);
  }
}

async function onIceCandidate(pc, event) {
    try {
      console.log('onIceCandidate');
      console.log(event);
      await (getOtherPc(pc).addIceCandidate(new RTCIceCandidate(event)));
      console.log(`${getName(pc)} addIceCandidate success`);
    } catch (e) {
      console.log(`${getName(pc)} failed to add ICE Candidate: ${e.toString()}`);
    }
    //console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function gotRemoteStream(e) {
    if (remoteVideo.srcObject !== e.streams[0]) {
      remoteVideo.srcObject = e.streams[0];
    }
}

async function onCreateOfferSuccess(desc) {
  //console.log(`Offer from pc1\n${desc.sdp}`);
  try {
    await pc1.setLocalDescription(desc);
  } catch (e) {

  }

  //console.log('pc2 setRemoteDescription start');
  try {
    await pc2.setRemoteDescription(desc);
  } catch (e) {
    
  }

  //console.log('pc2 createAnswer start');
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  try {
    const answer = await pc2.createAnswer();
    await onCreateAnswerSuccess(answer);
  } catch (e) {
    onCreateSessionDescriptionError(e);
  }
}

async function onCreateAnswerSuccess(desc) {
  //console.log(`Answer from pc2:\n${desc.sdp}`);
  //console.log('pc2 setLocalDescription start');
  try {
    await pc2.setLocalDescription(desc);
  } catch (e) {
  }
  //console.log('pc1 setRemoteDescription start');
  try {
    await pc1.setRemoteDescription(desc);
  } catch (e) {
  }
}

function onIceStateChange(pc, event) {
  if (pc) {
    //console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
    //console.log('ICE state change event: ', event);
  }
}

function hangup() {
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}

socket.on('e1_Sto2',e=>{
  console.log('recive e1 from server');
  console.log(e);
  onIceCandidate(pc1,e);
})