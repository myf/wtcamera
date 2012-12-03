var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server, { log: false });

server.listen(8888);



//configure
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname + '/public'));
});



//routing
app.get('/', function(req, res){
    res.sendfile(__dirname + '/views/index.html');
});

//server script
io.sockets.on('connection', function(client) {

    client.on('sendframe', function(data){
        client.broadcast.emit('updatevid', data);
    });

});
