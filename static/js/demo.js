$(window).ready(function() {
  var password = $('#js-password');
  var consoleDiv = $('#js-console');
  var showPassword = $("#js-show-password")[0];

  var absoluteUrl = function(url) {
    var a = document.createElement('a');
    a.setAttribute("href", url);
    return a.href;
  };
  var consoleScroll = function() {
    consoleDiv[0].scrollTop = 9999999;
  };
  var consoleWriteln = function(str) {
    consoleDiv.append(document.createTextNode((str || '') + '\n'));
    consoleScroll();
  };
  var consoleExec = function(cmdline) {
    var execSpan = $('<span class="exec"></span>');
    consoleDiv
      .append(document.createTextNode('$ '))
      .append(execSpan)
      .append(document.createTextNode('\n'));
    cmdline.forEach(function(arg, i) {
      var argSpan = $('<span class="exec-arg"></span>');
      if (typeof(arg) == "string") {
        if (!/^[A-Za-z0-9\-_.\/:]+$/.test(arg)) {
          arg = ("'" +
            arg.replace(/'/g, "'\\''")             // Escape single quotes
               .replace(/\n/g, "'$$'\\n''") +      // Escape newlines
            "'");
        }
        argSpan.text(arg);
      } else if (arg && typeof(arg) == "object" && arg.html) {
        argSpan.html(arg.html);
      } else {
        throw new Error("unexpected arg: " + arg);
      }
      argSpan.appendTo(execSpan);
      if (i < cmdline.length - 1)
        execSpan.append(document.createTextNode(' '));
    });
    consoleScroll();
  };

  var postJSON = function(path, json) {
    try {
      JSON.parse(json);
    } catch (e) {
      alert("Invalid JSON: " + e);
      return;
    }

    $.ajax({
      type: "POST",
      url: path,
      data: json,
      contentType: 'application/json'
    });
  };

  $("#submissions a:first").tab('show');

  $(document).ajaxSend(function(event, jqxhr, settings) {
    var USERNAME = 'api';

    settings.username = USERNAME;
    settings.password = password.val();
    var url = absoluteUrl(settings.url);
    var credentials = showPassword.checked 
      ? USERNAME + ':' + password.val()
      : {html: USERNAME + ':<span style="color: red">****</span>'};
    var cmdline = ["curl", "-i", "-u", credentials];
    if (settings.type != 'GET')
      cmdline = cmdline.concat([
        '-X', settings.type,
        '-H', 'Content-Type: ' + settings.contentType,
        '--data-binary', settings.data
      ]);
    cmdline.push(url);
    consoleExec(cmdline);
  }).ajaxComplete(function(event, jqxhr, settings) {
    consoleWriteln("HTTP/1.1 " + jqxhr.status + " " + jqxhr.statusText);
    ["Content-Type"].forEach(function(header) {
      consoleWriteln(header + ": " + jqxhr.getResponseHeader(header));
    });
    consoleWriteln();
    consoleWriteln(jqxhr.responseText);
  });

  $("#js-update-mentor").click(function() {
    postJSON("/api/mentor", $("#js-update-mentor-json").val());
  });

  $("#js-list-mentors").click(function() {
    $.get('/api/mentors', function(response) {
      $("#js-mentors").text(JSON.stringify(response, null, 2));
    });
  });

  $("form.js-submission").submit(function() {
    postJSON("/api/submit", $(this.elements['json']).val());
    return false;
  });
});
