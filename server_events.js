module.exports = function(io) {

   // SERVER INTERFACE
  io.sockets.on('connection', function(socket) {
    console.log('Client connected');

    // LOGIN FUNCTIONS
    socket.on('login', function(nickname, callback) {
      if (login(socket, nickname, callback)) {
        socket.nickname = nickname;
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

  // COMMUNICATION FUNCTIONS
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


  // SERVER LOGIC
  var people = {};

  login = function(nickname, callback) {
    console.log('Trying to set nickname ' + nickname);
    var nickAvailable = isNicknameAvailable(nickname);

    if (nickAvailable) {
      people[nickname] = "";
      callback(undefined, getClients());
    } else {
      callback('username_not_available', getClients());
    }

    return nickAvailable;
  };

  log_user_out = function(nickname) {
    console.log("Logging "+nickname+" out");
    people[nickname] = undefined;
  };

  request_chat = function(source, target, callback) {
    var status = check_chat_request();
    var target_socket;
    if (!status.valid) {
      callback(status.err, false);
    } else {
      target_socket = findSocket(target);
      target_socket.emit('request_from', source, function (ok) {
        if (ok) {
          console.log("Successful connection: " + source + " - " + target);
          set_chat(source, target);
          callback(undefined, true);
        } else {
          callback('Request rejected', false);
        }
      });
    }
  };

  leave_chat = function(nickname) {
    var other_nickname = people[nickname];
    if (other_nickname && other_nickname !== "") {
      var other_socket = findSocket(other_nickname);
      other_socket.emit('user_left_chat');
      console.log("Disconnection between " + nickname + " and " + other_nickname);
      remove_chat(nickname);
    }
  };

  var check_chat_request = function(source, target) {
    if (!isNicknameAvailable(source)) {
      return { valid: false, error: "We don't recognize your nick" };
    }

    if (!isNicknameAvailable(target)) {
      return { valid: false, error: "We don't recognize the target's nick" };
    }

    if (source === target) {
      return { valid: false, error: "You can\'t speak to yourself!" };
    }
    return { valid: true };
  };

  var set_chat = function(source, target) {
    people[source] = target;
    people[target] = source;
  };

  var remove_chat = function(source) {
    if (people[source]) {
      people[people[source]] = "";
      people[source] = "";
    }
  };

  var isNicknameAvailable = function(nickname) {
    return people[nickname] === undefined;
  };

  var findSocket = function (nickname) {
    var sockets = io.sockets.clients();
    for (var s in sockets) {
      if (sockets.hasOwnProperty(s) && sockets[s].nickname === nickname) {
        return sockets[s];
      }
    }
    return undefined;
  };

  var getClients = function() {
    console.log("clients? --> "+ people);
    result = [];
    for (var person in people) {
      if (people.hasOwnProperty(person) && people[person] === "") {
        result.push(person);
      }
    }
    return result;
  };
};
