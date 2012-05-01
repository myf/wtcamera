function update_video(data, canvas_id) {
    // output will display the processed webcam image from own computer
    data = lzw_decode(data);
    var output = document.getElementById(canvas_id);
    var output_context = output.getContext('2d');
    data = base64_to_bin(data,output.height);

    // draw the data to the canvas
    var finalImage = output_context.createImageData(output.width,output.height);
    for (var i=0;i<data.length*4;i=i+4){
        finalImage.data[i]=data[i/4]*255;
        finalImage.data[i+1]=data[i/4]*255;
        finalImage.data[i+2]=data[i/4]*255;
        finalImage.data[i+3]=255;
    }
    output_context.putImageData(finalImage,0,0);
//    var base64png = output.toDataURL()

    // transform the data array to a unicode string

//    return base64png;
    //instead of return this data as a bytestring we 
    //are outputting a base64 png that might just work a little
    //better,then we will try other gzip libraries to zip our
    //data on the fly
    //
    //return data;
}

function detect_edges(video_element,dim,threshold) {
    var horizontal_gradient =[[-1,0,1]];
    var vertical_gradient =[[-1],[0],[1]];
    var gaussian = [[1,4,7,4,1],
                    [4,16,26,16,4],
                    [7,26,41,26,7],
                    [4,16,26,16,4],
                    [1,4,7,4,1]];

    // input is a hidden / undisplayed canvas ... it has the data
    // that comes from the webcam, unprocessed
    var input = document.createElement('canvas');
    input.setAttribute('width', dim);
    input.setAttribute('height', dim);
    var input_context = input.getContext('2d');
    //draw input first
    input_context.drawImage(video_element,0,0, input.width, input.height);
    var input_data = input_context.getImageData(0,0,input.width,input.height);

    //black and whiting
    var bw = new Uint8Array(input.width*input.height);
    for (var i=0,data_length = input_data.data.length;i<data_length;i=i+4){
        bw[i/4]=Math.floor((input_data.data[i]+input_data.data[i+1]+input_data.data[i+2])/3)
    }
    //var small = downsample(bw, input.width, input.height, 2);
    var smoothed = convolve(bw, input.width, input.height,gaussian,1/273);
    var result1 = convolve(smoothed, input.width, input.height,vertical_gradient,1);
    var result2 = convolve(smoothed, input.width, input.height,horizontal_gradient,1);
    var result = merge(result1,result2);
    apply_to_each_pixel(result, function (x) {
            //reverse it
            //threshold
            var t = threshold || 15;
            if (x>t) {
                x = 0;
            }else{
                x=1;
            }
            return x;
    });
    
    result = bin_to_base64(result);
    result = lzw_encode(result);
    return result;
}

function convolve (input, width, height, kernel,n_factor) {
    var k_width = kernel[0].length;
    var k_height = kernel.length;
    var output = new Uint8Array(width*height);
    var width_offset = Math.floor(k_width/2);
    var height_offset = Math.floor(k_height/2);
    for (var j=height_offset;j<height-height_offset;j++) {
        for (var i= width_offset;i<width-width_offset;i++) {
            var sum =0;
            for (var mj=0;mj<kernel.length;mj++) {
                for (var mi=0;mi<kernel[0].length;mi++) {
                    sum += kernel[mj][mi]*input[width*(j-height_offset+mj)+(i-width_offset+mi)];
                    //console.log(kernel[mj][mi], input[width*j+i]);
                }
            }
            var avg = Math.min(Math.abs(Math.floor(sum*n_factor)),255);
            output[width*j+i]= avg;

        }
    }
    return output;
}
function apply_to_each_pixel (input, call) {
    for (var j = 0;j<input.length;j++){
            input[j] = call(input[j]);
    }
}
function merge (input1, input2) {
    var output = new Uint8Array(input1.length); 
    for (var j = 0;j<input1.length;j++){
        output[j] = Math.min(input1[j]+input2[j],255);
    }
    return output;
}
        

function downsample (input, width, height, factor) {
    var new_width = width / factor;
    var new_height = height / factor;
    var output = new Uint8Array(width*height);
    for (var j=0;j<new_height;j++) {
        for (var i=0;i<new_width;i++) {
            var sum = 0;
            for (var mj=0;mj<factor;mj++) {
                for (var mi=0;mi<factor;mi++) {
                    sum = sum + input[(((j*factor)+mj)*width)+((i*factor)+mi)];
                }
            }
            var avg = Math.floor(sum / (factor*factor));
            output[width*j+i] = avg;
            //console.log(j, i);
        }
    }
    return output;
}

function bin_to_unicode(uint8array) {
    return uint8array;

}

function unicode_to_bin(unicode) {
    return unicode;
}


function bin_to_base64(uint8array) {
	_key_map= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var result = "";
    var iter_length = uint8array.length-uint8array.length%6;
    //get the value
    for (var i=0;i<iter_length;i+=6) {
        var sum = 0;
        for (var j=0;j<6;j++) {
            sum += (uint8array[i+j]<<(5-j));
        }
        result = result.concat(_key_map[sum]);
    }
    return result;
}

String.prototype.times = function(n) { return (new Array(n+1)).join(this);};

function base64_to_bin(base64,dim) {
	_key_map= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var piece_string;
    var result = new Uint8Array(dim*dim);
    for (var i=0;i<base64.length;i++) {
        piece_string = parseInt(_key_map.indexOf(base64[i]),10).toString(2);
        if (piece_string.length < 6) {
            piece_string = ("0".times(6-piece_string.length)).concat(piece_string);
        }
        //console.log(piece_string);
        for (var j=0; j<piece_string.length;j++) {
            result[6*i+j] = piece_string[j];
        }
    }
    return result;
}




// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}

