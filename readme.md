[![Build Status](https://travis-ci.org/bitpay/cordova-plugin-qrscanner.svg?branch=master)](https://travis-ci.org/bitpay/cordova-plugin-qrscanner) [![npm](https://img.shields.io/npm/v/cordova-plugin-qrscanner.svg)](https://www.npmjs.com/package/cordova-plugin-qrscanner) [![npm](https://img.shields.io/npm/dm/cordova-plugin-qrscanner.svg)](https://www.npmjs.com/package/cordova-plugin-qrscanner)
[![Dependency Status](https://david-dm.org/bitpay/cordova-plugin-qrscanner.svg)](https://david-dm.org/bitpay/cordova-plugin-qrscanner)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# cordova-plugin-qrscanner
A fast, energy efficient, highly-configurable QR code scanner for Cordova apps – available for the iOS, Android, Windows, and browser platforms.

QRScanner's native camera preview is rendered behind the Cordova app's webview, and QRScanner provides `show` and `hide` methods to toggle the transparency of the webview's background. This allows for a completely HTML/CSS/JS interface to be built inside the webview to control the scanner.

## Get Started

```bash
cordova plugin add cordova-plugin-qrscanner
```

Simply adding this plugin to the Cordova project will make the `window.QRScanner` global object available once the `deviceready` event propagates.

### Usage

There are two primary steps to integrating `cordova-plugin-qrscanner`.

#### 1. Get Permission Early (Optional)

**This step is optional** – if the best place for your app to ask for camera permissions is at the moment scanning begins, you can safely skip this step.

If there's a better place in your app's onboarding process to ask for permission to use the camera ("permission priming"), this plugin makes it possible to ask prior to scanning using the [`prepare` method](#prepare). The `prepare` method initializes all the infrastructure required for scanning to happen, including (if applicable) asking for camera permissions. This can also be done before attempting to show the video preview, making your app feel faster and more responsive.

```js
// For the best user experience, make sure the user is ready to give your app
// camera access before you show the prompt. On iOS, you only get one chance.

QRScanner.prepare(onDone); // show the prompt

function onDone(err, status){
  if (err) {
   // here we can handle errors and clean up any loose ends.
   console.error(err);
  }
  if (status.authorized) {
    // W00t, you have camera access and the scanner is initialized.
    // QRscanner.show() should feel very fast.
  } else if (status.denied) {
   // The video preview will remain black, and scanning is disabled. We can
   // try to ask the user to change their mind, but we'll have to send them
   // to their device settings with `QRScanner.openSettings()`.
  } else {
    // we didn't get permission, but we didn't get permanently denied. (On
    // Android, a denial isn't permanent unless the user checks the "Don't
    // ask again" box.) We can ask again at the next relevant opportunity.
  }
}
```

#### 2. Scan

Later in your application, simply call the [`scan` method](#scan) to enable scanning, and the [`show` method](#show) to make the camera preview visible.

If you haven't previously `prepare`d the scanner, the `scan` method will first internally `prepare` the scanner, then begin scanning. If you'd rather ask for camera permissions at the time scanning is attempted, this is the simplest option.

```js
// Start a scan. Scanning will continue until something is detected or
// `QRScanner.cancelScan()` is called.
QRScanner.scan(displayContents);

function displayContents(err, text){
  if(err){
    // an error occurred, or the scan was canceled (error code `6`)
  } else {
    // The scan completed, display the contents of the QR code:
    alert(text);
  }
}

// Make the webview transparent so the video preview is visible behind it.
QRScanner.show();
// Be sure to make any opaque HTML elements transparent here to avoid
// covering the video.
```

Please see the [full API docs](#api) for details about each method, [error handling](#error-handling), and [platform specific details](#platform-specific-details).

### Electron or NW.js usage without `cordova-browser`

If your app uses the Cordova Browser platform, simply adding the plugin to the Cordova project will make the `window.QRScanner` global object available once the `deviceready` event propagates. For apps not using `cordova-browser`, this plugin is also available as a simple javascript library.

The library uses the [Universal Module Definition API](https://github.com/umdjs/umd), so it can simply be required by most build systems.

```js
var QRScanner = require('QRScanner');
```

Or alternatively, the library can be included in a page as-is, and the QRScanner will be made available at `window.QRScanner`.

```html
<script src="path/to/qrscanner/library.bundle.min.js"></script>
```

On the browser platform, performance is improved by running the processing-intensive scanning operation in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). For more information about the browser platform, see [Browser Platform Specific Details](#browser).

## API
With the exception of `QRScanner.scan(callback)` and `QRScanner.getStatus(callback)`, all callbacks are optional.

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

Request permission to access the camera (if not already granted), prepare the video preview, and configure everything needed by QRScanner. On platforms where possible, this also starts the video preview, saving valuable milliseconds and making it seem like the camera is starting instantly when `QRScanner.show()` is called. (These changes will only be visible to the user if `QRScanner.show()` has already made the webview transparent.)

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

Sets QRScanner to "watch" for valid QR codes. Once a valid code is detected, it's contents are passed to the callback, and scanning is toggled off. If `QRScanner.prepare()` has not been called, this method performs that setup as well. On platforms other than iOS and Android, the video preview must be visible for scanning to function.

```js
QRScanner.cancelScan(function(status){
  console.log(status);
});
```

Cancels the current scan. If `QRScanner.prepare()` has not been called, this method performs that setup as well. When a scan is canceled, the callback of the canceled `scan()` receives the `SCAN_CANCELED` error.

### Show

```js
QRScanner.show(function(status){
  console.log(status);
});
```

Configures the native webview to have a transparent background, then sets the background of the `<body>` and `<html>` DOM elements to transparent, allowing the webview to re-render with the transparent background.

To see the video preview, your application background must be transparent in the areas through which the preview should show.

The [`show`](#show) and [`hide`](#hide) methods are the fastest way to toggle visibility of the scanner. When building the scanner into tab systems and similar layouts, this makes the application feel much more responsive. It's possible to reduce power consumption (to extend battery life on mobile platforms) by intellegently [`destroy`](#destroy)ing the scanner when it's unlikely to be used for a long period of time. Before scanning is used again, you can re-[`prepare`](#prepare) it, making the interface seem much more responsive when `show` is called.

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

Camera selection can also be done directly with the `useCamera` method.

```js
var back = 0; // default camera on plugin initialization
var front = 1;
QRScanner.useCamera(front, function(err, status){
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

Pauses the video preview on the current frame (as if a snapshot was taken) and pauses scanning (if a scan is in progress).

```js
QRScanner.resumePreview(function(status){
  console.log(status);
})
```

Resumes the video preview and continues to scan (if a scan was in progress before `pausePreview()`).

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

Note: iOS immediately kills all apps affected by permission changes in Settings. If the user changes a permission setting, your app will stop and only restart when they return.

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
  "showing": Boolean
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
`denied`                         | A boolean value which is true if the user permanently denied camera access to the app (`AVAuthorizationStatus.Denied`). Once denied, camera access can only be gained by requesting the user change their decision (consider offering a link to the setting via `openSettings()`).
`restricted`                     | A boolean value which is true if the user is unable to grant permissions due to parental controls, organization security configuration profiles, or similar reasons.
`prepared`                       | A boolean value which is true if QRScanner is prepared to capture video and render it to the view.
`showing`                        | A boolean value which is true when the preview layer is visible (and on all platforms but `browser`, the native webview background is transparent).
`scanning`                       | A boolean value which is true if QRScanner is actively scanning for a QR code.
`previewing`                     | A boolean value which is true if QRScanner is displaying a live preview from the device's camera. Set to false when the preview is paused.
`lightEnabled`                   | A boolean value which is true if the light is enabled.
`canOpenSettings`                | A boolean value which is true only if the users' operating system is able to `QRScanner.openSettings()`.
`canEnableLight`                 | A boolean value which is true only if the users' device can enable a light in the direction of the currentCamera.
`canChangeCamera`                | A boolean value which is true only if the current device "should" have a front camera. The camera may still not be capturable, which would emit error code 3, 4, or 5 when the switch is attempted. (On the browser platform, this value is false until the `prepare` method is called.)
`currentCamera`                  | A number representing the index of the currentCamera. `0` is the back camera, `1` is the front.


### Destroy

```js
QRScanner.destroy(function(status){
  console.log(status);
});
```

Runs [`hide`](#hide), [`cancelScan`](#scan), stops video capture, removes the video preview, and deallocates as much as possible. Basically reverts the plugin to it's startup-state.

## Error Handling
Many QRScanner functions accept a callback with an `error` parameter. When QRScanner experiences errors, this parameter contains a QRScannerError object with properties `name` (_String_), `code` (_Number_), and `_message` (_String_). When handling errors, rely only on the `name` or `code` parameter, as the specific content of `_message` is not considered part of the plugin's stable API. Particularly if your app is localized, it's also a good idea to provide your own `message` when informing the user of errors.

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
   5 | `CAMERA_UNAVAILABLE`        | The camera is unavailable because it doesn't exist or is otherwise unable to be configured. (Also returned if QRScanner cannot return one of the more specific `BACK_CAMERA_UNAVAILABLE` or `FRONT_CAMERA_UNAVAILABLE` errors.)
   6 | `SCAN_CANCELED`             | Scan was canceled by the `cancelScan()` method. (Returned exclusively to the `QRScanner.scan()` method.)
   7 | `LIGHT_UNAVAILABLE`         | The device light is unavailable because it doesn't exist or is otherwise unable to be configured.
   8 | `OPEN_SETTINGS_UNAVAILABLE` | The device is unable to open settings.

## Platform Specific Details

This plugin attempts to properly abstract all the necessary functions of a well-designed, native QR code scanner. Here are some platform specific details it may be helpful to know.

## iOS

This plugin is always tested with the latest version of Xcode. Please be sure you have updated Xcode before installing.

If you run into issues in your own project, try the test project in this repo to confirm your environment is set up properly: `npm run gen-tests && npm run test:ios`.

## Android

On Android, calling `pausePreview()` will also disable the light. However, if `disableLight()` is not called, the light will be reenabled when `resumePreview()` is called.

If you run into issues in your own project, try the test project in this repo to confirm your environment is set up properly: `npm run gen-tests && npm run test:android`.

### Permissions

Unlike iOS, on Android >=6.0, permissions can be requested multiple times. If the user denies camera access, `status.denied` will remain `false` unless the user permanently denies by checking the `Never ask again` checkbox. Once `status.denied` is `true`, `openSettings()` is the only remaining option to grant camera permissions.

Because of API limitations, `status.restricted` will always be false on the Android platform. See [#15](https://github.com/bitpay/cordova-plugin-qrscanner/issues/15) for details. Pull requests welcome!

## Windows

Before testing - ensure the Windows Phone SDK is installed. In order to deploy from the command line Windows Phone 8.0 SDK and Visual Studio 2012 update 2 (or later) must be installed. Visual Studio 2015 is recommended for debugging Windows desktop apps.

The Windows platform renders an impervious white layer behind its browser- the video preview is not behind the webView, but is actually an HTML element that is carefully managed. Hide and show change the style properties (visibility) of the preview.

## Browser

While the browser implementation matches the native mobile implementations very closely, the platform itself does not. Notably:

- **multiple cameras** – most laptops/desktops do not have access to multiple cameras – so there is no concept of a "front" or "back" camera
- **light** – we are not aware of any devices for the `browser` platform which have a "light" (aka. "torch") – should a device like this be produced, and if [this spec](http://w3c.github.io/mediacapture-image/#filllightmode) is [implemented by Chromium](https://bugs.chromium.org/p/chromium/issues/detail?id=485972), this plugin will attempt to support it.

The browser implementation of this plugin is designed to abstract these platform differences very thoroughly. It's recommended that you focus your development efforts on implementing this plugin well for one of the mobile platform, and the browser platform implementation will degrade gracefully from there.

### Video Preview DOM Element

Unlike the other platforms, it's not possible to spawn the `<video>` preview behind the `<html>` and `<body>` using only Javascript. Trying to mimick the effect by making the element a sibling to either the `<html>` or `<body>` elements also produces inconsistent results (ie: no rendering on Chromium). Instead, this plugin appends the `<video>` element as the final child of the `<body>` element, and applies styling to cover the entire background.

As a consequence, you should assume that your `<body>` element will be completely obscured from view as soon as the plugin is `prepare()`ed. When building your application, apply styling you might otherwise apply to the `<body>` element to a child "container" `<div>` or other element. To show the video preview, call the `show()` method and make this container transparent.

### Privacy Lights

Most devices now include a hardware-level "privacy light", which is enabled when the camera is being used. To prevent this light from being "always on" when the app is running, the browser platform disables/enables use of the camera with the `hide`, `show`, `pausePreview`, and `resumePreview` methods. If your implementation works well on a mobile platform, you'll find that this addition provides a great head start for a solid `browser` implementation.

For this same reason, scanning requires the video preview to be active, and the `pausePreview` method will also pause scanning on the browser platform. (Calling `resumePreview` will continue the scan.)

### Camera Selection

When the `prepare` method runs, the browser platform attempts to select the best camera as the "back" camera (the default camera). If a "next-best" camera is available, that camera will be selected as the "front" camera. Camera switching is intended to be "togglable", so this plugin has no plans to support access to more than 2 cameras.

The "back" camera is selected by the following criteria:
1. [**facingMode**](http://w3c.github.io/mediacapture-main/#dfn-facingmode) – if a camera with a facingMode of `environment` exists, we use this one.
2. **resolution** – If multiple `environment` cameras are available, the highest resolution camera is selected. If no back-facing cameras exist, we default to the highest resolution camera available.

If more cameras are available, the "front" camera is then chosen from the highest resolution camera remaining.

### Light

The browser platform always returns the boolean `status.canEnableLight` as `false`, and the enableLight/disableLight methods throw the `LIGHT_UNAVAILABLE` error code.

`status.canEnableLight` is camera specific, meaning it will return `false` if the camera in use does not have a flash.

#### Using Status.authorized

Both Electron and NW.js automatically provide authorization to access the camera (without user confirmation) to bundled applications. This difference can't be detected via an API this plugin can implement, so the `authorized` property on any returned Status objects will be `false` on startup, even when it should be `true`. You should adjust your code to assume that these platforms are always authorized. (ie: Skip "permission priming" on these platforms.)

On the `browser` platform, the `authorized` field is set to `true` if at least one camera is available **and** the user has granted the application access to at least one camera. On Electron and NW.js, this field can reliably be used to determine if a camera is available to the device.

### Adjusting Scan Speed vs. CPU/Power Usage (uncommon)

On the browser platform, it's possible to adjust the interval at which QR decode attempts occur – even while a scan is happening. This enables applications to intellegently adjust scanning speed in different application states. QRScanner will check for the presence of the global variable `window.QRScanner_SCAN_INTERVAL` before scheduling each next QR decode. If not set, the default of `130` (milliseconds) is used.

## Typescript
Type definitions for cordova-plugin-qrscanner are [available in the DefinitelyTyped project](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/cordova-plugin-qrscanner/cordova-plugin-qrscanner.d.ts).

## Contributing &amp; Testing

To contribute, first install the dependencies:

```sh
npm install
```

Then setup the test project:

```sh
npm run gen-tests
```

This will create a new cordova project in the `cordova-plugin-test-projects` directory next to this repo, install `cordova-plugin-qrscanner`, and configure the [Cordova Plugin Test Framework](https://github.com/apache/cordova-plugin-test-framework). Once the platform tests are generated, the following commands are available:

- `npm run test:android`
- `npm run test:browser`
- `npm run test:ios`
- `npm run test:windows`

Both Automatic Tests (via Cordova Plugin Test Framework's built-in [Jasmine](https://github.com/jasmine/jasmine)) and Manual Tests are available. Automatic tests confirm the existence and expected structure of the javascript API, and manual tests should be used to confirm functionality on each platform.

The manual tests for the library are available without the cordova test project:

- `npm run test:library`

The build for this repo currently only confirms javascript style and syntax with [jshint](https://github.com/jshint/jshint). Pull requests with additional automated test methods are welcome!
