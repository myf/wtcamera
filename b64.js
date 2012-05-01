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
        console.log(piece_string);
        for (var j=0; j<piece_string.length;j++) {
            result[6*i+j] = piece_string[j];
        }
    }
    return result;
}



a = new Uint8Array(36);
for (var m=0;m<a.length;m++) {
    if (m%6==5 || m%6==4) {
        a[m]=1;
    }
}
console.log(a);
console.log(bin_to_base64(a));
base64_to_bin("DDDDDD",6);
