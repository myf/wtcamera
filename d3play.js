var canv = d3.select("#d3play").
    append("svg:svg").
    attr("width",100).
    attr("height",100);
/*
var rect = canv.append("svg:rect").
    attr("x", 10).
    attr("y", 10).
    attr("height", 50).
    attr("width", 50).
    attr("fill", "#0f0");
*/
var circle = canv.append("svg:circle").    
    attr("cx",60).
    attr("cy",60).
    attr("r",30).
    attr("stroke","red").
    attr("fill","#0f0");
