function incoming_video(incoming_data, dimention) {
    //incoming_data = JSON.parse(incoming_data);
    console.log(incoming_data);
    var canvas = document.getElementById('incoming_vid');
    var canvas_context = canvas.getContext('2d');

    var finalImage = canvas_context.createImageData(dimention,dimention);
    var array = to_array(incoming_data);
    for (var i=0;i<finalImage.data.length;i=i+4){
        finalImage.data[i]=array[i/4]*255;
        finalImage.data[i+1]=array[i/4]*255;
        finalImage.data[i+2]=array[i/4]*255;
        finalImage.data[i+3]=255;
    }
    canvas_context.putImageData(finalImage,0,0);
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

    var hex = outline_transform(input_data,input,threshold);
    //output_data = json_parse(output_data,dim);
    //now we have a hex string
    output_data = to_array(hex);
    var finalImage = output_context.createImageData(input.width,input.height);
    for (var i=0;i<input_data.data.length;i=i+4){
        finalImage.data[i]=output_data[i/4]*255;
        finalImage.data[i+1]=output_data[i/4]*255;
        finalImage.data[i+2]=output_data[i/4]*255;
        finalImage.data[i+3]=255;
    }
    output_context.putImageData(finalImage,0,0);
    //var base64png = output.toDataURL()
    //return base64png
    //instead of return this output_data as a bytestring we 
    //are outputting a base64 png that might just work a little
    //better,then we will try other gzip libraries to zip our
    //data on the fly
    //
    return hex;
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
    

    result = to_hex(result);
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

/*
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
*/

function to_hex(bin_array) {
    var result=[];
    var arr_length = bin_array.length;
    for (var i=0;i<arr_length-arr_length%4;i+=4){
        var sum = (bin_array[i]<<3)+
            (bin_array[i+1]<<2)+
            (bin_array[i+2]<<1)+
            (bin_array[i+3]);
        var hex = sum.toString(16);
        result.push(hex);
    }

    return result.join("");
}

     
function to_array(hex) {
    var array = new Uint8Array(hex.length*4);
    for (var i=0;i<hex.length;i++) {
        var bit_string = parseInt(hex[i],16).toString(2);
        array[4*i+0]=bit_string[0];
        array[4*i+1]=bit_string[1];
        array[4*i+2]=bit_string[2];
        array[4*i+3]=bit_string[3];
    }
    return array;
}


