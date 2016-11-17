chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  $('#cast').hide();
  chrome.tabs.sendMessage(tabs[0].id, 'get me video', function(response) {
  	if (!response){
  		console.log('no response from page')
  		return;
  	}

  	var loadFunction = function(url){
  		return function(){
      	loadCustomMedia(url)
  		}
  	}

    $('#video').text(response.video);
    $('#videosrc').text(response.videosrc);

    $('#loadMedia').click(loadFunction(response.videosrc))
    $('#loadApp').click(launchApp)
    $('#playpauseresume').click(playCurrentMedia)
    $('#joinsessionbyid').click(joinSessionBySessionId)

    $('#cast').show();

    $('#progress').change(function(){
      var pos = $(this).val();
      seekMedia(pos);
    })

      // check if a session ID is saved into localStorage
		storedSession = JSON.parse(localStorage.getItem('storedSession'));
		if (storedSession) {
		  var dateString = storedSession.timestamp;
		  var now = new Date().getTime();

		  if (now - dateString < SESSION_IDLE_TIMEOUT) {
		    document.getElementById('joinsessionbyid').style.display = 'block';
		  }
		}
  });
});
