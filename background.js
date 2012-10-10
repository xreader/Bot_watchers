chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.windows.create('window.html', {
    'width': 400,
    'height': 300
  });
  chrome.runtime.onSuspend.addListener(function() { 
  //TODO Do some simple clean-up tasks.
  });
});
