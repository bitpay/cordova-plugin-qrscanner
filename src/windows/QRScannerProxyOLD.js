



  //<!--Begin Public API-->
    function show(successCallback, errorCallback, strInput){
      if(!showing){
        var elmts = document.getElementsByClassName("barcode-scanner-wrap");
        if(elmts){
          var preview = elmts[0];
          preview.style.visibility = 'visible';
          showing = true;
        }
      }
      successCallback(calcStatus());
    }

    function hide(successCallback, errorCallback, strInput){
      if(showing){
        var elmts = document.getElementsByClassName("barcode-scanner-wrap");
        if(elmts){
          var preview = elmts[0];
          preview.style.visibility = 'hidden';
          showing = false;
        }
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
        showing = true;
        hide();
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
