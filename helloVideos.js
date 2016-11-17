var CAST_API_INITIALIZATION_DELAY = 1000;
var PROGRESS_BAR_UPDATE_DELAY = 1000;
var SESSION_IDLE_TIMEOUT = 300000;

/**
 * global variables
 */
var currentMediaSession = null;
var currentVolume = 0.5;
var progressFlag = 1;
var mediaCurrentTime = 0;
var session = null;
var storedSession = null;
var timer = null;

/**
 * Call initialization
 */
if (!chrome.cast || !chrome.cast.isAvailable) {
  setTimeout(initializeCastApi, CAST_API_INITIALIZATION_DELAY);
}

/**
 * initialization
 */
function initializeCastApi() {
  // default app ID to the default media receiver app
  // optional: you may change it to your own app ID/receiver
  var applicationIDs = [
      //"33881A30"//chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
	"246E0B12"
    ];


  // auto join policy can be one of the following three
  // 1) no auto join
  // 2) same appID, same URL, same tab
  // 3) same appID and same origin URL
  var autoJoinPolicyArray = [
      chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
      chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
      chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    ];

  // request session
  var sessionRequest = new chrome.cast.SessionRequest(applicationIDs[0]);
  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
    sessionListener,
    receiverListener,
    autoJoinPolicyArray[1]);

  chrome.cast.initialize(apiConfig, onInitSuccess, onError);
}

/**
 * initialization success callback
 */
function onInitSuccess() {
  appendMessage('init success');

  // check if a session ID is saved into localStorage
  storedSession = JSON.parse(localStorage.getItem('storedSession'));
  if (storedSession) {
    var dateString = storedSession.timestamp;
    var now = new Date().getTime();

    if (now - dateString < SESSION_IDLE_TIMEOUT) {
      document.getElementById('joinsessionbyid').style.display = 'block';
    }
  }
}

/**
 * session listener during initialization
 * @param {Object} e session object
 * @this sessionListener
 */
function sessionListener(e) {
  
  appendMessage('New session ID:' + e.sessionId);
  $('#loadApp').hide()
  session = e;
  //document.getElementById('casticon').src = CAST_ICON_THUMB_ACTIVE;
  if (session.media.length != 0) {
    appendMessage(
        'Found ' + session.media.length + ' existing media sessions.');
    onMediaDiscovered('sessionListener', session.media[0]);
  }
  session.addMediaListener(
    onMediaDiscovered.bind(this, 'addMediaListener'));
  session.addUpdateListener(sessionUpdateListener.bind(this));
  // disable join by session id when auto join already
  if (storedSession) {
    document.getElementById('joinsessionbyid').style.display = 'none';
  }
}

/**
 * session update listener
 * @param {boolean} isAlive status from callback
 * @this sessionUpdateListener
 */
function sessionUpdateListener(isAlive) {
  if (!isAlive) {
    session = null;
    var playpauseresume = document.getElementById('playpauseresume');
    playpauseresume.innerHTML = 'Play';
    if (timer) {
      clearInterval(timer);
    }
    else {
      timer = setInterval(updateCurrentTime.bind(this),
          PROGRESS_BAR_UPDATE_DELAY);
      playpauseresume.innerHTML = 'Pause';
    }
  }
}

/**
 * receiver listener during initialization
 * @param {string} e status string from callback
 */
function receiverListener(e) {
  if (e === 'available') {
    
    appendMessage('receiver found');
  }
  else {
    
    appendMessage('receiver list empty');
  }
}


/**
 * launch app and request session
 */
function launchApp() {
  
  appendMessage('launching app...');
  chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
  if (timer) {
    clearInterval(timer);
  }
}

/**
 * callback on success for requestSession call
 * @param {Object} e A non-null new session.
 * @this onRequestSesionSuccess
 */
function onRequestSessionSuccess(e) {
  
  appendMessage('session success: ' + e.sessionId);
  saveSessionID(e.sessionId);
  session = e;
  //document.getElementById('casticon').src = CAST_ICON_THUMB_ACTIVE;
  session.addUpdateListener(sessionUpdateListener.bind(this));
  if (session.media.length != 0) {
    onMediaDiscovered('onRequestSession', session.media[0]);
  }
  session.addMediaListener(
    onMediaDiscovered.bind(this, 'addMediaListener'));
}

