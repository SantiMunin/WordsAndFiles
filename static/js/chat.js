$(document).ready(function() {
  
  var $login = $("#login"),
      $nickname = $("#nickname"),
      $nickname_button = $("#signin"),
      $login_form = $("#login-form"),
      $error = $("#login-error");
      $room = $("#room"),
      $conversation = $('#conversation'),
      $users = $('#users'),
      $chat_with = $('#chat_with'),
      $other_user = $('#other_user'),
      $messages = $('#messages'),
      $message = $('#new_message'),
      $my_nickname = $('#my_nickname'),
      $error_paragraph = $('#error'),
      socket = io.connect('/'),
      other_nickname = undefined,
      my_nickname = undefined;

  $room.hide();
  $conversation.hide();
  
  socket.on('connect', function() {
    console.log('Connected with socket');
    init();
  });

  socket.on('connected_with', function(other_nickname) {
    setChatWithOther(other_nickname);
  });

  socket.on('new_message', function(message) {
    appendMessage(other_nickname, message);
  });

  socket.on('new_user', function(origin, new_nickname) {
    if (origin === 'SERVER') {
      appendNick(new_nickname);
    }
  });

  socket.on('disconnected_user', function(nickname) {
    console.log(nickname + "disconnected.");
  });
  
  var setKeyListener = function(element, callback) {
    element.keyup(function(e) {
      var code = e.which || e.keyCode;
      
      if (code == 13) {
        callback($(this).val());
      }
    });
  };

  var init = function() {
    $login_form.submit(setNickname);
  };
  
  var setNickname = function() {
    nickname = $nickname.val();
    if (nickname.length === 0) {
      showError("Empty nickname is not valid.");
      return false;
    }
    socket.emit('set_nickname', nickname, function(is_available) {
      if (is_available) {
        console.log('Nickname ' + nickname + ' is available');
        my_nickname = nickname;
        $my_nickname.text(my_nickname);
        setUpRoom();
      } else {
        $error_paragraph.text("Not available. Choose another");
      }
    });
    return false;
  };

  var showError = function(error) {
    $error.show();
    $error.text(error);
  };
    
  var setUpRoom = function() {
    socket.emit('get_users', function(users) {
      console.log("Received " + users);
      $login.hide();
      for (var client in users) {
        console.log(users[client]);
        appendNick(users[client]);
      }
      $room.show();
      setKeyListener($chat_with, connectWith);
    });
  };

  var connectWith = function(other_nickname) {
    socket.emit('connect_me_with', my_nickname, other_nickname, function(ok) {
      if(ok) {
        setChatWithOther(other_nickname);
      } else {
        console.error("Not possible.");
      }
    });
  };

  var setChatWithOther = function (nickname) {
    $room.hide();
    $other_user.text(nickname);
    $conversation.show();
    setKeyListener($message, sendMessageToOther);
    other_nickname = nickname;
  };

  var sendMessageToOther = function(message) {
    if (other_nickname === undefined) {
      console.error("You are not talking with other");
      return;
    }

    if (message === "") {
      console.error("Empty message, really?");
    }

    socket.emit('send_message_to', my_nickname, message, function(ok) {
      if (ok) {
        appendMessage(my_nickname, message);
        $message.val("");
      } else {
        console.error("Message could not be sent");
      }
    });
  };

  var appendNick = function(nickname) {
    if (nickname !== my_nickname) {
      $users.append($("<li>@" + nickname + "</li>"));
    }
  }

  var appendMessage = function(nickname, message) {
    $messages.append("<li>"+ nickname + ": " + message + "</li>");
  };

});
