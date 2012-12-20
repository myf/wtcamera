//global vars
_key_map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function update_colored_video(video_element, canvas_id) {
    // that comes from the webcam, unprocessed
    var input, input_context, input_data;
    // input is a hidden / undisplayed canvas ... it has the data
    // that comes from the webcam, unprocessed

    //TODO: do i need to create this element every time canvas refreshes
    input = document.getElementById(canvas_id);
    input_context = input.getContext('2d');
    //draw input first
    input_context.drawImage(video_element,0,0, input.width, input.height);
}
 
function update_video(data, canvas_id) {
    var output, output_context, finalImage, i;
    // output will display the processed webcam image from own computer
    data = lzw_decode(data);
    output = document.getElementById(canvas_id);
    output_context = output.getContext('2d');
    //data = base64_to_bin_improved(frame_data, output.height);
    data = base64_to_bin_improved(data,output.height);

    // draw the data to the canvas
    finalImage = output_context.createImageData(output.width,output.height);
    for (i=0;i<data.length*4;i=i+4){
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

function input_to_emit(video_element, hidden_canvas_context, dim,threshold) {
    var input_data, result;
    input_data = input_to_data(video_element,hidden_canvas_context, dim);
    result = detect_edges(input_data, dim, threshold);
    return result;
}

function prepare_hidden_canvas(dim) {
    var hidden_canvas = document.createElement('canvas');
    hidden_canvas.setAttribute('width', dim);
    hidden_canvas.setAttribute('height', dim);
    var hidden_canvas_context = hidden_canvas.getContext('2d');
    return hidden_canvas_context
}

function input_to_data(video_element, hidden_canvas_context, dim) {
    //converting input into data
    var input_data;
    // input is a hidden / undisplayed canvas ... it has the data
    // that comes from the webcam, unprocessed
    hidden_canvas_context.drawImage(video_element,0,0, dim, dim);
    input_data = hidden_canvas_context.getImageData(0,0,dim, dim);
    return input_data.data;
}


function detect_edges(data,dim,threshold) {
    //kernels
    var horizontal_gradient =[[-1,0,1]],
        vertical_gradient =[[-1],[0],[1]],
        gaussian = [[1,4,7,4,1],
                    [4,16,26,16,4],
                    [7,26,41,26,7],
                    [4,16,26,16,4],
                    [1,4,7,4,1]];
    //other vars
    var bw, i, smoothed, result_vertical, result_horizontal, result, t;
    var data_length = data.length;

    //black and whiting
    bw = new Uint8Array(dim*dim);
    for (i=0;i< data_length;i += 4){
//        bw[i/4]=Math.floor((input_data.data[i]
//            + input_data.data[i+1]+input_data.data[i+2])/3)
//      added luma
        bw[i/4] = Math.floor(data[i]*0.2126 
                + data[i+1]*0.7152
                + data[i+2]*0.0722);
          
    }
    //small = downsample(bw, input.width, input.height, 2);
    //TODO:can we possiblt link them together like a monad?
    //TODO:can we give width / length more convinient  style other than a 
    //SQUARE with dim x dim
    //smoothed = convolve(bw, dim, dim, gaussian, 1/273);
    smoothed = bw;
    result_vertical = convolve(smoothed, dim, dim, vertical_gradient,1);
    result_horizontal = convolve(smoothed, dim, dim, horizontal_gradient,1);
    result = merge(result_vertical,result_horizontal);
    //result = convolve(result, dim, dim, gaussian, 1/273)
//    var temp = new Uint8Array(dim*dim);
//    var t = threshold || 15;
//    for (var i = 0; i < result.length; i++ ) {
//        if (result[i] > t) { temp[i] = 0; }
//        else {temp[i] = 1;}
//    }
//    result = temp;
    result = result.map(function (x) {
        var t = threshold || 15;
        if (x>t) { x = 0; }
        else{ x=1; }
        return x;
    });
    
    result = bin_to_base64(result);
    result = lzw_encode(result);
    return result;
}

function convolve (input, width, height, kernel, n_factor) {
    //main convolve function that does edge detection
    // it takes the surrounding environment and churn out a result
    var k_width, k_height, output, width_offset, height_offset, sum, avg,
        j, i, mj, mi;

    k_width = kernel[0].length;
    k_height = kernel.length;
    output = new Uint8Array(width*height);
    width_offset = Math.floor(k_width/2);
    height_offset = Math.floor(k_height/2);
    for (j = height_offset;j<height-height_offset;j++) {
        for (i = width_offset;i<width-width_offset;i++) {
            sum =0;
            for (mj = 0;mj<kernel.length;mj++) {
                for ( mi = 0;mi<kernel[0].length;mi++) {
                    sum += kernel[mj][mi]*input[width*(j-height_offset+mj) 
                        + (i-width_offset+mi)];
                    //console.log(kernel[mj][mi], input[width*j+i]);
                }
            }
            avg = Math.min(Math.abs(Math.floor(sum*n_factor)),255);
            output[width*j+i]= avg;

        }
    }
    return output;
}

Uint8Array.prototype.map = function(call) {
    var i, result = new Uint8Array(this.length);
    for ( i = 0; i < this.length; i ++ ) {
        result[i] = call(this[i]);
    }
    return result;
}

function merge (input1, input2) {
    var output, j;
    output = new Uint8Array(input1.length); 
    for ( j = 0; j<input1.length; j++ ){
        output[j] = Math.min(input1[j]+input2[j],255);
    }
    return output;
}
        
function downsample (input, width, height, factor) {
    var new_width, new_height, output, j, i, sum, mj, mi, avg;
    new_width = width / factor;
    new_height = height / factor;
    output = new Uint8Array(width*height);
    for (j=0;j<new_height;j++) {
        for (i=0;i<new_width;i++) {
            sum = 0;
            for (mj=0;mj<factor;mj++) {
                for (mi=0;mi<factor;mi++) {
                    sum = sum + input[(((j*factor)+mj)*width)+((i*factor)+mi)];
                }
            }
            avg = Math.floor(sum / (factor*factor));
            output[width*j+i] = avg;
            //console.log(j, i);
        }
    }
    return output;
}

function bin_to_unicode(uint8array) {
    //TODO: make it
    return uint8array;

}

function unicode_to_bin(unicode) {
    //TODO: make it
    return unicode;
}


function bin_to_base64(uint8array) {
    //essentially what we want is to aggregate every six bin to a number
    var result, iter_length, header, i, sum, j;
    result = "";
    //getting ride of the last (<6) pixels
    iter_length = uint8array.length-uint8array.length%6;
    //header = "data:text/plain;charset=utf-8,";
    //get the value
    for (i=0;i<iter_length;i+=6) {
        sum = 0;
        for (j=0;j<6;j++) {
            sum += (uint8array[i+j]<<(5-j));
        }
        result += _key_map[sum]
    }
    //result = header.concat(result);
    return result;
}

String.prototype.times = function(n){
    if (n < 1) {
        return "";
    }
    var result = "", pattern = this.valueOf();
    while (n>0) {
        //if odd make one up for it
        if ( n & 1 ) {
            result += pattern;
        }
        // divide by 2 and double pattern
        n >>= 1;
        pattern += pattern;
    }
    return result;
}

function string_dict(string) {
    dict = {};
    for (var m = 0; m < string.length; m++) {
        dict[string[m]]=m;
    };
    return dict;
};
_key_dict = string_dict(_key_map);

function base64_to_bin(base64,dim) {
    var piece_string, result, i, j;
    //header = "data:text/plain;charset=utf-8,";
    //base64 = base64.substr(header.length,base64.length);
    result = new Uint8Array(dim*dim);
    for (i=0;i<base64.length;i++) {
        piece_string = parseInt(_key_map.indexOf(base64[i]),10).toString(2);
        if (piece_string.length < 6) {
            piece_string = ("0".times(6-piece_string.length)).concat(piece_string);
        }
        //console.log(piece_string);
        for (j=0; j<piece_string.length;j++) {
            result[6*i+j] = piece_string[j];
        }
    }
    return result;
}

function base64_to_bin_improved(base64, dim) {
    var result = new Uint8Array(dim*dim);
    var pointer = 0;
    for (var i = 0;i < base64.length; i++) {
        var value = _key_dict[base64[i]];
        //var value = _key_map.indexOf(base64[i]);
        var bit_shift = 5;
        while (bit_shift >= 0) {
            var bit_value = value >> bit_shift;
            result[pointer] = bit_value;
            value -= bit_value << bit_shift;
            bit_shift --;
            pointer ++;
        }
    }
    return result;
}
// LZW-compress a string
function lzw_encode(s) {
    var dict, data, out, currChar, phrase, code, i;
    dict = {};
    data = (s + "").split("");
    out = [];
    phrase = data[0];
    code = 256;
    for (i=1; i<data.length; i++) {
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
    for (i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict, data, currChar, oldPhrase, out, code, phrase, i, currCode;
    dict = {};
    data = (s + "").split("");
    currChar = data[0];
    oldPhrase = currChar;
    out = [currChar];
    code = 256;
    phrase;
    for (i=1; i<data.length; i++) {
        currCode = data[i].charCodeAt(0);
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

