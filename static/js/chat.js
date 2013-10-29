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

  socket.on('request_from', function(other_nickname, callback) {
    connectionRequest(other_nickname, callback);
  });

  socket.on('new_message', function(message) {
    appendMessage(partner_nickname, message);
  });

  socket.on('user_add', function(new_nickname) {
    $no_users_alert.hide();
    appendNick(new_nickname);
  });

  socket.on('user_left', function(nickname) {
    console.log(nickname + " disconnected.");
    removeNick(nickname);
    if (partner_nickname === nickname) {
      $conversation.hide();
      $messages.empty();
      setUpRoom();
    }
  });
  
  socket.on('user_left_chat', function () {
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
    socket.emit('login', nickname, function(err, succ, user_list) {
      if (succ) {
	console.log('Nickname ' + nickname + ' is available');
        my_nickname = nickname;
        setNickList(user_list);
	setUpRoom();
	$log_out_button.show();
      } else {
	  showError("Error: " + err);
      }
    });
    return false;
  };
 
  var setUpRoom = function() {
    $room_heading.text("Chat room - Logged as: " + nickname);
    $login.hide();
    current_window = $room;
    $room.show();
  };
  
  var connectionRequest = function(other_nickname, callback) {
    $room.hide();
    $request.show();
    $other_nickname.text(other_nickname);

    $button_accept.click( function () {
      callback(true);
      $request.hide();
      partner_nickname = other_nickname;
      setChat();
    });

    $button_deny.click( function () {
      callback(false);
      $request.hide();
      setUpRoom();
    });
    return false;
  };

  var connectWith = function(other_nickname) {
    socket.emit('request_chat', my_nickname, other_nickname, function(err, succ) {
      if(succ) {
        partner_nickname = other_nickname;
	setChat();
      } else {
	console.error("Not possible. Error: " + err);
      }
    });
  };

  var setChat = function () {
    $other_user.text("Chatting with: " + other_nickname);
    $room.hide();
    $button_leave_conv.show();
    current_window = $conversation;
    $other_user.text(partner_nickname);
    $conversation.show();
    setKeyListener($message, sendMessage);
    
    $button_leave_conv.click ( function () {
      socket.emit('leave_chat', nickname);
      $conversation.hide();
      partner_nickname = undefined;
      setUpRoom();
    });
  };

  var sendMessage = function(message) {
    if (partner_nickname === undefined) {
      console.error("You are not talking with other");
      return;
    }

    if (message === "") {
      console.error("Empty message, really?");
    }

    socket.emit('send_message', my_nickname, message, function(ok) {
      if (ok) {
        appendMessage(my_nickname, message);
        $message.val("");
      } else {
        console.error("Message could not be sent");
      }
    });
  };
  
  var showError = function(error) {
    $error.show();
    $error.text(error);
  };

  var clearError = function() {
    $error.hide();
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
  var setNickList = function(user_list){
    clearNickList();
    if (user_list.length < 2) {
      $no_users_alert.show();
    } else {
      for (var client in user_list) {
        console.log(user_list[client]);
        appendNick(user_list[client]);
      }
    }
  };

  var appendMessage = function(nickname, message) {
    $messages.append("<li>"+ nickname + ": " + message + "</li>");
  };

  var logout = function() {
    socket.emit('logout');
    current_window.hide();
    current_window = $login;
    $log_out_button.hide();
    $login.show();
  };
});