/**
 * callback on launch error
 */
function onLaunchError() {
  
  appendMessage('launch error');
}

/**
 * save session ID into localStorage for sharing
 * @param {string} sessionId A string for session ID
 */
function saveSessionID(sessionId) {
  // Check browser support of localStorage
  if (typeof(Storage) != 'undefined') {
    // Store sessionId and timestamp into an object
    var object = {id: sessionId, timestamp: new Date().getTime()};
    localStorage.setItem('storedSession', JSON.stringify(object));
  }
}

/**
 * join session by a given session ID
 */
function joinSessionBySessionId() {
  if (storedSession) {
    appendMessage(
        'Found stored session id: ' + storedSession.id);
    chrome.cast.requestSessionById(storedSession.id);
  }
}

/**
 * stop app/session
 */
function stopApp() {
  session.stop(onStopAppSuccess, onError);
  if (timer) {
    clearInterval(timer);
  }
}

/**
 * load media specified by custom URL
 */
function loadCustomMedia(customMediaURL) {
  // var customMediaURL = document.getElementById('customMediaURL').value;
  if (customMediaURL.length > 0) {
    loadMedia(customMediaURL);
  }
}

/**
 * load media
 * @param {string} mediaURL media URL string
 * @this loadMedia
 */
function loadMedia(mediaURL) {
  if (!session || !mediaURL) {
    
    appendMessage('no session or media');
    return;
  }

  var mediaInfo = new chrome.cast.media.MediaInfo(mediaURL);

  mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
  mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
  mediaInfo.contentType = 'video/mp4';

  mediaInfo.metadata.title = 'Cho ty ...';

  var request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.autoplay = true;
  request.currentTime = 0;

  session.loadMedia(request,
    onMediaDiscovered.bind(this, 'loadMedia'),
    onMediaError);

}

/**
 * callback on success for loading media
 * @param {string} how info string from callback
 * @param {Object} mediaSession media session object
 * @this onMediaDiscovered
 */
function onMediaDiscovered(how, mediaSession) {
  
  appendMessage('new media session ID:' + mediaSession.mediaSessionId +
      ' (' + how + ')');
  currentMediaSession = mediaSession;
  currentMediaSession.addUpdateListener(onMediaStatusUpdate);
  mediaCurrentTime = currentMediaSession.currentTime;
  playpauseresume.innerHTML = 'Play';
  //document.getElementById('casticon').src = CAST_ICON_THUMB_ACTIVE;
  document.getElementById('playerstate').innerHTML =
      currentMediaSession.playerState;
  if (!timer) {
    timer = setInterval(updateCurrentTime.bind(this),
        PROGRESS_BAR_UPDATE_DELAY);
    // playpauseresume.innerHTML = 'Pause';
  }
}

/**
 * callback on media loading error
 * @param {Object} e A non-null media object
 */
function onMediaError(e) {
  
  appendMessage('media error');
}

/**
 * get media status initiated by sender when necessary
 * currentMediaSession gets updated
 * @this getMediaStatus
 */
function getMediaStatus() {
  if (!session || !currentMediaSession) {
    return;
  }

  currentMediaSession.getStatus(null,
      mediaCommandSuccessCallback.bind(this, 'got media status'),
      onError);
}

/**
 * callback for media status event
 * @param {boolean} isAlive status from callback
 */
function onMediaStatusUpdate(isAlive) {
  if (!isAlive) {
    currentMediaTime = 0;
  }
  else {
    if (currentMediaSession.playerState == 'PLAYING') {
      if (progressFlag) {
        document.getElementById('progress').value = parseInt(100 *
            currentMediaSession.currentTime /
            currentMediaSession.media.duration);
        document.getElementById('progress_tick').innerHTML =
            currentMediaSession.currentTime;
        document.getElementById('duration').innerHTML =
            currentMediaSession.media.duration;
        progressFlag = 0;
      }
      document.getElementById('playpauseresume').innerHTML = 'Pause';
    }
  }
  document.getElementById('playerstate').innerHTML =
      currentMediaSession.playerState;
}

/**
 * Updates the progress bar shown for each media item.
 */
