// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	console.log('content got: ' + msg);
	if (msg !== 'get me video'){
		return;
	}
	var response = {
		video: $('video').prop('outerHTML'),
		videosrc: $('video').attr('src')
	};
	console.log(JSON.stringify(response));
  sendResponse(response);
});	