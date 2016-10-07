require('webrtc-adapter');
var workerScript = require("raw-loader!../worker.min.js");

module.exports = function(){

  var ELEMENTS = {
    preview: 'cordova-plugin-qrscanner-video-preview',
    still: 'cordova-plugin-qrscanner-still'
  };
  var ZINDEXES = {
    preview: -100,
    still: -99
  };
  var backCamera = null;
  var frontCamera = null;
  var currentCamera = 0;
  var activeMediaStream = null;
  var scanning = false;
  var previewing = false;
  var scanWorker = null;
  var thisScanCycle = null;
  var nextScan = null;
  var cancelNextScan = null;

  // standard screen widths/heights, from 4k down to 320x240
  // widths and heights are each tested separately to account for screen rotation
  var standardWidthsAndHeights = [
    5120, 4096, 3840, 3440, 3200, 3072, 3000, 2880, 2800, 2736, 2732, 2560,
    2538, 2400, 2304, 2160, 2100, 2048, 2000, 1920, 1856, 1824, 1800, 1792,
    1776, 1728, 1700, 1680, 1600, 1536, 1440, 1400, 1392, 1366, 1344, 1334,
    1280, 1200, 1152, 1136, 1120, 1080, 1050, 1024, 1000, 960, 900, 854, 848,
    832, 800, 768, 750, 720, 640, 624, 600, 576, 544, 540, 512, 480, 320, 240
  ];

  var facingModes = [
    'environment',
    'user'
  ];

  //utils
  function killStream(mediaStream){
    mediaStream.getTracks().forEach(function(track){
      track.stop();
    });
  }

  // For performance, we test best-to-worst constraints. Once we find a match,
  // we move to the next test. Since `ConstraintNotSatisfiedError`s are thrown
  // much faster than streams can be started and stopped, the scan is much
  // faster, even though it may iterate through more constraint objects.
  function getCameraSpecsById(deviceId){

    // return a getUserMedia Constraints
    function getConstraintObj(deviceId, facingMode, width, height){
      var obj = { audio: false, video: {} };
      obj.video.deviceId = {exact: deviceId};
      if(facingMode) {
        obj.video.facingMode = {exact: facingMode};
      }
      if(width) {
        obj.video.width = {exact: width};
      }
      if(height) {
        obj.video.height = {exact: height};
      }
      return obj;
    }

    var facingModeConstraints = facingModes.map(function(mode){
    	return getConstraintObj(deviceId, mode);
    });
    var widthConstraints = standardWidthsAndHeights.map(function(width){
    	return getConstraintObj(deviceId, null, width);
    });
    var heightConstraints = standardWidthsAndHeights.map(function(height){
    	return getConstraintObj(deviceId, null, null, height);
    });

    // create a promise which tries to resolve the best constraints for this deviceId
    // rather than reject, failures return a value of `null`
    function getFirstResolvingConstraint(constraintsBestToWorst){
      return new Promise(function(resolveBestConstraints){
        // build a chain of promises which either resolves or continues searching
        return constraintsBestToWorst.reduce(function(chain, next){
          return chain.then(function(searchState){
            if(searchState.found){
              // The best working constraint was found. Skip further tests.
              return searchState;
            } else {
              searchState.nextConstraint = next;
              return window.navigator.mediaDevices.getUserMedia(searchState.nextConstraint).then(function(mediaStream){
                // We found the first working constraint object, now we can stop
                // the stream and short-circuit the search.
                killStream(mediaStream);
                searchState.found = true;
                return searchState;
              }, function(){
                // didn't get a media stream. The search continues:
                return searchState;
              });
            }
          });
        }, Promise.resolve({
          // kick off the search:
          found: false,
          nextConstraint: {}
        })).then(function(searchState){
          if(searchState.found){
            resolveBestConstraints(searchState.nextConstraint);
          } else {
            resolveBestConstraints(null);
          }
        });
      });
    }

    return getFirstResolvingConstraint(facingModeConstraints).then(function(facingModeSpecs){
      return getFirstResolvingConstraint(widthConstraints).then(function(widthSpecs){
        return getFirstResolvingConstraint(heightConstraints).then(function(heightSpecs){
          return {
            deviceId: deviceId,
            facingMode: facingModeSpecs === null ? null : facingModeSpecs.video.facingMode.exact,
            width: widthSpecs === null ? null : widthSpecs.video.width.exact,
            height: heightSpecs === null ? null : heightSpecs.video.height.exact
          };
        });
      });
    });
  }

  function chooseCameras(){
    var devices = window.navigator.mediaDevices.enumerateDevices();
    return devices.then(function(mediaDeviceInfoList){
      var videoDeviceIds = mediaDeviceInfoList.filter(function(elem){
        return elem.kind === 'videoinput';
      }).map(function(elem){
        return elem.deviceId;
      });
      return videoDeviceIds;
    }).then(function(videoDeviceIds){
      // there is no standardized way for us to get the specs of each camera
      // (due to concerns over user fingerprinting), so we're forced to
      // iteratively test each camera for it's capabilities
      var searches = [];
      videoDeviceIds.forEach(function(id){
        searches.push(getCameraSpecsById(id));
      });
      return Promise.all(searches);
    }).then(function(cameraSpecsArray){
      return cameraSpecsArray.filter(function(camera){
        // filter out any cameras where width and height could not be captured
        if(camera !== null && camera.width !== null && camera.height !== null){
          return true;
        }
      }).sort(function(a, b){
        // sort cameras from highest resolution (by width) to lowest
        return b.width - a.width;
      });
    }).then(function(bestToWorstCameras){
      var backCamera = null,
          frontCamera = null;
      // choose backCamera
      for(var i = 0; i < bestToWorstCameras.length; i++){
        if (bestToWorstCameras[i].facingMode === 'environment'){
          backCamera = bestToWorstCameras[i];
          // (shouldn't be used for frontCamera)
          bestToWorstCameras.splice(i, 1);
          break;
        }
      }
      // if no back-facing cameras were found, choose the highest resolution
      if(backCamera === null){
        if(bestToWorstCameras.length > 0){
          backCamera = bestToWorstCameras[0];
          // (shouldn't be used for frontCamera)
          bestToWorstCameras.splice(0, 1);
        } else {
          // user doesn't have any available cameras
          backCamera = false;
        }
      }
      if(bestToWorstCameras.length > 0){
        // frontCamera should simply be the next-best resolution camera
        frontCamera = bestToWorstCameras[0];
      } else {
        // user doesn't have any more cameras
        frontCamera = false;
      }
      return {
        backCamera: backCamera,
        frontCamera: frontCamera
      };
    });
  }

  function mediaStreamIsActive(){
    return activeMediaStream !== null;
  }

  function killActiveMediaStream(){
    killStream(activeMediaStream);
    activeMediaStream = null;
  }

  function getVideoPreview(){
    return document.getElementById(ELEMENTS.preview);
  }

  function getImg(){
    return document.getElementById(ELEMENTS.still);
  }

  function getCurrentCameraIndex(){
    return currentCamera;
  }

  function getCurrentCamera(){
    return currentCamera === 1 ? frontCamera : backCamera;
  }

  function bringStillToFront(){
    var img = getImg();
    if(img){
      img.style.visibility = 'visible';
      previewing = false;
    }
  }

  function bringPreviewToFront(){
    var img = getImg();
    if(img){
      img.style.visibility = 'hidden';
      previewing = true;
    }
  }

  function isInitialized(){
    return backCamera !== null;
  }

  function canChangeCamera(){
    return !!backCamera && !!frontCamera;
  }

  function calcStatus(){
    return {
      // !authorized means the user either has no camera or has denied access.
      // This would leave a value of `null` before prepare(), and `false` after.
      authorized: (backCamera !== null && backCamera !== false)? '1': '0',
      // No applicable API
      denied: '0',
      // No applicable API
      restricted: '0',
      prepared: isInitialized() ? '1' : '0',
      scanning: scanning? '1' : '0',
      previewing: previewing? '1' : '0',
      // We leave this true after prepare() to match the mobile experience as
      // closely as possible. (Without additional covering, the preview will
      // always be visible to the user).
      showing: getVideoPreview()? '1' : '0',
      // No applicable API
      lightEnabled: '0',
      // No applicable API
      canOpenSettings: '0',
      // No applicable API
      canEnableLight: '0',
      canChangeCamera: canChangeCamera() ? '1' : '0',
      currentCamera: currentCamera.toString()
    };
  }

  function startCamera(success, error){
      var currentCameraIndex = getCurrentCameraIndex();
      var currentCamera = getCurrentCamera();
      window.navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: {exact: currentCamera.deviceId},
          width: {ideal: currentCamera.width},
          height: {ideal: currentCamera.height}
        }
      }).then(function(mediaStream){
        activeMediaStream = mediaStream;
        var video = getVideoPreview();
        video.src = URL.createObjectURL(mediaStream);
        success(calcStatus());
      }, function(err){
        // something bad happened
        err = null;
        var code = currentCameraIndex? 4 : 3;
        error(code); // FRONT_CAMERA_UNAVAILABLE : BACK_CAMERA_UNAVAILABLE
      });
  }

  function getTempCanvasAndContext(videoElement){
    var tempCanvas = document.createElement('canvas');
    var camera = getCurrentCamera();
    tempCanvas.height = camera.height;
    tempCanvas.width = camera.width;
    var tempCanvasContext = tempCanvas.getContext('2d');
    tempCanvasContext.drawImage(videoElement, 0, 0, camera.width, camera.height);
    return {
      canvas: tempCanvas,
      context: tempCanvasContext
    };
  }

  function getCurrentImageData(videoElement){
    var snapshot = getTempCanvasAndContext(videoElement);
    return snapshot.context.getImageData(0, 0, snapshot.canvas.width, snapshot.canvas.height);
  }

  // take a screenshot of the video preview with a temp canvas
  function captureCurrentFrame(videoElement){
    return getTempCanvasAndContext(videoElement).canvas.toDataURL('image/png');
  }

  function initialize(success, error){
    if(scanWorker === null){
      var workerBlob = new Blob([workerScript],{type: "text/javascript"});
      scanWorker = new Worker(URL.createObjectURL(workerBlob));
    }
    if(!getVideoPreview()){
      // prepare DOM (sync)
      var videoPreview = document.createElement('video');
      videoPreview.setAttribute('autoplay', 'autoplay');
      videoPreview.setAttribute('id', ELEMENTS.preview);
      videoPreview.setAttribute('style', 'display:block;position:fixed;top:50%;left:50%;' +
      'width:auto;height:auto;min-width:100%;min-height:100%;z-index:' + ZINDEXES.preview +
      ';-moz-transform: translateX(-50%) translateY(-50%);-webkit-transform: ' +
      'translateX(-50%) translateY(-50%);transform:translateX(-50%) translateY(-50%);' +
      'background-size:cover;background-position:50% 50%;background-color:#FFF;');
      videoPreview.addEventListener('loadeddata', function(){
        bringPreviewToFront();
      });

      var stillImg = document.createElement('div');
      stillImg.setAttribute('id', ELEMENTS.still);
      stillImg.setAttribute('style', 'display:block;position:fixed;top:50%;left:50%;visibility: hidden;' +
      'width:auto;height:auto;min-width:100%;min-height:100%;z-index:' + ZINDEXES.still +
      ';-moz-transform: translateX(-50%) translateY(-50%);-webkit-transform: ' +
      'translateX(-50%) translateY(-50%);transform:translateX(-50%) translateY(-50%);' +
      'background-size:cover;background-position:50% 50%;background-color:#FFF;');

      document.body.appendChild(videoPreview);
      document.body.appendChild(stillImg);
    }
    if(backCamera === null){
      // set instance cameras
      chooseCameras().then(function(cameras){
        backCamera = cameras.backCamera;
        frontCamera = cameras.frontCamera;
        if(backCamera !== false){
          success();
        } else {
          error(5); // CAMERA_UNAVAILABLE
        }
      }, function(err){
        // something bad happened
        err = null;
        error(0); // UNEXPECTED_ERROR
      });
    } else if (backCamera === false){
      error(5); // CAMERA_UNAVAILABLE
    } else {
      success();
    }
  }

  /*
   *  --- Begin Public API ---
   */

  function prepare(success, error){
    initialize(function(){
      // return status on success
      success(calcStatus());
    },
    // pass errors through
    error);
  }

  function show(success, error){
    function showCamera(){
      if(!mediaStreamIsActive()){
        startCamera(success, error);
      } else {
        success(calcStatus());
      }
    }
    if(!isInitialized()){
      initialize(function(){
        // on successful initialization, attempt to showCamera
        showCamera();
      },
      // pass errors through
      error);
    } else {
      showCamera();
    }
  }

  function hide(success, error){
    error = null; // should never error
    if(mediaStreamIsActive()){
      killActiveMediaStream();
    }
    var video = getVideoPreview();
    if(video){
      video.src = '';
    }
    success(calcStatus());
  }

  function scan(success, error) {
    // initialize and start video preview if not already active
    show(function(ignore){
      // ignore success output – `scan` method callback should be passed the decoded data
      ignore = null;
      var video = getVideoPreview();
      var returned = false;
      scanning = true;
      scanWorker.onmessage = function(event){
        var obj = event.data;
        if(obj.result && !returned){
          returned = true;
          thisScanCycle = null;
          success(obj.result);
        }
      };
      thisScanCycle = function(){
        scanWorker.postMessage(getCurrentImageData(video));
        if(cancelNextScan !== null){
          // avoid race conditions, always clear before starting a cycle
          cancelNextScan();
        }
        // interval in milliseconds at which to try decoding the QR code
        var SCAN_INTERVAL = window.QRScanner_SCAN_INTERVAL || 130;
        // this value can be adjusted on-the-fly (while a scan is active) to
        // balance scan speed vs. CPU/power usage
        nextScan = window.setTimeout(thisScanCycle, SCAN_INTERVAL);
        cancelNextScan = function(sendError){
          window.clearTimeout(nextScan);
          nextScan = null;
          cancelNextScan = null;
          if(sendError){
            error(6); // SCAN_CANCELED
          }
        };
      };
      thisScanCycle();
    }, error);
  }

  function cancelScan(success, error){
    error = null; // should never error
    if(cancelNextScan !== null){
      cancelNextScan(true);
    }
    scanning = false;
    if(typeof success === "function"){
      success(calcStatus());
    }
  }

  function pausePreview(success, error){
    error = null; // should never error
    if(mediaStreamIsActive()){
      // pause scanning too
      if(cancelNextScan !== null){
        cancelNextScan();
      }
      var video = getVideoPreview();
      video.pause();
      var img = new Image();
      img.src = captureCurrentFrame(video);
      getImg().style.backgroundImage = 'url(' + img.src + ')';
      bringStillToFront();
      // kill the active stream to turn off the privacy light (the screenshot
      // in the stillImg will remain visible)
      killActiveMediaStream();
      success(calcStatus());
    } else {
      success(calcStatus());
    }
  }

  function resumePreview(success, error){
    // if a scan was happening, resume it
    if(thisScanCycle !== null){
      thisScanCycle();
    }
    show(success, error);
  }

  function enableLight(success, error){
    error(7); //LIGHT_UNAVAILABLE
  }

  function disableLight(success, error){
    error(7); //LIGHT_UNAVAILABLE
  }

  function useCamera(success, error, array){
    var requestedCamera = array[0];
    var initialized = isInitialized();
    if(requestedCamera !== currentCamera){
      if(initialized && requestedCamera === 1 && !canChangeCamera()){
          error(4); //FRONT_CAMERA_UNAVAILABLE
      } else {
        currentCamera = requestedCamera;
        if(initialized){
          hide(function(status){
            // Don't need this one
            status = null;
          });
          show(success, error);
        } else {
          success(calcStatus());
        }
      }
    } else {
      success(calcStatus());
    }
  }

  function openSettings(success, error){
    error(8); //OPEN_SETTINGS_UNAVAILABLE
  }

  function getStatus(success, error){
    error = null; // should never error
    success(calcStatus());
  }

  // Reset all instance variables to their original state.
  // This method might be useful in cases where a new camera is available, and
  // the application needs to force the plugin to chooseCameras() again.
  function destroy(success, error){
    error = null; // should never error
    cancelScan();
    if(mediaStreamIsActive()){
      killActiveMediaStream();
    }
    backCamera = null;
    frontCamera = null;
    var preview = getVideoPreview();
    var still = getImg();
    if(preview){
      preview.remove();
    }
    if(still){
      still.remove();
    }
    success(calcStatus());
  }

  return {
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
};
