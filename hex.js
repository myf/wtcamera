
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

var input = new Uint8Array(4);
for (var m =0;m<input.length;m+=4) {
    input[m]=1
    input[m+2]=1
}

console.log("input", input);
console.log("hex", to_hex(input));
console.log("result", to_array(to_hex(input)));
one = to_hex(input);
two = to_array(one);
console.log(input.toString()===two.toString());

