width = window.innerWidth || 200;
height = window.innerHeight ||200;
paper = Raphael(0,0,width,height);
draw_circles();








function draw_circles() {
    var c1 = paper.circle(0,0,height/2);
    var c2 = paper.circle(width/2,height/2,height/2);
    var c3 = paper.circle(0,height,height/2);
    var c4 = paper.circle(width,0,height/2);
    var c5 = paper.circle(width,height,height/2); 
    c2.attr("fill","#f00")
    c3.attr("fill","#0f0")
    c4.attr("fill","#00f")
    c5.attr("fill","#000")
}
