var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

app.listen(8888);



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
