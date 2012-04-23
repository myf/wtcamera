var sobel = [[-1,-1,-1],
            [-1,8,-1],
            [-1,-1,-1]];
var horizontal_gradient =[[-1,0,1]];
var vertical_gradient =[[-1],[0],[1]];
var gaussian = [[1,4,7,4,1],
                [4,16,26,16,4],
                [7,26,41,26,7],
                [4,16,26,16,4],
                [1,4,7,4,1]]


input = document.getElementById('input');
output = document.getElementById('output');
input_context = input.getContext('2d');
output_context = output.getContext('2d');
finalImage = output_context.createImageData(input.width,input.height);
var img = new Image();
img.src = "pic/8.jpg";
img.onload = function () {
    input_context.drawImage(img,0,0)
    var input_data = input_context.getImageData(0,0,input.width,input.height)
    var bw = new Uint8Array(input.width*input.height);
    for (var i=0,data_length = input_data.data.length;i<data_length;i=i+4){
        bw[i/4]=Math.floor((input_data.data[i]+input_data.data[i+1]+input_data.data[i+2])/3)
    }
    var small = downsample(bw, input.width, input.height, 1);
    var smoothed = convolve(small, input.width, input.height,gaussian,1/273);
    var result1 = convolve(smoothed, input.width, input.height,vertical_gradient,1);
    var result2 = convolve(smoothed, input.width, input.height,horizontal_gradient,1);
    var result = merge(result1,result2);
    apply_to_each_pixel(result, function (x) {
            //reverse it
            //threshold
            if (x>25) {
                x = 0;
            }else{
                x=255;
            }
            return x;
    });

    for (var i=0;i<data_length;i=i+4){
        finalImage.data[i]=result[i/4];
        finalImage.data[i+1]=result[i/4];
        finalImage.data[i+2]=result[i/4];
        finalImage.data[i+3]=255;
        
    }
    output_context.putImageData(finalImage,0,0);

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

