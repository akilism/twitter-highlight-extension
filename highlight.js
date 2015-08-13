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

  var hideInput = function () {
    var input = document.querySelector("#tweetHighlightInput");
    input.style.display = "none";
  };

  var showInput = function(initialClick, finalClick, status) {
    var input = document.querySelector("#tweetHighlightInput");
    input.style.display = "block";
    var button = document.querySelector("#tweetHighlightButton");
    button.addEventListener("click", function tweetClick() {
      hideInput();
      button.removeEventListener("click", tweetClick);
      setTimeout(function() {
        sendClickMessage(initialClick, finalClick, status);
      }, 150);
    });
    var statusText = document.querySelector("#tweetHighlightStatus");
    statusText.value = status;
  };

  var createInput = function() {
    input = document.createElement("div");
    input.setAttribute("id", "tweetHighlightInput");
    var text = document.createElement("textarea");
    text.setAttribute("rows", "5");
    text.setAttribute("cols", "60");
    text.setAttribute("maxlength", "150");
    text.setAttribute("id", "tweetHighlightStatus");
    var tweetButton = document.createElement("button");
    tweetButton.innerText = "Tweet";
    tweetButton.setAttribute("id", "tweetHighlightButton");
    var cancelButton = document.createElement("button");
    cancelButton.innerText = "Cancel";
    cancelButton.setAttribute("id", "tweetHighlightCancelButton");
    cancelButton.addEventListener("click", hideInput);
    input.appendChild(text);
    input.appendChild(tweetButton);
    input.appendChild(cancelButton);
    body.appendChild(input);
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
