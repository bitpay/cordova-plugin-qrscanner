  const Capture = Windows.Media.Capture;
  const FocusMode = Windows.Media.Devices.FocusMode;
  const Promise = WinJS.Promise;

  let currentVideoCapture;

  function create(videoDeviceId) {

    let captureSettings = new Capture.MediaCaptureInitializationSettings();
    captureSettings.streamingCaptureMode = Capture.StreamingCaptureMode.video;
    captureSettings.photoCaptureSource = Capture.PhotoCaptureSource.videoPreview;
    captureSettings.videoDeviceId = videoDeviceId;

    let videoUrl;

    let capture = new Windows.Media.Capture.MediaCapture();
    let displayInformation = Windows.Graphics.Display.DisplayInformation.getForCurrentView();

    let initPromise = capture.initializeAsync(captureSettings);

    initPromise.then(function () {
      adjustCaptureOrientation(displayInformation);
      displayInformation.addEventListener("orientationchanged", onOrientationChange);
    });


    canFocus().then(function (canFocus) {
      let ctrl = capture.videoDeviceController;
      if (canFocus && ctrl.focusControl.configure && ctrl.focusControl.supportedFocusModes) {

        function supportsFocusMode(mode) {
          return ctrl.focusControl.supportedFocusModes.indexOf(mode).returnValue;
        }

        var focusConfig = new Windows.Media.Devices.FocusSettings();
        focusConfig.autoFocusRange = Windows.Media.Devices.AutoFocusRange.normal;
        focusConfig.disableDriverFallback = false;
        if (supportsFocusMode(FocusMode.continuous)) {
          focusConfig.mode = FocusMode.continuous;
        } else if (supportsFocusMode(FocusMode.auto)) {
          focusConfig.mode = FocusMode.auto;
        }
      }
    });

    function onOrientationChange(e) {
      adjustCaptureOrientation(e.target);
    }

    function adjustCaptureOrientation(displayInformation) {

      let orientationDegrees = displayOrientationToDegrees(displayInformation.currentOrientation)

      if (capture.getPreviewMirroring()) {
        orientationDegrees = 360 - orientationDegrees;
      }
      capture.setPreviewRotation(degreesToCaptureRotation(orientationDegrees));
    }

    function displayOrientationToDegrees(displayOrientation) {
      switch (displayOrientation) {
        case Windows.Graphics.Display.DisplayOrientations.portrait:
          return 90;
          break;
        case Windows.Graphics.Display.DisplayOrientations.landscapeFlipped:
          return 180;
          break;
        case Windows.Graphics.Display.DisplayOrientations.portraitFlipped:
          return 270;
          break;
        case Windows.Graphics.Display.DisplayOrientations.landscape:
        default:
          return 0;
          break;
      }
    }

    function degreesToCaptureRotation(degrees) {
      switch (degrees) {
        case 0:
          return Windows.Media.Capture.VideoRotation.none;
        case 270:
          return Windows.Media.Capture.VideoRotation.clockwise270Degrees;
        case 180:
          return Windows.Media.Capture.VideoRotation.clockwise180Degrees;
        case 90:
        default:
          return Windows.Media.Capture.VideoRotation.clockwise90Degrees;
      }
    }

    function canFocus() {
      return initPromise.then(function () {
        if (capture.videoDeviceController) {
          let ctrl = capture.videoDeviceController;
          return ctrl.focusControl && ctrl.focusControl.supported;
        }
        return false;
      });
    }

    let videoCapture = {
      videoDeviceId: videoDeviceId
    };

    videoCapture.getUrl = function () {
      return initPromise.then(function () {
        if (!videoUrl) {
          videoUrl = URL.createObjectURL(capture)
        }
        return videoUrl;
      });
    }

    videoCapture.getCapture = function () {
      return initPromise.then(function () {
        return capture;
      });
    }

    videoCapture.canEnableLight = function () {
      return initPromise.then(function () {
        if (capture.videoDeviceController) {
          let ctrl = capture.videoDeviceController;
          return (ctrl.flashControl && ctrl.flashControl.supported)
            || (ctrl.torchControl && ctrl.torchControl.supported);
        }
        return false;
      });
    }

    videoCapture.enableLight = function () {
      return videoCapture.canEnableLight().then(function (canEnableLight) {
        if (!canEnableLight) {
          return false;
        }

        function lightEnabler(lightControl) {
          if (lightControl && lightControl.supported) {
            lightControl.enabled = true;
            if (lightControl.powerSupported) {
              lightControl.powerPercent = 90;
            }
            return true;
          }
          return false;
        }

        if (capture.videoDeviceController) {
          let ctrl = capture.videoDeviceController;

          let flashEnabled = lightEnabler(ctrl.flashControl);
          let torchEnabled = lightEnabler(ctrl.torchControl);

          return flashEnabled || torchEnabled;
        }
        return false;
      });
    }

    videoCapture.disableLight = function () {
      return videoCapture.canEnableLight().then(function (canEnableLight) {
        if (!canEnableLight || !capture.videoDeviceController) {
          return;
        }

        let tc = capture.videoDeviceController.torchControl;
        let fc = capture.videoDeviceController.flashControl;

        if (tc.enabled) {
          tc.enabled = false;
        }
        if (fc.enabled) {
          fc.enabled = false;
        }
      });
    }

    videoCapture.focus = function () {
      const OPERATION_IS_IN_PROGRESS = -2147024567;
      const INITIAL_FOCUS_DELAY = 200;

      canFocus().done(function (canFocus) {
        if (canFocus) {
          let focusControl = capture.videoDeviceController.focusControl;
          if (focusControl.focusState !== Windows.Media.Devices.MediaCaptureFocusState.searching) {
            Promise.timeout(INITIAL_FOCUS_DELAY).done(function(){
              focusControl.focusAsync().onerror = function (error) {
                if (error.number !== OPERATION_IS_IN_PROGRESS) {
                  console.error(error);
                }
              };
            });


          }
        }
      });
    }

    videoCapture.destroy = function () {
      return initPromise.then(function () {
        displayInformation.removeEventListener("orientationchanged", onOrientationChange);
      });
    }

    currentVideoCapture = videoCapture;
    return videoCapture;

  }

  function getCameras() {
    var Devices = Windows.Devices.Enumeration;

    return Devices.DeviceInformation.findAllAsync(Devices.DeviceClass.videoCapture)
    .then(function (cameras) {

      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras found");
      }

      let backCameras = cameras.filter(function (camera) {
        return camera.enclosureLocation && camera.enclosureLocation.panel === Devices.Panel.back;
      });
      let frontCameras = cameras.filter(function (camera) {
        return camera.enclosureLocation && camera.enclosureLocation.panel === Devices.Panel.front;
      });

      return {
        back: backCameras[0] || cameras[0],
        front: frontCameras[0]
      };
    });
  }

  module.exports = {
    get: function (videoDeviceId) {
      if (currentVideoCapture) {
        if (currentVideoCapture.videoDeviceId === videoDeviceId) {
          return Promise.wrap(currentVideoCapture);
        }
        currentVideoCapture.destroy().then(function () {
          return create(videoDeviceId);
        });
      }
      return Promise.wrap(create(videoDeviceId));
    },
    getCameras: getCameras
  };
