Awesome Camera
================
An real-time artsy display of reality in your browser requires low bandwidth
------------------------------------------------------------------

Background:
------------
We are trying to explore different compression algorithms that allows us to do real-time video chat with low bandwidth. The current version gives an idea of the participants by drawing their edges in a nearly cartoonie display. It then communicates through socket.io in node.js

To Run:
---------

First of all install node.js

Get the repo from github
> git checkout git://github.com/myf/wtcamera.git

> cd wtcamera

Install Dependency:
> npm install

run it with
> node app.js

Now go to your Chrom Browser (since Chrome is the only browser that honors WebRTC and our system is based on html5 <video> and <canvas> elements (instead of Adobe Flash).

go to
> chrome://flags

then scroll down to the end of the page, the third one from bottom, Enables MediaStreams

test it for yourself or with friends on the same network at
>localhost:8888
