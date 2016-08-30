exports.defineAutoTests = function() {
  describe('QRScanner (window.QRScanner)', function() {

    it('should exist', function() {
      expect(window.QRScanner).toBeDefined();
    });

    describe('Methods exist', function() {
      it('`prepare` method should exist', function() {
        expect(typeof window.QRScanner.prepare).toBe('function');
      });
      it('`scan` method should exist', function() {
        expect(typeof window.QRScanner.scan).toBe('function');
      });
      it('`cancelScan` method should exist', function() {
        expect(typeof window.QRScanner.cancelScan).toBe('function');
      });
      it('`show` method should exist', function() {
        expect(typeof window.QRScanner.show).toBe('function');
      });
      it('`hide` method should exist', function() {
        expect(typeof window.QRScanner.hide).toBe('function');
      });
      it('`pausePreview` method should exist', function() {
        expect(typeof window.QRScanner.pausePreview).toBe('function');
      });
      it('`resumePreview` method should exist', function() {
        expect(typeof window.QRScanner.resumePreview).toBe('function');
      });
      it('`enableLight` method should exist', function() {
        expect(typeof window.QRScanner.enableLight).toBe('function');
      });
      it('`disableLight` method should exist', function() {
        expect(typeof window.QRScanner.disableLight).toBe('function');
      });
      it('`useCamera` method should exist', function() {
        expect(typeof window.QRScanner.useCamera).toBe('function');
      });
      it('`useFrontCamera` method should exist', function() {
        expect(typeof window.QRScanner.useFrontCamera).toBe('function');
      });
      it('`useBackCamera` method should exist', function() {
        expect(typeof window.QRScanner.useBackCamera).toBe('function');
      });
      it('`openSettings` method should exist', function() {
        expect(typeof window.QRScanner.openSettings).toBe('function');
      });
      it('`getStatus` method should exist', function() {
        expect(typeof window.QRScanner.openSettings).toBe('function');
      });
    });

    describe('QRScanner `status` object', function() {
      it('Should be valid', function(done) {
        window.QRScanner.getStatus(function(status) {
          expect(typeof status.authorized).toBe('boolean');
          expect(typeof status.denied).toBe('boolean');
          expect(typeof status.restricted).toBe('boolean');
          expect(typeof status.prepared).toBe('boolean');
          expect(typeof status.scanning).toBe('boolean');
          expect(typeof status.previewing).toBe('boolean');
          expect(typeof status.showing).toBe('boolean');
          expect(typeof status.lightEnabled).toBe('boolean');
          expect(typeof status.canOpenSettings).toBe('boolean');
          expect(typeof status.canEnableLight).toBe('boolean');
          expect(typeof status.canChangeCamera).toBe('boolean');
          expect(typeof status.currentCamera).toBe('number');
          done();
        });
      });
    });
  });
};

