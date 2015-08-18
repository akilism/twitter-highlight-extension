(function() {

  var authItems;
  var mediaIds = [];

  // Inject the content script and css into the current page.
  // Handles highlighting the text and capturing the selection
  // dimensions.
  var insertContentScript = function(info, tab) {
    chrome.tabs.executeScript(null, {file: "highlight.js"});
    chrome.tabs.insertCSS(null, {file: "highlight.css"});
    //chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) { console.log(dataUrl); });
  };


  //**********************
  //*  Image Processing  *
  //**********************

  // Create a canvas element in the background page to crop the
  // image down to the selection dimensions.
  var createCanvas = function(w, h) {
    var body = document.querySelector("body"),
        canvas = document.createElement("canvas");
    canvas.setAttribute("width", w);
    canvas.setAttribute("height", h);
    canvas.classList.add("crop");
    body.appendChild(canvas);
  };

  // Create an image element to hold the full screen shot.
  var createImage = function(dataUrl) {
    var body = document.querySelector("body"),
        image = document.createElement("img");
    image.src = dataUrl;
    image.classList.add("screenshot");
    body.appendChild(image);
  };

  // Crop the full screen shot down to the selection dimensions.
  // Return a base64 encoded png of the cropped image.
  var cropImage = function(dimensions) {
    var canvas = document.querySelector(".crop"),
        ctx = canvas.getContext("2d"),
        image = document.querySelector(".screenshot");
    ctx.drawImage(image, dimensions.x, dimensions.y, dimensions.w, dimensions.h, 0, 0, dimensions.w, dimensions.h);
    //console.log("crop-image:", canvas.toDataURL("image/png"));
    return canvas.toDataURL("image/png");
  };

  // Remove an element from the DOM.
  var removeElement = function(selector) {
    var elem = document.querySelector(selector);
    elem.remove();
  }

  var getDimensions = function(initialClick, finalClick) {
    return {
      w: (finalClick[0] - initialClick[0]),
      h: (finalClick[1] - initialClick[1]),
      x: initialClick[0],
      y: initialClick[1]
    };
  };

  // Crop a full screen shot to the selection dimensions.
  var processScreenshot = function(initialClick, finalClick, dataUrl) {
    //console.log("full-image:", dataUrl);
    var selectionDimensions = getDimensions(initialClick, finalClick);
    createCanvas(selectionDimensions.w, selectionDimensions.h);
    createImage(dataUrl);
    var cropData = cropImage(selectionDimensions);
    console.log("cropped image:", cropData);
    [".screenshot", ".crop"].forEach(removeElement);
    return cropData;
  };

  // Capture an image of the current tab.
  var captureImage = function(initialClick, finalClick) {
    return new Promise(function(resolve, reject) {
      chrome.tabs.captureVisibleTab(null, {format: "png"}, function (dataUrl) {
        resolve(processScreenshot(initialClick, finalClick, dataUrl));
      });
    });
  };

  //*******************
  //*  Tweet Sending  *
  //*******************

  var uploadImage = function(imageData) {
    // twitter.setAuthItems(authItems);
    return twitter.uploadImage({media: imageData.replace("data:image/png;base64,","")});
  };

  var tweetImage = function(status, mediaId) {
    twitter.setAuthItems(authItems);
    console.log(status, status.length);
    return twitter.sendStatus({media_ids: mediaId, status: status});
  };


  //***********
  //*  Setup  *
  //***********

  var setMenu = function() {
    chrome.contextMenus.removeAll();
    return twitter.getLocalAuth()
      .then(function(items) {
        twitter.setAuthItems(items);
        authItems = items;
        chrome.contextMenus.create({ title: "Post highlight to Twitter.",
          id: "postTwitter",
          contexts: ["all"],
          onclick:  insertContentScript });
      }).catch(function() {
        chrome.contextMenus.create({ title: "Please connect a Twitter Account.",
          contexts: ["all"],
          id: "postTwitter",
          onclick:  null });
      });
  };


  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.initialClick && request.finalClick) {
        mediaIds = [];
        return captureImage(request.initialClick, request.finalClick)
          .then(uploadImage)
          .then(function(reply) {
            mediaIds.push(reply.media_id_string);
            return mediaIds;
          })
          .catch(function(err) {
            console.error(err);
          });
      } else if (request.status) {
        var status = (request.status) ? request.status : "";
        return tweetImage(status, mediaIds.join(",")).catch(function(err) { console.error(err); });
      } else if (request.auth) {
        setMenu();
      }
  });

  setMenu();

}());
