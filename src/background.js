var DEFAULT_BUBBLE_SIZE = 240;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

function gotSources(mediaSources) {
  var videoSources = mediaSources.filter(function(source) { return source.kind === 'video' });

  var deviceContextMenuOptions = {
    contexts: ['launcher'],
    title: 'Source',
    id: 'videoSource'
  }
  chrome.contextMenus.create(deviceContextMenuOptions);

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
    appWindow.contentWindow.document.addEventListener('DOMContentLoaded', function() {
      initContextMenus(appWindow);
      captureVideo(appWindow, videoSourceId);
      resizeBubble(appWindow, appWindow.innerBounds.width);
    });
    appWindow.onClosed.addListener(function() {
      chrome.contextMenus.removeAll(function() {
        window.close();
      });
    });
  });
}

function captureVideo(appWindow, videoSourceId) {
  appWindow.hide();
  var constraints = { video: { optional: [{ sourceId: videoSourceId }]}};
  navigator.getUserMedia(constraints, function(stream) {
    var video = appWindow.contentWindow.document.querySelector('video');
    video.addEventListener('canplay', function() {
      appWindow.show();
    });
    video.src = URL.createObjectURL(stream);
  }, function() {
    chrome.notifications.create({
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
  if (event.menuItemId === 'smallBubble') {
    resizeBubble(appWindow, event.checked ? DEFAULT_BUBBLE_SIZE : DEFAULT_BUBBLE_SIZE * 2);
  } else {
    captureVideo(appWindow, event.menuItemId);
  }
};

function initContextMenus(appWindow) {
  var bubbleSizeContextOptions = {
    contexts: ['launcher'],
    type: 'checkbox',
    checked: (appWindow.innerBounds.width === DEFAULT_BUBBLE_SIZE),
    title: 'Small Bubbles',
    id: 'smallBubble'
  }
  chrome.contextMenus.create(bubbleSizeContextOptions);
};

chrome.contextMenus.onClicked.addListener(onContextMenuClicked);

chrome.app.runtime.onLaunched.addListener(function() {
  MediaStreamTrack.getSources(gotSources);
});