exports.defineManualTests = function(contentEl, createActionButton) {

  function log(button, err, status, focusProp) {
    if (err) {
      console.log(button + ' callback returned. QRScannerError:');
      console.error(JSON.stringify(err));
    } else {
      console.log(button + ' callback returned.');
      if(focusProp){
        console.log('status.' + focusProp + ': ' + status[focusProp]);
      } else {
        console.log('status: ' + JSON.stringify(status, null, 2));
      }
    }
  }

  var qrscanner_tests = '';

  var portraitBtn = 'Portrait';
  var landscapeBtn = 'Landscape';
  var unlockBtn = 'Unlock Orientation';
  qrscanner_tests += '<h3>Screen Orientation</h3>' +
    '<div id="portraitBtn"></div><div id="landscapeBtn"></div><div id="unlockBtn"></div>' +
    'Manual tests should be completed in each screen orientation mode. (This section uses <code>cordova-plugin-screen-orientation</code>.)';
  var portrait = function() {
    window.screen.lockOrientation('portrait');
  };
  var landscape = function() {
    window.screen.lockOrientation('landscape');
  };
  var unlock = function() {
    window.screen.unlockOrientation();
  };

  // log when orientation changes
  window.addEventListener("orientationchange", function(){
      console.log('Screen orientation changed to: ' + screen.orientation);
  });

  var prepareBtn = 'QRScanner.prepare()';
  qrscanner_tests += '<h1>QRScanner Tests</h1>' +
    '<h3>Prepare QRScanner</h3>' +
    '<div id="prepareBtn"></div>' +
    'Expected result: Will request Camera access (if needed) and prepare the video preview UI layer. Runs callback(err, status), even if already prepared.';
  var prepare = function() {
    window.QRScanner.prepare(function(err, status) {
      log(prepareBtn, err, status, 'prepared');
    });
  };


  var showBtn = 'QRScanner.show()';
  qrscanner_tests += '<h3>Show QRScanner</h3>' +
    '<div id="showBtn"></div>' +
    'Expected result: Should make the video preview layer visible.';
  var show = function() {
    window.QRScanner.show(function(status) {
      log(showBtn, null, status, 'showing');
    });
  };


  var hideBtn = 'QRScanner.hide()';
  qrscanner_tests += '<h3>Hide QRScanner</h3>' +
    '<div id="hideBtn"></div>' +
    'Expected result: Should hide the video preview layer (returning the background to the default – opaque and white).';
  var hide = function() {
    window.QRScanner.hide(function(status) {
      log(hideBtn, null, status, 'showing');
    });
  };


  var scanBtn = 'QRScanner.scan()';
  var scanWithPauseBtn = 'QRScanner.scan() (with pause)';
  var scanWithPauseAndVibrateBtn = 'QRScanner.scan() (pause, vibrate)';
  var cancelScanBtn = 'QRScanner.cancelScan()';
  qrscanner_tests += '<h2>Scan</h2>' +
    '<div id="scanBtn"></div><div id="scanWithPauseBtn"></div><div id="scanWithPauseAndVibrateBtn"></div><div id="cancelScanBtn"></div>' +
    'Expected result: Should scan QR codes and log the contents. Scanning can also be stopped. If QRScanner.prepare() has not yet been run, scan also performs any native actions needed.';
  var startScan = function(pause, vibrate){
    console.log('scanning...');
    window.QRScanner.scan(function(err, result) {
      console.log('QRScanner.scan() callback returned.');
      if(err){
        console.error(err);
      } else {
        console.log('Scan result:');
        console.log(result);
        if(pause){
          window.QRScanner.pausePreview();
        }
        if(vibrate){
          // 80ms vibration
          window.navigator.vibrate(80);
        }
      }
    });
  };
  var cancelScan = function() {
    window.QRScanner.cancelScan();
    console.log('Canceled scanning.');
  };
  var scan = function() {
    startScan(false, false);
  };
  var scanWithPause = function(){
    startScan(true, false);
  };
  var scanWithPauseAndVibrate = function(){
    startScan(true, true);
  };

  var pausePreviewBtn = 'QRScanner.pausePreview()';
  var resumePreviewBtn = 'QRScanner.resumePreview()';
  qrscanner_tests += '<h3>Video Preview</h3>' +
    '<div id="pausePreviewBtn"></div><div id="resumePreviewBtn"></div>' +
    'Expected result: Should pause and resume the preview, respectively.';
  var pausePreview = function() {
    window.QRScanner.pausePreview(function(status) {
      log(pausePreviewBtn, null, status, 'previewing');
    });
  };
  var resumePreview = function() {
    window.QRScanner.resumePreview(function(status) {
      log(resumePreviewBtn, null, status, 'previewing');
    });
  };

  var enableLightBtn = 'QRScanner.enableLight()';
  var disableLightBtn = 'QRScanner.disableLight()';
  qrscanner_tests += '<h3>Enable & Disable Light</h3>' +
    '<div id="enableLightBtn"></div><div id="disableLightBtn"></div>' +
    'Expected result: Should enable and disable the light, respectively.';
  var enableLight = function() {
    window.QRScanner.enableLight(function(err, status) {
      log(enableLightBtn, err, status, 'lightEnabled');
    });
  };
  var disableLight = function() {
    window.QRScanner.disableLight(function(err, status) {
      log(disableLightBtn, err, status, 'lightEnabled');
    });
  };

  var useFrontCameraBtn = 'QRScanner.useFrontCamera()';
  var useBackCameraBtn = 'QRScanner.useBackCamera()';
  qrscanner_tests += '<h3>Active Camera</h3>' +
    '<div id="useFrontCameraBtn"></div><div id="useBackCameraBtn"></div>' +
    'Expected result: Should switch the direction of the camera. The plugin should default to the back camera.';
  var useFrontCamera = function() {
    window.QRScanner.useFrontCamera(function(err, status) {
      log(useFrontCameraBtn, err, status, 'currentCamera');
    });
  };
  var useBackCamera = function() {
    window.QRScanner.useBackCamera(function(err, status) {
      log(useBackCameraBtn, err, status, 'currentCamera');
    });
  };

  var openSettingsBtn = 'QRScanner.openSettings()';
  qrscanner_tests += '<h3>Open Settings (App Permissions)</h3>' +
    '<div id="openSettingsBtn"></div>' +
    'Expected result: Should open app-specific permission settings on iOS 8.0+.';
  var openSettings = function() {
    window.QRScanner.openSettings(function(err, status) {
      log(openSettingsBtn, err, status, 'canOpenSettings');
    });
  };

  var statusBtn = 'QRScanner.getStatus()';
  qrscanner_tests += '<h3>Get QRScanner Status</h3>' +
    '<div id="statusBtn"></div>' +
    'Expected result: Should log the current status.';
  var getStatus = function() {
    window.QRScanner.getStatus(function(status) {
      log(statusBtn, null, status);
    });
  };

  var destroyBtn = 'QRScanner.destroy()';
  qrscanner_tests += '<h3>Destroy QRScanner</h3>' +
    '<div id="destroyBtn"></div>' +
    'Expected result: Should "unprepare" and clean up all native functionality prepared by QRScanner.';
  var destroy = function() {
    window.QRScanner.destroy(function(status) {
      log(destroyBtn, null, status, 'prepared');
    });
  };

  contentEl.innerHTML = qrscanner_tests;

  createActionButton(portraitBtn, portrait, 'portraitBtn');
  createActionButton(landscapeBtn, landscape, 'landscapeBtn');
  createActionButton(unlockBtn, unlock, 'unlockBtn');
  createActionButton(prepareBtn, prepare, 'prepareBtn');
  createActionButton(showBtn, show, 'showBtn');
  createActionButton(hideBtn, hide, 'hideBtn');
  createActionButton(scanBtn, scan, 'scanBtn');
  createActionButton(scanWithPauseBtn, scanWithPause, 'scanWithPauseBtn');
  createActionButton(scanWithPauseAndVibrateBtn, scanWithPauseAndVibrate, 'scanWithPauseAndVibrateBtn');
  createActionButton(cancelScanBtn, cancelScan, 'cancelScanBtn');
  createActionButton(pausePreviewBtn, pausePreview, 'pausePreviewBtn');
  createActionButton(resumePreviewBtn, resumePreview, 'resumePreviewBtn');
  createActionButton(enableLightBtn, enableLight, 'enableLightBtn');
  createActionButton(disableLightBtn, disableLight, 'disableLightBtn');
  createActionButton(openSettingsBtn, openSettings, 'openSettingsBtn');
  createActionButton(useFrontCameraBtn, useFrontCamera, 'useFrontCameraBtn');
  createActionButton(useBackCameraBtn, useBackCamera, 'useBackCameraBtn');
  createActionButton(statusBtn, getStatus, 'statusBtn');
  createActionButton(destroyBtn, destroy, 'destroyBtn');
};
