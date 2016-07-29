

  function calcStatus(){
    return {
      authorized: '0'
      denied: '0',
      restricted: '0',
      prepared: '0'
      scanning: '0'
      previewing: '0'
      showing: '0'
      lightEnabled: '0',
      canOpenSettings: '0',
      canEnableLight: '0',
      canChangeCamera: '0'
      currentCamera: '0'
  };
}
//<!--Begin public API-->
prepare:function(successCallback, errorCallback, strInput){
  successCallback("woohoo");
}

show:function(successCallback, errorCallback, strInput){
  successCallback("woohoo");
}

hide:function(successCallback, errorCallback, strInput){

}

scan:function(successCallback, errorCallback, strInput){

}

cancelScan:function(successCallback, errorCallback, strInput){

}

pausePreview:function(successCallback, errorCallback, strInput){

}

resumePreview:function(successCallback, errorCallback, strInput){

}

enableLight:function(successCallback, errorCallback, strInput){
  errorCallback(3);
}

disableLight:function(successCallback, errorCallback, strInput){

}

useFrontCamera:function(successCallback, errorCallback, strInput){

}

useBackCamera:function(successCallback, errorCallback, strInput){

}

openSettings:function(successCallback, errorCallback, strInput){
  Windows.System.Launcher.LaunchUriAsync(new Uri("ms-settings-wifi"));
}

getStatus:function(successCallback, errorCallback, strInput){
  successCallback(calcStatus());
}

module.exports = {
    prepare: prepare,
    show: show,
    hide: hide,
    scan: scan,
    cancelScan: cancelScan,
    pausePreview: pausePreview,
    resumePreview: resumePreview,
    enableLight: enableLight,
    disableLight: disableLight,
    useCamera: useCamera,
    openSettings: openSettings,
    getStatus: getStatus,
    destroy: destroy
};

require('cordova/exec/proxy').add('QRScanner', module.exports);
