(function(){
  var body = document.querySelector("body"),
      grid,
      input,
      initialClick,
      finalClick;

  var sendClickMessage = function(initialClick, finalClick, status) {
    chrome.runtime.sendMessage({initialClick: initialClick, finalClick: finalClick, status: status});
  };

  var newGrid = function() {
    var grid = document.createElement("div");
    grid.classList.add("highlight-grid");
    body.appendChild(grid);
  };

  var createGrid = function(startPos) {
    if(!grid) {
      newGrid();
      grid = document.querySelector(".highlight-grid");
    }

    grid.style.width = "1px";
    grid.style.height = "1px";
    grid.style.left = startPos[0] + "px";
    grid.style.top = startPos[1] + "px";
    grid.style.display = "block";
  };

  var sizeGrid = function(evt) {
    var x = evt.clientX,
        y = evt.clientY;
    grid.style.width = (x - initialClick[0]) + "px";
    grid.style.height = (y - initialClick[1]) + "px";
  };

  var removeGrid = function() {
    grid.style.display = "none";
    body.style.cursor = "auto";
  };

  var updateCharCount = function(evt) {
    var len = evt.target.value.length;
    var charCount = document.querySelector("#tweetHighlightCharCount");
    var tweetButton = document.querySelector("#tweetHighlightButton");
    if(len <= 140) {
      charCount.classList.add("good");
      charCount.classList.remove("error");
      tweetButton.removeAttribute("disabled");
      tweetButton.classList.remove("disabled");
    } else {
      charCount.classList.add("error");
      charCount.classList.remove("good");
      tweetButton.setAttribute("disabled", true);
      tweetButton.classList.add("disabled");
    }
    charCount.innerText = (140 - len);
  }

  var hideInput = function () {
    var overlay = document.querySelector("#tweetHighlightOverlay");
    overlay.style.display = "none";
    var statusText = document.querySelector("#tweetHighlightStatus");
    statusText.removeEventListener("keydown", updateCharCount);
    statusText.removeEventListener("change", updateCharCount);
  };

  var showInput = function(initialClick, finalClick, status) {
    var overlay = document.querySelector("#tweetHighlightOverlay");
    overlay.style.display = "flex";

    var button = document.querySelector("#tweetHighlightButton");
    button.addEventListener("click", function tweetClick() {
      var statusText = document.querySelector("#tweetHighlightStatus");
      var status = statusText.value;
      hideInput();
      button.removeEventListener("click", tweetClick);
      setTimeout(function() {
        sendClickMessage(initialClick, finalClick, status);
      }, 150);
    });

    var statusText = document.querySelector("#tweetHighlightStatus");
    statusText.addEventListener("keydown", updateCharCount, false);
    statusText.addEventListener("change", updateCharCount, false);
    statusText.value = status;

    var charCount = document.querySelector("#tweetHighlightCharCount");

    charCount.innerText = (140 - status.length);
    if(status.length <= 140) {
      charCount.classList.add("good");
      charCount.classList.remove("error");
      button.removeAttribute("disabled");
      button.classList.remove("disabled");
    } else {
      charCount.classList.add("error");
      charCount.classList.remove("good");
      button.setAttribute("disabled", true);
      button.classList.add("disabled");
    }
  };

  var createInput = function() {
    var overlay = document.createElement("div");
    overlay.setAttribute("id", "tweetHighlightOverlay");

    var heading = document.createElement("span");
    heading.innerText = "Post to Twitter...";
    heading.classList.add("tweet-highlight-heading");

    input = document.createElement("div");
    input.setAttribute("id", "tweetHighlightInput");

    var text = document.createElement("textarea");
    text.setAttribute("rows", "5");
    text.setAttribute("cols", "65");
    text.setAttribute("maxlength", "150");
    text.setAttribute("id", "tweetHighlightStatus");

    var charCount = document.createElement("span");
    charCount.innerText = "0";
    charCount.classList.add("tweet-char-count");
    charCount.setAttribute("id", "tweetHighlightCharCount");

    var tweetButton = document.createElement("button");
    tweetButton.innerText = "Tweet";
    tweetButton.setAttribute("id", "tweetHighlightButton");

    var cancelButton = document.createElement("button");
    cancelButton.innerText = "Cancel";
    cancelButton.setAttribute("id", "tweetHighlightCancelButton");
    cancelButton.addEventListener("click", hideInput);

    input.appendChild(heading);
    input.appendChild(text);
    input.appendChild(charCount);
    input.appendChild(tweetButton);
    input.appendChild(cancelButton);

    overlay.appendChild(input);
    body.appendChild(overlay);
  };

  var captureInitialClick = function(evt) {
    evt.preventDefault();
    initialClick =[evt.clientX, evt.clientY];
    createGrid(initialClick);
    document.removeEventListener("mousedown", captureInitialClick);
    document.addEventListener("mousemove", sizeGrid, false);
    document.addEventListener("mousedown", captureFinalClick, false);
  };

  var captureFinalClick = function(evt) {
    evt.preventDefault();
    removeGrid();
    finalClick = [evt.clientX, evt.clientY];
    var status = document.title + " - " + window.location.href;
    document.removeEventListener("mousemove", sizeGrid);
    document.removeEventListener("mousedown", captureFinalClick);
    if(!input) { createInput(); }
    showInput(initialClick, finalClick, status);
  };

  document.addEventListener("mousedown", captureInitialClick, false);
  body.style.cursor = "crosshair";
}());
