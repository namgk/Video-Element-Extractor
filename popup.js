$(function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, 'get me video', function(response) {
      $('#video').text(response.video);
      $('#videosrc').text(response.videosrc);
    });
  });
});
