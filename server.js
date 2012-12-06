var express = require('express'),
    exp_server = express(),
    http = require('http'),
    server = http.createServer(exp_server),
    db = require('monk')('localhost/wtcamera'),
    users = db.get("users"),
    PORT = process.env.PORT || 8888,
    io = require('socket.io').listen(server, { log: false });

server.listen(PORT);
//remove remainder db
users.remove();

//configure
exp_server.configure(function(){
    exp_server.set('views', __dirname + '/views');
    exp_server.use(express.static(__dirname + '/public'));
});

//routing
exp_server.get('/', function(req, res){
    res.sendfile(__dirname + '/views/index.html');
});

//socket scripts
io.sockets.on('connection', function(client) {

    client.on('set nickname', function(name) {
        //check validity
        if ((name !== null) && (name !=='')) {
            //check uniqueness
            users.findOne({name:name}) .on('success', function(doc){
                //check if this thing exist
                if (doc === null) {
                    users.insert({name:name}, function(){
                        client.set('name',name);
                        client.emit('user_success',name);
                    });
                }else {
                    client.emit('user_exist',name);
                }
            })
        }
//        client.set('nickname', name, function () {
//            client.emit('ready');
//        });
    });

    client.on('sendframe', function(res){
        client.broadcast.emit('updatevid', res);
    });

    client.on('disconnect', function(res){
        client.get('name',function(err, name){
            users.remove({name:name});
            client.broadcast.emit('leave',name);
        });
        
    });

});
