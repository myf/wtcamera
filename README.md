worldtalks camera
================

A real-time video chat in your browser requiring low bandwidth
------------------------------------------------------------------

<pre>
Author, myf [$~: echo bXlmQHdvcmxkdGFsa3Mub3JnCg== |base64 -d]
</pre>

Background:
------------
We are trying to explore different compression algorithms that allows us to do
real-time video chat with low bandwidth. The current version gives an idea of
the participants by drawing their edges in a nearly cartoonie display. It then
communicates through socket.io in node.js

To Run: 
---------

First of all install node.js

Get the repo from github
> git checkout git://github.com/myf/wtcamera.git

> cd wtcamera

Install Dependency (you may find most of the dependencies in package.json):
> npm install

run it with
> node .

test it for yourself or with friends on the same network at
> localhost:8888


