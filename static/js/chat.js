$(document).ready(function() {
  
  var $login = $('#login'),
      $nickname = $('#nickname'),
      $nickname_button = $('#signin'),
      $login_form = $('#login-form'),
      $error = $('#login-error');
      $room = $("#room"),
      $conversation = $('#conversation'),
      $users = $('#users'),
      $chat_with = $('#chat_with'),
      $other_user = $('#other_user'),
      $messages = $('#messages'),
      $message = $('#new_message'),
      $room_heading = $('#room_heading'),
      $other_nickname = $('#other_nickname'),
      $connect = $('#connect'),
      $request = $('#request'),
      $button_accept = $('#button_accept'),
      $button_deny = $('#button_deny'),
      $no_users_alert = $('#no-users-alert'),
      $log_out_button = $('#log-out-button'),
      $button_leave_conv = $('#button_leave_conversation'),
      socket = io.connect('/'),
      partner_nickname = undefined,
      my_nickname = undefined,
      current_window = $login;

  $room.hide();
  $conversation.hide();
  $request.hide();
  
	
  socket.on('connect', function() {
    console.log('Connected with socket');
    init();
  });

  socket.on('connection_request', function(other_nickname, callback) {
    connectionRequest(other_nickname, callback);
  });

  socket.on('new_message', function(message) {
    appendMessage(partner_nickname, message);
  });

  socket.on('new_user', function(origin, new_nickname) {
    if (origin === 'SERVER') {
      $no_users_alert.hide();
      appendNick(new_nickname);
    }
  });

  socket.on('disconnected_user', function(orogin, nickname) {
    console.log(nickname + " disconnected.");
    removeNick(nickname);
  });
  
  socket.on('exit_conversation_request', function () {
    console.log("Disconnecting from conversation");
    $conversation.hide();
    setUpRoom();
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
    $log_out_button.click(logout);
  };
  
  var setNickname = function() {
    nickname = $nickname.val();
    clearError();
    if (nickname.length === 0) {
      showError("Empty nickname is not valid.");
      return false;
    }
    socket.emit('set_nickname', nickname, function(is_available) {
      if (is_available) {
        console.log('Nickname ' + nickname + ' is available');
        my_nickname = nickname;
        setUpRoom(nickname);
        $log_out_button.show();
      } else {
        showError("Not available. Choose another.");
      }
    });
    return false;
  };

  var showError = function(error) {
    $error.show();
    $error.text(error);
  };

  var clearError = function() {
    $error.hide();
  };
    
  var setUpRoom = function() {
    $room_heading.text("Chat room - Logged as: " + nickname);
    socket.emit('get_users', function(users) {
      console.log("Received " + users);
      $login.hide();
      current_window = $room;
      clearNickList();
      if (users.length < 2) {
        $no_users_alert.show();
      } else {
        for (var client in users) {
          console.log(users[client]);
          appendNick(users[client]);
        }
      }
      $room.show();
    });
  };
  
  var connectionRequest = function(other_nickname, callback) {
    $room.hide();
    $request.show();
    $other_nickname.text(other_nickname);

    $button_accept.click( function () {
      callback(true);
      $request.hide();
      setChatWithOther(other_nickname);
    });

    $button_deny.click( function () {
      callback(false);
      $request.hide();
      setUpRoom();
    });
    return false;
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

  var setChatWithOther = function (other_nickname) {
    $room.hide();
    current_window = $conversation;
    $other_user.text("Chatting with: " + other_nickname);
    partner_nickname = other_nickname;
    $conversation.show();
    $button_leave_conv.show();
    setKeyListener($message, sendMessageToOther);
    
    $button_leave_conv.click ( function () {
      socket.emit('exit_conversation', nickname);
      $conversation.hide();
      partner_nickname = undefined;
      setUpRoom();
    });
  };

  var sendMessageToOther = function(message) {
    if (partner_nickname === undefined) {
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

  var clearNickList = function() {
    $users.empty();
  };

  var appendNick = function(nickname) {
    console.log("Trying to append: " +nickname);
    if (nickname !== my_nickname) {
      var $link = $('<a href="#" class="list-group-item"></a>');
      $link.text(nickname);
      $link.click(function() {
        connectWith(nickname);
      });
      $users.append($link);
    }
  };

  var removeNick = function(nickname) {
    var user_links = $('a:contains("'+nickname+'")');
    for (var i in user_links) {
      if ($(user_links[i]).text() === nickname) {
        $(user_links[i]).remove();
        if (user_links.length < 2) {
          $no_users_alert.show();
        }
        return;
      }
    }
  };

  var appendMessage = function(nickname, message) {
    $messages.append("<li>"+ nickname + ": " + message + "</li>");
  };

  var logout = function() {
    socket.emit('log_me_out');
    current_window.hide();
    current_window = $login;
    $log_out_button.hide();
    $login.show();
  };
});
