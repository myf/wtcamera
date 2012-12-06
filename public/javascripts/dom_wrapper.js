//socket init and update video upon receiving data
var socket = io.connect();
var dimension = 256;
var fps = 15;
var time_interval = 1000/fps;
var username;
var user_list = [];
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
//TODO: it shouldn't check validity everytime
//polling every 2 second?
//or trying to get a long polling that sends the users to everone
socket.on('updatevid', function(res){
    var user = res.name;
    var user_canvas = user + '_vid';
    console.log(user_list)
    if (user === username) {
        return;
    } else if ($.inArray(user, user_list)===0) {
        update_video(res.data, user_canvas);
    } else {
        return;
    }
});

function add_canvas_list(user) {
    var user_canvas = user + '_vid';
    $("#canvas_area").append(
        '<canvas class="pull-left" id="'+user_canvas+'" width="'
            + dimension +'" height="' + dimension +'"> </canvas>'
        );
}

function remove_canvas_list(user) {
    var user_canvas = user + '_vid';
    $('#'+user_canvas).remove();
}


socket.on('SOW', function(list) {
    console.log(list);
    if (list === user_list) {
        return;
    } else {
        for (var i = 0; i < list.length; i++) {
            if ($.inArray(list[i],user_list)===-1) {
                if(list[i]!==username) {
                    add_canvas_list(list[i]);
                }
            }
        }
        for (var i = 0; i < user_list.length; i++) {
            if($.inArray(user_list[i],list)===-1) {
                if (user_list[i]!==username) {
                    remove_canvas_list(user_list[i]);
                }
            }
        }
        user_list = list;
    }
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


