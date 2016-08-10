  var prepared = false,
      authorized = false,
      denied = false,
      restricted = false,
      scanning = false,
      previewing = false,
      showing = false,
      lightEnabled = false,
      canOpenSettings = false,
      canEnableLight = false,
      canChangeCamera = false;

    function calcStatus(){
     return {
       authorized: authorized? '1' : '0',
       denied: denied? '1' : '0',
       restricted: restricted? '1' : '0',
       prepared: prepared? '1' : '0',
       scanning: scanning? '1' : '0',
       previewing: previewing? '1' : '0',
       showing: showing? '1' : '0',
       lightEnabled: lightEnabled? '1' : '0',
       canOpenSettings: canOpenSettings? '1' : '0',
       canEnableLight: canEnableLight? '1' : '0',
       canChangeCamera: canChangeCamera? '1' : '0',
       currentCamera: '0'
     };
    }



  //<!--Begin Public API-->
    function show(successCallback, errorCallback, strInput){
      if(!showing){
        var elmts = document.getElementsByClassName("barcode-scanner-wrap");
        if(elmts){
          var preview = elmts[0];
        }
        preview.style.visibility = 'visible';
        showing = true;
      }
      successCallback(calcStatus());
    }

    function hide(successCallback, errorCallback, strInput){
      if(showing){
        var elmts = document.getElementsByClassName("barcode-scanner-wrap");
        if(elmts){
          var preview = elmts[0];
        }
        preview.style.visibility = 'hidden';
        showing = false;
      }
    }

    function prepare(successCallback, errorCallback, strInput){
      if(!prepared){
      cordova.plugins.barcodeScanner.preview(
        function(result){
          successCallback(calcStatus());
        },
        function(error){
          errorCallback("");
        });
        hide();
      }
      prepared = true;
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
  hide: hide,
  prepare: prepare,
  openSettings: openSettings,
  getStatus: getStatus,
  enableLight: enableLight,
  disableLight: disableLight
};

require('cordova/exec/proxy').add('QRScanner', module.exports);
