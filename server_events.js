module.exports = function(io) {

  require('./server_logic.js')(io);

  io.sockets.on('connection', function(socket) {
    console.log('Client connected');


    // LOGIN FUNCTIONS
    socket.on('login', function(nickname, callback) {
      if (login(nickname, callback)) {
        sendMessage('new_user', 'SERVER', nickname);
      }
    });

    socket.on('log_me_out', function() {
      log_user_out(socket.nickname);
      sendMessage('user_left', 'SERVER', nickname);
    });

    // CHAT FUNCTIONS
    socket.on('request_chat', function(source, target, callback) {
      request_chat(source, target, callback);
    });

    socket.on('send_message_to', function(nickname, message, callback) {
      callback(sendMessageToOther(nickname, message));
    });

    socket.on('leave_chat', function (nickname) {
      leave_chat(nickname);
    });
  });

  var sendMessage = function(subject, nickname, message) {
    io.sockets.emit(subject, nickname, message);
  };
  
  var sendMessageToOther = function(nickname, message) {
    if (message !== "") {
        console.log("Sending message: " + message + " to " + people[nickname]);
        var other_socket = findSocket(people[nickname]);
        if (other_socket !== undefined) {
          console.log("other_socket" + other_socket);
          other_socket.emit('new_message', message);
          return true;
        }
    }
    return false;
  };
};
