chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	if (msg !== 'get me video'){
		return;
	}
	var response = {
		video: $('video').prop('outerHTML'),
		videosrc: $('video').attr('src')
	};
	console.log(response)
  sendResponse(response);
});	