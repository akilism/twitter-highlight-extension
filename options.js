//options.js
//try to get token from local storage
//if no token show connect button
//on button click show input fields
//on successful auth show disconnect button and save tokens

(function(){
  var connectTwitter = function(evt) {
    evt.preventDefault();
    return twitter.oauthRequestToken({oauth_callback: "oob"}).then(function(reply) {
      twitter.setToken(reply.oauth_token, reply.oauth_token_secret);
      return twitter.oauthAuthorize({});
    }).then(function(auth_url) {
      window.codebird_auth = window.open(auth_url);
      show('pin-input');
    }).catch(function(err) {
      console.error(err);
    });
  };

  var saveAuthLocal = function(items, callback) {
    twitter.setAuthItems(items);
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.set(items, function() {
        resolve(true);
      });
    });
  };

  var disconnectTwitter = function(evt) {
    evt.preventDefault();
    return saveAuthLocal({oauthToken: null, oauthTokenSecret: null}).then(function() {
      show('connect');
    });
  };

  var saveAuth = function(evt) {
    evt.preventDefault();
    var params = {oauth_verifier: document.querySelector("#twitterPin").value};
    return twitter.oauthAccessToken(params).then(function(reply) {
      twitter.setToken(reply.oauth_token, reply.oauth_token_secret);
      return saveAuthLocal({oauthToken: reply.oauth_token, oauthTokenSecret: reply.oauth_token_secret});
    }).then(function(result) {
      chrome.runtime.sendMessage({auth: true});
      show('disconnect');
    });
  };

  var screens = {
    "connect": {
      buttonId: "btnConnect",
      buttonHandler: connectTwitter
    },
    "disconnect": {
      buttonId: "btnDisconnect",
      buttonHandler: disconnectTwitter
    },
    "pin-input": {
      buttonId: "btnSave",
      buttonHandler: saveAuth
    }
  };

  var hideScreens = function() {
    var screenElems = Array.prototype.slice.call(document.querySelectorAll(".screen"), 0);
    screenElems.forEach(function(s) {
      s.style.display = "none";
    });
  };

  var show = function(screen) {
    var screenOpts = screens[screen];
    hideScreens();
    var activeScreen = document.querySelector("#" + screen);
    activeScreen.style.display = "flex";
    var actionButton = document.querySelector("#" + screenOpts.buttonId);
    actionButton.addEventListener("click", screenOpts.buttonHandler);
  };

  var setMenu = function() {
    return twitter.getLocalAuth().then(function(items) {
      twitter.setAuthItems(items);
      show("disconnect");
    }).catch(function() {
      show("connect");
    });
  };

  document.addEventListener('DOMContentLoaded', setMenu);
}());
