function incoming_video(lzw, dimention) {
    //incoming_data = JSON.parse(incoming_data);
    var incoming_data = lzw_decode(lzw);
    var canvas = document.getElementById('incoming_vid');
    var canvas_context = canvas.getContext('2d');

    /*
    var finalImage = canvas_context.createImageData(dimention,dimention);
    for (var i=0;i<finalImage.data.length;i=i+4){
        finalImage.data[i]=incoming_data[i/4]*255;
        finalImage.data[i+1]=incoming_data[i/4]*255;
        finalImage.data[i+2]=incoming_data[i/4]*255;
        finalImage.data[i+3]=255;
    }
    canvas_context.putImageData(finalImage,0,0);
    */
    var streaming_image = new Image();
    streaming_image.src = incoming_data;
    streaming_image.onload = function () {
        canvas_context.drawImage(streaming_image,0,0);
    }
}

function update_video(video_element,dim,threshold) {
    var input = document.createElement('canvas');
    input.setAttribute('width', dim);
    input.setAttribute('height', dim);
    /*
     * canvas = document.createElement('canvas');  
     *       canvas.setAttribute('width',132);  
     *             canvas.setAttribute('height',150);  
     */
    var input_context = input.getContext('2d');
    //draw input first
    input_context.drawImage(video_element,0,0, input.width, input.height);
    var input_data = input_context.getImageData(0,0,input.width,input.height);
    var output = document.getElementById('output');
    var output_context = output.getContext('2d');

    var output_data = outline_transform(input_data,input,threshold);
    var finalImage = output_context.createImageData(input.width,input.height);
    for (var i=0;i<input_data.data.length;i=i+4){
        finalImage.data[i]=output_data[i/4]*255;
        finalImage.data[i+1]=output_data[i/4]*255;
        finalImage.data[i+2]=output_data[i/4]*255;
        finalImage.data[i+3]=255;
    }
    output_context.putImageData(finalImage,0,0);
    var base64png = output.toDataURL()
    var lzw = lzw_encode(base64png);
    return lzw;
    //return base64png;
    //instead of return this output_data as a bytestring we 
    //are outputting a base64 png that might just work a little
    //better,then we will try other gzip libraries to zip our
    //data on the fly
    //
    //return output_data;
}

function outline_transform(input_data,input,threshold) {
    var sobel = [[-1,-1,-1],
                [-1,8,-1],
                [-1,-1,-1]];
    var horizontal_gradient =[[-1,0,1]];
    var vertical_gradient =[[-1],[0],[1]];
    var gaussian = [[1,4,7,4,1],
                    [4,16,26,16,4],
                    [7,26,41,26,7],
                    [4,16,26,16,4],
                    [1,4,7,4,1]];
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

function jsonfy (result) {
    arr = [];
    for (var m=0;m<result.length;m++) {
        if (result[m] === 1) {
            arr.push(m);
        }
    }
    return arr;
}

function json_parse (data, dim) {
    arr = new Uint8Array(dim*dim);
    for (var n=0;n<data.length;n++) {
        var index = data[n];
        arr[index] = 1;
    }
    return arr;
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

