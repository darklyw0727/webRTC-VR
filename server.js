var http = require('http');
var url = require('url');
var fs = require('fs');
var socket = require('socket.io');
const { isObject } = require('util');

let camera = '';
let watcher = '';

console.log('建立伺服器');

var server = http.createServer(function(request, response){
    console.log('建立連線');
    var path = url.parse(request.url).pathname;

    switch(path){
        case '/':
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write('Welcome');
            response.end();
            break;
        case '/test/test.html':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        case '/test/test.js':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/js'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        case '/ex/ex.html':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        case '/ex/ex.js':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/js'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        case '/vr/camera.html':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        case '/vr/camera.js':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/js'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        case '/vr/watch.html':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        case '/vr/watch.js':
            fs.readFile(__dirname + path, function(error, data){
                if(error){
                    response.writeHead(404);
                    response.write('Something Error - 404');
                }else{
                    response.writeHead(200, {'Content-Type': 'text/js'});
                    response.write(data, 'utf8');
                }
                response.end();
            })
            break;
        default:
            response.writeHead(404);
            response.write('Something Error - 404');
            response.end();
            break;
    }
});

server.listen(8001);

//建立socket server
try{
    var io = socket(server);
    console.log('建立socket server');
}catch(e){
    console.log(`Socket server建立失敗，原因:${e.toString()}`);
}


//監聽連接用戶
io.on('connection', function(socket){
    console.log(`用戶 ${socket.id} 連線至socket`);

    //監聽加入訊號
    socket.on('button', (button) => {
        //camera加入
        if(button === 'Stream'){
            console.log(`Camera開始串流，socketID為 ${socket.id}`);
            camera = socket.id;//camera紀錄用戶id
        }else if(button === 'Watch'){//watcher加入
            console.log(`Watcher加入，socketID為 ${socket.id}`);
            watcher = socket.id;//watcher紀錄用戶id
        }

        //判斷是否雙方都加入
        if(camera != '' && watcher != ''){
            io.emit('start');//傳送開始訊號
            console.log('Link Start!');
        }
    });

    //offer中轉
    socket.on('offer', (offer) => {
        console.log('接收到來自camera的offer');
        //console.log(offer);
        io.to(watcher).emit('cameraOffer', offer);//offer轉送至watcher
        console.log('Offer轉送至watcher');
    })
    //answer中轉
    socket.on('answer', (answer) => {
        console.log('接收到來自watcher的answer');
        //console.log(answer);
        io.to(camera).emit('watcherAnswer', answer);//answer轉送至camera
        console.log('Answer轉送至camera');
    })
    //ICEcandidate中轉
    socket.on('ice', (ice) => {
        if(socket.id === camera){
            console.log('接收來自camera的ICEcandidate');
            io.to(watcher).emit('otherICE', ice);//cameraICE轉送至watcher
            console.log('CameraICE轉送給watcher');
        }else if(socket.id === watcher){
            console.log('接收來自watcher的ICEcandidate');
            io.to(camera).emit('otherICE', ice);//watcherICE轉送至camera
            console.log('WatcherICE轉送給camera');
        }
    });
    //監聽cameraP2P連接成功訊號
    socket.on('p2pSucess', () => {
        io.to(watcher).emit('cameraP2Pok');//傳送確認訊號至watcher
        console.log('P2P連線成功');
    });

    /*socket.on('e1_1toS',function(e){
        console.log('recive e1 from 1');
        console.log(e);
        io.emit('e1_Sto2',e);
        console.log('send e1 to 2');
    });

    socket.on('e2_2toS',function(e){
        console.log(e);
        io.emit('e2_Sto1',e);
    });*/

    //用戶離開
    socket.on('disconnect', () => {
        //camera離開，清空該資料
        if(socket.id === camera){
            console.log(`Camera已離開(ID = ${socket.id})`);
            camera = '';
            console.log('移除camera資料');
        }else if(socket.id === watcher){//watcher離開，清空該資料
            console.log(`Watcher已離開(ID = ${socket.id})`);
            watcher = '';
            console.log('移除watcher資料');
        }

        //io.emit('over');
    });
});