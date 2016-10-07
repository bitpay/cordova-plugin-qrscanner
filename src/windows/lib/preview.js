  const urlutil = require('cordova/urlutil');

  let preview;

  function create() {

    if (preview) {
      throw 'preview already exists';
    }

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

    preview = {};

    preview.setVideoUrl = function (videoUrl) {
      capturePreview.src = videoUrl;
    }

    preview.setMirroring = function (isMirrored) {
      if (isMirrored) {
        capturePreviewFrame.style.transform = 'scaleY(-1)';
      } else {
        capturePreviewFrame.style.transform = '';
      }
    }

    preview.show = function () {
        if (!capturePreviewFrame) {
          return;
        }

        capturePreview.play();
        capturePreviewFrame.style.visibility = 'visible';
      }

    preview.hide = function () {
        if (!capturePreviewFrame) {
          return;
        }

        capturePreviewFrame.style.visibility = 'hidden';
        capturePreview.pause();
      }

    preview.pause = function() {
        capturePreview.pause();
      }

    preview.resume = function() {
        capturePreview.play();
    }

    preview.destroy = function () {
        if (!preview) {
          return;
        }

        preview = null;
        document.head.removeChild(capturePreviewFrameStyle);
        document.body.removeChild(capturePreviewFrame);
    }

    return preview;

    }

  module.exports = {
    create: create
  };
