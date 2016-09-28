function QRScanner() {
  var createQRScannerAdapter = require('../../common/src/createQRScannerAdapter.js');
  var createQRScannerInternal = require('./createQRScannerInternal.js');

  var internal = createQRScannerInternal();
  var functionList = {
      prepare: internal.prepare,
      show: internal.show,
      hide: internal.hide,
      scan: internal.scan,
      cancelScan: internal.cancelScan,
      pausePreview: internal.pausePreview,
      resumePreview: internal.resumePreview,
      enableLight: internal.enableLight,
      disableLight: internal.disableLight,
      useCamera: internal.useCamera,
      openSettings: internal.openSettings,
      getStatus: internal.getStatus,
      destroy: internal.destroy
  };

  // shim cordova's functionality for library usage
  var shimCordova = {
    exec: function(successCallback, errorCallback, className, functionName, inputArray){
      if(className !== 'QRScanner' || !functionList[functionName]){
        return errorCallback(0);
      }
      if(inputArray){
        functionList[functionName](successCallback, errorCallback, inputArray);
      } else {
        functionList[functionName](successCallback, errorCallback);
      }
    }
  };

  var adapter = createQRScannerAdapter(shimCordova);
  return adapter;
}

module.exports = new QRScanner();
