//socket init and update video upon receiving data
var socket = io.connect();
var dimension = 256;
var fps = 15;
var time_interval = 1000/fps;
var username;
// event generated when video data comes from other user
// send the data to the incoming_video function to be processed and displayed
function creating_canvas(name,dimention) {
    $("#canvas_area").append(
        '<canvas class="pull-left" id="'+name+'" width="'
            + dimension +'" height="' + dimension +'"> </canvas>'
        );
}
///////////////////////////////////////////////////////////////////////
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
        creating_canvas(user_canvas,dimension);
    }


});
socket.on('leave', function(name){
    $('#'+name+'_vid').remove()
});

socket.on('updatetext', function(res){
    var user = res.name;
    var message = res.data;
    update_line('#agg_chat',user,message);
});


///////////////////////////////////////////////////////
//text chats
$('#chat_input').keypress(function(e){
    if (e.keyCode===13) {
        var message = $('#chat_input').val();
        $('#chat_input').val('');
        update_line('#agg_chat',username,message);
        socket.emit('sendtext',{name:username, data:message})
    }
})

function update_line(loc,name,message){
    $(loc).append(name+': ')
    $(loc).append(message)
    $(loc).append('\n')
}
///////////////////////////////////////////////////////////////////////

//updating video from own computer
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                   navigator.mozGetUserMedia || navigator.msGetUserMedia;
var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
var requestAnimationFrame = window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.msRequestAnimationFrame;
// collects data from webcam passes the stream data to the 



navigator.webkitGetUserMedia({video:true}, function(stream) {
        video_element = document.createElement('video');
        video_element.src = URL.createObjectURL(stream);
        video_element.play();
        //locally add canvas
        creating_canvas('own_video',dimension);
        var hidden_canvas_context = prepare_hidden_canvas(dimension);

        function frame_loop(threshold) {
            window.refresh = setInterval(function() {
                var emit_data = input_to_emit(video_element, 
                    hidden_canvas_context, dimension, threshold);
                socket.emit('sendframe', {name:username, data:emit_data});
                update_video(emit_data,'own_video');
            },time_interval);
        }
        // attach the setInterval function to the window object
        frame_loop();

        $( "#slider" ).slider({
            value:15,
            min: 1,
            max: 30,
            step: 1,
            slide: function( event, ui ) {
                $( "#amount" ).val( ui.value );
                window.clearInterval(window.refresh);
                frame_loop(ui.value);
            }
        });
        $( "#amount" ).val( $( "#slider" ).slider( "value" ) );
});