function updateCurrentTime() {
  if (!session || !currentMediaSession) {
    return;
  }

  if (currentMediaSession.media && currentMediaSession.media.duration != null) {
    var cTime = currentMediaSession.getEstimatedTime();
    document.getElementById('progress').value = parseInt(100 * cTime /
        currentMediaSession.media.duration);
    document.getElementById('progress_tick').innerHTML = cTime;
  }
  else {
    document.getElementById('progress').value = 0;
    document.getElementById('progress_tick').innerHTML = 0;
    if (timer) {
      clearInterval(timer);
    }
  }
}

function playCurrentMedia() {
  if (!currentMediaSession) {
    return;
  }

  if (timer) {
    clearInterval(timer);
  }

  var playpauseresume = document.getElementById('playpauseresume');
  if (playpauseresume.innerHTML == 'Play') {
    currentMediaSession.play(null,
      mediaCommandSuccessCallback.bind(this, 'playing started for ' +
          currentMediaSession.sessionId),
      onError);
      playpauseresume.innerHTML = 'Pause';
      appendMessage('play started');
      timer = setInterval(updateCurrentTime.bind(this),
          PROGRESS_BAR_UPDATE_DELAY);
  }
  else {
    if (playpauseresume.innerHTML == 'Pause') {
      currentMediaSession.pause(null,
        mediaCommandSuccessCallback.bind(this, 'paused ' +
            currentMediaSession.sessionId),
        onError);
      playpauseresume.innerHTML = 'Resume';
      appendMessage('paused');
    }
    else {
      if (playpauseresume.innerHTML == 'Resume') {
        currentMediaSession.play(null,
          mediaCommandSuccessCallback.bind(this, 'resumed ' +
              currentMediaSession.sessionId),
          onError);
        playpauseresume.innerHTML = 'Pause';
        appendMessage('resumed');
        timer = setInterval(updateCurrentTime.bind(this),
            PROGRESS_BAR_UPDATE_DELAY);
      }
    }
  }
}

/**
 * stop media
 * @this stopMedia
 */
function stopMedia() {
  if (!currentMediaSession)
    return;

  currentMediaSession.stop(null,
    mediaCommandSuccessCallback.bind(this, 'stopped ' +
        currentMediaSession.sessionId),
    onError);
  var playpauseresume = document.getElementById('playpauseresume');
  playpauseresume.innerHTML = 'Play';
  appendMessage('media stopped');
  if (timer) {
    clearInterval(timer);
  }
}

/**
 * set media volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute
 * @this setMediaVolume
 */
function setMediaVolume(level, mute) {
  if (!currentMediaSession)
    return;

  var volume = new chrome.cast.Volume();
  volume.level = level;
  currentVolume = volume.level;
  volume.muted = mute;
  var request = new chrome.cast.media.VolumeRequest();
  request.volume = volume;
  currentMediaSession.setVolume(request,
    mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
    onError);
}

/**
 * set receiver volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute
 * @this setReceiverVolume
 */
function setReceiverVolume(level, mute) {
  if (!session)
    return;

  if (!mute) {
    session.setReceiverVolumeLevel(level,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
    currentVolume = level;
  }
  else {
    session.setReceiverMuted(true,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
  }
}


/**
 * seek media position
 * @param {Number} pos A number to indicate percent
 * @this seekMedia
 */
function seekMedia(pos) {
  progressFlag = 0;
  var request = new chrome.cast.media.SeekRequest();
  request.currentTime = pos * currentMediaSession.media.duration / 100;
  currentMediaSession.seek(request,
    onSeekSuccess.bind(this, 'media seek done'),
    onError);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 */
function onSeekSuccess(info) {
  appendMessage(info);
  setTimeout(function() {progressFlag = 1},PROGRESS_BAR_UPDATE_DELAY);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 */
function mediaCommandSuccessCallback(info) {
  appendMessage(info);
}

/**
 * append message to debug message window
 * @param {string} message A message string
 */
function appendMessage(message) {
  console.log(message)
}
function onError(e) {
  appendMessage('Error' + e);
}

function onSuccess(message) {
  appendMessage(message)
}

function onStopAppSuccess() {
  appendMessage('Session stopped');
}
