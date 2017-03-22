const Capture = Windows.Media.Capture;
const FocusMode = Windows.Media.Devices.FocusMode;
const Promise = WinJS.Promise;

let currentVideoCapture;

function create(videoDeviceId) {

  let captureSettings = new Capture.MediaCaptureInitializationSettings();
  captureSettings.streamingCaptureMode = Capture.StreamingCaptureMode.video;
  captureSettings.videoDeviceId = videoDeviceId;

  let capture = new Windows.Media.Capture.MediaCapture();
  let displayInformation = Windows.Graphics.Display.DisplayInformation.getForCurrentView();

  return capture.initializeAsync(captureSettings).then(function () {
    adjustCaptureOrientation(displayInformation);
    displayInformation.addEventListener("orientationchanged", onOrientationChange);

    let ctrl = capture.videoDeviceController;
    let canFocus = ctrl.focusControl && ctrl.focusControl.supported;

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

    let videoCapture = {
      videoDeviceId: videoDeviceId,
      url: URL.createObjectURL(capture)
    };

    videoCapture.capture = capture;

    videoCapture.canEnableLight = ctrl.torchControl && ctrl.torchControl.supported;

    videoCapture.enableLight = function () {
      if (!videoCapture.canEnableLight || !ctrl) {
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

      return lightEnabler(ctrl.torchControl);
    }

    videoCapture.disableLight = function () {
      if (!videoCapture.canEnableLight || !ctrl) {
        return;
      }

      let tc = ctrl.torchControl;

      if (tc.enabled) {
        tc.enabled = false;
      }
    }

    videoCapture.focus = function () {
      const OPERATION_IS_IN_PROGRESS = -2147024567;
      const INITIAL_FOCUS_DELAY = 200;

      if (canFocus) {
        let focusControl = capture.videoDeviceController.focusControl;
        if (focusControl.focusState !== Windows.Media.Devices.MediaCaptureFocusState.searching) {
          Promise.timeout(INITIAL_FOCUS_DELAY).done(function () {
            focusControl.focusAsync().onerror = function (error) {
              if (error.number !== OPERATION_IS_IN_PROGRESS) {
                console.error(error);
              }
            };
          });


        }
      }
    }

    videoCapture.destroy = function () {
      displayInformation.removeEventListener("orientationchanged", onOrientationChange);
      return Promise.wrap();
    }

    currentVideoCapture = videoCapture;
    return videoCapture;
  });

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

      let camerasFound = {};

      if (backCameras.length > 0) camerasFound.back = backCameras[0];
      if (frontCameras.length > 0) camerasFound.front = frontCameras[0];

      return camerasFound;
    });
}

module.exports = {
  get: function (videoDeviceId) {
    if (currentVideoCapture) {
      return currentVideoCapture.destroy().then(function () {
        return create(videoDeviceId);
      });
    }
    return create(videoDeviceId);
  },
  getCameras: getCameras
};
