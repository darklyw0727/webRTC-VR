var http = require('http');
var url = require('url');
var fs = require('fs');
var socket = require('socket.io');
const { isObject } = require('util');

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
        case '/test/getUserMedia.js':
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
        case '/exex.html':
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
        default:
            response.writeHead(404);
            response.write('Something Error - 404');
            response.end();
            break;
    }
});

server.listen(8001);

var io = socket(server);
console.log('建立socket server');

/*io.on('connection', function(socket){
    console.log('用戶連線至socket');

    socket.on('button',function(message){
        console.log(message);
    });

    socket.on('e1_1toS',function(e){
        console.log(e.candidate);
        io.emit('e1_Sto2',e);
    });
    socket.on('e2_2toS',function(e){
        console.log(e.candidate);
        io.emit('e2_Sto1',e);
    });
});*/

function findNowRoom(client) {
    return Object.keys(client.rooms).find(item => {
      return item !== client.id
    });
  }
  
  io.on('connection', client => {
    console.log(`socket 用戶連接 ${client.id}`);
  
    client.on('joinRoom', room => {
      console.log(room);
      
      const nowRoom = findNowRoom(client);
      if (nowRoom) {
        client.leave(nowRoom);
      }
      client.join(room, () => {
        io.sockets.in(room).emit('roomBroadcast', '已有新人加入聊天室！');
      });
    });
  
    client.on('peerconnectSignaling', message => {
      console.log('接收資料：', message);
   
      const nowRoom = findNowRoom(client);
      client.to(nowRoom).emit('peerconnectSignaling', message)
    });
  
    client.on('disconnect', () => {
      console.log(`socket 用戶離開 ${client.id}`);
    });
  });