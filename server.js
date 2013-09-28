var express = require('express'),
  app = express.createServer(),
  http = require('http'),
  port = process.env.PORT || 5000,
  io = require('socket.io').listen(app);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

app.configure(function() {
    app.set('view options', {
	layout : false
    });
    app.use(express.static(__dirname + '/static'));
});

app.get('/', function(request, response) {
    response.render('main.jade');

});

app.listen(port);
console.log("Server started on port %s", port);
require('./io')(io);
