function curry(fn) {
  return function() {
    if(fn.length > arguments.length) {
      var slice = Array.prototype.slice;
      var args = slice.apply(arguments);
      return function() {
        return fn.apply(null, args.concat(slice.apply(arguments)));
      };
    } else {
      return fn.apply(null, arguments);
    }
  };
}

var twitter = (function(){
  var oauthToken, oauthTokenSecret;
  var cb = new Codebird;
  cb.setUseProxy(false);
  cb.setConsumerKey("key", "secret");

  var setToken = function(oauthToken, oauthTokenSecret) {
    cb.setToken(oauthToken, oauthTokenSecret);
  };

  var setAuthItems = function(items) {
    oauthToken = items.oauthToken;
    oauthTokenSecret = items.oauthTokenSecret;
    setToken(oauthToken, oauthTokenSecret);
  };

  var getLocalAuth = function() {
    return new Promise(function(resolve, reject) {
      if(oauthToken && oauthTokenSecret) {
        console.log("auth saved:", oauthToken);
        resolve({oauthToken:oauthToken, oauthTokenSecret:oauthTokenSecret});
        return;
      }

      chrome.storage.sync.get({
        oauthToken: null,
        oauthTokenSecret: null
      }, function(items) {
        if(items.oauthToken) {
          console.log("auth localstorage:", items.oauthToken);
          resolve(items);
        } else {
          console.log("no auth");
          reject(items);
        }
      });
    });
  };

  var cbPromise = function(apiMethod, params) {
    return new Promise(function(resolve, reject) {
      cb.__call(apiMethod, params, function(reply) {
        console.log(reply);
        if(reply.httpstatus >= 400) {
          reject(new Error("something went wrong: " + apiMethod + ": <httpstatus: " + reply.httpstatus + ">"));
        } else {
          resolve(reply);
        }
      });
    });
  }

  var uploadImage = curry(cbPromise)("media_upload");

  var sendStatus = curry(cbPromise)("statuses_update");

  var oauthRequestToken = curry(cbPromise)("oauth_requestToken");

  var oauthAuthorize = curry(cbPromise)("oauth_authorize");

  var oauthAccessToken = curry(cbPromise)("oauth_accessToken");

  return {
    cb: cb,
    getLocalAuth: getLocalAuth,
    setAuthItems:setAuthItems,
    oauthRequestToken:oauthRequestToken,
    oauthAuthorize:oauthAuthorize,
    oauthAccessToken:oauthAccessToken,
    setToken:setToken,
    uploadImage:uploadImage,
    sendStatus:sendStatus
  };
}());
