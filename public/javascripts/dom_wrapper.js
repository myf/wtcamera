//socket init and update video upon receiving data
var socket = io.connect();
var dimension = 256;
var fps = 12;
var time_interval = 1000/fps;
var username;
// event generated when video data comes from other user
// send the data to the incoming_video function to be processed and displayed
socket.on('connect', function() {
    socket.emit('set nickname', prompt('get yourself a name'));
    socket.on('user_exist', function(name) {
        socket.emit('set nickname', 
            prompt('your name '+name+' is taken, choose another one!')
            );
    });
    socket.on('user_success', function(name){
        username = name;
    });
});
socket.on('updatevid', function(res){
    var user = res.name;
    var user_canvas = user+'_vid';
    if (user === username) {
        return;
    } else if ($('#'+user_canvas).get(0)) {
        update_video(res.data, user_canvas);
    } else {
        $("#canvas_area").append(
            '<canvas class="pull-left" id="'+user_canvas+'" width="'
                + dimension +'" height="' + dimension +'"> </canvas>'
            );
    }


});
socket.on('leave', function(name){
    $('#'+name+'_vid').remove()
});

//updating video from own computer
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                   navigator.mozGetUserMedia || navigator.msGetUserMedia;
var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
// collects data from webcam passes the stream data to the 
navigator.webkitGetUserMedia({video:true}, function(stream) {
        video_element = document.createElement('video');
        video_element.src = URL.createObjectURL(stream);
        video_element.play();
        //locally add canvas
        $("#canvas_area").append(
            '<canvas class="pull-left" id="own_video" width="'
                + dimension +'" height="' + dimension +'"> </canvas>'
            );

        // attach the setInterval function to the window object
        var hidden_canvas_context = prepare_hidden_canvas(dimension)
        window.refresh = window.setInterval(function() {
            // send the video data to other person
            var emit_data = input_to_emit(video_element,
                hidden_canvas_context,dimension);
            socket.emit('sendframe', {name:username,data:emit_data});
            // update the local canvas
            update_video(emit_data, 'own_video');
            //update_colored_video(video_element, 'output');
            //update_video(detect_edges(video_element,dimention), 'output');

            //var str_edata = Array.prototype.join.call(emit_data, "");
        }, time_interval);

        $( "#slider" ).slider({
            value:15,
            min: 1,
            max: 20,
            step: 1,
            slide: function( event, ui ) {
                $( "#amount" ).val( ui.value );
                window.clearInterval(window.refresh);

                window.refresh = setInterval(function() {
                    var emit_data = input_to_emit(video_element, 
                        hidden_canvas_context, dimension, ui.value);
                    socket.emit('sendframe', {name:username,data:emit_data});
                    update_video(emit_data,'own_video');
                },time_interval);
            }
        });
        $( "#amount" ).val( $( "#slider" ).slider( "value" ) );
});


