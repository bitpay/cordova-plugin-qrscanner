# cordova-plugin-qrscanner
A fast, energy efficient, highly-configurable QR code scanner for Cordova apps. Currently iOS only.

QRScanner's live video preview is rendered behind the Cordova app's native webview, and the native webview's background is made transparent. This allows for an interface to be built inside the webview to control the scanner.

## Install

```bash
cordova plugin add cordova-plugin-qrscanner
```

In your Cordova app's `config.xml`, add the following hook to the iOS platform:
```xml
<platform name="ios">
    <hook type="after_platform_add" src="plugins/cordova-plugin-qrscanner/scripts/swift-support.js" />
</platform>
```

Remove and re-add the ios platform to trigger the hook:

```bash
cordova platform remove ios
cordova platform add ios
```

The `QRScanner` plugin is now available in your app:

```js
// Make sure the user will give your app camera access when prompted, then:

QRScanner.prepare(onDone); // prompt for access

function onDone(status){
  if (!status.authorized) {
    // the video preview will remain black, and scanning is disabled
    // you can try asking the user again, but you'll have to use `QRScanner.openSettings()`.
  }
}

// later in your app:

QRScanner.show(); // optional: make the webview transparent so the video preview is visible behind it

QRScanner.scan(displayContents); // scan until something is found

function displayContents(text){
  alert(text);
}
```

## API

Unless otherwise noted, all functions accept an optional callback which gets the QRScanner status object.

### Prepare

```js
var done = function(status){
  console.log('QRScanner is initialized. Status:');
  console.dir(status);
};

QRScanner.prepare(done);
```

Request permission to access the camera (if not already granted), prepare the video preview, and configure everything needed by QRScanner. This will only be visible if `QRScanner.show()` has already made the webview transparent.

### Scan

```js
var callback = function(err, contents){
  if(err){
    console.error(err);
  }
  alert('The QR Code contains: ' + contents);
};

QRScanner.scan(callback);
```

Sets QRScanner to "watch" for valid QR codes. Once a valid code is detected, it's contents are passed to the callback, and scanning is toggled off. If `QRScanner.prepare()` has not been called, `QRScanner.scan()` performs that setup as well. The video preview does not need to be visible for scanning to function.

```js
QRScanner.cancelScan();
```

Cancels the current scan. The current scan() callback will not return.

### Show

```js
QRScanner.show();
```

Configures the native webview to have a transparent background, then sets the background of the `<body>` and parent elements to transparent, allowing the webview to re-render with the transparent background.

To see the video preview, your application background must be transparent in the areas through which it should show.

### Hide

```js
QRScanner.hide();
```

Configures the native webview to be opaque with a white background, covering the video preview.

### Lighting

```js
QRScanner.enableLight();
```
Enable the device's light (for scanning in low-light environments).

```js
QRScanner.disableLight();
```
Disable the device's light.


### Camera Reversal
QRScanner defaults to the back camera, but can be reversed.

```js
QRScanner.useFrontCamera();
```
Switch video capture to the device's front camera.

```js
QRScanner.useBackCamera();
```
Switch video capture to the device's back camera.


### Video Preview Control

```js
QRScanner.pausePreview()
```

Pauses the video preview on the current frame (as if a snapshot was taken).

```js
QRScanner.resumePreview()
```

Resumes the video preview.

### Open App Settings

```js
QRScanner.getStatus(function(status){
  if(!status.authorized && status.canOpenSettings){
    if(confirm("Would you like to enable QR code scanning? You can allow camera access in your settings.")){
      QRScanner.openSettings();
    }
  }
});
```

Open the app-specific permission settings in the user's device settings. Here the user can enable/disable camera (and other) access for your app.

### Get QRScanner Status

```js
QRScanner.getStatus(function(status){
  console.dir(status);
});
```
Retrieve the status of QRScanner and provide it to the callback function.

#### authorized
On iOS, camera access is granted to an app by the user (by clicking "Allow" at the dialog). The `authorized` property is a boolean value which is true only when the user has allowed camera access to your app (`AVAuthorizationStatus.Authorized`). The `NotDetermined`, `Restricted` (e.g.: parental controls), and `Denied` AVAuthorizationStatus states all cause this value to be false. If the user has denied access to your app, consider asking nicely and offering a link via `QRScanner.openSettings()`.

#### prepared
A boolean value which is true if QRScanner is prepared to capture video and render it to the view.

#### scanning
A boolean value which is true if QRScanner is actively scanning for a QR code.

#### previewing
A boolean value which is true if QRScanner is displaying a live preview from the device's camera. Set to false when the preview is paused.

#### webviewBackgroundIsTransparent
A boolean value which is true when the native webview background is transparent.

#### lightEnabled
A boolean value which is true if the light is enabled.

#### canOpenSettings
A boolean value which is true only if the users' operating system is able to `QRScanner.openSettings()`.

#### canEnableLight
A boolean value which is true only if the users' device can enable a light in the direction of the currentCamera.

#### currentCamera
A number. `0` is the back camera, `1` is the front.

### Destroy

```js
QRScanner.destroy();
```

Stops scanning, video capture, and the preview, and deallocates as much as possible. (E.g. to improve performance/battery life when the scanner is not likely to be used for a while.) Basically reverts the plugin to it's startup-state.

## Typescript

Type definitions for cordova-plugin-qrscanner are [available in the DefinitelyTyped project](https://github.com/bitjson/DefinitelyTyped/blob/master/cordova-plugin-qrscanner/cordova-plugin-qrscanner.d.ts).

## Contributing &amp; Testing

To setup the tests, run the `tests/setupTests.sh` script. This will create a new cordova project in the same directory as this repo, install cordova-plugin-qrscanner, and configure the [Cordova Plugin Test Framework](https://github.com/apache/cordova-plugin-test-framework).
