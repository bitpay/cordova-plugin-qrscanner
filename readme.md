[![npm](https://img.shields.io/npm/v/cordova-plugin-qrscanner.svg)](https://www.npmjs.com/package/cordova-plugin-qrscanner) [![npm](https://img.shields.io/npm/dm/cordova-plugin-qrscanner.svg)](https://www.npmjs.com/package/cordova-plugin-qrscanner)
[![Dependency Status](https://david-dm.org/bitpay/cordova-plugin-qrscanner.svg)](https://david-dm.org/bitpay/cordova-plugin-qrscanner)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

# cordova-plugin-qrscanner
A fast, energy efficient, highly-configurable QR code scanner for Cordova apps. Currently iOS only.

QRScanner's live video preview is rendered behind the Cordova app's native webview, and the native webview's background is made transparent. This allows for an interface to be built inside the webview to control the scanner.

## Get Started

```bash
cordova plugin add cordova-plugin-qrscanner
```

The iOS component of the plugin is written in Swift 2. To enable it, add the following hook to the iOS platform in your Cordova app's `config.xml`:

```xml
<platform name="ios">
    <hook type="after_platform_add" src="plugins/cordova-plugin-qrscanner/scripts/swift-support.js" />
</platform>
```

This script requires the `xcode` npm module:

```bash
npm install --save xcode
```
Once installed, remove and re-add the ios platform to trigger the hook:

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

### Using multiple Cordova plugins written in Swift

Because Cordova is written in Objective-C, Cordova plugins written in Swift [require a `bridging header` to interact with Cordova](https://developer.apple.com/library/ios/documentation/Swift/Conceptual/BuildingCocoaApps/MixandMatch.html).

A project can only have one bridging header. If your app uses plugins other than `cordova-plugin-qrscanner` which are also written in Swift, you will need to create a master bridging header to import each. Create a new bridging header and import each of the plugins' bridging headers, for example:

```c
//  MyProject-Bridging-Header.h
//  Use this file to import your target's public headers that you would like to expose to Swift.

//cordova-plugin-apple-watch
#import "Watch-Bridge.h"

//com.eface2face.iosrtc
#import "iosrtc-Bridging-Header.h"

//cordova-plugin-qrscanner
#import "QRScanner-Bridging-Header.h"
```
Copy the script from `cordova-plugin-qrscanner/scripts/swift-support.js` into your project (eg. into the `hooks` folder), and modify the `BRIDGING_HEADER_END` variable to point to your new bridging header. Finally, remove and re-add the ios platform to trigger the hook. See [this issue](https://github.com/eface2face/cordova-plugin-iosrtc/issues/9) for more information.

## API
With the exception of `QRScanner.scan()`, all callbacks are optional.

### Prepare

```js
var done = function(err, status){
  if(err){
    console.error(err._message);
  } else {
    console.log('QRScanner is initialized. Status:');
    console.log(status);
  }
};

QRScanner.prepare(done);
```

Request permission to access the camera (if not already granted), prepare the video preview, and configure everything needed by QRScanner. This will only be visible if `QRScanner.show()` has already made the webview transparent.

### Scan

```js
var callback = function(err, contents){
  if(err){
    console.error(err._message);
  }
  alert('The QR Code contains: ' + contents);
};

QRScanner.scan(callback);
```

Sets QRScanner to "watch" for valid QR codes. Once a valid code is detected, it's contents are passed to the callback, and scanning is toggled off. If `QRScanner.prepare()` has not been called, this method performs that setup as well. The video preview does not need to be visible for scanning to function.

```js
QRScanner.cancelScan(function(status){
  console.log(status);
});
```

Cancels the current scan. If `QRScanner.prepare()` has not been called, this method performs that setup as well.

### Show

```js
QRScanner.show(function(status){
  console.log(status);
});
```

Configures the native webview to have a transparent background, then sets the background of the `<body>` and parent elements to transparent, allowing the webview to re-render with the transparent background.

To see the video preview, your application background must be transparent in the areas through which it should show.

### Hide

```js
QRScanner.hide(function(status){
  console.log(status);
});
```

Configures the native webview to be opaque with a white background, covering the video preview.

### Lighting

```js
QRScanner.enableLight(function(err, status){
  err && console.error(err);
  console.log(status);
});
```

Enable the device's light (for scanning in low-light environments). If `QRScanner.prepare()` has not been called, this method performs that setup as well.

```js
QRScanner.disableLight(function(err, status){
  err && console.error(err);
  console.log(status);
});
```

Disable the device's light. If `QRScanner.prepare()` has not been called, this method performs that setup as well.

### Camera Reversal
QRScanner defaults to the back camera, but can be reversed. If `QRScanner.prepare()` has not been called, these methods perform that setup as well.

```js
QRScanner.useFrontCamera(function(err, status){
  err && console.error(err);
  console.log(status);
});
```

Switch video capture to the device's front camera.

```js
QRScanner.useBackCamera(function(err, status){
  err && console.error(err);
  console.log(status);
});
```

Switch video capture to the device's back camera.

### Video Preview Control

```js
QRScanner.pausePreview(function(status){
  console.log(status);
})
```

Pauses the video preview on the current frame (as if a snapshot was taken).

```js
QRScanner.resumePreview(function(status){
  console.log(status);
})
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

Note: iOS immediately kills all apps affected by permissions changes. If the user changes a permission settings, your app will stop and only restart when they return.

### Get QRScanner Status

```js
QRScanner.getStatus(function(status){
  console.log(status);
});
```

```js
{
  "authorized": Boolean
  "denied": Boolean
  "restricted": Boolean
  "prepared": Boolean
  "scanning": Boolean
  "previewing": Boolean
  "webviewBackgroundIsTransparent": Boolean
  "lightEnabled": Boolean
  "canOpenSettings": Boolean
  "canEnableLight": Boolean
  "currentCamera": Number
}
```

Retrieve the status of QRScanner and provide it to the callback function.

### Status Object Properties

Name                             | Description
:------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
`authorized`                     | On iOS and Android 6.0+, camera access is granted at runtime by the user (by clicking "Allow" at the dialog). The `authorized` property is a boolean value which is true only when the user has allowed camera access to your app (`AVAuthorizationStatus.Authorized`). On platforms with permissions granted at install (Android pre-6.0, Windows Phone) this property is always true.
`denied`                         | A boolean value which is true if the user permenantly denied camera access to the app (`AVAuthorizationStatus.Denied`). Once denied, camera access can only be gained by requesting the user change their decision (consider offering a link to the setting via `openSettings()`).
`restricted`                     | A boolean value which is true if the user is unable to grant permissions due to parental controls, organization security configuration profiles, or similar reasons.
`prepared`                       | A boolean value which is true if QRScanner is prepared to capture video and render it to the view.
`scanning`                       | A boolean value which is true if QRScanner is actively scanning for a QR code.
`previewing`                     | A boolean value which is true if QRScanner is displaying a live preview from the device's camera. Set to false when the preview is paused.
`webviewBackgroundIsTransparent` | A boolean value which is true when the native webview background is transparent.
`lightEnabled`                   | A boolean value which is true if the light is enabled.
`canOpenSettings`                | A boolean value which is true only if the users' operating system is able to `QRScanner.openSettings()`.
`canEnableLight`                 | A boolean value which is true only if the users' device can enable a light in the direction of the currentCamera.
`currentCamera`                  | A number representing the index of the currentCamera. `0` is the back camera, `1` is the front.

### Destroy

```js
QRScanner.destroy(function(status){
  console.log(status);
});
```

Runs hide(), stops scanning, video capture, and the preview, and deallocates as much as possible. (E.g. to improve performance/battery life when the scanner is not likely to be used for a while.) Basically reverts the plugin to it's startup-state.

## Error Handling
Many QRScanner functions accept a callback with an `error` parameter. When QRScanner experiences errors, this parameter contains a QRScannerError object with properties `name` (_String_), `code` (_Number_), and `_message` (_String_). When handling errors, rely only on the `name` or `code` parameter, as the specific content of `_message` is not considered part of the plugin's stable API.

```js
QRScanner.scan(function(err, contents){
  if(err){
    if(err.name === 'SCAN_CANCELED') {
      console.error('The scan was canceled before a QR code was found.');
    } else {
      console.error(err._message);
    }
  }
  console.log('Scan returned: ' + contents);
});
```

### Possible Error Types

Code | Name                        | Description
---: | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   0 | `UNEXPECTED_ERROR`          | An unexpected error. Returned only by bugs in QRScanner.
   1 | `CAMERA_ACCESS_DENIED`      | The user denied camera access.
   2 | `CAMERA_ACCESS_RESTRICTED`  | Camera access is restricted (due to parental controls, organization security configuration profiles, or similar reasons).
   3 | `BACK_CAMERA_UNAVAILABLE`   | The back camera is unavailable.
   4 | `FRONT_CAMERA_UNAVAILABLE`  | The front camera is unavailable.
   5 | `CAMERA_UNAVAILABLE`        | The camera is unavailable because it doesn't exist or is otherwise unable to be configured. (Returned if QRScanner cannot return one of the more specific `BACK_CAMERA_UNAVAILABLE` or `FRONT_CAMERA_UNAVAILABLE` errors.)
   6 | `SCAN_CANCELED`             | Scan was canceled by the `cancelScan()` method. (Returned exclusively to the `QRScanner.scan()` method.)
   7 | `LIGHT_UNAVAILABLE`         | The device light is unavailable because it doesn't exist or is otherwise unable to be configured.
   8 | `OPEN_SETTINGS_UNAVAILABLE` | The device is unable to open settings.

## Typescript
Type definitions for cordova-plugin-qrscanner are [available in the DefinitelyTyped project](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/cordova-plugin-qrscanner/cordova-plugin-qrscanner.d.ts).

## Contributing &amp; Testing
To setup the tests, run `npm test:ios`. This will create a new cordova project in the same directory as this repo, install cordova-plugin-qrscanner, and configure the [Cordova Plugin Test Framework](https://github.com/apache/cordova-plugin-test-framework).

Both Automatic Tests (via Cordova Plugin Test Framework's built-in [Jasmine](https://github.com/jasmine/jasmine)) and Manual Tests are available. Automatic tests confirm the existence and expected structure of the javascript API, and manual tests should be used to confirm functionality on each platform.
