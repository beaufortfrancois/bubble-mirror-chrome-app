var DEFAULT_BUBBLE_SIZE = 240;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

function gotSources(mediaSources) {
  var videoSources = mediaSources.filter(function(source) { return source.kind === 'video' });
  for (var i = 0; i < videoSources.length; i++) {
    var contextOptions = {
      contexts: ['launcher'],
      type: 'radio',
      id: videoSources[i].id,
      title: videoSources[i].label,
      parentId: 'videoSource'
    };
    chrome.contextMenus.create(contextOptions);
    if (i === 0) {
      createBubble(contextOptions.id);
    }
  }
}

function createBubble(videoSourceId) {
  console.log('createBubble');
  var windowOptions = {
    id: 'bubble',
    alphaEnabled: true,
    alwaysOnTop: true,
    frame: 'none',
    hidden: true,
    resizable: false,
  };
  chrome.app.window.create('bubble.html', windowOptions, function(appWindow) {
    showBubble(appWindow, videoSourceId, onBubbleCreated);
    appWindow.onClosed.addListener(function() {
      window.close();
    })
  });
}

function showBubble(appWindow, videoSourceId, callback) {
  var constraints = {video: {optional: [{sourceId: videoSourceId}]}};
  navigator.getUserMedia(constraints, function(stream) {
    var video = appWindow.contentWindow.document.querySelector('video');
    video.src = URL.createObjectURL(stream);
    console.log('show');
    callback(appWindow);
  }, function() {});
}

function onBubbleCreated(appWindow) {
  var video = appWindow.contentWindow.document.querySelector('video');
  video.addEventListener('loadeddata', function() {
    resizeBubble(appWindow, DEFAULT_BUBBLE_SIZE);
    appWindow.show();
  });
}

function resizeBubble(appWindow, size) {
  console.log('resizeBubble', size);
  appWindow.resizeTo(size, size);
  var video = appWindow.contentWindow.document.querySelector('video');
  video.width = video.height = size;
  video.style.borderRadius = Math.round(size / 2) + 'px';
}

function onContextMenuClicked(event) {
  var appWindow = chrome.app.window.get('bubble');
  console.log('onContextMenuClicked');
  if (event.menuItemId === 'useBigBubble') {
    resizeBubble(appWindow, event.checked ? DEFAULT_BUBBLE_SIZE * 2 : DEFAULT_BUBBLE_SIZE);
  } else {
    showBubble(appWindow, event.menuItemId, function() {});
  }
};

chrome.contextMenus.onClicked.addListener(onContextMenuClicked);

chrome.app.runtime.onLaunched.addListener(function(launchData) {
  MediaStreamTrack.getSources(gotSources);
});

chrome.runtime.onInstalled.addListener(function() {
  var bubbleSizeContextOptions = {
    contexts: ['launcher'],
    type: 'checkbox',
    checked: false,
    title: 'Use big bubbles',
    id: 'useBigBubble'
  }
  var deviceContextMenuOptions = {
    contexts: ['launcher'],
    title: 'Media Source',
    id: 'videoSource'
  }
  chrome.contextMenus.create(bubbleSizeContextOptions);
  chrome.contextMenus.create(deviceContextMenuOptions);
});