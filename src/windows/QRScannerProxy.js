

    function calcStatus(){
     return {
       authorized: '0',
       denied: '0',
       restricted: '0',
       prepared: '0',
       scanning: '0',
       previewing: '0',
       showing: '0',
       lightEnabled: '0',
       canOpenSettings: '0',
       canEnableLight: '0',
       canChangeCamera: '0',
       currentCamera: '0'
     };
    }



  //<!--Begin Public API-->
    function show(successCallback, errorCallback, strInput){
      successCallback(calcStatus());
    }

    function prepare(successCallback, errorCallback, strInput){
      cordova.plugins.barcodeScanner.scan(
        function(result){
          successCallback(calcStatus());
        },
        function(error){
          errorCallback("");
        });
    }

    function openSettings(successCallback, errorCallback, strInput){
      var settingsUri = new Windows.Foundation.Uri("ms-settings:");
      Windows.System.Launcher.launchUriAsync(settingsUri);
    }

    function getStatus(successCallback, errorCallback, strInput){
      successCallback(calcStatus());
    }

    function enableLight(successCallback, errorCallback, strInput){
      successCallback(calcStatus());
    }

    function disableLight(successCallback, errorCallback, strInput){
      successCallback(calcStatus());
    }


module.exports = {
  show: show,
  prepare: prepare,
  openSettings: openSettings,
  getStatus: getStatus,
  enableLight: enableLight,
  disableLight: disableLight
};

require('cordova/exec/proxy').add('QRScanner', module.exports);
