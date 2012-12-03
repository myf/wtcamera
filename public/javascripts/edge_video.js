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
//    var dim = 256;
//    data = new Uint8Array(dim*dim);
//    for (var m = 0; m < dim*dim; m++) {
//        if (m%2==0){
//            data[m] = 1;
//        }
//        else {
//            data[m] = 0;
//        }
//    }


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
    hidden_canvas.setAttribute('width', 256);
    hidden_canvas.setAttribute('height', 256);
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
    //TODO:return input_data.data
    return input_data;
}


function detect_edges(input_data,dim,threshold) {
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

    //black and whiting
    bw = new Uint8Array(dim*dim);
    for (i=0,data_length = input_data.data.length;i<data_length;i=i+4){
        bw[i/4]=Math.floor((input_data.data[i]
            + input_data.data[i+1]+input_data.data[i+2])/3)
    }
    //small = downsample(bw, input.width, input.height, 2);
    //TODO:can we possiblt link them together like a monad?
    //TODO:can we give width / length more convinient  style other than a 
    //SQUARE with dim x dim
    smoothed = convolve(bw, dim, dim, gaussian, 1/273);
    //smoothed = bw;
    //console.log(smoothed);
    result_vertical = convolve(smoothed, dim, dim, vertical_gradient,1);
    result_horizontal = convolve(smoothed, dim, dim, horizontal_gradient,1);
    result = merge(result_vertical,result_horizontal);
    //result = convolve(result, dim, dim, gaussian, 1/273)
    result = result.map(function (x) {
        //reverse threshold
        t = threshold || 15;
        if (x>t) { x = 0; }
        else{ x=1; }
        return x;
    });
    
    result = bin_to_base64(result);
    result = lzw_encode(result);
    return result;
//    var temp = new Uint8Array(dim*dim);
//    var t = threshold || 15;
//    //in-line loop instead of func call for performance
//    for (var i = 0; i < result.length; i++ ) {
//        if (result[i] > t) { temp[i] = 0; }
//        else {temp[i] = 1;}
//    }
//    result = temp;
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
        var value = _key_map.indexOf(base64[i]);
        var bit_shift = 5;
        while (bit_shift >= 0) {
            var bit_value = value >> bit_shift;
            result[pointer] = bit_value;
            value -= bit_value<<bit_shift;
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

var frame_data ='///////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABn///////////////////+P///+Af6f////////////mf///////////////////w//x//v/8///+f/////o/+Z/////////4Kn///yd/9eD/wf/////Px/9+////AAEBn/////IwAAAAJ//+Bv//4H+eAf+c9//v//9///5mAeGf////5PABAAHn//4////4/+AAHAAZj////////v//+Z///////////+f//n////z8AAAADAbT///////8///5n///////////9///////+CAAAAAHA+n///////z///mf///////////3///////wAAAAAAAA4J///////f//+Z///////////////////+AAADgAAABgT/7////9///5n///////////+///////wAAA/8AAABDo//////n///mf///////////7//////+AAAP/+AwAAOH/////+f//+Z////////////v//////wADD//8BEAAA//////7///5n//////////////////+AA5///8A4AAA//////v///mf///////////7//////wAPP///4DAAAAH/mf/////+Z////////////v/////+AB5////wBAAAAA/c//3///5n///////////+f/////wAf/////gMAAAAB8x//f///mf///////////9/////+AH///////8AAAAD7j/////+Z////////////3/////wA/////////AAAAD+H/////5n////////////f////+AH/////////4AAAD4f/////mf/////////////////wB//////////+AAABx/////+Z/////////////////+AP//////////+AAAfH/////5n/////////////////4B///////////+AAA8f/////mf/////////////////AP///////////8AAAx/////+Z/////////////f9//4B////////////+AAAB7////5n////////////9/n//AP////////////+AAABP////mf///////////+z8f/4B/////////////+AAAAn///+Z////////////5ABP/AL/////////////+AAAAf///5n////////////gAE/4Af/////////////+AAAD////mf///////////+AAD/gD//////////////8AAAP///+Z////////////4AAP8Af//////////////4AIA////5n////////////g/w/gH///////////////4AAD////mf////////////AAD8A////////////////wAAf///+Z////////////8AAPgH////////////////gAB////5n////////////4AB+A////////////////+AAP////mf////////////wAfwD////////////////8AA////+Z///////////////+Af////////////////gAD////5n///////////////4D/////////////////wCH////mf///////////////Af/////////////////AMf///+Z///////////////4D/////////////////8AR////5n///////////////Af/////////////////wAz////mf//////////////8B//////////////////gBn///+Z/////////8f////gP/////////////////+AGP///5n/////////g////+B//////////////////8AMf///mf////////+D////wH//////////////////wA5///+Z/////////wP////A///////////////////gDj///5n/////////A////4D//////////////////+AHP///mf////////wj////AP//////////////////8Acf//+Z///+AAAAACH///8B///////////////////wA5//4BnAB4AAAAAAYAAAfAP///////////////////gDn//AGYf///////v4AAAAB///////////////////+ACP/wAZ//////gACAP///gH///////////////////4AAP+Dxn+8AAAAAAAAAAAeAf///////////////////wAAAAQmAAR/4AA4AADgAAAD////////////////////ADD/kaZ//////////////Af///////////////////+AAH/ABn/////////////8B////////////////////4AAAAAGf/////////////wP////////////////////gDD/4QZ/////////////+A////////////////////+Ac///5n/////////////4H////////////////////4Bx///mf/////////////gf////////////////////wDH//+Z/////////////8B/////////////////////AMf//5n/////////////gP////////////////////+Ax///mf////////////+A/////////////////////4DH//+Z/////////////wH/////////////////////gM///5n/////////////Af////////////////////+Ax///mf////////////8D/////////////////////4DH//+Z/////////////gP/////////////////////gEf//5n////////////+B/////////////////////+AB///mf////////////4H/////////////////////4AH//+Z/////////////Af/////////////////////wAf//5n////////////8D//////////////////////BB///mf////////////wP/////////////////////8EH//+Z////////////+A//////////////////////wQf//5n////////////4H//////////////////////BD///mf////////////gf/////////////////////+GP//+Z////////////8B//////////////////////4I///5n////////////wH//////////////////////gj///mf////////////A//////////////////////uCP//+Z////////////8D/////////////////////+YA///5n////////////gP//////////////////////gD///mf///////////+B//////////////////////+AP//+Z////////////4H//////////////////////4A///5n////////////gf//3///////////////////gD///mf///////////8B///f///////////////////AP//+Z/f//////////wH//////////////////////8A///5n9///////////A///v///////////////////wD///mf///////////8D//+////////////////////AP//+Z////////////wP//7///////////////////8A///5n////////////A///P//z/n///////z//////wD///mf///////////8D//8//+f+L//////8f//////AP//+Z////////////wP//j//z/4D//////A//////8A///5n////////////B//+P////gB/////wH//////wD///mf///////////8H//4/////wD////8A///////AP//+Z////////////wf//n/////4H////gH//////8A///5nn///////////A//+f/////4P///8D///////4D///mef//////////8D//5//////w////gf///////AP//+Y7///////////gP//n///////////P///////8A///5jv///////////A//+f///////////////////wD///mG///////////4D//5////////////////////Af//+YT///////////gP//n///////////////+///+B///5gf//////////+A//8f///////////////5///4H///mA///////////4D//z////////////////n///gP//+YB///////////wP//P///////////////+P//+B///5kH///////////A//8f///////////////8///4H///mCP//////////8B//x////////////////////gP//+Yg/////7/////wH3/n////////////////f//+A///5gH/////f/////Afv/////////////////9///4D/n8mEP////9/////8A//////gB/////////H/////gP+L+YA////xgP////wD////////////////AA////8A/8/5gj///+AAAA///AP/9/Af/////////+8P/////wD///mAH///4AAAD//wAf/vgP/kH///////3//////7AP//+ZEf///AA/////wB//4/4D////////////v///8Af//5kA///8Af/////wH/7P8H/////P///////P//+QB///mYj///4B//////gP/c/h//4f/+P//////+///4Af//+ZwP///gH/////+A//z8f/4D//+Pn/////7///gB///5nEf//+ID/////4D/zPz/5x////k//////v//+AP///mcA///4gD////gAP/s+P/P///9///////+eb/4A///+Z4j///gAH///8AAf+z5//////z///////59v/gB///5ngP//+EAf///gAB//Pn//////n///////jz/+AD///mfEf//8IA///+AAH/8ef/////+fP/////+Pv/8AP//+Z+A///wQD///4PAP/wx//////9wHv/9//4+//wAf//5n4j///AAP///gAAf/hH//////mAO/////j7//gB///mfwH//+AAf//+AAA/+Gf/////+YY7////+Hv/+AP//+Z/EP//8AB///8AAD/8J//////5jz/////4e//wA///5n+A///8Dh///8AAH/4n//////ufv/////x7//gD///mf4h/75fwAN///+Af/if//////587/////HP/+Af//8Z/wH/gAAAAAAD/mA//J///////DDn////8cv/4B///xn/EP8AAAAAAAAAcB/8n//////8EGf////xi//gH//BGf+APwAAAAAAAAAAD/yf//////w4Z/////Gb/8A//4AZ/8AAH+AAABiDefAP/I//////+Dgn////8ZP/wDPgABn/gAAf////////8Af+T//////YfCP////wM//AAAAAGf+EAB//////gAAAB/5P//////j8M/////Aj/8AAAAAZ/wQACAAAAA////wH/k//////sP4T////+Af/wAAADhn9Dn/+AAAAAAAAAAP+T/////+h/hP////8B/+AAAAOGf2BgAP//+AAAAAAA/9v/////2H/Gf////gH/4AAAAAZ/8AAAAo///////8D/yf////+Q/8J////+A//AAAAABn/4AAAAAAAAAAAAAP/p/////xH/wz////4D84B////mf//H/A4QAAAAAAAAf+z/////If/BP////APjAAAAAAZ7/8//D////ngABkB/5P////5j/+Gf///8B8AAAAAABn//z//P//////O/wH/yf////Ef/4I////wHgAAAD//mf/8P///////////gP/sf///wh//wx////g+AAD///+Z4Hx///////////+AP/Yf//8GP//Bj///4HwAAf///5nADP///////////4Af/wP/+B///+bB//+A+AAD////mcAB////////////gB//wAAAf///7/gEABz4AAP///+ZxwD///////////+A////AB/////v3+AD4PAAB////5mH4P///////////wD//////////+f///4I4AAH////mYBwf//3///////+AP6P////////9//KAHjgAE////+ZwBh///f///////wB+f/////////z//9/+MABT////5ngCD//////////+AHz//////////H////4wAHf////mf+EP//////////4Aef/////////8f////iAA/////+Z/8Qf////////w/ADz//////////4////+YAP/////5n/4g////////+A4AOf//////////x////5AA//////mf/hD////////wBgDz//////+f///j////kAH/////+Z//EH///////+GAAPf//8///5////P///+QAP/////5n/+IPx/////4IAAA7/9/B///P///8f///xAB//////mf/4j///////wuYBHP/nwB//8////5////IAH/////+Z//wP/////////wEd/8PAD//3////3///8gA//////5n//AYAAD////8AAhv/h4eH///////////wAP//////mf/+D/5AH////AACM/+HD/n///////////QA//////+Z//4f//+f/////gR3/wcP/f//////////8AH//////5n//z///9/////8BGf/Dh/+///////////4Ef//////mf//////7/////gM7/8OH////8////////gT//////+Z///////v////+Anf/hw/////Af//////8DP//////5n//////+f////wCd/8HD/P//8d///////wN///////mf//////9/////Abv/g4f8f//3////////B3//////+Z///////7////4B9/+Dh/x///////////4H///////5n///////v////AP//wcP+H///////////A////////mf///////////8A/9/Dw/4f//////////4D///////+Z///////9////wH///HH/h///////////Af///////5n////////////A///8If+H//////////4D////////mf///////v///8D///4h/w///////5///gf///////+Z///////+////wf///2P/D///////j//+A////////5n///////9///+B////4/8P//////+H//4Bp///////mf///////////4H////H/x///////8f//gAgP/////+Z////////////gf///8//D//////////+AP///////5n///////////8B////5/+P//////////4D////////mf///////////wP////n/4f//////////gf///////+Z////////3///A////+f/x//////////+B////////5n////////v//8H////9//D//////////8D////+///mf///////+///wf//////+P//////////wH////7//+Z////////7///B///////4f//////////A////////5n////////3//8D///////h//////////8D////////mf////////P//4H///////H//////////wP//////7+Z////////+///gf//////8P//////////A///////35n////////5///A///////w//////////sD///////Pmf////////3//+D///////h/////////8wEMf///9++Z/////////P//4P//////+H/////////yAAAA//+H55n////////+///wf//////8P/////////MAAAH//8/3mf////////5//+B///////wf////////4wf///////+Z/////////n//4H///////g/////////jAAAA///435n/////////P//gf///////B////////uEAAA///m//mf////////8//+B///////+D////////wAf///////+Z/////////5//8H///////8H////////ED////////5n/////////n//gf///////4P///////4AP////////mf/////////f/8B////////gf///////AA////////+Z/////////8//gGf///////A///////8AD////////5n/////////7/8AZ///////+B///////gAf////////mf///////////gBz///////8H//////+AB////////+Z///////////8APH///////4P//////wQP////////5n/////////+/wH8f///////wf//////Bh/////////mf////////4P+B/4////////g//////8EP/////f//+Z//+P/////AHwP/z////////A//////4Af4AA/7///5n//wf////4AHA//H///////8A//////gAAAAD/v///mf//A/////AAAH/8f///////4B/////+AHAAAH9///+Z//8B////wAAA//4////////4D/////wH//+Af////5n//wH///+AAAD//h////////4D/////AD//gB/////mf//EP///4B4Af//H////////wH////8AH/8AH////+Z//8Qf///AP8B//8P////////wP////wAAAAIf////5n//xg///8B/8P//4/////////gf////AAAAAD/////mf//EB///gH/////h/////////Af///8AAAAAP////+Z//8SH//+Af/////H////////+A///5wAAAHw/////5n//xIP//4D/////8P////////+B///PgAAA///////mf//IA///AP/////4/////////8D//4+AAAA//////+Z//8gj/8AA//////x/////////4D//n8AAAA//////5n//iCP+AAH//////H/////////wH/+/4AQAA//////mf/+JI/gAA//////+P/////////wP///gA8AB/////+Z//4IjwAAD//////4f/////////gf///+D8AD/////5n//gAIAAAf//////w//////////A////8PwAH/////mf/+AAAB/x///////j/////////+D////4fgAP////+Z//wAAA/+P///////H/////////8H////w/PAP////5n//AAAP//////////P/////////4P////j+/Af////mf/8IAH/////////////////////wf////n5+A////+Z//xwIP/////////////////////h//////j8B////5n/+Dh4/////////////////////+D//////eIH////mf/wP3j//////////////////73/8P//////4QP///+Z/+B/eP//////////////////nAB4f///////g////5n/wP84///////////////////+AAB///////+D////mf+B/z3////////////////////4AD///////8H///+Z/4H/v//////////////////////gH///////wf///5n/A/////////////////////////+D////n//B////mf8H/////////////////////////+D///8f/8H///+Z/g///////////////////////////H///h//wf///5n+D//////////////////////////+f//8f//B////mfwf//////////////////////////9///3//+D///+Z+D///////////////////////////z//////4D///5n4P//////////////////////////////////gD///mfB///////////////////////////////////AH//+Z8H//////////////////////////////////8AH//5ng///////////////////////////////////4AH//mcH///////////////////////////////////mAH/+Zwf//////////////////////////////7////eAH/5mD///////////////////////////////f///9+AH/mYP//////////////////////////////5////z+AH+ZB////////////////////////////////////H+AP5kH///////////////////////////////////8H+AfmA////////////////////////////////////4H/A+YD////////////////////////////////////4D/B5gf////////////////////////////////////wH+DmB/////////////////////////////////////4f8GYH/////////////////////////////////////4/wJg//////////////////////////////////////n/gGAAAAAAAAAAH//////////////gAAAA/9gAAAAAAAAAcAAAB4AAAAB///////////////AAAAP///AAAAAAAAD//////////////////////////////////////////'
