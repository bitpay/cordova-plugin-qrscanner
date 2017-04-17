const preview = require('./preview');
const barcodeReader = new QRReader.Reader();
const VideoCapture = QRReader.VideoCapture;
const Promise = WinJS.Promise;

const errorTypes = {
  UNEXPECTED_ERROR: 0,
  CAMERA_ACESS_DENIED: 1,
  CAMERA_ACCESS_RESTRICTED: 2,
  BACK_CAMERA_UNAVAILABLE: 3,
  FRONT_CAMERA_UNAVAILABLE: 4,
  CAMERA_UNAVAILABLE: 5,
  SCAN_CANCELED: 6,
  LIGHT_UNAVAILABLE: 7,
  OPEN_SETTINGS_UNAVAILABLE: 8
};

const cameraTypes = {
  BACK: 0,
  FRONT: 1
};

const defaultStatusFlags = {
  prepared: false,
  authorized: false,
  denied: false,
  restricted: false,
  scanning: false,
  previewing: false,
  showing: false,
  lightEnabled: false,
  canOpenSettings: false,
  canEnableLight: false,
  canChangeCamera: false,
  currentCamera: cameraTypes.BACK
};

let statusFlags;
let currentVideoCapture;

function resetStatusFlags() {

  statusFlags = {};
  for (let property in defaultStatusFlags) {
    statusFlags[property] = defaultStatusFlags[property];
  }
  return statusFlags;
}

function reset() {
  document.body.removeEventListener('click', onPreviewClick);
  preview.destroy();
  if (currentVideoCapture) currentVideoCapture.destroy();
  currentVideoCapture = null;
  availableCameras = null;
  resetStatusFlags();
}

function generateStatusResponse() {
  let response = {};
  for (let property in statusFlags) {
    response[property] = statusFlags[property] ? '1' : '0';
  }
  return Promise.wrap(response);
}

function init() {
  if (!statusFlags.prepared) {
    document.body.addEventListener('click', onPreviewClick);
    return VideoCapture.getCamerasAsync().then(function (cameras) {
      if (cameras.back && cameras.front) {
        statusFlags.canChangeCamera = true;
      }
      if (!cameras.back && !cameras.front) {
        return Promise.wrapError(errorTypes.CAMERA_UNAVAILABLE);
      }
      availableCameras = cameras;
      return initCamera().then(function () {
        statusFlags.prepared = true;
        statusFlags.authorized = true;
      });
    });
  }
  return Promise.wrap();
}

function initCamera(cameraType) {
  if (cameraType === cameraTypes.BACK && !availableCameras.back) {
    return Promise.wrapError(errorTypes.BACK_CAMERA_UNAVAILABLE);
  }
  if (cameraType === cameraTypes.FRONT && !availableCameras.front) {
    return Promise.wrapError(errorTypes.FRONT_CAMERA_UNAVAILABLE);
  }
  if (!cameraType) {
    if (availableCameras.front) {
      cameraType = cameraTypes.FRONT;
    }
    if (availableCameras.back) {
      cameraType = cameraTypes.BACK;
    }
  }
  preview.setVideoUrl('');
  return VideoCapture.createAsync(cameraType ? availableCameras.front : availableCameras.back).then(function (videoCapture) {
    currentVideoCapture = videoCapture;

    let videoUrl = URL.createObjectURL(currentVideoCapture.capture);

    if (statusFlags.showing) {
      preview.pause();
    }
    preview.setVideoUrl(videoUrl);
    if (statusFlags.showing) {
      preview.resume();
    }
    barcodeReader.setCapture(currentVideoCapture.capture);
    statusFlags.canEnableLight = currentVideoCapture.canEnableLight;
    statusFlags.currentCamera = cameraType;

  }, function (error) {
    const ACCESS_DENIED = -2147024891;
    if (error.number === ACCESS_DENIED) {
      statusFlags.denied = true;
      return Promise.wrapError(errorTypes.CAMERA_ACESS_DENIED);
    }
    return Promise.wrapError(errorTypes.UNEXPECTED_ERROR);
  });
}

