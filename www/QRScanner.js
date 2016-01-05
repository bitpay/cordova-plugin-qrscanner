// The native implementations should return their status as ['string':'string']
// dictionaries. Boolean values are encoded to '0' and '1', respectively.
function stringToBool(string) {
  switch(string){
    case '1':
      return true;
    case '0':
      return false;
    default:
      throw new Error('QRScanner plugin returned an invalid boolean value.');
  }
}

// Converts the returned ['string':'string'] dictionary to a status object.
function convertStatus(statusDictionary) {
  return {
    authorized: stringToBool(statusDictionary.authorized),
    prepared: stringToBool(statusDictionary.prepared),
    scanning: stringToBool(statusDictionary.scanning),
    previewing: stringToBool(statusDictionary.previewing),
    webviewBackgroundIsTransparent: stringToBool(statusDictionary.webviewBackgroundIsTransparent),
    lightEnabled: stringToBool(statusDictionary.lightEnabled),
    canOpenSettings: stringToBool(statusDictionary.canOpenSettings),
    canEnableLight: stringToBool(statusDictionary.canEnableLight),
    currentCamera: parseInt(statusDictionary.currentCamera)
  };
}

// Simple utility method to ensure the background is transparent. Used by the
// plugin to force re-rendering immediately when the native webview background
// is made transparent.
function clearBackground(domNode) {
  while (domNode) {
    if (domNode.style) {
      domNode.style.backgroundColor = 'transparent';
      domNode.style.backgroundImage = '';
    }
    domNode = domNode.parentNode;
  }
}

function errorCallback(callback){
  return function(error){
    callback(error);
  };
}

function successCallback(callback){
  if(!callback){
    throw new Error('No callback provided.');
  }
  return function(statusDict){
    callback(null, convertStatus(statusDict));
  };
}

function doneCallback(callback, clear){
  if(!callback){
    return null;
  }
  return function(statusDict){
    if(clear){
      clearBackground(document.body);
    }
    callback(convertStatus(statusDict));
  };
}

var QRScanner = {
  prepare: function(callback){
    cordova.exec(successCallback(callback), errorCallback(callback), 'QRScanner', 'prepare');
  },
  destroy: function(callback){
    cordova.exec(doneCallback(callback, true), null, 'QRScanner', 'destroy');
  },
  scan: function(callback){
    var success = function(status) {
      callback(null, status);
    };
    cordova.exec(success, errorCallback(callback), 'QRScanner', 'scan');
  },
  cancelScan: function(callback){
    cordova.exec(doneCallback(callback), null, 'QRScanner', 'cancelScan');
  },
  show: function(callback){
    cordova.exec(doneCallback(callback, true), null, 'QRScanner', 'show');
  },
  hide: function(callback){
    cordova.exec(doneCallback(callback, true), null, 'QRScanner', 'hide');
  },
  pausePreview: function(callback){
    cordova.exec(doneCallback(callback), null, 'QRScanner', 'pausePreview');
  },
  resumePreview: function(callback){
    cordova.exec(doneCallback(callback), null, 'QRScanner', 'resumePreview');
  },
  enableLight: function(callback){
    cordova.exec(successCallback(callback), errorCallback(callback), 'QRScanner', 'enableLight');
  },
  disableLight: function(callback){
    cordova.exec(successCallback(callback), errorCallback(callback), 'QRScanner', 'disableLight');
  },
  useCamera: function(index, callback){
    cordova.exec(successCallback(callback), errorCallback(callback), 'QRScanner', 'useCamera', [index]);
  },
  useFrontCamera: function(callback){
    var frontCamera = 1;
    if(callback){
      this.useCamera(frontCamera, callback);
    } else {
      cordova.exec(null, null, 'QRScanner', 'useCamera', [frontCamera]);
    }
  },
  useBackCamera: function(callback){
    var backCamera = 1;
    if(callback){
      this.useCamera(backCamera, callback);
    } else {
      cordova.exec(null, null, 'QRScanner', 'useCamera', [backCamera]);
    }
  },
  openSettings: function(callback){
    if(callback){
      cordova.exec(successCallback(callback), errorCallback(callback), 'QRScanner', 'openSettings');
    } else{
      cordova.exec(null, null, 'QRScanner', 'openSettings');
    }
  },
  getStatus: function(callback){
    cordova.exec(doneCallback(callback), null, 'QRScanner', 'getStatus');
  }
};

module.exports = QRScanner;
