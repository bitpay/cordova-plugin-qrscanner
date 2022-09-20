[![Build Status](https://travis-ci.org/bitpay/cordova-plugin-qrscanner.svg?branch=master)](https://travis-ci.org/bitpay/cordova-plugin-qrscanner) [![npm](https://img.shields.io/npm/v/cordova-plugin-qrscanner.svg)](https://www.npmjs.com/package/cordova-plugin-qrscanner) [![npm](https://img.shields.io/npm/dm/cordova-plugin-qrscanner.svg)](https://www.npmjs.com/package/cordova-plugin-qrscanner)
[![Dependency Status](https://david-dm.org/bitpay/cordova-plugin-qrscanner.svg)](https://david-dm.org/bitpay/cordova-plugin-qrscanner)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# cordova-plugin-qrscanner

A fast, energy efficient, highly-configurable QR code scanner for Cordova apps – available for the iOS, Android, Windows, and browser platforms.

QRScanner's native camera preview is rendered behind the Cordova app's webview, and QRScanner provides `show` and `hide` methods to toggle the transparency of the webview's background. This allows for a completely HTML/CSS/JS interface to be built inside the webview to control the scanner.

## Examples

<!-- Does your project use cordova-plugin-qrscanner? We'd love to share a screenshot of your scanning interface! Please send a pull request adding your screenshot to the list below. -->

<table>
<tr align="center">
<!-- Please be sure your screenshot is hosted by cloud.githubusercontent.com. (You can upload by adding the image to any GitHub issue. -->
<td><img height="450" src="https://cloud.githubusercontent.com/assets/904007/24809138/943a9628-1b8c-11e7-8659-828c8060a9b6.PNG" alt="BitPay – Secure Bitcoin Wallet"></td>
<td><img height="450" src="https://cloud.githubusercontent.com/assets/904007/24809499/b192a246-1b8d-11e7-9f3b-e85ae480fdd6.PNG" alt="Copay Bitcoin Wallet Platform"></td>
<td><img height="450" src="https://cloud.githubusercontent.com/assets/5379359/25655918/0909bac8-2ff7-11e7-8775-ebb11bb085d6.png" alt="BitPocket Point Of Sale App"></td>
</tr>
<tr align="center">
<!-- Please provide a title and, if possible, a link to your project. -->
<td><a href="https://bitpay.com/wallet">BitPay – Secure Bitcoin Wallet</a></td>
<td><a href="https://github.com/bitpay/copay">bitpay/copay</a></td>
<td><a href="https://github.com/getbitpocket/bitpocket-mobile-app">BitPocket - Bitcoin Point of Sale App</a></td>
</tr>
</table>

## Get Started

```bash
cordova plugin add cordova-plugin-qrscanner (fork)
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

QRScanner.prepare() // show the prompt
	.then((status: IQRScannerStatus) => {
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
	})
	.catch((error: QRScannerStatusError) => {
		// here we can handle errors and clean up any loose ends.
		console.error(err);
	});
```

#### 2. Scan

Later in your application, simply call the [`scan` method](#scan) to enable scanning, and the [`show` method](#show) to make the camera preview visible.

If you haven't previously `prepare`d the scanner, the `scan` method will first internally `prepare` the scanner, then begin scanning. If you'd rather ask for camera permissions at the time scanning is attempted, this is the simplest option.

```js
// Start a scan. Scanning will continue until something is detected or
// `QRScanner.cancelScan()` is called.
QRScanner.scan()
    .then((text: string) => {
		// The scan completed, display the contents of the QR code:
		alert(text);
    })
	.catch((error: QRScannerStatusError) => {
		// an error occurred, or the scan was canceled (error code `SCAN_CANCELED`)
		console.error(err);
	});
// Notes: need to prepare from client side transparent part
// Make the webview transparent so the video preview is visible behind it.
QRScanner.show();
// Be sure to make any opaque HTML elements transparent here to avoid
// covering the video.
```
## API

With the exception of `QRScanner.scan()` and `QRScanner.getStatus()`, all callbacks are optional.

### Prepare

```js
QRScanner.prepare();
```

Request permission to access the camera (if not already granted), prepare the video preview, and configure everything needed by QRScanner. On platforms where possible, this also starts the video preview, saving valuable milliseconds and making it seem like the camera is starting instantly when `QRScanner.show()` is called. (These changes will only be visible to the user if `QRScanner.show()` has already made the webview transparent.)

### Scan

```js
QRScanner.scan();
```

Sets QRScanner to "watch" for valid QR codes. Once a valid code is detected, it's contents are passed to the result, and scanning is toggled off. If `QRScanner.prepare()` has not been called, this method performs that setup as well. On platforms other than iOS and Android, the video preview must be visible for scanning to function.

```js
QRScanner.cancelScan()
    .then((status: IQRScannerStatus) => console.log(status));
```

Cancels the current scan. If `QRScanner.prepare()` has not been called, this method performs that setup as well. When a scan is canceled, the callback of the canceled `scan()` receives the `SCAN_CANCELED` error.

### Show

```js
QRScanner.show()
	.then((status: IQRScannerStatus) => console.log(status));
```
Notes: need to prepare from client side transparent part
Configures the native webview to have a transparent background, then sets the background of the `<body>` and `<html>` DOM elements to transparent, allowing the webview to re-render with the transparent background.

To see the video preview, your application background must be transparent in the areas through which the preview should show.

The [`show`](#show) and [`hide`](#hide) methods are the fastest way to toggle visibility of the scanner. When building the scanner into tab systems and similar layouts, this makes the application feel much more responsive. It's possible to reduce power consumption (to extend battery life on mobile platforms) by intellegently [`destroy`](#destroy)ing the scanner when it's unlikely to be used for a long period of time. Before scanning is used again, you can re-[`prepare`](#prepare) it, making the interface seem much more responsive when `show` is called.

### Hide

```js
QRScanner.hide()
	.then((status: IQRScannerStatus) => console.log(status));
```

Configures the native webview to be opaque with a white background, covering the video preview.

### Lighting

```js
QRScanner.enableLight()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Enable the device's light (for scanning in low-light environments). If `QRScanner.prepare()` has not been called, this method performs that setup as well.

```js
QRScanner.disableLight()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Disable the device's light. If `QRScanner.prepare()` has not been called, this method performs that setup as well.

### Camera Reversal

QRScanner defaults to the back camera, but can be reversed. If `QRScanner.prepare()` has not been called, these methods perform that setup as well.

```js
QRScanner.useFrontCamera()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Switch video capture to the device's front camera.

```js
QRScanner.useBackCamera()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Camera selection can also be done directly with the `useCamera` method.

```js
var back = 0; // default camera on plugin initialization
var front = 1;
QRScanner.useCamera(front)
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Switch video capture to the device's back camera.

### Video Preview Control

```js
QRScanner.pausePreview()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Pauses the video preview on the current frame (as if a snapshot was taken) and pauses scanning (if a scan is in progress).

```js
QRScanner.resumePreview()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Resumes the video preview and continues to scan (if a scan was in progress before `pausePreview()`).

### Open App Settings

```js
QRScanner.getStatus()
	.then((status: IQRScannerStatus) =>{
		console.log(status);
		if (!status.authorized && status.canOpenSettings) {
			if (confirm("Would you like to enable QR code scanning? You can allow camera access in your settings.")) {
				QRScanner.openSettings();
			}
		}
    })
	.catch((error: QRScannerStatusError) => console.error(err));
```

Open the app-specific permission settings in the user's device settings. Here the user can enable/disable camera (and other) access for your app.

Note: iOS immediately kills all apps affected by permission changes in Settings. If the user changes a permission setting, your app will stop and only restart when they return.

### Get QRScanner Status

```js
QRScanner.getStatus()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

```typescript
interface IQRScannerStatus {
	authorized: boolean;
	denied: boolean;
	restricted: boolean;
	prepared: boolean;
	scanning: boolean;
	previewing: boolean;
	showing: boolean;
	lightEnabled: boolean;
	canOpenSettings: boolean;
	canEnableLight: boolean;
	canChangeCamera: boolean;
	/**
	 * 	FRONT_CAMERA = 1;
	 * 	BACK_CAMERA = 0;
	 */
	currentCamera: number;
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
QRScanner.destroy()
	.then((status: IQRScannerStatus) => console.log(status))
	.catch((error: QRScannerStatusError) => console.error(err));
```

Runs [`hide`](#hide), [`cancelScan`](#scan), stops video capture, removes the video preview, and deallocates as much as possible. Basically reverts the plugin to it's startup-state.

## Error Handling

Many QRScanner promises accept a catch with parameter. See QRScannerStatusError.

```typescript
type QRScannerStatusError = 'QR_SCANNER_UNEXPECTED_ERROR' | 'QR_SCANNER_CAMERA_ACCESS_DENIED' | 'QR_SCANNER_CAMERA_ACCESS_RESTRICTED' | 'QR_SCANNER_BACK_CAMERA_UNAVAILABLE'
	| 'QR_SCANNER_FRONT_CAMERA_UNAVAILABLE' | 'QR_SCANNER_CAMERA_UNAVAILABLE' | 'QR_SCANNER_SCAN_CANCELED' | 'QR_SCANNER_LIGHT_UNAVAILABLE' | 'QR_SCANNER_OPEN_SETTINGS_UNAVAILABLE';
```

### Possible Error Types

Error                       | Description
|:----------------------------| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
`QR_SCANNER_UNEXPECTED_ERROR`          | An unexpected error. Returned only by bugs in QRScanner.
`QR_SCANNER_CAMERA_ACCESS_DENIED`      | The user denied camera access.
`QR_SCANNER_CAMERA_ACCESS_RESTRICTED`  | Camera access is restricted (due to parental controls, organization security configuration profiles, or similar reasons).
`QR_SCANNER_BACK_CAMERA_UNAVAILABLE`   | The back camera is unavailable.
`QR_SCANNER_FRONT_CAMERA_UNAVAILABLE`  | The front camera is unavailable.
`QR_SCANNER_CAMERA_UNAVAILABLE`        | The camera is unavailable because it doesn't exist or is otherwise unable to be configured. (Also returned if QRScanner cannot return one of the more specific `BACK_CAMERA_UNAVAILABLE` or `FRONT_CAMERA_UNAVAILABLE` errors.)
`QR_SCANNER_SCAN_CANCELED`             | Scan was canceled by the `cancelScan()` method. (Returned exclusively to the `QRScanner.scan()` method.)
`QR_SCANNER_LIGHT_UNAVAILABLE`         | The device light is unavailable because it doesn't exist or is otherwise unable to be configured.
`QR_SCANNER_OPEN_SETTINGS_UNAVAILABLE` | The device is unable to open settings.

## Platform Specific Details

This plugin attempts to properly abstract all the necessary functions of a well-designed, native QR code scanner. Here are some platform specific details it may be helpful to know.

## iOS

This plugin is always tested with the latest version of Xcode. Please be sure you have updated Xcode before installing.

## Android

On Android, calling `pausePreview()` will also disable the light. However, if `disableLight()` is not called, the light will be reenabled when `resumePreview()` is called.

### Permissions

Unlike iOS, on Android >=6.0, permissions can be requested multiple times. If the user denies camera access, `status.denied` will remain `false` unless the user permanently denies by checking the `Never ask again` checkbox. Once `status.denied` is `true`, `openSettings()` is the only remaining option to grant camera permissions.

Because of API limitations, `status.restricted` will always be false on the Android platform. See [#15](https://github.com/bitpay/cordova-plugin-qrscanner/issues/15) for details. Pull requests welcome!

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

Type definitions for cordova-plugin-qrscanner are [types/index.d.ts].
