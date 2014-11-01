var express = require('express'),
  app = express(),
  http = require('http'),
  server = http.createServer(app),
  port = process.env.PORT || 5000,
  io = require('socket.io').listen(server);

app.set('view options', { layout : false });

app.use(express.static(__dirname + '/static'));

app.route('/')
    .get(function(request, response) {
        response.render('main.jade');
    });

server.listen(port);
console.log("Server started on port %s", port);
require('./server_events.js')(io);
