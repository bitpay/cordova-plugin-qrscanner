const urlutil = require('cordova/urlutil');

let _ = {
};

function initialize() {

  let capturePreviewFrameStyle = document.createElement('link');
  capturePreviewFrameStyle.rel = "stylesheet";
  capturePreviewFrameStyle.type = "text/css";
  capturePreviewFrameStyle.href = urlutil.makeAbsolute("/www/css/plugin-qrscanner-preview.css");
  document.head.appendChild(capturePreviewFrameStyle);

  let capturePreviewFrame = document.createElement('div');
  capturePreviewFrame.className = "barcode-scanner-wrap";
  capturePreviewFrame.style.zIndex = -100;
  capturePreviewFrame.style.visibility = 'hidden';

  let capturePreview = document.createElement("video");
  capturePreview.className = "barcode-scanner-preview";
  capturePreview.msZoom = true;
  capturePreview.style.height = 'calc(100%)';
  capturePreview.style.top = 'calc(50%)';

  capturePreviewFrame.appendChild(capturePreview);
  document.body.appendChild(capturePreviewFrame);

  _.preview = {
    capturePreviewFrameStyle: capturePreviewFrameStyle,
    capturePreviewFrame: capturePreviewFrame,
    capturePreview: capturePreview
  };

}

function ensurePreviewInitialized() {
  if (!_.preview) initialize();
}

exports.setVideoUrl = function (videoUrl) {
  ensurePreviewInitialized();
  _.preview.capturePreview.src = videoUrl;
}

exports.show = function () {
  ensurePreviewInitialized();
  if (!_.preview.capturePreviewFrame) {
    return;
  }

  _.preview.capturePreview.play();
  _.preview.capturePreviewFrame.style.visibility = 'visible';
}

exports.hide = function () {
  ensurePreviewInitialized();
  if (!_.preview.capturePreviewFrame) {
    return;
  }

  _.preview.capturePreviewFrame.style.visibility = 'hidden';
  _.preview.capturePreview.pause();
}

exports.pause = function () {
  ensurePreviewInitialized();
  _.preview.capturePreview.pause();
}

exports.resume = function () {
  ensurePreviewInitialized();
  _.preview.capturePreview.play();
}

exports.isPlaying = function () {
  if (!_.preview) return false;
  return !_.preview.capturePreview.paused;
}

exports.destroy = function () {
  if (_.preview) {
    document.head.removeChild(_.preview.capturePreviewFrameStyle);
    document.body.removeChild(_.preview.capturePreviewFrame);
    delete _.preview;
  }
}

module.exports = exports;