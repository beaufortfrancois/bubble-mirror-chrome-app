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
  var windowOptions = {
    id: 'bubble',
    alphaEnabled: true,
    alwaysOnTop: true,
    frame: 'none',
    resizable: false,
    innerBounds: {
      width: DEFAULT_BUBBLE_SIZE,
      height: DEFAULT_BUBBLE_SIZE,
    },
  };
  chrome.app.window.create('bubble.html', windowOptions, function(appWindow) {
    captureVideo(appWindow, videoSourceId);
    appWindow.onClosed.addListener(function() {
      window.close();
    })
  });
}

function captureVideo(appWindow, videoSourceId) {
  var constraints = {video: {optional: [{sourceId: videoSourceId}]}};
  navigator.getUserMedia(constraints, function(stream) {
    var video = appWindow.contentWindow.document.querySelector('video');
    video.src = URL.createObjectURL(stream);
  }, function() {
    chrome.notifications.create('id', {
      iconUrl: chrome.runtime.getURL('assets/icon_128.png'),
      message: 'Bubble cannot get video source.... Please try again.',
      title: 'Saperlipopette!',
      type: 'basic',
    }, function() {
      appWindow.close();
    });
  });
}

function resizeBubble(appWindow, size) {
  appWindow.resizeTo(size, size);
  var video = appWindow.contentWindow.document.querySelector('video');
  video.style.width = video.style.height = size + 'px';
  video.style.borderRadius = Math.round(size / 2) + 'px';
}

function onContextMenuClicked(event) {
  var appWindow = chrome.app.window.get('bubble');
  if (event.menuItemId === 'useBigBubble') {
    resizeBubble(appWindow, event.checked ? DEFAULT_BUBBLE_SIZE * 2 : DEFAULT_BUBBLE_SIZE);
  } else {
    captureVideo(appWindow, event.menuItemId);
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