function onPreviewClick(e) {
  if (statusFlags.showing && currentVideoCapture) {
    currentVideoCapture.focus();
  }
}

let qrScanner = {};

qrScanner.getStatus = function () {
  return init().then(generateStatusResponse, generateStatusResponse);
}

qrScanner.prepare = function () {
  return init().then(generateStatusResponse);
}

qrScanner.useCamera = function (inputStr) {
  return init().then(function () {
    let cameraType = parseInt(inputStr);
    return initCamera(cameraType).then(function () {
      return generateStatusResponse();
    });
  });
}

qrScanner.show = function () {
  return init().then(function () {
    preview.show();
    statusFlags.showing = true;
    statusFlags.previewing = preview.isPlaying();
    return generateStatusResponse();
  });
}

qrScanner.hide = function () {
  return init().then(function () {
    preview.hide();
    statusFlags.showing = false;
    statusFlags.previewing = false;
    return generateStatusResponse();
  });
}

let resolveLastScanPromise, rejectLastScanPromise;

qrScanner.scan = function () {

  if (statusFlags.scanning) {
    rejectLastScanPromise(errorTypes.SCAN_CANCELED);

    let lastScanPromise = new Promise(function (resolve, reject) {
      resolveLastScanPromise = resolve;
      rejectLastScanPromise = reject;
    });

    return lastScanPromise;

  }

  let lastScanPromise = new Promise(function (resolve, reject) {
    resolveLastScanPromise = resolve;
    rejectLastScanPromise = reject;
  });

  init().then(function () {
    barcodeReader.readCode().then(function (result) {
      if (!result) {
        return rejectLastScanPromise(errorTypes.SCAN_CANCELED);
      }
      resolveLastScanPromise(result.text);
      statusFlags.scanning = false;
    });
  }, function (error) {
    statusFlags.scanning = false;
    return rejectLastScanPromise(error);
  });

  statusFlags.scanning = true;

  return lastScanPromise;

}

qrScanner.cancelScan = function () {
  if (!statusFlags.scanning) return generateStatusResponse();
  statusFlags.scanning = false;
  barcodeReader.stop();
  return generateStatusResponse();
}

qrScanner.pausePreview = function () {
  preview.pause();
  statusFlags.previewing = false;
  return generateStatusResponse();
}

qrScanner.resumePreview = function () {
  preview.resume();
  statusFlags.previewing = statusFlags.showing;
  return generateStatusResponse();
}

//on Lumia devices, light functionality may be disabled while plugged in
qrScanner.enableLight = function () {
  return init().then(function () {
    if (statusFlags.lightEnabled) {
      return generateStatusResponse();
    }

    statusFlags.lightEnabled = currentVideoCapture.enableLight();

    if (!statusFlags.lightEnabled) {
      return Promise.wrapError(errorTypes.LIGHT_UNAVAILABLE);
    }

    return generateStatusResponse();
  });
}

qrScanner.disableLight = function () {

  if (statusFlags.lightEnabled) {
    currentVideoCapture.disableLight();
  }

  return generateStatusResponse();

}

qrScanner.openSettings = function () {
  return Promise.wrapError(errorTypes.OPEN_SETTINGS_UNAVAILABLE);
}

qrScanner.destroy = function () {
  reset();
  return generateStatusResponse();
}

reset();

function wrapPromise(fn) {
  return function (successCallback, errorCallback, strInput) {
    fn.call(window, strInput).then(successCallback, function (errorCode) {
      errorCallback(errorCode.toString() || '0');
    });
  }
}

for (let property in qrScanner) {
  if (typeof qrScanner[property] == "function") {
    exports[property] = wrapPromise(qrScanner[property])
  }
}

module.exports = exports;

cordova.commandProxy.add("QRScanner", exports);