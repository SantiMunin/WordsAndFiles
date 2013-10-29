/**
 * This module receives the 'io' object from socket.io and
 * defines all the events that a server can receive and process.
 * @param io
 */
module.exports = function (io) {

  /**
   * Server interface. List of the events that the server can process.
   */
  io.sockets.on('connection', function (socket) {
    console.log('Client connected');

    // LOGIN FUNCTIONS
    socket.on('login', function(nickname, callback) {
      if (login(nickname, callback)) {
        socket.nickname = nickname;
        sendMessage('user_add', nickname);
      }
    });

    socket.on('logout', function () {
      log_user_out(socket.nickname);
      sendMessage('user_left', socket.nickname);
    });

    // CHAT FUNCTIONS
    socket.on('request_chat', function (source, target, callback) {
      request_chat(source, target, callback);
    });

    socket.on('send_message', function (nickname, message, callback) {
      callback(sendMessageToOther(nickname, message));
    });

    socket.on('leave_chat', function (nickname) {
      leave_chat(nickname);
    });
  });

  // COMMUNICATION FUNCTIONS
  /**
   * Broadcasts a message.
   */
  var sendMessage = function (subject, message) {
    io.sockets.emit(subject, message);
  };

  /**
   * Send a message from one user to another.
   * @returns false if the message is empty or the user is not chatting.
   */
  var sendMessageToOther = function (nickname, message) {
    if (message !== "") {
      console.log("Sending message: " + message + " to " + people[nickname]);
      var other_socket = findSocket(people[nickname]);
      if (other_socket !== undefined) {
        console.log("other_socket" + other_socket);
        other_socket.emit('new_message', message);
        return true;
      } else {
        return false;
      }
    }
    return false;
  };


  // SERVER LOGIC

  /**
   * Maps users with other users.
   */
  var people = {};

  /**
   * If the nickname is not used, it logs the user in.
   */
  var login = function (nickname, callback) {
    console.log('Trying to set nickname ' + nickname);
    var nickAvailable = isFreeNickname(nickname);

    if (nickAvailable) {
      people[nickname] = "";
      callback(undefined, true, getClients());
    } else {
      callback('username_not_available', false, getClients());
    }

    return nickAvailable;
  };

  /**
   * Removes the user from the users list.
   */
  var log_user_out = function (nickname) {
    console.log("Logging " + nickname + " out");
    if (people[nickname] && people[nickname] !== "") {
      people[people[nickname]] = "";
    }
    people[nickname] = undefined;
  };

  /**
   * Redirects a chat request to its target. It redirects the answer as well.
   */
  var request_chat = function (source, target, callback) {
    var status = check_chat_request(source, target);
    var target_socket;
    if (!status.valid) {
      callback(status.error, false);
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

  /**
   * Leaves the conversation.
   */
  var leave_chat = function (nickname) {
    var other_nickname = people[nickname];
    if (other_nickname && other_nickname !== "") {
      var other_socket = findSocket(other_nickname);
      other_socket.emit('user_left_chat');
      console.log("Disconnection between " + nickname + " and " + other_nickname);
      remove_chat(nickname);
    }
  };

  var check_chat_request = function (source, target) {
    if (isFreeNickname(source)) {
      return { valid: false, error: "We don't recognize your nick" };
    }

    if (isFreeNickname(target)) {
      return { valid: false, error: "We don't recognize the target's nick" };
    }

    if (source === target) {
      return { valid: false, error: "You can\'t speak to yourself!" };
    }
    return { valid: true };
  };

  var set_chat = function (source, target) {
    people[source] = target;
    people[target] = source;
  };

  var remove_chat = function (source) {
    if (people[source]) {
      people[people[source]] = "";
      people[source] = "";
    }
  };

  var isFreeNickname = function (nickname) {
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

  var getClients = function () {
    console.log("clients? --> " + people);
    result = [];
    for (var person in people) {
      if (people.hasOwnProperty(person) && people[person] === "") {
        result.push(person);
      }
    }
    return result;
  };
};
