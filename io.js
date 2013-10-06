module.exports = function(io) {

  var people = {};

  io.sockets.on('connection', function(socket) {
    console.log('Client connected');
        
    socket.on('set_nickname', function(nickname, callback) {
      console.log('Trying to set nickname ' + nickname);
          
      var nickAvailable = isNicknameAvailable(nickname);
      if (nickAvailable) {
        people[nickname] = "";
        socket.nickname = nickname;
      }
      callback(nickAvailable);
      sendMessage('new_user', 'SERVER', nickname);
    });
        
    socket.on('get_users', function(callback) {
      users = getClients();
      callback(users);
      sendMessage('SERVER', "Found users");
    });

    socket.on('connect_me_with', function(source, target, callback) {
      if (people[source] !== "" || people[target] !== "" || source === target) {
        callback(false);
      }  else {
        other_socket = findSocket(target);
        other_socket.emit('connection_request', source, function (ok) {
          if (ok) {
            console.log("cannection succesfull between " + source + " - " + target);
            people[source] = target;
            people[target] = source;
            callback(true);
          } else {
            callback(false);
          }
        });
      }
    });

    socket.on('send_message_to', function(nickname, message, callback) {
      callback(sendMessageToOther(nickname, message));
    });
        
    socket.on('message', function(message) {
      sendMessage(socket.nickname, message);
    });
        
    socket.on('disconnect', function() {
     log_user_out(socket.nickname);
    });

    socket.on('exit_conversation', function (nickname) {
      var other_nickname = people[nickname];
      var other_socket = findSocket(other_nickname);
      other_socket.emit('exit_conversation_request');
      console.log("Disconnection between " + nickname + " and " + other_nickname);
      people[people[nickname]] = "";
      people[nickname] = "";
    });

    socket.on('log_me_out', function() {
     log_user_out(socket.nickname);
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
  
  var isNicknameAvailable = function(nickname) {
    return people[nickname] === undefined;
  };

  var getClients = function() {
    console.log("clients? --> "+ people);
    result = [];
    for (var person in people) {
      if (people[person] === "") {
        result.push(person);
      }
    }
    return result;
  };

  var findSocket = function(nickname) {
    var sockets = io.sockets.clients();
    for (var s in sockets) {
      if (sockets[s].nickname === nickname) {
        return sockets[s];
      }
    }
    return undefined;
  };

  var log_user_out = function(nickname) {
    console.log("Logging "+nickname+" out");
    people[nickname] = undefined;
    sendMessage('disconnected_user', 'SERVER', nickname);
  };
};
